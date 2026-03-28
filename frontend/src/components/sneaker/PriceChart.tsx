'use client';

import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { PriceHistoryPoint } from '@/features/sneaker/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface PriceChartProps {
    data: PriceHistoryPoint[];
    title?: string;
}

export default function PriceChart({ data, title = 'Lịch sử giá' }: PriceChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="chart-container">
                <h3>{title}</h3>
                <div className="empty-state">
                    <p>Chưa có dữ liệu lịch sử giá</p>
                </div>
            </div>
        );
    }

    const labels = data.map(d => {
        const date = new Date(d.date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Giá',
                data: prices,
                borderColor: '#0071e3',
                backgroundColor: 'rgba(0, 113, 227, 0.06)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: '#0071e3',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2,
                borderWidth: 2,
            },
            {
                label: 'Trung bình',
                data: Array(labels.length).fill(avgPrice),
                borderColor: 'rgba(0, 113, 227, 0.25)',
                borderDash: [5, 5],
                borderWidth: 1,
                pointRadius: 0,
                fill: false,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(29, 29, 31, 0.92)',
                titleColor: '#f5f5f7',
                bodyColor: '#a1a1a6',
                borderColor: 'rgba(0, 113, 227, 0.2)',
                borderWidth: 1,
                cornerRadius: 10,
                padding: 10,
                titleFont: { family: '-apple-system, BlinkMacSystemFont, Inter, sans-serif', size: 12 },
                bodyFont: { family: '-apple-system, BlinkMacSystemFont, Inter, sans-serif', size: 11 },
                callbacks: {
                    label: function (context: { dataset: { label: string }; parsed: { y: number } }) {
                        return `${context.dataset.label}: ${new Intl.NumberFormat('vi-VN').format(context.parsed.y)}đ`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: { color: 'rgba(0, 0, 0, 0.04)' },
                ticks: {
                    color: '#86868b',
                    font: { size: 10, family: '-apple-system, BlinkMacSystemFont, Inter, sans-serif' },
                    maxTicksLimit: 10,
                },
            },
            y: {
                grid: { color: 'rgba(0, 0, 0, 0.04)' },
                ticks: {
                    color: '#86868b',
                    font: { size: 10, family: '-apple-system, BlinkMacSystemFont, Inter, sans-serif' },
                    callback: function (value: number | string) {
                        return new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(Number(value));
                    },
                },
            },
        },
    };

    const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(Math.round(v)) + 'đ';

    return (
        <div className="chart-container">
            <h3>{title}</h3>
            <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', fontSize: '0.8rem' }}>
                <div>
                    <span style={{ color: 'var(--text-muted)' }}>Thấp nhất: </span>
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>{formatVND(minPrice)}</span>
                </div>
                <div>
                    <span style={{ color: 'var(--text-muted)' }}>Cao nhất: </span>
                    <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{formatVND(maxPrice)}</span>
                </div>
                <div>
                    <span style={{ color: 'var(--text-muted)' }}>Trung bình: </span>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{formatVND(avgPrice)}</span>
                </div>
            </div>
            <div className="chart-wrapper">
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
}
