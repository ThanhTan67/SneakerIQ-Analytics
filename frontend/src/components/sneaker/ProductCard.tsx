import Link from 'next/link';
import { Product } from '@/features/sneaker/types';

function formatPrice(price: number | undefined | null): string {
    if (!price) return '—';
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

function getTrendClass(trend?: string): string {
    switch (trend) {
        case 'FALLING': return 'trend-falling';
        case 'RISING': return 'trend-rising';
        default: return 'trend-stable';
    }
}

function getTrendLabel(trend?: string): string {
    switch (trend) {
        case 'FALLING': return '↓ Giảm';
        case 'RISING': return '↑ Tăng';
        case 'STABLE': return '— Ổn định';
        case 'VOLATILE': return '⚡ Biến động';
        case 'RARE_LOW': return '🔥 Giá thấp hiếm';
        default: return '— Ổn định';
    }
}

function getRecClass(rec?: string): string {
    switch (rec) {
        case 'BUY_NOW': return 'rec-buy-now';
        case 'GREAT_DEAL': return 'rec-great-deal';
        case 'FAIR_PRICE': return 'rec-fair-price';
        case 'WAIT': return 'rec-wait';
        case 'WATCH': return 'rec-watch';
        default: return 'rec-fair-price';
    }
}

function getRecLabel(rec?: string): string {
    switch (rec) {
        case 'BUY_NOW': return '🛒 Mua ngay';
        case 'GREAT_DEAL': return '🔥 Deal tốt';
        case 'FAIR_PRICE': return '✓ Giá hợp lý';
        case 'WAIT': return '⏳ Chờ thêm';
        case 'WATCH': return '👀 Theo dõi';
        default: return '✓ Giá hợp lý';
    }
}

export default function ProductCard({ product }: { product: Product }) {
    const hasDiscount = product.discountPercent && product.discountPercent > 0;
    const priceChanged = product.originalPrice && product.originalPrice > product.currentPrice;

    return (
        <Link href={`/products/${product.id}`} className="product-card" id={`product-${product.id}`}>
            <div className="product-card-image">
                {product.mainImage ? (
                    <img src={product.mainImage} alt={product.name} loading="lazy" />
                ) : (
                    <span className="placeholder-icon">👟</span>
                )}
                <div className="product-badges">
                    {product.trending && <span className="badge badge-trend">🔥 Trending</span>}
                    {product.newArrival && <span className="badge badge-new">✨ Mới</span>}
                    {hasDiscount && <span className="badge badge-sale">-{Math.round(product.discountPercent!)}%</span>}
                    {product.dealScore && product.dealScore >= 70 && (
                        <span className="badge badge-deal">⭐ Deal tốt</span>
                    )}
                </div>
            </div>

            <div className="product-card-info">
                <div className="product-card-brand">{product.brandName}</div>
                <div className="product-card-name">{product.name}</div>

                <div className="product-card-pricing">
                    <span className="price-current">{formatPrice(product.currentPrice)}</span>
                    {priceChanged && (
                        <span className="price-original">{formatPrice(product.originalPrice)}</span>
                    )}
                    {hasDiscount && (
                        <span className="price-discount">-{Math.round(product.discountPercent!)}%</span>
                    )}
                </div>

                <div className="product-card-meta">
                    {product.ratingAvg ? (
                        <span className="product-card-rating">
                            <span className="star">★</span>
                            {product.ratingAvg.toFixed(1)}
                            {product.reviewCount && <span>({product.reviewCount})</span>}
                        </span>
                    ) : <span />}

                    {product.trendStatus && (
                        <span className={`trend-badge ${getTrendClass(product.trendStatus)}`}>
                            {getTrendLabel(product.trendStatus)}
                        </span>
                    )}
                </div>

                {product.recommendationLabel && (
                    <div style={{ marginTop: '8px' }}>
                        <span className={`rec-badge ${getRecClass(product.recommendationLabel)}`}>
                            {getRecLabel(product.recommendationLabel)}
                        </span>
                    </div>
                )}
            </div>
        </Link>
    );
}

export { formatPrice, getTrendClass, getTrendLabel, getRecClass, getRecLabel };
