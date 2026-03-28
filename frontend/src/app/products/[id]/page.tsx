'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PriceChart from '@/components/sneaker/PriceChart';
import ProductCard from '@/components/sneaker/ProductCard';
import { formatPrice, getRecClass, getRecLabel, getTrendClass, getTrendLabel } from '@/components/sneaker/ProductCard';
import { Product, PriceHistoryPoint } from '@/features/sneaker/types';

// Brand → official store URLs for Buy Now
const BRAND_STORE_URLS: Record<string, { name: string; search: string }> = {
    nike: { name: 'Nike.com', search: 'https://www.nike.com/vn/w?q=' },
    adidas: { name: 'Adidas.com.vn', search: 'https://www.adidas.com.vn/search?q=' },
    puma: { name: 'Puma.com', search: 'https://vn.puma.com/vn/vi/search?q=' },
    'new-balance': { name: 'NewBalance.com', search: 'https://www.newbalance.com/search/?q=' },
    converse: { name: 'Converse.com.vn', search: 'https://www.converse.com.vn/search?q=' },
    vans: { name: 'Vans.com.vn', search: 'https://www.vans.com.vn/search?q=' },
    jordan: { name: 'Nike.com/Jordan', search: 'https://www.nike.com/vn/w?q=jordan+' },
};

function extractResellLinks(descLong?: string): Record<string, string> {
    if (!descLong) return {};
    const match = descLong.match(/\[RESELL_LINKS\](.*?)\[\/RESELL_LINKS\]/);
    if (match) {
        try { return JSON.parse(match[1]); }
        catch { return {}; }
    }
    return {};
}

function cleanDescription(descLong?: string): string {
    if (!descLong) return '';
    return descLong.replace(/\[RESELL_LINKS\].*?\[\/RESELL_LINKS\]/s, '').trim();
}

function getBuyNowUrl(product: Product): string {
    const resellLinks = extractResellLinks(product.descriptionLong);
    if (resellLinks.stockX) return resellLinks.stockX;
    if (resellLinks.goat) return resellLinks.goat;
    if (resellLinks.flightClub) return resellLinks.flightClub;

    const brand = BRAND_STORE_URLS[product.brandSlug];
    if (brand) {
        const query = encodeURIComponent(product.sku || product.name);
        return brand.search + query;
    }
    return `https://www.google.com/search?q=${encodeURIComponent(product.name + ' buy')}`;
}

function getBuyNowLabel(product: Product): string {
    const resellLinks = extractResellLinks(product.descriptionLong);
    if (resellLinks.stockX) return 'Mua trên StockX';
    if (resellLinks.goat) return 'Mua trên GOAT';
    const brand = BRAND_STORE_URLS[product.brandSlug];
    return brand ? `Mua tại ${brand.name}` : 'Tìm nơi mua';
}

// Generate realistic sizes based on gender/brand
interface SizeInfo {
    size: string;
    available: boolean;
    priceAdjust: number; // % adjustment from base price
}

function generateSizes(gender?: string, basePrice?: number): SizeInfo[] {
    const menSizes = ['US 7', 'US 7.5', 'US 8', 'US 8.5', 'US 9', 'US 9.5', 'US 10', 'US 10.5', 'US 11', 'US 11.5', 'US 12', 'US 13'];
    const womenSizes = ['US 5', 'US 5.5', 'US 6', 'US 6.5', 'US 7', 'US 7.5', 'US 8', 'US 8.5', 'US 9', 'US 9.5', 'US 10'];
    const kidsSizes = ['US 3.5Y', 'US 4Y', 'US 4.5Y', 'US 5Y', 'US 5.5Y', 'US 6Y', 'US 6.5Y', 'US 7Y'];

    let sizes: string[];
    if (gender === 'WOMEN') sizes = womenSizes;
    else if (gender === 'KIDS') sizes = kidsSizes;
    else sizes = menSizes;

    // Use basePrice as seed for deterministic randomness
    const seed = basePrice ? Math.round(basePrice / 1000) : 42;

    return sizes.map((size, i) => {
        const hash = (seed * 31 + i * 17) % 100;
        const available = hash > 20; // ~80% available
        // Popular sizes (9, 10, 11) have slight premium, extreme sizes slight discount
        const midIdx = Math.floor(sizes.length / 2);
        const dist = Math.abs(i - midIdx);
        let adjust = 0;
        if (dist <= 1) adjust = 2; // popular sizes: +2%
        else if (dist >= 4) adjust = -3; // extreme sizes: -3%

        return { size, available, priceAdjust: adjust };
    });
}

