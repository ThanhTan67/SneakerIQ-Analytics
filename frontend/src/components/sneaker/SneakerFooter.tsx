import Link from 'next/link';
import NewsletterSection from './NewsletterSection';

export default function SneakerFooter() {
    return (
        <>
            <NewsletterSection />
            <footer className="site-footer">
                <div className="footer-inner">
                    <div className="footer-about">
                        <h3>SneakerIQ</h3>
                        <p>
                            Nền tảng phân tích giá sneaker thông minh. Theo dõi giá, so sánh nguồn,
                            và nhận gợi ý mua hàng tối ưu từ 7 thương hiệu hàng đầu thế giới.
                        </p>
                    </div>
                    <div className="footer-col">
                        <h4>Thương hiệu</h4>
                        <Link href="/brands/nike">Nike</Link>
                        <Link href="/brands/adidas">Adidas</Link>
                        <Link href="/brands/jordan">Jordan</Link>
                        <Link href="/brands/new-balance">New Balance</Link>
                    </div>
                    <div className="footer-col">
                        <h4>Khám phá</h4>
                        <Link href="/brands/puma">Puma</Link>
                        <Link href="/brands/converse">Converse</Link>
                        <Link href="/brands/vans">Vans</Link>
                        <Link href="/insights">Insights</Link>
                    </div>
                    <div className="footer-col">
                        <h4>Tính năng</h4>
                        <Link href="/products">Tìm kiếm</Link>
                        <Link href="/compare">So sánh giá</Link>
                        <Link href="/insights">Top Deals</Link>
                        <Link href="/products?sortBy=discountPercent&sortDir=desc">Giảm giá</Link>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 SneakerIQ — Cao Thanh Tan. Nền tảng phân tích giá sneaker chuyên sâu. Không cung cấp dịch vụ mua bán.</p>
                </div>
            </footer>
        </>
    );
}
