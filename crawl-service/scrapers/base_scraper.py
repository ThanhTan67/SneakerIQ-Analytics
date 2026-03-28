"""Base scraper class providing common crawling functionality."""

import asyncio
import json
import logging
import random
import time
from abc import ABC, abstractmethod
from typing import List, Optional

import httpx

from config import (
    BACKEND_URL, INGEST_URL, INGEST_BATCH_URL, JOB_START_URL,
    USER_AGENT, REQUEST_DELAY_MIN, REQUEST_DELAY_MAX,
)
from models.schemas import CrawledProduct, CrawledPrice, CrawledReview, CrawledDeal

logger = logging.getLogger(__name__)


class BaseScraper(ABC):
    """
    Abstract base class for all scrapers.

    Each scraper must implement:
      - source_name: identifier (e.g., 'nike', 'amazon')
      - source_type: OFFICIAL, MARKETPLACE, or CATALOG
      - crawl_products(): crawl product data
      - crawl_prices(): crawl price data
      - crawl_reviews(): crawl review data (optional)
      - crawl_deals(): crawl deal data (optional)
    """

    source_name: str = ""
    source_type: str = "OFFICIAL"  # OFFICIAL, MARKETPLACE, CATALOG

    def __init__(self):
        self.client = httpx.AsyncClient(
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
            },
            timeout=30.0,
            follow_redirects=True,
        )
        self.backend_client = httpx.AsyncClient(
            base_url=BACKEND_URL,
            timeout=30.0,
        )
        self.crawl_job_id: Optional[str] = None

    async def close(self):
        await self.client.aclose()
        await self.backend_client.aclose()

    # ============================================================
    # ABSTRACT METHODS — Must be implemented by subclasses
    # ============================================================

    @abstractmethod
    async def crawl_products(self) -> List[CrawledProduct]:
        """Crawl product master data from the source."""
        ...

    @abstractmethod
    async def crawl_prices(self) -> List[CrawledPrice]:
        """Crawl current prices from the source."""
        ...

    async def crawl_reviews(self) -> List[CrawledReview]:
        """Crawl review data. Default: empty (override for marketplaces)."""
        return []

    async def crawl_deals(self) -> List[CrawledDeal]:
        """Crawl deal/discount data. Default: empty."""
        return []

    # ============================================================
    # CRAWL JOB LIFECYCLE
    # ============================================================

    async def start_job(self, job_type: str = "FULL_CRAWL") -> str:
        """Start a crawl job on the Spring Boot backend."""
        try:
            resp = await self.backend_client.post(
                "/api/crawl/jobs",
                json={"sourceName": self.source_name, "jobType": job_type}
            )
            if resp.status_code == 200:
                data = resp.json()
                self.crawl_job_id = data.get("id")
                logger.info(f"Started crawl job: {self.crawl_job_id}")
                return self.crawl_job_id
        except Exception as e:
            logger.error(f"Failed to start crawl job: {e}")
        return None

    async def complete_job(self, items_processed: int, items_error: int):
        """Mark crawl job as completed."""
        if not self.crawl_job_id:
            return
        try:
            await self.backend_client.post(
                f"/api/crawl/jobs/{self.crawl_job_id}/complete",
                json={"itemsProcessed": items_processed, "itemsError": items_error}
            )
        except Exception as e:
            logger.error(f"Failed to complete job: {e}")

    async def fail_job(self, error: str):
        """Mark crawl job as failed."""
        if not self.crawl_job_id:
            return
        try:
            await self.backend_client.post(
                f"/api/crawl/jobs/{self.crawl_job_id}/fail",
                json={"error": error}
            )
        except Exception as e:
            logger.error(f"Failed to fail job: {e}")

    # ============================================================
    # DATA INGESTION
    # ============================================================

    async def ingest_product(self, product: CrawledProduct, external_id: str,
                              source_url: str = None):
        """Send a crawled product to the backend."""
        await self._ingest(
            external_id=external_id,
            source_url=source_url,
            raw_json=product.model_dump_json(),
            data_type="PRODUCT",
        )

    async def ingest_price(self, price: CrawledPrice, external_id: str,
                            source_url: str = None):
        """Send a crawled price to the backend."""
        await self._ingest(
            external_id=external_id,
            source_url=source_url,
            raw_json=price.model_dump_json(),
            data_type="PRICE",
        )

    async def ingest_review(self, review: CrawledReview, external_id: str,
                             source_url: str = None):
        """Send a crawled review to the backend."""
        await self._ingest(
            external_id=external_id,
            source_url=source_url,
            raw_json=review.model_dump_json(),
            data_type="REVIEW",
        )

    async def ingest_deal(self, deal: CrawledDeal, external_id: str,
                           source_url: str = None):
        """Send a crawled deal to the backend."""
        await self._ingest(
            external_id=external_id,
            source_url=source_url,
            raw_json=deal.model_dump_json(),
            data_type="DEAL",
        )

    async def _ingest(self, external_id: str, source_url: str,
                       raw_json: str, data_type: str):
        """Send raw data to the Spring Boot /api/crawl/ingest endpoint."""
        payload = {
            "crawlJobId": self.crawl_job_id,
            "sourceName": self.source_name,
            "sourceType": self.source_type,
            "sourceUrl": source_url or "",
            "externalId": external_id or "",
            "rawJson": raw_json,
            "dataType": data_type,
        }
        try:
            resp = await self.backend_client.post("/api/crawl/ingest", json=payload)
            if resp.status_code != 200:
                logger.error(f"Ingest failed ({resp.status_code}): {resp.text}")
        except Exception as e:
            logger.error(f"Ingest error: {e}")

    # ============================================================
    # HTTP HELPERS
    # ============================================================

    async def fetch(self, url: str, **kwargs) -> Optional[httpx.Response]:
        """Fetch a URL with rate limiting and error handling."""
        await self._rate_limit()
        try:
            resp = await self.client.get(url, **kwargs)
            resp.raise_for_status()
            return resp
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error {e.response.status_code} for {url}")
        except Exception as e:
            logger.error(f"Request error for {url}: {e}")
        return None

    async def fetch_json(self, url: str, **kwargs) -> Optional[dict]:
        """Fetch JSON from a URL."""
        resp = await self.fetch(url, **kwargs)
        if resp:
            return resp.json()
        return None

    async def _rate_limit(self):
        """Add random delay between requests to avoid rate limiting."""
        delay = random.uniform(REQUEST_DELAY_MIN, REQUEST_DELAY_MAX)
        await asyncio.sleep(delay)

    # ============================================================
    # RUN ALL CRAWL TYPES
    # ============================================================

    async def run_full_crawl(self):
        """Run a full crawl: products, prices, reviews, deals."""
        logger.info(f"Starting full crawl for {self.source_name}...")
        await self.start_job("FULL_CRAWL")

        items_processed = 0
        items_error = 0

        try:
            # Crawl products
            products = await self.crawl_products()
            for product in products:
                try:
                    await self.ingest_product(
                        product,
                        external_id=product.sku or product.name,
                    )
                    items_processed += 1
                except Exception as e:
                    logger.error(f"Error ingesting product: {e}")
                    items_error += 1

            # Crawl prices
            prices = await self.crawl_prices()
            for price in prices:
                try:
                    await self.ingest_price(price, external_id=price.sku or "")
                    items_processed += 1
                except Exception as e:
                    items_error += 1

            # Crawl reviews
            reviews = await self.crawl_reviews()
            for review in reviews:
                try:
                    await self.ingest_review(review, external_id=review.sku or "")
                    items_processed += 1
                except Exception as e:
                    items_error += 1

            # Crawl deals
            deals = await self.crawl_deals()
            for deal in deals:
                try:
                    await self.ingest_deal(deal, external_id=deal.sku or "")
                    items_processed += 1
                except Exception as e:
                    items_error += 1

            await self.complete_job(items_processed, items_error)
            logger.info(
                f"Full crawl complete for {self.source_name}: "
                f"{items_processed} processed, {items_error} errors"
            )

        except Exception as e:
            logger.error(f"Full crawl failed: {e}")
            await self.fail_job(str(e))
            raise

        finally:
            await self.close()
