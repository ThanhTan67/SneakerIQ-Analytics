"""
Product data normalizer.

Cleans and standardizes product data from different sources
before sending to the backend.
"""

import re
from typing import Optional


def normalize_product_name(name: str) -> str:
    """Standardize product name by removing extra whitespace and special chars."""
    if not name:
        return ""
    name = re.sub(r'\s+', ' ', name).strip()
    return name


def normalize_sku(sku: str) -> str:
    """Standardize SKU format: uppercase, trimmed."""
    if not sku:
        return ""
    return sku.strip().upper().replace(" ", "-")


def normalize_color(color: str) -> str:
    """Clean up color/colorway strings."""
    if not color:
        return ""
    # Remove parenthetical comments
    color = re.sub(r'\(.*?\)', '', color).strip()
    # Capitalize each word
    return color.title()


def normalize_price_vnd(price: Optional[float], currency: str = "VND") -> Optional[float]:
    """
    Normalize price to VND.

    Conversion rates (approximate):
      USD → VND: × 25,000
      EUR → VND: × 27,000
    """
    if price is None:
        return None

    currency = currency.upper()
    if currency == "VND":
        return round(price)
    elif currency == "USD":
        return round(price * 25000)
    elif currency == "EUR":
        return round(price * 27000)
    elif currency == "GBP":
        return round(price * 31000)
    else:
        return round(price)


def extract_brand_from_name(name: str) -> Optional[str]:
    """Try to detect brand from product name."""
    name_lower = name.lower()
    brands = {
        "nike": "nike",
        "air jordan": "jordan",
        "jordan": "jordan",
        "adidas": "adidas",
        "puma": "puma",
        "new balance": "new-balance",
        "converse": "converse",
        "vans": "vans",
    }
    for keyword, slug in brands.items():
        if keyword in name_lower:
            return slug
    return None


def categorize_sneaker(name: str, description: str = "") -> str:
    """Categorize a sneaker based on its name and description."""
    combined = f"{name} {description}".lower()

    if any(kw in combined for kw in ["running", "pegasus", "vomero", "ultraboost", "fuelcell"]):
        return "Running"
    elif any(kw in combined for kw in ["basketball", "jordan", "dunk"]):
        return "Basketball"
    elif any(kw in combined for kw in ["skate", "sb", "sk8"]):
        return "Skateboarding"
    elif any(kw in combined for kw in ["retro", "vintage", "classic", "og"]):
        return "Retro"
    elif any(kw in combined for kw in ["racing", "elite", "competition"]):
        return "Performance"
    else:
        return "Lifestyle"
