// src/app/page.tsx
import Link from 'next/link';
import "@/styles/assets/store.css";

export default function Home() {
    const shoeBrands = [
        { name: 'Nike', bgColor: '#f5f5f7', textColor: '#1d1d1f', accent: '#e6e6e8' },
        { name: 'Adidas', bgColor: '#f5f5f7', textColor: '#1d1d1f', accent: '#e6e6e8' },
        { name: 'Puma', bgColor: '#f5f5f7', textColor: '#1d1d1f', accent: '#e6e6e8' },
        { name: 'New Balance', bgColor: '#f5f5f7', textColor: '#1d1d1f', accent: '#e6e6e8' },
        { name: 'Converse', bgColor: '#f5f5f7', textColor: '#1d1d1f', accent: '#e6e6e8' },
        { name: 'Vans', bgColor: '#f5f5f7', textColor: '#1d1d1f', accent: '#e6e6e8' },
        { name: 'Jordan', bgColor: '#f5f5f7', textColor: '#1d1d1f', accent: '#e6e6e8' },
    ];

    return (
        <>
            <div className="apple-banner">
                <div className="banner-content">
                    <p>
                        Thanh toán hàng tháng thật dễ dàng với lãi suất 0% trong 12 tháng.
                        <Link href="#" className="banner-link"> Tìm hiểu thêm <span>→</span></Link>
                    </p>
                </div>
            </div>

            {/* Hero Section - Apple style */}
            <section className="apple-hero">
                <div className="hero-content">
                    <h2 className="hero-eyebrow">Bộ sưu tập mới</h2>
                    <h1 className="hero-title">
                        Trao những điều
                        <br />đặc biệt.
                    </h1>
                    <p className="hero-description">
                        Khám phá những mẫu giày thể thao mới nhất từ các thương hiệu hàng đầu thế giới.
                        Thiết kế đương đại, chất lượng vượt thời gian.
                    </p>
                    <div className="hero-cta">
                        <button className="cta-primary">Mua sắm ngay</button>
                        <button className="cta-secondary">Tìm hiểu thêm</button>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="hero-image"></div>
                </div>
            </section>

            {/* Brand Grid - Apple style */}
            <section className="apple-brands">
                <div className="section-header-compact">
                    <h2>Thương hiệu nổi bật.</h2>
                    <p>Khám phá bộ sưu tập từ những thương hiệu giày hàng đầu.</p>
                </div>

                <div className="brand-grid-compact">
                    {shoeBrands.map((brand) => (
                        <Link
                            key={brand.name}
                            href={`/brand/${brand.name.toLowerCase().replace(' ', '-')}`}
                            className="brand-tile"
                            style={{ backgroundColor: brand.bgColor }}
                        >
                            <span className="brand-tile-emoji">👟</span>
                            <h3 style={{ color: brand.textColor }}>{brand.name}</h3>
                            <span className="brand-tile-arrow">→</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Featured Categories - Apple style */}
            <section className="apple-categories">
                <div className="categories-grid">
                    <div className="category-card large">
                        <div className="category-content">
                            <span className="category-tag">Giới hạn</span>
                            <h3>Bộ sưu tập Air Max</h3>
                            <p>Thoải mái tối đa cho mọi bước chạy</p>
                            <Link href="/nike/air-max" className="category-link">Xem bộ sưu tập →</Link>
                        </div>
                        <div className="category-visual air-max-bg"></div>
                    </div>

                    <div className="category-card">
                        <div className="category-content">
                            <h3>Ultraboost mới</h3>
                            <p>Năng lượng cho mọi bước chạy</p>
                            <Link href="/adidas/ultraboost" className="category-link">Xem ngay →</Link>
                        </div>
                        <div className="category-visual ultraboost-bg"></div>
                    </div>

                    <div className="category-card">
                        <div className="category-content">
                            <h3>Classic Suede</h3>
                            <p>Phong cách vượt thời gian</p>
                            <Link href="/puma/suede" className="category-link">Xem ngay →</Link>
                        </div>
                        <div className="category-visual puma-bg"></div>
                    </div>

                    <div className="category-card">
                        <div className="category-content">
                            <h3>990 Series</h3>
                            <p>Đẳng cấp Made in USA</p>
                            <Link href="/new-balance/990" className="category-link">Xem ngay →</Link>
                        </div>
                        <div className="category-visual nb-bg"></div>
                    </div>

                    <div className="category-card">
                        <div className="category-content">
                            <h3>Chuck 70</h3>
                            <p>Huyền thoại trở lại</p>
                            <Link href="/converse/chuck-70" className="category-link">Xem ngay →</Link>
                        </div>
                        <div className="category-visual converse-bg"></div>
                    </div>

                    <div className="category-card">
                        <div className="category-content">
                            <h3>Old Skool</h3>
                            <p>Biểu tượng đường phố</p>
                            <Link href="/vans/old-skool" className="category-link">Xem ngay →</Link>
                        </div>
                        <div className="category-visual vans-bg"></div>
                    </div>
                </div>
            </section>

            {/* Product Grid - Apple style */}
            <section className="apple-products">
                <div className="section-header-compact">
                    <h2>Sản phẩm mới nhất.</h2>
                    <p>Khám phá những thiết kế mới nhất vừa ra mắt.</p>
                </div>

                <div className="product-grid-compact">
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <div key={item} className="product-item">
                            <div className="product-image-wrapper">
                                <div className="product-image-placeholder"></div>
                            </div>
                            <div className="product-details">
                                <span className="product-brand-tag">Nike</span>
                                <h4 className="product-name">Air Max Pulse</h4>
                                <p className="product-price">3.299.000đ</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer - Apple style */}
            <footer className="apple-footer">
                <div className="footer-content">
                    <div className="footer-breadcrumb">
                        <span>🛒</span> › <span>Giày thể thao</span> › <span>Bộ sưu tập mới</span>
                    </div>

                    <div className="footer-links">
                        <div className="footer-column">
                            <h4>Khám phá</h4>
                            <Link href="/nike">Nike</Link>
                            <Link href="/adidas">Adidas</Link>
                            <Link href="/puma">Puma</Link>
                            <Link href="/new-balance">New Balance</Link>
                        </div>
                        <div className="footer-column">
                            <h4>Dịch vụ</h4>
                            <Link href="/help">Trợ giúp</Link>
                            <Link href="/returns">Đổi trả</Link>
                            <Link href="/shipping">Vận chuyển</Link>
                            <Link href="/payment">Thanh toán</Link>
                        </div>
                        <div className="footer-column">
                            <h4>Về chúng tôi</h4>
                            <Link href="/about">Giới thiệu</Link>
                            <Link href="/contact">Liên hệ</Link>
                            <Link href="/careers">Tuyển dụng</Link>
                        </div>
                        <div className="footer-column">
                            <h4>Kết nối</h4>
                            <Link href="#">Facebook</Link>
                            <Link href="#">Instagram</Link>
                            <Link href="#">Twitter</Link>
                        </div>
                    </div>

                    <div className="footer-legal">
                        <p>© 2026 ShoeStore. All rights reserved.</p>
                        <div className="legal-links">
                            <Link href="/privacy">Chính sách riêng tư</Link>
                            <Link href="/terms">Điều khoản sử dụng</Link>
                            <Link href="/sitemap">Sitemap</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}