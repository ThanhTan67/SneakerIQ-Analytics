"""
TheSneakerDatabase API Client — RapidAPI Integration

Uses RapidAPI's TheSneakerDatabase for catalog data across all brands.
Free tier: 100 requests/month, 5 req/sec, 10GB bandwidth.

Strategy:
  - Paginate getSneakers: limit=15 × 7 pages = 105 products/brand
  - Local JSON cache (7-day expiry) to avoid repeat API calls
  - Request counter to stay under monthly limit
"""

import asyncio
import json
import logging
import os
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional

import httpx

from scrapers.base_scraper import BaseScraper
from models.schemas import CrawledProduct, CrawledPrice
from normalizer.product_normalizer import categorize_sneaker
from config import (
    RAPIDAPI_KEY, RAPIDAPI_HOST, SNEAKERDB_BASE_URL,
    MONTHLY_REQUEST_LIMIT, RAPIDAPI_DELAY,
    PRODUCTS_PER_PAGE, PAGES_PER_BRAND,
    CACHE_DIR, CACHE_EXPIRY_DAYS, BRAND_URLS,
)

logger = logging.getLogger(__name__)

# Request counter file
REQUEST_COUNTER_FILE = os.path.join(CACHE_DIR, "_request_counter.json")

# All brands to crawl
BRANDS_TO_CRAWL = ["nike", "adidas", "puma", "new balance", "converse", "vans", "jordan"]


