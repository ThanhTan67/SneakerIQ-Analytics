"""
GlowMart Crawl Service — FastAPI Application

Crawls sneaker data from TheSneakerDatabase (RapidAPI) and sends
raw data to the Spring Boot backend for ETL processing.

Free tier budget: 100 requests/month
Strategy: Full crawl on startup (49 requests), weekly re-crawl 1 brand (7 requests)
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime

import httpx
from fastapi import FastAPI, BackgroundTasks, HTTPException
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from api_clients.sneakerdb_client import SneakerDBClient, BRANDS_TO_CRAWL
from config import (
    AUTO_CRAWL_ON_STARTUP, BACKEND_URL, ETL_TRIGGER_URL,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("crawl-service")

# Scheduler
scheduler = AsyncIOScheduler()

# Crawl status
crawl_status = {
    "last_crawl": None,
    "running": False,
    "source": None,
    "errors": [],
    "total_products_crawled": 0,
    "monthly_requests_used": 0,
}

# Weekly rotation index
_weekly_brand_index = 0


# ============================================================
# CRAWL FUNCTIONS
# ============================================================

async def run_sneakerdb_crawl():
    """Crawl all brands from SneakerDB (uses cache to minimize API calls)."""
    crawl_status["running"] = True
    crawl_status["source"] = "sneakerdb"

    try:
        client = SneakerDBClient()
        await client.run_full_crawl()
        crawl_status["monthly_requests_used"] = client._load_counter().get("count", 0)
        logger.info("SneakerDB crawl completed")
    except Exception as e:
        logger.error(f"SneakerDB crawl failed: {e}")
        crawl_status["errors"].append({"source": "sneakerdb", "error": str(e)})
    finally:
        crawl_status["running"] = False
        crawl_status["source"] = None
        crawl_status["last_crawl"] = datetime.now().isoformat()


async def run_weekly_brand_refresh():
    """Rotate through brands weekly (7 requests/week ≈ 28/month)."""
    global _weekly_brand_index

    brand = BRANDS_TO_CRAWL[_weekly_brand_index % len(BRANDS_TO_CRAWL)]
    _weekly_brand_index += 1

    logger.info(f"Weekly refresh: re-crawling '{brand}'...")

    try:
        client = SneakerDBClient()
        # Invalidate cache for this brand
        import os
        cache_path = client._cache_path(brand)
        if os.path.exists(cache_path):
            os.remove(cache_path)
            logger.info(f"Invalidated cache for '{brand}'")

        # Re-crawl just this brand
        await client._crawl_brand(brand)
        crawl_status["monthly_requests_used"] = client._load_counter().get("count", 0)

        # Trigger ETL
        await trigger_etl()

    except Exception as e:
        logger.error(f"Weekly refresh failed for '{brand}': {e}")


async def trigger_etl():
    """Trigger the backend ETL pipeline."""
    logger.info("Triggering backend ETL pipeline...")
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(ETL_TRIGGER_URL)
            if resp.status_code == 200:
                result = resp.json()
                logger.info(f"ETL complete: {result}")
                return result
            else:
                logger.error(f"ETL trigger failed ({resp.status_code}): {resp.text}")
    except Exception as e:
        logger.error(f"ETL trigger error: {e}")
    return None


async def startup_crawl():
    """On startup: crawl all brands then trigger ETL."""
    logger.info("=" * 60)
    logger.info("STARTUP CRAWL: Populating database with real data...")
    logger.info("=" * 60)

    await wait_for_backend()
    await run_sneakerdb_crawl()
    await trigger_etl()

    logger.info("=" * 60)
    logger.info("STARTUP CRAWL COMPLETE")
    logger.info("=" * 60)


async def wait_for_backend(max_wait: int = 60):
    """Wait for Spring Boot backend to be ready."""
    logger.info("Waiting for backend...")
    async with httpx.AsyncClient(timeout=5.0) as client:
        for attempt in range(max_wait // 3):
            try:
                resp = await client.get(f"{BACKEND_URL}/api/v1/brands")
                if resp.status_code == 200:
                    logger.info("Backend is ready!")
                    return
            except Exception:
                pass
            await asyncio.sleep(3)
    logger.warning("Backend may not be ready, proceeding anyway...")


# ============================================================
# SCHEDULER — Budget-aware
# ============================================================

def setup_scheduler():
    """Weekly brand rotation (≈28 requests/month)."""
    # Re-crawl 1 brand per week (every 7 days)
    scheduler.add_job(
        run_weekly_brand_refresh,
        "interval",
        weeks=1,
        id="weekly_brand_refresh",
        name="Weekly Brand Refresh (1 brand, ~7 requests)",
    )
    scheduler.start()
    logger.info("Scheduler started: weekly brand rotation")


# ============================================================
# FASTAPI APP
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_scheduler()
    logger.info("GlowMart Crawl Service started (RapidAPI mode)")

    if AUTO_CRAWL_ON_STARTUP:
        asyncio.create_task(startup_crawl())

    yield
    scheduler.shutdown()
    logger.info("GlowMart Crawl Service stopped")


app = FastAPI(
    title="GlowMart Crawl Service",
    description="Sneaker data crawling via RapidAPI SneakerDB — Free tier budget aware",
    version="3.0.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "crawl-service", "api": "rapidapi-sneakerdb"}


@app.get("/crawl/status")
async def get_status():
    client = SneakerDBClient()
    remaining = client._get_remaining_requests()
    counter = client._load_counter()

    return {
        **crawl_status,
        "api_budget": {
            "monthly_limit": 95,
            "used": counter.get("count", 0),
            "remaining": remaining,
            "month": counter.get("month", ""),
        },
        "available_brands": BRANDS_TO_CRAWL,
        "scheduler_jobs": [
            {
                "id": job.id,
                "name": job.name,
                "next_run": str(job.next_run_time) if job.next_run_time else None,
            }
            for job in scheduler.get_jobs()
        ],
    }


@app.post("/crawl/all")
async def trigger_full_crawl(background_tasks: BackgroundTasks):
    """Full crawl (uses cache, only calls API when cache expired)."""
    if crawl_status["running"]:
        raise HTTPException(status_code=409, detail="Crawl already running")

    async def crawl_then_etl():
        await run_sneakerdb_crawl()
        await trigger_etl()

    background_tasks.add_task(crawl_then_etl)
    return {"message": "Full crawl started", "status": "started"}


@app.post("/crawl/etl")
async def trigger_etl_endpoint():
    """Manually trigger ETL."""
    result = await trigger_etl()
    if result:
        return result
    raise HTTPException(status_code=500, detail="ETL trigger failed")


@app.get("/crawl/budget")
async def get_budget():
    """Check API budget usage."""
    client = SneakerDBClient()
    counter = client._load_counter()
    remaining = client._get_remaining_requests()
    return {
        "month": counter.get("month", ""),
        "used": counter.get("count", 0),
        "remaining": remaining,
        "limit": 95,
        "safe": remaining > 10,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
