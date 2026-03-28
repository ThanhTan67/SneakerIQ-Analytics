'use client';

import { useState } from 'react';

export default function NewsletterSection() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || loading) return;
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setSubmitted(true);
            setLoading(false);
        }, 800);
    };

    return (
        <section className="newsletter-section">
            <div className="newsletter-content">
                <div className="newsletter-badge">✉ Ưu đãi độc quyền</div>
                <h2 className="newsletter-title">
                    Đừng bỏ lỡ deal hot
                </h2>
                <p className="newsletter-subtitle">
                    Đăng ký nhận thông báo về giá giảm sốc, sản phẩm mới và ưu đãi độc quyền từ các thương hiệu hàng đầu.
                </p>

                {submitted ? (
                    <div className="newsletter-success">
                        ✓ Đăng ký thành công! Chúng tôi sẽ gửi thông báo ưu đãi cho bạn.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="newsletter-form">
                        <input
                            type="email"
                            className="newsletter-input"
                            placeholder="Nhập email của bạn..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <button type="submit" className="newsletter-btn" disabled={loading}>
                            {loading ? 'Đang gửi...' : 'Đăng ký'}
                        </button>
                    </form>
                )}

                <p className="newsletter-privacy">
                    Chúng tôi tôn trọng quyền riêng tư của bạn. Hủy đăng ký bất cứ lúc nào.
                </p>
            </div>
        </section>
    );
}