class SneakerDBClient(BaseScraper):
    """Crawl sneaker data from TheSneakerDatabase via RapidAPI."""

    source_name = "TheSneakerDatabase"
    source_type = "CATALOG"

    def __init__(self):
        super().__init__()
        self.api_client = httpx.AsyncClient(
            base_url=SNEAKERDB_BASE_URL,
            headers={
                "X-RapidAPI-Key": RAPIDAPI_KEY,
                "X-RapidAPI-Host": RAPIDAPI_HOST,
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )
        # Ensure cache directory exists
        Path(CACHE_DIR).mkdir(parents=True, exist_ok=True)

    # ============================================================
    # ABSTRACT METHOD IMPLEMENTATIONS (required by BaseScraper)
    # ============================================================

    async def crawl_products(self) -> List[CrawledProduct]:
        """Not used directly — run_full_crawl handles everything."""
        return []

    async def crawl_prices(self) -> List[CrawledPrice]:
        """Not used directly — run_full_crawl handles everything."""
        return []

    # ============================================================
    # REQUEST COUNTING (stay under 100/month)
    # ============================================================

    def _load_counter(self) -> dict:
        """Load the monthly request counter."""
        try:
            if os.path.exists(REQUEST_COUNTER_FILE):
                with open(REQUEST_COUNTER_FILE, "r") as f:
                    data = json.load(f)
                # Reset if new month
                stored_month = data.get("month", "")
                current_month = datetime.now().strftime("%Y-%m")
                if stored_month != current_month:
                    return {"month": current_month, "count": 0}
                return data
        except Exception:
            pass
        return {"month": datetime.now().strftime("%Y-%m"), "count": 0}

    def _save_counter(self, counter: dict):
        """Save the monthly request counter."""
        try:
            with open(REQUEST_COUNTER_FILE, "w") as f:
                json.dump(counter, f)
        except Exception as e:
            logger.error(f"Failed to save request counter: {e}")

    def _increment_counter(self) -> int:
        """Increment and return the current month's request count."""
        counter = self._load_counter()
        counter["count"] += 1
        self._save_counter(counter)
        return counter["count"]

    def _get_remaining_requests(self) -> int:
        """Get remaining requests for this month."""
        counter = self._load_counter()
        return MONTHLY_REQUEST_LIMIT - counter.get("count", 0)

    # ============================================================
    # LOCAL JSON CACHE
    # ============================================================

    def _cache_path(self, brand: str) -> str:
        """Get cache file path for a brand."""
        safe_name = brand.replace(" ", "_").lower()
        return os.path.join(CACHE_DIR, f"sneakerdb_{safe_name}.json")

    def _is_cache_valid(self, brand: str) -> bool:
        """Check if cache exists and is not expired."""
        path = self._cache_path(brand)
        if not os.path.exists(path):
            return False
        try:
            mtime = os.path.getmtime(path)
            age = datetime.now() - datetime.fromtimestamp(mtime)
            return age < timedelta(days=CACHE_EXPIRY_DAYS)
        except Exception:
            return False

    def _load_cache(self, brand: str) -> Optional[List[dict]]:
        """Load cached products for a brand."""
        path = self._cache_path(brand)
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                logger.info(f"Cache hit for '{brand}': {len(data)} products")
                return data
        except Exception as e:
            logger.warning(f"Failed to load cache for '{brand}': {e}")
            return None

    def _save_cache(self, brand: str, products: List[dict]):
        """Save products to cache."""
        path = self._cache_path(brand)
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(products, f, ensure_ascii=False, indent=2)
            logger.info(f"Cached {len(products)} products for '{brand}'")
        except Exception as e:
            logger.error(f"Failed to save cache for '{brand}': {e}")

    # ============================================================
    # MAIN CRAWL
    # ============================================================

    async def run_full_crawl(self):
        """Crawl all brands with caching and budget control."""
        remaining = self._get_remaining_requests()
        logger.info(f"SneakerDB: Starting crawl. Remaining API requests this month: {remaining}")

        if remaining <= 0:
            logger.warning("SneakerDB: Monthly request limit reached! Using cache only.")

        total_products = 0
        errors = 0

        # Start a crawl job on the backend so ingest has a valid crawlJobId
        await self.start_job("FULL_CRAWL")

        for brand in BRANDS_TO_CRAWL:
            # Check cache first
            if self._is_cache_valid(brand):
                cached = self._load_cache(brand)
                if cached:
                    await self._ingest_from_cache(cached, brand)
                    total_products += len(cached)
                    continue

            # Check budget before making API calls
            remaining = self._get_remaining_requests()
            needed = PAGES_PER_BRAND  # 1 request per brand
            if remaining < needed:
                logger.warning(
                    f"SneakerDB: Only {remaining} requests left, "
                    f"need {needed} for '{brand}'. Skipping."
                )
                # Try cache even if expired
                cached = self._load_cache(brand)
                if cached:
                    await self._ingest_from_cache(cached, brand)
                    total_products += len(cached)
                continue

            # Crawl from API
            products = await self._crawl_brand(brand)
            total_products += len(products)

        # Complete the crawl job
        await self.complete_job(total_products, errors)

        logger.info(f"SneakerDB: Crawl complete. Total products: {total_products}")
        remaining = self._get_remaining_requests()
        logger.info(f"SneakerDB: Remaining API requests this month: {remaining}")

    async def _crawl_brand(self, brand: str) -> List[dict]:
        """Crawl a single brand with pagination."""
        all_raw = []

        brand_slug = brand.replace(" ", "-").lower()
        if brand_slug == "new-balance":
            brand_slug = "new-balance"

        logger.info(f"SneakerDB: Crawling '{brand}' ({PAGES_PER_BRAND} pages × {PRODUCTS_PER_PAGE}/page)...")

        for page in range(1, PAGES_PER_BRAND + 1):
            try:
                # Rate limit: 5 req/sec max
                await asyncio.sleep(RAPIDAPI_DELAY)

                resp = await self.api_client.get(
                    "/search",
                    params={
                        "limit": str(PRODUCTS_PER_PAGE),
                        "page": str(page - 1),
                        "query": brand,
                    },
                )

                count = self._increment_counter()
                logger.info(
                    f"  Page {page}/{PAGES_PER_BRAND} — "
                    f"Status: {resp.status_code} — "
                    f"Monthly requests: {count}/{MONTHLY_REQUEST_LIMIT}"
                )

                if resp.status_code == 429:
                    logger.warning("SneakerDB: Rate limited! Waiting 5s...")
                    await asyncio.sleep(5)
                    continue

                if resp.status_code != 200:
                    logger.warning(f"SneakerDB: API returned {resp.status_code}")
                    break

                data = resp.json()

                # Handle different response formats
                if isinstance(data, list):
                    items = data
                elif isinstance(data, dict):
                    items = data.get("results", data.get("data", data.get("products", [])))
                    if isinstance(items, dict):
                        items = list(items.values()) if items else []
                else:
                    items = []

                if not items:
                    logger.info(f"  No more products on page {page}")
                    break

                all_raw.extend(items)

            except httpx.HTTPError as e:
                logger.error(f"SneakerDB API error on page {page}: {e}")
                break
            except Exception as e:
                logger.error(f"Error crawling page {page}: {e}")
                break

        # Save to cache
        if all_raw:
            self._save_cache(brand, all_raw)

        # Parse and ingest
        for item in all_raw:
            product = self._parse_sneaker(item, brand)
            if product:
                await self.ingest_product(
                    product,
                    external_id=str(item.get("id", "")),
                    source_url=item.get("links", {}).get("stockX", "") if isinstance(item.get("links"), dict) else "",
                )

        logger.info(f"SneakerDB: '{brand}' — {len(all_raw)} products crawled")
        return all_raw

    async def _ingest_from_cache(self, raw_items: List[dict], brand: str):
        """Ingest products from cache (no API calls needed)."""
        count = 0
        for item in raw_items:
            product = self._parse_sneaker(item, brand)
            if product:
                await self.ingest_product(
                    product,
                    external_id=str(item.get("id", "")),
                    source_url=item.get("links", {}).get("stockX", "") if isinstance(item.get("links"), dict) else "",
                )
                count += 1
        logger.info(f"SneakerDB: Ingested {count} products from cache for '{brand}'")

    # ============================================================
    # PARSING
    # ============================================================

    def _parse_sneaker(self, data: dict, brand_hint: str = "") -> Optional[CrawledProduct]:
        """Parse a sneaker from the RapidAPI response."""
        name = data.get("shoeName") or data.get("shoe") or data.get("name") or data.get("title", "")
        if not name:
            return None

        # Brand slug
        brand_slug = self._detect_brand(data, brand_hint)

        # Price (retail, usually in USD)
        retail_price = data.get("retailPrice") or data.get("price")
        if retail_price:
            if isinstance(retail_price, str):
                try:
                    retail_price = float(retail_price.replace("$", "").replace(",", ""))
                except ValueError:
                    retail_price = None
            elif isinstance(retail_price, (int, float)):
                retail_price = float(retail_price)

        # Estimated market value
        estimated_value = data.get("estimatedMarketValue") or data.get("resellPrice")
        if estimated_value and isinstance(estimated_value, str):
            try:
                estimated_value = float(estimated_value.replace("$", "").replace(",", ""))
            except ValueError:
                estimated_value = None

        # Convert USD to VND (approximate)
        price_vnd = retail_price * 25000 if retail_price else None
        market_vnd = estimated_value * 25000 if estimated_value else price_vnd

        # Images — prefer high-res original
        image = ""
        img_data = data.get("image")
        if isinstance(img_data, dict):
            image = img_data.get("original") or img_data.get("small") or img_data.get("thumbnail", "")
        elif isinstance(img_data, str):
            image = img_data
        if not image:
            image = data.get("thumbnail") or ""

        # Skip products without image or price (data cleaning)
        if not image or (not retail_price and not estimated_value):
            return None

        # Resell links (for Buy Now)
        links = data.get("links", {}) or {}
        resell_info = {}
        if isinstance(links, dict):
            for site in ["stockX", "goat", "flightClub", "stadiumGoods"]:
                if links.get(site):
                    resell_info[site] = links[site]

        # Category detection
        colorway = data.get("colorway") or data.get("color", "")
        desc_short = data.get("story") or data.get("description", "")
        category = categorize_sneaker(name, desc_short)

        # Release date
        release_date = data.get("releaseDate") or data.get("release_date")

        # Gender
        gender = self._parse_gender(data)

        # Build description with resell links for frontend
        desc_long = desc_short
        if resell_info:
            link_parts = []
            for site, url in resell_info.items():
                link_parts.append(f"{site}: {url}")
            desc_long = f"{desc_short}\n\n[RESELL_LINKS]{json.dumps(resell_info)}[/RESELL_LINKS]"

        return CrawledProduct(
            name=name,
            sku=data.get("styleId") or data.get("sku", ""),
            modelCode=data.get("styleId") or data.get("make", ""),
            brandSlug=brand_slug,
            category=category,
            color=colorway,
            descriptionShort=desc_short[:500] if desc_short else "",
            descriptionLong=desc_long,
            mainImage=image,
            currentPrice=market_vnd or price_vnd,
            originalPrice=price_vnd,
            currency="VND",
            gender=gender,
            releaseDate=release_date,
        )

    def _detect_brand(self, data: dict, brand_hint: str = "") -> str:
        """Detect brand slug from data or hint."""
        brand = (data.get("brand") or data.get("make") or brand_hint or "").lower().strip()

        brand_map = {
            "nike": "nike",
            "adidas": "adidas",
            "puma": "puma",
            "new balance": "new-balance",
            "newbalance": "new-balance",
            "converse": "converse",
            "vans": "vans",
            "jordan": "jordan",
            "air jordan": "jordan",
        }

        for key, slug in brand_map.items():
            if key in brand:
                return slug

        # Fallback: detect from product name
        name = (data.get("shoeName") or data.get("name") or "").lower()
        for key, slug in brand_map.items():
            if key in name:
                return slug

        return brand.replace(" ", "-") if brand else "unknown"

    def _parse_gender(self, data: dict) -> Optional[str]:
        """Parse gender from API data."""
        gender = data.get("gender") or ""
        if isinstance(gender, str):
            g = gender.lower()
            if "men" in g and "women" not in g:
                return "MEN"
            elif "women" in g or "wmns" in g:
                return "WOMEN"
            elif "kid" in g or "gs" in g:
                return "KIDS"
            elif "unisex" in g:
                return "UNISEX"
        return "UNISEX"

    async def close(self):
        """Close the HTTP client."""
        await self.api_client.aclose()
