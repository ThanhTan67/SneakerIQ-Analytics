import Link from 'next/link';
import Image from 'next/image';

const BRANDS = [
    { name: 'Nike', slug: 'nike', logo: '/images/nike.svg', color: '#FA5400', desc: 'Thương hiệu giày thể thao hàng đầu thế giới' },
    { name: 'Adidas', slug: 'adidas', logo: '/images/adidas.svg', color: '#000', desc: 'Phong cách thời trang đường phố Đức' },
    { name: 'Jordan', slug: 'jordan', logo: '/images/jordan.svg', color: '#E31937', desc: 'Huyền thoại bóng rổ Michael Jordan' },
    { name: 'New Balance', slug: 'new-balance', logo: '/images/new-balance.svg', color: '#CF0A2C', desc: 'Chất lượng Made in USA' },
    { name: 'Puma', slug: 'puma', logo: '/images/puma.svg', color: '#E91E63', desc: 'Thời trang kết hợp hiệu suất' },
    { name: 'Converse', slug: 'converse', logo: '/images/converse.svg', color: '#1E3264', desc: 'Biểu tượng văn hóa từ 1917' },
    { name: 'Vans', slug: 'vans', logo: '/images/vans.svg', color: '#C8102E', desc: 'Văn hóa skateboard đường phố' },
];

export default function BrandsPage() {
    return (
        <div className="section">
            <h1 className="section-title" style={{ marginBottom: '12px', fontSize: '2rem' }}>
               7 Thương Hiệu Sneaker
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', maxWidth: '600px', lineHeight: 1.6 }}>
                Khám phá và so sánh giá sneaker từ 7 thương hiệu hàng đầu thế giới. Mỗi hãng đều có trang riêng
                với sản phẩm nổi bật, deal tốt nhất và biểu đồ phân tích giá.
            </p>

            <div className="brands-page-grid">
                {BRANDS.map(brand => (
                    <Link
                        key={brand.slug}
                        href={`/brands/${brand.slug}`}
                        className="brand-page-card"
                    >
                        <div className="brand-page-card-logo">
                            <Image
                                src={brand.logo}
                                alt={brand.name}
                                width={80}
                                height={80}
                                style={{ objectFit: 'contain' }}
                            />
                        </div>
                        <div className="brand-page-card-info">
                            <div className="brand-page-card-name">{brand.name}</div>
                            <div className="brand-page-card-desc">{brand.desc}</div>
                        </div>
                        <div className="brand-page-card-arrow">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
