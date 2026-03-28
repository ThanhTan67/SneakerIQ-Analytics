// src/app/page.tsx - SneakerIQ Homepage — Apple-inspired design
import Link from 'next/link';
import ProductCard from '@/components/sneaker/ProductCard';
import { Product, Brand } from '@/features/sneaker/types';

// Lấy các biến từ env (thêm vào nhưng không thay đổi logic code gốc)
const BRANDS: { name: string; slug: string; logo: string }[] = [
    { name: 'Nike', slug: 'nike', logo: '/images/nike.svg' },
    { name: 'Adidas', slug: 'adidas', logo: '/images/adidas.svg' },
    { name: 'Jordan', slug: 'jordan', logo: '/images/jordan.svg' },
    { name: 'New Balance', slug: 'new-balance', logo: '/images/new-balance.svg' },
    { name: 'Puma', slug: 'puma', logo: '/images/puma.svg' },
    { name: 'Converse', slug: 'converse', logo: '/images/converse.svg' },
    // { name: 'Vans', slug: 'vans', logo: '/images/vans.svg' },
];

async function fetchData() {
    // Sử dụng env cho API URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    // Sử dụng env cho các limit
    const defaultLimit = process.env.NEXT_PUBLIC_DEFAULT_LIMIT || '8';
    const bestDealsLimit = process.env.NEXT_PUBLIC_BEST_DEALS_LIMIT || '12';

    try {
        const [trendingRes, topDiscRes, bestDealsRes, brandsRes] = await Promise.all([
            fetch(`${baseUrl}/api/v1/products/trending?limit=${defaultLimit}`, { cache: 'no-store' }),
            fetch(`${baseUrl}/api/v1/products/top-discounted?limit=${defaultLimit}`, { cache: 'no-store' }),
            fetch(`${baseUrl}/api/v1/products/best-deals?limit=${bestDealsLimit}`, { cache: 'no-store' }),
            fetch(`${baseUrl}/api/v1/brands`, { cache: 'no-store' }).catch(() => null),
        ]);

        const trending = trendingRes.ok ? await trendingRes.json() : [];
        const topDisc = topDiscRes.ok ? await topDiscRes.json() : [];
        const bestDealsRaw = bestDealsRes.ok ? await bestDealsRes.json() : [];
        const brands: Brand[] = brandsRes && brandsRes.ok ? await brandsRes.json() : [];
        const totalProducts = brands.reduce((sum, b) => sum + (b.productCount || 0), 0);

        // Filter: only show products with images and real prices
        const filterValid = (items: Product[]) => items.filter(
            (p: Product) => p.mainImage && p.currentPrice && p.currentPrice > 0
        );

        return {
            trending: filterValid(trending).slice(0, Number(defaultLimit)),
            topDiscounted: filterValid(topDisc).slice(0, Number(defaultLimit)),
            bestDeals: filterValid(bestDealsRaw).slice(0, Number(defaultLimit)),
            totalProducts,
        };
    } catch {
        return { trending: [], topDiscounted: [], bestDeals: [], totalProducts: 0 };
    }
}

export default async function HomePage() {
    const { trending, topDiscounted, bestDeals, totalProducts } = await fetchData();

    // Sử dụng env cho thông tin website (giữ nguyên hiển thị)
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Sneaker';
    const siteDescription = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Phân tích giá sneaker. Thông minh hơn.';

    return (
        <>
            {/* Hero */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">{siteName} Price Intelligence</div>
                    <h1 className="hero-title">
                        {siteDescription}<br />
                        <span className="gradient-text">Thông minh hơn.</span>
                    </h1>
                    <p className="hero-subtitle">
                        Theo dõi giá, so sánh nguồn mua và nhận gợi ý mua hàng tối ưu
                        từ 7 thương hiệu hàng đầu thế giới.
                    </p>
                    <div className="hero-stats">
                        <div className="hero-stat">
                            <div className="hero-stat-value">7</div>
                            <div className="hero-stat-label">Thương hiệu</div>
                        </div>
                        <div className="hero-stat">
                            <div className="hero-stat-value">{totalProducts || '50+'}</div>
                            <div className="hero-stat-label">Sản phẩm</div>
                        </div>
                        <div className="hero-stat">
                            <div className="hero-stat-value">90</div>
                            <div className="hero-stat-label">Ngày lịch sử giá</div>
                        </div>
                        <div className="hero-stat">
                            <div className="hero-stat-value">24/7</div>
                            <div className="hero-stat-label">Cập nhật</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Brands */}
            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">Thương hiệu</h2>
                    <Link href="/brands" className="section-link">Xem tất cả →</Link>
                </div>
                <div className="brand-grid">
                    {BRANDS.map((brand) => (
                        <Link key={brand.slug} href={`/brands/${brand.slug}`} className="brand-card">
                            <div className="brand-card-icon">
                                <img src={brand.logo} alt={brand.name} width={64} height={64} />
                            </div>
                            <div className="brand-card-name">{brand.name}</div>
                            <div className="brand-card-count">Xem sản phẩm →</div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Trending */}
            {trending.length > 0 && (
                <section className="section" style={{ background: 'var(--bg-secondary)' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <div className="section-header">
                            <h2 className="section-title">Trending</h2>
                            <Link href="/products?sortBy=viewCount&sortDir=desc" className="section-link">Xem thêm →</Link>
                        </div>
                        <div className="product-grid">
                            {trending.map((product: Product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Best Deals */}
            {bestDeals.length > 0 && (
                <section className="section">
                    <div className="section-header">
                        <h2 className="section-title">Best Deals</h2>
                        <Link href="/insights" className="section-link">Xem tất cả →</Link>
                    </div>
                    <div className="product-grid">
                        {bestDeals.map((product: Product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* Top Discounted */}
            {topDiscounted.length > 0 && (
                <section className="section" style={{ background: 'var(--bg-secondary)' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <div className="section-header">
                            <h2 className="section-title">Giảm giá tốt nhất</h2>
                            <Link href="/products?sortBy=discountPercent&sortDir=desc" className="section-link">Xem thêm →</Link>
                        </div>
                        <div className="product-grid">
                            {topDiscounted.map((product: Product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}