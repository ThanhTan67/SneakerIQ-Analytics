"""
Nike.com Scraper
Crawls product data from Nike.com/vn using their internal API.

Nike uses a Next.js frontend with API endpoints that return structured JSON.
The main endpoint is the product wall/grid API.
"""

import json
import logging
from typing import List, Optional
from selectolax.parser import HTMLParser

from scrapers.base_scraper import BaseScraper
from models.schemas import CrawledProduct, CrawledPrice, CrawledVariant
from config import BRAND_URLS

logger = logging.getLogger(__name__)


class NikeScraper(BaseScraper):
    source_name = "nike"
    source_type = "OFFICIAL"

    def __init__(self):
        super().__init__()
        self.config = BRAND_URLS["nike"]
        self.base_url = self.config["base_url"]

    async def crawl_products(self) -> List[CrawledProduct]:
        """
        Crawl products from Nike.com/vn.

        Strategy:
        1. Try Nike's internal API first (faster, structured data)
        2. Fall back to HTML scraping if API is blocked
        """
        products = []

        # Try Nike's product wall API
        api_products = await self._crawl_via_api()
        if api_products:
            products.extend(api_products)
        else:
            # Fallback: scrape HTML pages
            html_products = await self._crawl_via_html()
            products.extend(html_products)

        logger.info(f"Nike: crawled {len(products)} products")
        return products

    async def crawl_prices(self) -> List[CrawledPrice]:
        """Prices are collected alongside products in crawl_products."""
        return []

    # ============================================================
    # API-BASED CRAWLING
    # ============================================================

    async def _crawl_via_api(self) -> List[CrawledProduct]:
        """
        Crawl using Nike's internal product API.
        Endpoint: https://api.nike.com/cic/browse/v2

        Nike's API accepts query parameters for filtering by category,
        gender, brand, etc. Returns structured JSON with product data.
        """
        products = []

        # Nike API endpoints for sneakers
        api_params = {
            "queryid": "products",
            "anonymousId": "",
            "country": "vn",
            "endpoint": "/product_feed/rollup_threads/v2",
            "language": "vi",
            "localizedRangeStr": "{lowestPrice} — {highestPrice}",
            "count": 60,
            "anchor": 0,
        }

        # Categories to crawl
        channels = [
            "d9a5bc42-4b9c-4976-858a-f159cf99c647",  # Nike Shoes
        ]

        for channel_id in channels:
            params = {**api_params, "channel": channel_id}
            api_url = self.config.get("api_url", "https://api.nike.com/cic/browse/v2")

            data = await self.fetch_json(
                api_url,
                params=params,
                headers={
                    "nike-api-caller-id": "com.nike:commerce.nikedotcom.web",
                }
            )

            if not data:
                logger.info("Nike API not accessible, will try HTML scraping")
                return []

            # Parse API response
            objects = data.get("data", {}).get("products", {}).get("products", [])
            for obj in objects:
                try:
                    product = self._parse_api_product(obj)
                    if product:
                        products.append(product)
                        # Ingest immediately
                        await self.ingest_product(
                            product,
                            external_id=obj.get("id", product.sku),
                            source_url=f"{self.base_url}/t/{obj.get('url', '')}",
                        )
                except Exception as e:
                    logger.error(f"Error parsing Nike API product: {e}")

        return products

    def _parse_api_product(self, data: dict) -> Optional[CrawledProduct]:
        """Parse a product from Nike's API response."""
        title = data.get("title", "")
        if not title:
            return None

        # Extract price
        price_data = data.get("price", {})
        current_price = price_data.get("currentPrice")
        full_price = price_data.get("fullPrice")

        # Extract colors/images
        color_images = data.get("colorways", [])
        main_image = None
        color = None
        variants = []

        if color_images:
            first_color = color_images[0]
            main_image = first_color.get("images", {}).get("portraitURL", "")
            color = first_color.get("colorDescription", "")

        # Extract sizes from available SKUs
        available_sizes = data.get("availableSkus", [])
        for sku_data in available_sizes:
            variants.append(CrawledVariant(
                size=sku_data.get("localizedSize", sku_data.get("size", "")),
                colorway=color,
                stockStatus="AVAILABLE" if sku_data.get("available", True) else "OUT_OF_STOCK",
                price=current_price,
            ))

        return CrawledProduct(
            name=title,
            sku=data.get("productCode", ""),
            modelCode=data.get("styleCode", ""),
            brandSlug="nike",
            category=self._categorize_product(data),
            color=color,
            descriptionShort=data.get("subtitle", ""),
            descriptionLong=data.get("description", ""),
            mainImage=main_image,
            currentPrice=current_price * 1000 if current_price else None,  # USD to VND approx
            originalPrice=full_price * 1000 if full_price else None,
            currency="VND",
            gender=self._parse_gender(data),
            variants=variants if variants else None,
        )

    # ============================================================
    # HTML-BASED CRAWLING (fallback)
    # ============================================================

    async def _crawl_via_html(self) -> List[CrawledProduct]:
        """Fallback: crawl by parsing HTML pages."""
        products = []

        # Crawl the shoes category pages
        category_urls = [
            f"{self.base_url}/w/mens-shoes",
            f"{self.base_url}/w/womens-shoes",
        ]

        for cat_url in category_urls:
            resp = await self.fetch(cat_url)
            if not resp:
                continue

            tree = HTMLParser(resp.text)

            # Find product cards
            product_cards = tree.css("div.product-card")
            for card in product_cards:
                try:
                    product = self._parse_html_product(card)
                    if product:
                        products.append(product)
                except Exception as e:
                    logger.error(f"Error parsing Nike HTML product: {e}")

            # Check for __NEXT_DATA__ script (Next.js)
            next_data = tree.css_first("script#__NEXT_DATA__")
            if next_data and next_data.text():
                try:
                    json_data = json.loads(next_data.text())
                    wall_data = (json_data.get("props", {})
                                 .get("pageProps", {})
                                 .get("initialState", {})
                                 .get("Wall", {})
                                 .get("products", []))
                    for item in wall_data:
                        product = self._parse_api_product(item)
                        if product:
                            products.append(product)
                except json.JSONDecodeError:
                    pass

        return products

    def _parse_html_product(self, card) -> Optional[CrawledProduct]:
        """Parse a product from an HTML card element."""
        name_el = card.css_first("div.product-card__title")
        price_el = card.css_first("div.product-price")
        img_el = card.css_first("img.product-card__hero-image")
        link_el = card.css_first("a.product-card__link-overlay")

        name = name_el.text().strip() if name_el else None
        if not name:
            return None

        price_text = price_el.text().strip() if price_el else ""
        price = self._parse_price(price_text)
        image = img_el.attributes.get("src", "") if img_el else ""

        return CrawledProduct(
            name=name,
            brandSlug="nike",
            mainImage=image,
            currentPrice=price,
            currency="VND",
        )

    # ============================================================
    # HELPERS
    # ============================================================

    def _parse_price(self, price_text: str) -> Optional[float]:
        """Parse Vietnamese price format, e.g., '3.519.000₫'"""
        if not price_text:
            return None
        cleaned = price_text.replace("₫", "").replace(".", "").replace(",", "").strip()
        try:
            return float(cleaned)
        except ValueError:
            return None

    def _parse_gender(self, data: dict) -> Optional[str]:
        """Determine gender from Nike API data."""
        label = data.get("label", "").lower()
        if "men" in label and "women" not in label:
            return "MEN"
        elif "women" in label:
            return "WOMEN"
        elif "kid" in label or "boy" in label or "girl" in label:
            return "KIDS"
        return "UNISEX"

    def _categorize_product(self, data: dict) -> str:
        """Map Nike product types to our categories."""
        product_type = data.get("productType", "").lower()
        subtitle = data.get("subtitle", "").lower()

        if "running" in subtitle or "pegasus" in subtitle or "vomero" in subtitle:
            return "Running"
        elif "basketball" in subtitle or "jordan" in subtitle:
            return "Basketball"
        elif "skate" in subtitle or "sb" in subtitle:
            return "Skateboarding"
        elif "retro" in subtitle or "vintage" in subtitle:
            return "Retro"
        else:
            return "Lifestyle"
