'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/sneaker/ProductCard';
import { Product, Brand, PageResponse } from '@/features/sneaker/types';

const BRAND_META: Record<string, { logo: string; color: string }> = {
    nike: { logo: '/images/nike.svg', color: '#FA5400' },
    adidas: { logo: '/images/adidas.svg', color: '#000' },
    jordan: { logo: '/images/jordan.svg', color: '#E31937' },
    'new-balance': { logo: '/images/new-balance.svg', color: '#CF0A2C' },
    puma: { logo: '/images/puma.svg', color: '#E91E63' },
    converse: { logo: '/images/converse.svg', color: '#1E3264' },
    vans: { logo: '/images/vans.svg', color: '#C8102E' },
};

const SORT_OPTIONS = [
    { name: 'Phổ biến nhất', sortBy: 'viewCount', sortDir: 'desc' },
    { name: 'Tên A-Z', sortBy: 'name', sortDir: 'asc' },
    { name: 'Giá thấp → cao', sortBy: 'currentPrice', sortDir: 'asc' },
    { name: 'Giá cao → thấp', sortBy: 'currentPrice', sortDir: 'desc' },
    { name: 'Giảm giá nhiều nhất', sortBy: 'discountPercent', sortDir: 'desc' },
];

export default function BrandPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [brand, setBrand] = useState<Brand | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [bestDeals, setBestDeals] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [sortIdx, setSortIdx] = useState(0);

    const fetchProducts = useCallback(async (currentPage: number) => {
        try {
            const params = new URLSearchParams();
            params.set('brandSlug', slug);
            params.set('sortBy', SORT_OPTIONS[sortIdx].sortBy);
            params.set('sortDir', SORT_OPTIONS[sortIdx].sortDir);
            params.set('page', currentPage.toString());
            params.set('size', '24');

            const res = await fetch(`/api/v1/products?${params}`);
            if (res.ok) {
                const data: PageResponse<Product> = await res.json();
                setProducts(data.content);
                setTotalPages(data.totalPages);
                setTotalElements(data.totalElements);
            }
        } catch (err) {
            console.error('Error fetching brand products', err);
        }
    }, [slug, sortIdx]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [brandRes, dealsRes] = await Promise.all([
                    fetch(`/api/v1/brands/${slug}`),
                    fetch(`/api/v1/brands/${slug}/best-deals?limit=6`),
                ]);

                if (brandRes.ok) setBrand(await brandRes.json());
                if (dealsRes.ok) setBestDeals(await dealsRes.json());

                await fetchProducts(0);
            } catch (err) {
                console.error('Error fetching brand data', err);
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchData();
    }, [slug]);

    useEffect(() => {
        if (!loading) {
            fetchProducts(page);
        }
    }, [page, sortIdx]);

    const meta = BRAND_META[slug] || { logo: '/images/nike.svg', color: 'var(--accent-primary)' };

    if (loading) {
        return (
            <div className="loading-container" style={{ minHeight: '60vh' }}>
                <div className="loading-spinner" />
                <p>Đang tải thông tin thương hiệu...</p>
            </div>
        );
    }

    return (
        <>
            {/* Brand Hero */}
            <section
                className="brand-hero"
                style={{ '--brand-color-transparent': `${meta.color}22` } as React.CSSProperties}
            >
                <div className="brand-hero-content">
                    <div className="brand-hero-logo">
                        <Image src={meta.logo} alt={brand?.name || slug} width={96} height={96} style={{ objectFit: 'contain' }} />
                    </div>
                    <h1 className="brand-hero-title">{brand?.name || slug}</h1>
                    <p className="brand-hero-desc">{brand?.description}</p>
                    <div className="hero-stats" style={{ marginTop: '24px' }}>
                        <div className="hero-stat">
                            <div className="hero-stat-value">{totalElements || brand?.productCount || 0}</div>
                            <div className="hero-stat-label">Sản phẩm</div>
                        </div>
                        <div className="hero-stat">
                            <div className="hero-stat-value">{bestDeals.length}</div>
                            <div className="hero-stat-label">Deals tốt</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Best Deals */}
            {bestDeals.length > 0 && (
                <section className="section">
                    <div className="section-header">
                        <h2 className="section-title">Deal Tốt Nhất</h2>
                    </div>
                    <div className="product-grid">
                        {bestDeals.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* All Products */}
            <section className="section">
                <div className="section-header" style={{ alignItems: 'center' }}>
                    <h2 className="section-title">Tất Cả Sản Phẩm ({totalElements})</h2>
                    <select className="filter-select" value={sortIdx}
                            onChange={(e) => { setSortIdx(Number(e.target.value)); setPage(0); }}
                            style={{ width: 'auto' }}>
                        {SORT_OPTIONS.map((s, i) => <option key={i} value={i}>{s.name}</option>)}
                    </select>
                </div>

                {products.length > 0 ? (
                    <>
                        <div className="product-grid">
                            {products.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px', flexWrap: 'wrap' }}>
                                <button className="filter-btn" disabled={page === 0}
                                        onClick={() => setPage(p => p - 1)} style={{ opacity: page === 0 ? 0.5 : 1 }}>
                                    ← Trước
                                </button>
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    const start = Math.max(0, Math.min(page - 2, totalPages - 5));
                                    const pNum = start + i;
                                    return (
                                        <button key={pNum} className="filter-btn"
                                                onClick={() => setPage(pNum)}
                                                style={{
                                                    background: pNum === page ? 'var(--text-primary)' : undefined,
                                                    color: pNum === page ? 'white' : undefined,
                                                    minWidth: '36px',
                                                }}>
                                            {pNum + 1}
                                        </button>
                                    );
                                })}
                                <button className="filter-btn" disabled={page >= totalPages - 1}
                                        onClick={() => setPage(p => p + 1)}
                                        style={{ opacity: page >= totalPages - 1 ? 0.5 : 1 }}>
                                    Sau →
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="empty-state">
                        <div className="icon">👟</div>
                        <p>Chưa có sản phẩm nào cho thương hiệu này</p>
                    </div>
                )}
            </section>
        </>
    );
}
