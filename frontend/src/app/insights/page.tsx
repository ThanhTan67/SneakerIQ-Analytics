'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Insight } from '@/features/sneaker/types';
import { formatPrice, getRecClass, getRecLabel, getTrendClass, getTrendLabel } from '@/components/sneaker/ProductCard';

const BRAND_TABS = [
    { name: 'Tất cả', slug: '' },
    { name: 'Nike', slug: 'nike' },
    { name: 'Adidas', slug: 'adidas' },
    { name: 'Jordan', slug: 'jordan' },
    { name: 'New Balance', slug: 'new-balance' },
    { name: 'Puma', slug: 'puma' },
    { name: 'Converse', slug: 'converse' },
    { name: 'Vans', slug: 'vans' },
];

export default function InsightsPage() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [activeTab, setActiveTab] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchInsights = async (brandSlug: string) => {
        setLoading(true);
        try {
            const url = brandSlug
                ? `/api/v1/insights/top-deals/${brandSlug}?limit=20`
                : '/api/v1/insights/top-deals?limit=30';
            const res = await fetch(url);
            if (res.ok) setInsights(await res.json());
        } catch (err) {
            console.error('Failed to fetch insights', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights(activeTab);
    }, [activeTab]);

    return (
        <div className="section">
            <h1 className="section-title" style={{ marginBottom: '8px', fontSize: '2rem' }}>
               Insights & Analytics
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Phân tích deal tốt nhất, xu hướng giá và khuyến nghị mua hàng cho sneaker.
            </p>

            {/* Brand Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
                {BRAND_TABS.map(tab => (
                    <button
                        key={tab.slug}
                        onClick={() => setActiveTab(tab.slug)}
                        style={{
                            padding: '8px 20px',
                            borderRadius: 'var(--radius-full)',
                            border: activeTab === tab.slug
                                ? '2px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)',
                            background: activeTab === tab.slug
                                ? 'rgba(108,92,231,0.15)' : 'var(--bg-card)',
                            color: activeTab === tab.slug ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: activeTab === tab.slug ? 700 : 400,
                            transition: 'all 150ms ease',
                        }}
                    >
                        {tab.name}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner" />
                    <p>Đang tải insights...</p>
                </div>
            ) : insights.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">📊</div>
                    <p>Chưa có dữ liệu insights</p>
                </div>
            ) : (
                <div className="insight-grid">
                    {insights.map((insight, idx) => (
                        <Link
                            key={insight.productId}
                            href={`/products/${insight.productId}`}
                            className="insight-card"
                        >
                            <div className="insight-card-image">
                                {insight.mainImage ? (
                                    <img src={insight.mainImage} alt={insight.productName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                                ) : (
                                    <span>👟</span>
                                )}
                            </div>
                            <div className="insight-card-info">
                                <div className="insight-card-brand">{insight.brandName}</div>
                                <div className="insight-card-name">{insight.productName}</div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                    <span style={{ fontWeight: 800, fontSize: '1rem' }}>
                                        {formatPrice(insight.currentPrice)}
                                    </span>
                                    {insight.discountPercent != null && insight.discountPercent > 0 && (
                                        <span className="badge badge-sale">-{Math.round(insight.discountPercent)}%</span>
                                    )}
                                </div>

                                <div className="insight-card-stats">
                                    <div className="insight-stat">
                                        <span className="insight-stat-label">Deal Score</span>
                                        <span className="insight-stat-value" style={{
                                            color: insight.dealScore >= 70 ? 'var(--success)' : insight.dealScore >= 40 ? 'var(--warning)' : 'var(--danger)'
                                        }}>
                                            {insight.dealScore}/100
                                        </span>
                                    </div>
                                    <div className="insight-stat">
                                        <span className="insight-stat-label">Xu hướng</span>
                                        <span className={`trend-badge ${getTrendClass(insight.trendStatus)}`} style={{ fontSize: '0.65rem' }}>
                                            {getTrendLabel(insight.trendStatus)}
                                        </span>
                                    </div>
                                    <div className="insight-stat">
                                        <span className="insight-stat-label">Khuyến nghị</span>
                                        <span className={`rec-badge ${getRecClass(insight.recommendationLabel)}`} style={{ fontSize: '0.6rem', padding: '2px 8px' }}>
                                            {getRecLabel(insight.recommendationLabel)}
                                        </span>
                                    </div>
                                </div>

                                {insight.bestPrice && (
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.7rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>
                                            Min: <span style={{ color: 'var(--success)' }}>{formatPrice(insight.bestPrice)}</span>
                                        </span>
                                        <span style={{ color: 'var(--text-muted)' }}>
                                            Avg: <span style={{ color: 'var(--accent-secondary)' }}>{formatPrice(insight.avgPrice)}</span>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
