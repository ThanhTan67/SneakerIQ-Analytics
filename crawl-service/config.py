import os
from dotenv import load_dotenv

load_dotenv()

# Backend connection
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")
INGEST_URL = f"{BACKEND_URL}/api/crawl/ingest"
INGEST_BATCH_URL = f"{BACKEND_URL}/api/crawl/ingest/batch"
JOB_START_URL = f"{BACKEND_URL}/api/crawl/jobs"
ETL_TRIGGER_URL = f"{BACKEND_URL}/api/crawl/etl"

# Auto crawl on startup (populates empty DB)
AUTO_CRAWL_ON_STARTUP = os.getenv("AUTO_CRAWL_ON_STARTUP", "true").lower() == "true"

# ============================================================
# RapidAPI — TheSneakerDatabase
# Free tier: 100 requests/month, 5 req/sec, 10GB bandwidth
# ============================================================
RAPIDAPI_KEY = os.getenv("SNEAKERDB_API_KEY", "")
RAPIDAPI_HOST = "the-sneaker-database.p.rapidapi.com"
SNEAKERDB_BASE_URL = f"https://{RAPIDAPI_HOST}"

# Budget control
MONTHLY_REQUEST_LIMIT = 95  # Leave 5 requests as buffer
RAPIDAPI_DELAY = 0.25       # 0.25s between requests (max 5/sec)
PRODUCTS_PER_PAGE = 100     # API max per request (min=10, max=100)
PAGES_PER_BRAND = 1         # 100 products × 1 page = 100 products/brand

# Local JSON cache (avoid repeat API calls)
CACHE_DIR = os.path.join(os.path.dirname(__file__), "cache")
CACHE_EXPIRY_DAYS = 7  # Re-crawl after 7 days

# ============================================================
# Crawl intervals
# ============================================================
PRICE_CRAWL_INTERVAL = int(os.getenv("PRICE_CRAWL_INTERVAL", "21600"))
PRODUCT_CRAWL_INTERVAL = int(os.getenv("PRODUCT_CRAWL_INTERVAL", "86400"))
REVIEW_CRAWL_INTERVAL = int(os.getenv("REVIEW_CRAWL_INTERVAL", "43200"))

# Rate limiting (for website scrapers)
REQUEST_DELAY_MIN = float(os.getenv("REQUEST_DELAY_MIN", "1.0"))
REQUEST_DELAY_MAX = float(os.getenv("REQUEST_DELAY_MAX", "3.0"))

# User agent
USER_AGENT = os.getenv(
    "USER_AGENT",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

# Brand official URLs (for "Buy Now" links)
BRAND_URLS = {
    "nike": {
        "base_url": "https://www.nike.com/vn",
        "search_url": "https://www.nike.com/vn/w?q=",
    },
    "adidas": {
        "base_url": "https://www.adidas.com.vn",
        "search_url": "https://www.adidas.com.vn/search?q=",
    },
    "puma": {
        "base_url": "https://vn.puma.com",
        "search_url": "https://vn.puma.com/vn/vi/search?q=",
    },
    "new-balance": {
        "base_url": "https://www.newbalance.com",
        "search_url": "https://www.newbalance.com/search/?q=",
    },
    "converse": {
        "base_url": "https://www.converse.com.vn",
        "search_url": "https://www.converse.com.vn/search?q=",
    },
    "vans": {
        "base_url": "https://www.vans.com.vn",
        "search_url": "https://www.vans.com.vn/search?q=",
    },
    "jordan": {
        "base_url": "https://www.nike.com/vn/jordan",
        "search_url": "https://www.nike.com/vn/w?q=jordan+",
    },
}

# Marketplace URLs
MARKETPLACE_URLS = {
    "amazon": {
        "base_url": "https://www.amazon.com",
        "search_url": "https://www.amazon.com/s",
    },
}
