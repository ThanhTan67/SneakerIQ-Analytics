'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/features/sneaker/types';
import { formatPrice, getRecClass, getRecLabel, getTrendLabel } from '@/components/sneaker/ProductCard';

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

export default function ComparePage() {
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [compareData, setCompareData] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [brandFilter, setBrandFilter] = useState('');

    // Load products for selection
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const params = new URLSearchParams({ size: '200', sortBy: 'name', sortDir: 'asc' });
                if (brandFilter) params.set('brandSlug', brandFilter);
                const res = await fetch(`/api/v1/products?${params}`);
                if (res.ok) {
                    const data = await res.json();
                    setAllProducts(data.content || []);
                }
            } catch (err) {
                console.error('Failed to fetch products', err);
            }
        };
        fetchProducts();
    }, [brandFilter]);

    const handleToggleProduct = (id: string) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            if (prev.length >= 4) return prev; // max 4
            return [...prev, id];
        });
    };

    const handleCompare = async () => {
        if (selectedIds.length < 2) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/products/compare?ids=${selectedIds.join(',')}`);
            if (res.ok) {
                setCompareData(await res.json());
            }
        } catch (err) {
            console.error('Failed to compare', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = allProducts.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brandName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="section">
            <h1 className="section-title" style={{ marginBottom: '8px' }}>
                So Sánh Sneaker
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Chọn 2-4 sản phẩm để so sánh giá, deal, rating và xu hướng giá.
            </p>

            {/* Brand filter */}
            <div className="brand-filter-bar">
                {BRANDS.map((b) => (
                    <button
                        key={b.value}
                        className={`brand-pill ${brandFilter === b.value ? 'active' : ''}`}
                        onClick={() => setBrandFilter(b.value)}
                    >
                        {b.name}
                    </button>
                ))}
            </div>

            {/* Search */}
            <input
                className="filter-input"
                type="text"
                placeholder="🔍 Tìm sản phẩm để so sánh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', maxWidth: '400px', marginBottom: '16px' }}
            />

            {/* Product Picker — Card-based */}
            <div className="compare-picker-grid">
                {filteredProducts.map(p => (
                    <div
                        key={p.id}
                        className={`compare-pick-card ${selectedIds.includes(p.id) ? 'selected' : ''}`}
                        onClick={() => handleToggleProduct(p.id)}
                    >
                        {p.mainImage ? (
                            <img className="pick-thumb" src={p.mainImage} alt={p.name} />
                        ) : (
                            <div className="pick-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👟</div>
                        )}
                        <div className="pick-info">
                            <div className="pick-name">{p.name}</div>
                            <div className="pick-brand">{p.brandName}</div>
                            <div className="pick-price">{formatPrice(p.currentPrice)}</div>
                        </div>
                        <div className="pick-check">
                            {selectedIds.includes(p.id) ? '✓' : ''}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <button
                    className="filter-btn"
                    onClick={handleCompare}
                    disabled={selectedIds.length < 2}
                    style={{ opacity: selectedIds.length < 2 ? 0.5 : 1 }}
                >
                    So sánh {selectedIds.length} sản phẩm
                </button>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Đã chọn {selectedIds.length}/4
                </span>
                {selectedIds.length > 0 && (
                    <button className="filter-btn" onClick={() => setSelectedIds([])}
                            style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                        Xóa tất cả
                    </button>
                )}
            </div>

            {/* Comparison Table */}
            {loading && (
                <div className="loading-container">
                    <div className="loading-spinner" />
                    <p>Đang so sánh...</p>
                </div>
            )}

            {!loading && compareData.length >= 2 && (
                <div style={{ overflowX: 'auto' }}>
                    <table className="compare-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left' }}>Tiêu chí</th>
                                {compareData.map(p => (
                                    <th key={p.id}>
                                        <div className="compare-product-header">
                                            {p.mainImage ? (
                                                <img className="thumb-img" src={p.mainImage} alt={p.name} />
                                            ) : (
                                                <div className="thumb-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👟</div>
                                            )}
                                            <Link href={`/products/${p.id}`} className="name" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
                                                {p.name}
                                            </Link>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ textAlign: 'left', fontWeight: 600 }}>Thương hiệu</td>
                                {compareData.map(p => <td key={p.id}>{p.brandName}</td>)}
                            </tr>
                            <tr>
                                <td style={{ textAlign: 'left', fontWeight: 600 }}>Giá hiện tại</td>
                                {compareData.map(p => (
                                    <td key={p.id} style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                                        {formatPrice(p.currentPrice)}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td style={{ textAlign: 'left', fontWeight: 600 }}>Giá gốc</td>
                                {compareData.map(p => <td key={p.id}>{formatPrice(p.originalPrice)}</td>)}
                            </tr>
                            <tr>
                                <td style={{ textAlign: 'left', fontWeight: 600 }}>Giảm giá</td>
                                {compareData.map(p => (
                                    <td key={p.id} style={{ color: p.discountPercent ? 'var(--danger)' : 'var(--text-muted)' }}>
                                        {p.discountPercent ? `-${Math.round(p.discountPercent)}%` : '—'}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td style={{ textAlign: 'left', fontWeight: 600 }}>Giá thấp nhất</td>
                                {compareData.map(p => (
                                    <td key={p.id} style={{ color: 'var(--success)' }}>{formatPrice(p.bestPrice)}</td>
                                ))}
                            </tr>
                            <tr>
                                <td style={{ textAlign: 'left', fontWeight: 600 }}>Giá trung bình</td>
                                {compareData.map(p => (
                                    <td key={p.id} style={{ color: 'var(--accent-secondary)' }}>{formatPrice(p.avgPrice)}</td>
                                ))}
                            </tr>
                            <tr>
                                <td style={{ textAlign: 'left', fontWeight: 600 }}>Xu hướng giá</td>
                                {compareData.map(p => (
                                    <td key={p.id}>{p.trendStatus ? getTrendLabel(p.trendStatus) : '—'}</td>
                                ))}
                            </tr>
                            <tr>
                                <td style={{ textAlign: 'left', fontWeight: 600 }}>Deal Score</td>
                                {compareData.map(p => (
                                    <td key={p.id}>
                                        {p.dealScore != null ? (
                                            <span style={{ fontWeight: 700 }}>{p.dealScore}/100</span>
                                        ) : '—'}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td style={{ textAlign: 'left', fontWeight: 600 }}>Khuyến nghị</td>
                                {compareData.map(p => (
                                    <td key={p.id}>
                                        {p.recommendationLabel ? (
                                            <span className={`rec-badge ${getRecClass(p.recommendationLabel)}`}>
                                                {getRecLabel(p.recommendationLabel)}
                                            </span>
                                        ) : '—'}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td style={{ textAlign: 'left', fontWeight: 600 }}>Màu sắc</td>
                                {compareData.map(p => <td key={p.id}>{p.color || '—'}</td>)}
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
