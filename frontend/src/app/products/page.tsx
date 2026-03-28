'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/sneaker/ProductCard';
import { Product, PageResponse } from '@/features/sneaker/types';

const BRANDS = [
    { name: 'Tất cả', value: '' },
    { name: 'Nike', value: 'nike' },
    { name: 'Adidas', value: 'adidas' },
    { name: 'Jordan', value: 'jordan' },
    { name: 'New Balance', value: 'new-balance' },
    { name: 'Puma', value: 'puma' },
    { name: 'Converse', value: 'converse' },
    { name: 'Vans', value: 'vans' },
];



const SORT_OPTIONS = [
    { name: 'Tên A-Z', sortBy: 'name', sortDir: 'asc' },
    { name: 'Giá thấp → cao', sortBy: 'currentPrice', sortDir: 'asc' },
    { name: 'Giá cao → thấp', sortBy: 'currentPrice', sortDir: 'desc' },
    { name: 'Giảm giá nhiều nhất', sortBy: 'discountPercent', sortDir: 'desc' },
    { name: 'Phổ biến nhất', sortBy: 'viewCount', sortDir: 'desc' },
];

function ProductsContent() {
    const searchParams = useSearchParams();

    const [products, setProducts] = useState<Product[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(true);

    // Filter state
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [brand, setBrand] = useState(searchParams.get('brand') || '');

    const [sortIdx, setSortIdx] = useState(0);
    const [page, setPage] = useState(0);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    // Sync URL searchParams → local state (fixes header search only working once)
    useEffect(() => {
        const urlSearch = searchParams.get('search') || '';
        const urlBrand = searchParams.get('brand') || '';
        if (urlSearch !== search) {
            setSearch(urlSearch);
            setPage(0);
        }
        if (urlBrand !== brand) {
            setBrand(urlBrand);
            setPage(0);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const fetchProducts = useCallback(async (currentPage: number) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (brand) params.set('brandSlug', brand);
            if (minPrice) params.set('minPrice', minPrice);
            if (maxPrice) params.set('maxPrice', maxPrice);
            params.set('sortBy', SORT_OPTIONS[sortIdx].sortBy);
            params.set('sortDir', SORT_OPTIONS[sortIdx].sortDir);
            params.set('page', currentPage.toString());
            params.set('size', '20');

            const res = await fetch(`/api/v1/products?${params}`);
            if (res.ok) {
                const data: PageResponse<Product> = await res.json();
                setProducts(data.content);
                setTotalPages(data.totalPages);
                setTotalElements(data.totalElements);
            }
        } catch (err) {
            console.error('Failed to fetch products', err);
        } finally {
            setLoading(false);
        }
    }, [search, brand, minPrice, maxPrice, sortIdx]);

    // Auto-fetch when filters change
    useEffect(() => {
        fetchProducts(page);
    }, [page, sortIdx, brand, search, fetchProducts]);

    const handleSearch = () => {
        setPage(0);
        fetchProducts(0);
    };

    return (
        <div className="section">
            <h1 className="section-title" style={{ marginBottom: '24px' }}>
                Tìm Kiếm Sneaker
            </h1>

            {/* Brand Filter Pills */}
            <div className="brand-filter-bar">
                {BRANDS.map((b) => (
                    <button
                        key={b.value}
                        className={`brand-pill ${brand === b.value ? 'active' : ''}`}
                        onClick={() => { setBrand(b.value); setSearch(''); setPage(0); }}
                    >
                        {b.name}
                    </button>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-group">
                    <label>Tìm kiếm</label>
                    <input
                        className="filter-input"
                        type="text"
                        placeholder="Tên sản phẩm..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>



                <div className="filter-group">
                    <label>Giá (VNĐ)</label>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input className="filter-input" type="number" placeholder="Từ" value={minPrice}
                               onChange={(e) => setMinPrice(e.target.value)} style={{ width: '100px' }} />
                        <span style={{ color: 'var(--text-muted)' }}>→</span>
                        <input className="filter-input" type="number" placeholder="Đến" value={maxPrice}
                               onChange={(e) => setMaxPrice(e.target.value)} style={{ width: '100px' }} />
                    </div>
                </div>

                <div className="filter-group">
                    <label>Sắp xếp</label>
                    <select className="filter-select" value={sortIdx} onChange={(e) => { setSortIdx(Number(e.target.value)); setPage(0); }}>
                        {SORT_OPTIONS.map((s, i) => <option key={i} value={i}>{s.name}</option>)}
                    </select>
                </div>

                <button className="filter-btn" onClick={handleSearch}>Tìm</button>
            </div>

            {/* Results */}
            <div style={{ marginBottom: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {totalElements} sản phẩm{brand ? ` • ${BRANDS.find(b => b.value === brand)?.name}` : ''} • Trang {page + 1}/{Math.max(totalPages, 1)}
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner" />
                    <p>Đang tải sản phẩm...</p>
                </div>
            ) : products.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">🔍</div>
                    <p>Không tìm thấy sản phẩm nào phù hợp</p>
                </div>
            ) : (
                <>
                    <div className="product-grid">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px', flexWrap: 'wrap' }}>
                            <button className="filter-btn" disabled={page === 0}
                                    onClick={() => setPage(p => p - 1)} style={{ opacity: page === 0 ? 0.5 : 1 }}>
                                ← Trước
                            </button>
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                const start = Math.max(0, Math.min(page - 3, totalPages - 7));
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
            )}
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={
            <div className="loading-container"><div className="loading-spinner" /><p>Đang tải...</p></div>
        }>
            <ProductsContent />
        </Suspense>
    );
}
