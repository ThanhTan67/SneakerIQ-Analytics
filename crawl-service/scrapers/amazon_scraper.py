"""
Amazon Scraper
Crawls reviews, ratings, prices, and deals for sneakers from Amazon.

Amazon is used as a MARKETPLACE source for:
- Review summaries (rating_avg, review_count)
- Current marketplace prices
- Active deals and discounts

Note: Amazon has aggressive anti-scraping measures.
This uses structured data extraction from product pages.
"""

import json
import logging
import re
from typing import List, Optional
from selectolax.parser import HTMLParser

from scrapers.base_scraper import BaseScraper
from models.schemas import CrawledProduct, CrawledPrice, CrawledReview, CrawledDeal
from config import MARKETPLACE_URLS

logger = logging.getLogger(__name__)


# SKU-to-ASIN mapping for known sneakers
# This is populated from ExternalReference via the backend API
KNOWN_ASINS = {}


class AmazonScraper(BaseScraper):
    source_name = "amazon"
    source_type = "MARKETPLACE"

    def __init__(self):
        super().__init__()
        self.config = MARKETPLACE_URLS["amazon"]
        self.base_url = self.config["base_url"]
        self.search_url = self.config["search_url"]

    async def crawl_products(self) -> List[CrawledProduct]:
        """
        Amazon is not used as a product source.
        Products come from official brand sites.
        """
        return []

    async def crawl_prices(self) -> List[CrawledPrice]:
        """Crawl current Amazon prices for known sneaker ASINs."""
        prices = []

        # Search for sneaker brands
        brands_to_search = [
            "Nike sneakers",
            "Adidas sneakers",
            "New Balance sneakers",
            "Puma sneakers",
            "Converse sneakers",
            "Vans sneakers",
        ]

        for query in brands_to_search:
            results = await self._search_products(query)
            for result in results:
                price = CrawledPrice(
                    sku=result.get("sku"),
                    currentPrice=result.get("currentPrice"),
                    originalPrice=result.get("originalPrice"),
                    currency="USD",
                    priceNote="Amazon marketplace price",
                )
                prices.append(price)
                await self.ingest_price(
                    price,
                    external_id=result.get("asin", ""),
                    source_url=f"{self.base_url}/dp/{result.get('asin', '')}",
                )

        logger.info(f"Amazon: crawled {len(prices)} prices")
        return prices

    async def crawl_reviews(self) -> List[CrawledReview]:
        """Crawl review summaries from Amazon product pages."""
        reviews = []

        # Search and get reviews for sneaker products
        brands_to_search = [
            "Nike Air Force 1",
            "Nike Air Max 90",
            "Nike Dunk Low",
            "Adidas Ultraboost",
            "Adidas Samba",
            "Adidas Stan Smith",
            "New Balance 990",
            "New Balance 550",
            "Converse Chuck Taylor",
            "Vans Old Skool",
        ]

        for query in brands_to_search:
            results = await self._search_products(query)
            for result in results:
                if result.get("rating") and result.get("reviewCount"):
                    review = CrawledReview(
                        sku=result.get("sku"),
                        ratingAvg=result["rating"],
                        ratingCount=result["reviewCount"],
                    )
                    reviews.append(review)
                    await self.ingest_review(
                        review,
                        external_id=result.get("asin", ""),
                        source_url=f"{self.base_url}/dp/{result.get('asin', '')}",
                    )

        logger.info(f"Amazon: crawled {len(reviews)} reviews")
        return reviews

    async def crawl_deals(self) -> List[CrawledDeal]:
        """Crawl active deals from Amazon search results."""
        deals = []

        results = await self._search_products("sneaker deals")
        for result in results:
            original = result.get("originalPrice")
            current = result.get("currentPrice")

            if original and current and original > current:
                discount_pct = round((1 - current / original) * 100)
                if discount_pct >= 10:  # Only significant deals
                    deal = CrawledDeal(
                        sku=result.get("sku"),
                        dealTitle=f"-{discount_pct}% {result.get('name', 'Sneaker Deal')}",
                        dealDescription=f"Was ${original:.2f}, now ${current:.2f} on Amazon",
                        dealType="PERCENTAGE",
                    )
                    deals.append(deal)
                    await self.ingest_deal(
                        deal,
                        external_id=result.get("asin", ""),
                        source_url=f"{self.base_url}/dp/{result.get('asin', '')}",
                    )

        logger.info(f"Amazon: crawled {len(deals)} deals")
        return deals

    # ============================================================
    # SEARCH & PARSE
    # ============================================================

    async def _search_products(self, query: str) -> List[dict]:
        """Search Amazon and return structured product data."""
        results = []

        resp = await self.fetch(
            self.search_url,
            params={"k": query, "rh": "n:679255011"},  # Shoes category
        )

        if not resp:
            return results

        tree = HTMLParser(resp.text)

        # Parse search result cards
        cards = tree.css("div[data-component-type='s-search-result']")
        for card in cards:
            try:
                result = self._parse_search_card(card)
                if result:
                    results.append(result)
            except Exception as e:
                logger.debug(f"Error parsing Amazon card: {e}")

        return results[:10]  # Limit to 10 per search

    def _parse_search_card(self, card) -> Optional[dict]:
        """Parse an Amazon search result card."""
        asin = card.attributes.get("data-asin", "")
        if not asin:
            return None

        # Title
        title_el = card.css_first("h2 a span")
        name = title_el.text().strip() if title_el else ""

        # Price
        price_whole = card.css_first("span.a-price-whole")
        price_frac = card.css_first("span.a-price-fraction")
        current_price = None
        if price_whole:
            try:
                whole = price_whole.text().replace(",", "").replace(".", "").strip()
                frac = price_frac.text().strip() if price_frac else "00"
                current_price = float(f"{whole}.{frac}")
            except ValueError:
                pass

        # Original price (strikethrough)
        original_el = card.css_first("span.a-price.a-text-price span.a-offscreen")
        original_price = None
        if original_el:
            try:
                original_price = float(
                    original_el.text().replace("$", "").replace(",", "").strip()
                )
            except ValueError:
                pass

        # Rating
        rating_el = card.css_first("span.a-icon-alt")
        rating = None
        if rating_el:
            match = re.search(r"([\d.]+)", rating_el.text())
            if match:
                rating = float(match.group(1))

        # Review count
        review_el = card.css_first("span.a-size-base.s-underline-text")
        review_count = 0
        if review_el:
            try:
                review_count = int(
                    review_el.text().replace(",", "").replace(".", "").strip()
                )
            except ValueError:
                pass

        # Try to extract SKU/model from title
        sku = self._extract_sku_from_title(name)

        return {
            "asin": asin,
            "name": name,
            "sku": sku,
            "currentPrice": current_price,
            "originalPrice": original_price,
            "rating": rating,
            "reviewCount": review_count,
        }

    def _extract_sku_from_title(self, title: str) -> Optional[str]:
        """Try to extract a sneaker model code from the product title."""
        # Common patterns: "Nike Air Force 1 '07 ..." → "AF1-07"
        patterns = [
            r"([A-Z]{2,}\d{2,}[-/]\d{2,})",  # e.g., DD1391-100
            r"([A-Z]{2,}\d{4,})",              # e.g., FB9658
        ]
        for pattern in patterns:
            match = re.search(pattern, title.upper())
            if match:
                return match.group(1)
        return None
