// API service for Sneaker Price Intelligence
import { Brand, Product, PriceHistoryPoint, Insight, PageResponse } from './types';

const API_BASE = '/api/v1';

async function fetchApi<T>(url: string): Promise<T> {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
}

// ====== Brands ======
export async function getAllBrands(): Promise<Brand[]> {
    return fetchApi<Brand[]>(`${API_BASE}/brands`);
}

export async function getBrandBySlug(slug: string): Promise<Brand> {
    return fetchApi<Brand>(`${API_BASE}/brands/${slug}`);
}

export async function getBrandBestDeals(slug: string, limit = 10): Promise<Product[]> {
    return fetchApi<Product[]>(`${API_BASE}/brands/${slug}/best-deals?limit=${limit}`);
}

// ====== Products ======
export async function searchProducts(params: {
    brandId?: string;
    gender?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sortBy?: string;
    sortDir?: string;
    page?: number;
    size?: number;
}): Promise<PageResponse<Product>> {
    const query = new URLSearchParams();
    if (params.brandId) query.set('brandId', params.brandId);
    if (params.gender) query.set('gender', params.gender);
    if (params.minPrice) query.set('minPrice', params.minPrice.toString());
    if (params.maxPrice) query.set('maxPrice', params.maxPrice.toString());
    if (params.search) query.set('search', params.search);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortDir) query.set('sortDir', params.sortDir);
    query.set('page', (params.page ?? 0).toString());
    query.set('size', (params.size ?? 20).toString());
    return fetchApi<PageResponse<Product>>(`${API_BASE}/products?${query}`);
}

export async function getProductById(id: string): Promise<Product> {
    return fetchApi<Product>(`${API_BASE}/products/${id}`);
}

export async function getTrendingProducts(limit = 10): Promise<Product[]> {
    return fetchApi<Product[]>(`${API_BASE}/products/trending?limit=${limit}`);
}

export async function getNewArrivals(limit = 10): Promise<Product[]> {
    return fetchApi<Product[]>(`${API_BASE}/products/new-arrivals?limit=${limit}`);
}

export async function getTopDiscounted(limit = 10): Promise<Product[]> {
    return fetchApi<Product[]>(`${API_BASE}/products/top-discounted?limit=${limit}`);
}

export async function getBestDeals(limit = 10): Promise<Product[]> {
    return fetchApi<Product[]>(`${API_BASE}/products/best-deals?limit=${limit}`);
}

export async function getPriceHistory(productId: string, days = 90): Promise<PriceHistoryPoint[]> {
    return fetchApi<PriceHistoryPoint[]>(`${API_BASE}/products/${productId}/price-history?days=${days}`);
}

export async function getSimilarProducts(productId: string, limit = 6): Promise<Product[]> {
    return fetchApi<Product[]>(`${API_BASE}/products/${productId}/similar?limit=${limit}`);
}

export async function compareProducts(ids: string[]): Promise<Product[]> {
    return fetchApi<Product[]>(`${API_BASE}/products/compare?ids=${ids.join(',')}`);
}

// ====== Insights ======
export async function getTopDeals(limit = 20): Promise<Insight[]> {
    return fetchApi<Insight[]>(`${API_BASE}/insights/top-deals?limit=${limit}`);
}

export async function getTopDealsByBrand(brandSlug: string, limit = 10): Promise<Insight[]> {
    return fetchApi<Insight[]>(`${API_BASE}/insights/top-deals/${brandSlug}?limit=${limit}`);
}

// ====== Crawl Pipeline ======
export interface CrawlStats {
    pending: number;
    processed: number;
    errors: number;
    total: number;
}

export async function getCrawlStats(): Promise<CrawlStats> {
    return fetchApi<CrawlStats>('/api/crawl/stats');
}

export async function triggerETL(): Promise<{ processedItems: number; insightsRecalculated: number }> {
    const res = await fetch('/api/crawl/etl', { method: 'POST' });
    if (!res.ok) throw new Error(`ETL trigger failed: ${res.status}`);
    return res.json();
}