export default function ProductDetailPage() {
    const params = useParams();
    const productId = params.id as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([]);
    const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [prodRes, histRes, simRes] = await Promise.all([
                    fetch(`/api/v1/products/${productId}`),
                    fetch(`/api/v1/products/${productId}/price-history?days=90`),
                    fetch(`/api/v1/products/${productId}/similar?limit=4`),
                ]);

                if (prodRes.ok) setProduct(await prodRes.json());
                if (histRes.ok) setPriceHistory(await histRes.json());
                if (simRes.ok) setSimilarProducts(await simRes.json());
            } catch (err) {
                console.error('Error fetching product details', err);
            } finally {
                setLoading(false);
            }
        };

        if (productId) fetchData();
    }, [productId]);

    const sizes = useMemo(() => {
        if (!product) return [];
        return generateSizes(product.gender, product.currentPrice);
    }, [product]);

    const selectedSizePrice = useMemo(() => {
        if (!product || !selectedSize) return product?.currentPrice;
        const s = sizes.find(sz => sz.size === selectedSize);
        if (!s || !product.currentPrice) return product?.currentPrice;
        return Math.round(product.currentPrice * (1 + s.priceAdjust / 100));
    }, [product, selectedSize, sizes]);

    if (loading) {
        return (
            <div className="loading-container" style={{ minHeight: '60vh' }}>
                <div className="loading-spinner" />
                <p>Đang tải thông tin sản phẩm...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="empty-state" style={{ minHeight: '60vh' }}>
                <p style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Không tìm thấy sản phẩm</p>
                <Link href="/products" className="filter-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
                    Quay lại danh sách
                </Link>
            </div>
        );
    }

    const hasDiscount = product.originalPrice && product.originalPrice > product.currentPrice;
    const buyNowUrl = getBuyNowUrl(product);
    const buyNowLabel = getBuyNowLabel(product);
    const resellLinks = extractResellLinks(product.descriptionLong);
    const descriptionClean = cleanDescription(product.descriptionLong) || product.descriptionShort;

    return (
        <div className="product-detail">
            {/* Breadcrumb */}
            <nav className="detail-breadcrumb">
                <Link href="/">Trang chủ</Link>
                <span className="breadcrumb-sep">/</span>
                <Link href="/products">Sản phẩm</Link>
                <span className="breadcrumb-sep">/</span>
                <Link href={`/brands/${product.brandSlug}`}>{product.brandName}</Link>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">{product.name}</span>
            </nav>

            <div className="detail-grid">
                {/* Image Section */}
                <div className="detail-image-section">
                    <div className="detail-main-image">
                        {product.mainImage ? (
                            <img
                                src={product.mainImage}
                                alt={product.name}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    transition: 'transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
                                }}
                                onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                                onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
                            />
                        ) : (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                height: '100%', color: 'var(--text-muted)', fontSize: '1rem',
                            }}>
                                Không có hình ảnh
                            </div>
                        )}
                    </div>

                    {/* Quick specs under image */}
                    <div className="detail-quick-specs">
                        {product.sku && (
                            <div className="quick-spec-item">
                                <span className="quick-spec-label">Mã sản phẩm</span>
                                <span className="quick-spec-value">{product.sku}</span>
                            </div>
                        )}
                        {product.categoryName && (
                            <div className="quick-spec-item">
                                <span className="quick-spec-label">Danh mục</span>
                                <span className="quick-spec-value">{product.categoryName}</span>
                            </div>
                        )}
                        {product.gender && (
                            <div className="quick-spec-item">
                                <span className="quick-spec-label">Giới tính</span>
                                <span className="quick-spec-value">
                                    {product.gender === 'MEN' ? 'Nam' : product.gender === 'WOMEN' ? 'Nữ' : product.gender === 'KIDS' ? 'Trẻ em' : 'Unisex'}
                                </span>
                            </div>
                        )}
                        {product.releaseDate && (
                            <div className="quick-spec-item">
                                <span className="quick-spec-label">Ngày ra mắt</span>
                                <span className="quick-spec-value">{product.releaseDate}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Panel */}
                <div className="detail-info">
                    <div className="detail-brand">{product.brandName}</div>
                    <h1 className="detail-title">{product.name}</h1>

                    {/* Color */}
                    {product.color && (
                        <p className="detail-colorway">{product.color}</p>
                    )}

                    {/* Price Section */}
                    <div className="detail-price-section">
                        <div className="detail-price-row">
                            <span className="detail-current-price">
                                {formatPrice(selectedSizePrice ?? product.currentPrice)}
                            </span>
                            {hasDiscount && (
                                <>
                                    <span className="detail-original-price">{formatPrice(product.originalPrice)}</span>
                                    <span className="detail-discount-badge">-{Math.round(product.discountPercent || 0)}%</span>
                                </>
                            )}
                        </div>

                        {/* Price Insights */}
                        {product.bestPrice && (
                            <div className="detail-price-insight">
                                <div className="price-insight-item">
                                    <div className="price-insight-label">Thấp nhất 90 ngày</div>
                                    <div className="price-insight-value" style={{ color: 'var(--success)' }}>
                                        {formatPrice(product.bestPrice)}
                                    </div>
                                </div>
                                <div className="price-insight-item">
                                    <div className="price-insight-label">Cao nhất 90 ngày</div>
                                    <div className="price-insight-value" style={{ color: 'var(--danger)' }}>
                                        {formatPrice(product.worstPrice)}
                                    </div>
                                </div>
                                <div className="price-insight-item">
                                    <div className="price-insight-label">Trung bình</div>
                                    <div className="price-insight-value" style={{ color: 'var(--accent-secondary)' }}>
                                        {formatPrice(product.avgPrice)}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recommendation Badge */}
                        {product.recommendationLabel && (
                            <div className="detail-rec">
                                <span className={`rec-badge ${getRecClass(product.recommendationLabel)}`} style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
                                    {getRecLabel(product.recommendationLabel)}
                                </span>
                                <span className="detail-rec-text">
                                    {product.recommendationLabel === 'BUY_NOW' && 'Giá đang thấp hơn trung bình đáng kể.'}
                                    {product.recommendationLabel === 'GREAT_DEAL' && 'Deal rất tốt, giá thấp hơn trung bình.'}
                                    {product.recommendationLabel === 'FAIR_PRICE' && 'Giá hợp lý so với trung bình.'}
                                    {product.recommendationLabel === 'WAIT' && 'Giá đang cao, nên chờ thêm.'}
                                    {product.recommendationLabel === 'WATCH' && 'Sản phẩm hay giảm giá định kỳ.'}
                                </span>
                            </div>
                        )}

                        {/* Trend */}
                        {product.trendStatus && (
                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                                <span className={`trend-badge ${getTrendClass(product.trendStatus)}`} style={{ padding: '4px 12px' }}>
                                    {getTrendLabel(product.trendStatus)}
                                </span>
                                {product.priceChange7d != null && (
                                    <span style={{ color: product.priceChange7d >= 0 ? 'var(--danger)' : 'var(--success)' }}>
                                        7 ngày: {product.priceChange7d >= 0 ? '+' : ''}{formatPrice(product.priceChange7d)}
                                    </span>
                                )}
                                {product.priceChange30d != null && (
                                    <span style={{ color: product.priceChange30d >= 0 ? 'var(--danger)' : 'var(--success)' }}>
                                        30 ngày: {product.priceChange30d >= 0 ? '+' : ''}{formatPrice(product.priceChange30d)}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Deal Score */}
                        {product.dealScore != null && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deal Score</span>
                                <div className="deal-score">
                                    <div className="deal-score-bar">
                                        <div
                                            className={`deal-score-fill ${product.dealScore >= 70 ? 'high' : product.dealScore >= 40 ? 'medium' : 'low'}`}
                                            style={{ width: `${product.dealScore}%` }}
                                        />
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{product.dealScore}/100</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ========== SIZE SELECTOR ========== */}
                    <div className="size-section">
                        <h4>Chọn Size {selectedSize && <span style={{ fontWeight: 400, color: 'var(--accent-primary)' }}>— {selectedSize}</span>}</h4>
                        <div className="size-grid">
                            {sizes.map(s => {
                                const sizePrice = product.currentPrice ? Math.round(product.currentPrice * (1 + s.priceAdjust / 100)) : null;
                                return (
                                    <div
                                        key={s.size}
                                        className={`size-chip ${!s.available ? 'out-of-stock' : ''} ${selectedSize === s.size ? 'selected' : ''}`}
                                        onClick={() => s.available && setSelectedSize(s.size === selectedSize ? null : s.size)}
                                    >
                                        <span>{s.size.replace('US ', '')}</span>
                                        {s.available && sizePrice && (
                                            <span className="size-price">{(sizePrice / 1000000).toFixed(1)}M</span>
                                        )}
                                        {!s.available && <span className="size-price">Hết</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ========== BUY NOW BUTTON ========== */}
                    <a
                        href={buyNowUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="buy-now-btn"
                        id="buy-now-button"
                    >
                        {buyNowLabel}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                    </a>

                    {/* Other resell links */}
                    {Object.keys(resellLinks).length > 1 && (
                        <div className="resell-links">
                            <span className="resell-links-label">So sánh giá tại:</span>
                            <div className="resell-links-list">
                                {resellLinks.stockX && (
                                    <a href={resellLinks.stockX} target="_blank" rel="noopener noreferrer" className="resell-link-chip">StockX</a>
                                )}
                                {resellLinks.goat && (
                                    <a href={resellLinks.goat} target="_blank" rel="noopener noreferrer" className="resell-link-chip">GOAT</a>
                                )}
                                {resellLinks.flightClub && (
                                    <a href={resellLinks.flightClub} target="_blank" rel="noopener noreferrer" className="resell-link-chip">Flight Club</a>
                                )}
                                {resellLinks.stadiumGoods && (
                                    <a href={resellLinks.stadiumGoods} target="_blank" rel="noopener noreferrer" className="resell-link-chip">Stadium Goods</a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Specs grid */}
                    <div className="detail-specs">
                        {product.material && (
                            <div className="spec-row">
                                <span className="spec-label">Chất liệu</span>
                                <span className="spec-value">{product.material}</span>
                            </div>
                        )}
                        {product.color && (
                            <div className="spec-row">
                                <span className="spec-label">Màu sắc</span>
                                <span className="spec-value">{product.color}</span>
                            </div>
                        )}
                        {product.modelCode && (
                            <div className="spec-row">
                                <span className="spec-label">Model</span>
                                <span className="spec-value">{product.modelCode}</span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {descriptionClean && (
                        <div className="detail-description">
                            <h4>Giới thiệu</h4>
                            <p>{descriptionClean}</p>
                        </div>
                    )}

                    {/* Data Source - minimal */}
                    <div className="detail-source-info">
                        <div className="source-info-header">Nguồn dữ liệu</div>
                        <div className="source-info-content">
                            Dữ liệu được tổng hợp tự động từ TheSneakerDatabase, website chính hãng và marketplace.
                            Giá cập nhật hàng tuần.
                        </div>
                    </div>
                </div>
            </div>

            {/* Price History Chart */}
            <PriceChart data={priceHistory} title={`Lịch sử giá — ${product.name}`} />

            {/* Similar Products */}
            {similarProducts.length > 0 && (
                <section style={{ marginTop: '48px' }}>
                    <div className="section-header">
                        <h2 className="section-title">Sản phẩm tương tự</h2>
                    </div>
                    <div className="product-grid">
                        {similarProducts.map(p => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
