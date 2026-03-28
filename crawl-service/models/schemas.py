"""Pydantic models for crawl data schemas."""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CrawledProduct(BaseModel):
    """Product data extracted from a source."""
    name: str
    sku: Optional[str] = None
    modelCode: Optional[str] = None
    brandSlug: str
    category: Optional[str] = None
    color: Optional[str] = None
    descriptionShort: Optional[str] = None
    descriptionLong: Optional[str] = None
    mainImage: Optional[str] = None
    material: Optional[str] = None
    currentPrice: Optional[float] = None
    originalPrice: Optional[float] = None
    currency: str = "VND"
    gender: Optional[str] = None
    releaseDate: Optional[str] = None
    variants: Optional[List["CrawledVariant"]] = None


class CrawledVariant(BaseModel):
    """Product variant (size/color)."""
    size: str
    colorway: Optional[str] = None
    stockStatus: str = "AVAILABLE"
    price: Optional[float] = None


class CrawledPrice(BaseModel):
    """Price snapshot from a source."""
    sku: Optional[str] = None
    currentPrice: float
    originalPrice: Optional[float] = None
    currency: str = "VND"
    priceNote: Optional[str] = None


class CrawledReview(BaseModel):
    """Review summary from a marketplace."""
    sku: Optional[str] = None
    ratingAvg: float
    ratingCount: int
    sentimentScore: Optional[float] = None


class CrawledDeal(BaseModel):
    """Deal/discount from a source."""
    sku: Optional[str] = None
    dealTitle: str
    dealDescription: Optional[str] = None
    dealType: str = "PERCENTAGE"  # PERCENTAGE, FIXED, BOGO, CLEARANCE, FLASH_SALE
    couponCode: Optional[str] = None
    startAt: Optional[str] = None
    endAt: Optional[str] = None


class IngestPayload(BaseModel):
    """Payload sent to Spring Boot /api/crawl/ingest."""
    crawlJobId: Optional[str] = None
    sourceName: str
    sourceType: str  # OFFICIAL, MARKETPLACE, CATALOG
    sourceUrl: Optional[str] = None
    externalId: Optional[str] = None
    rawJson: str  # JSON string of CrawledProduct/Price/Review/Deal
    dataType: str  # PRODUCT, PRICE, REVIEW, DEAL


class IngestBatchPayload(BaseModel):
    """Batch payload sent to Spring Boot /api/crawl/ingest/batch."""
    crawlJobId: Optional[str] = None
    items: List[dict]
