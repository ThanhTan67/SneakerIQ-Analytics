// Types for the Sneaker Price Intelligence Platform

export interface Brand {
    id: string;
    name: string;
    slug: string;
    logo: string;
    description: string;
    productCount: number;
    avgPrice?: number;
    avgDiscount?: number;
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    modelCode: string;
    brandName: string;
    brandSlug: string;
    categoryName?: string;
    gender: string;
    color: string;
    descriptionShort: string;
    descriptionLong?: string;
    mainImage: string;
    material?: string;
    currentPrice: number;
    originalPrice: number;
    discountPercent?: number;
    currency: string;
    viewCount: number;
    trending: boolean;
    newArrival: boolean;
    bestPrice?: number;
    worstPrice?: number;
    avgPrice?: number;
    trendStatus?: 'RISING' | 'FALLING' | 'STABLE' | 'VOLATILE' | 'RARE_LOW';
    dealScore?: number;
    recommendationLabel?: 'BUY_NOW' | 'WAIT' | 'WATCH' | 'GREAT_DEAL' | 'FAIR_PRICE';
    priceChange7d?: number;
    priceChange30d?: number;
    ratingAvg?: number;
    reviewCount?: number;
    releaseDate?: string;
    variants?: ProductVariant[];
    activeDeals?: Deal[];
}

export interface ProductVariant {
    id: string;
    size: string;
    colorway: string;
    image?: string;
    stockStatus: string;
    price: number;
}

export interface Deal {
    id: string;
    dealTitle: string;
    dealDescription: string;
    dealType: string;
    couponCode?: string;
    startAt?: string;
    endAt?: string;
}

export interface PriceHistoryPoint {
    date: string;
    price: number;
    previousPrice?: number;
    priceDiff?: number;
    priceDiffPercent?: number;
    sourceName?: string;
}

export interface Insight {
    productId: string;
    productName: string;
    brandName: string;
    brandSlug: string;
    mainImage: string;
    currentPrice: number;
    bestPrice: number;
    worstPrice: number;
    avgPrice: number;
    trendStatus: string;
    dealScore: number;
    recommendationLabel: string;
    priceChange7d?: number;
    priceChange30d?: number;
    volatility?: number;
    discountPercent?: number;
}

export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}
