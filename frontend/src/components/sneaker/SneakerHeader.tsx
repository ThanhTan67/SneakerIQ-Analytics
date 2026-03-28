'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

const NAV_LINKS = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Sản phẩm', href: '/products' },
    { label: 'Thương hiệu', href: '/brands' },
    { label: 'So sánh', href: '/compare' },
    { label: 'Insights', href: '/insights' },
];

export default function SneakerHeader() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Track scroll for header shadow
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close search on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
                if (!searchQuery.trim()) setSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchQuery]);

    // Close mobile menu on resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 833) setMobileMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Focus input when search opens
    useEffect(() => {
        if (searchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchOpen]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchOpen(false);
            setMobileMenuOpen(false);
        }
    };

    const toggleSearch = () => {
        setSearchOpen(!searchOpen);
        if (searchOpen) setSearchQuery('');
    };

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    return (
        <>
            <header className={`apple-nav ${scrolled ? 'apple-nav--scrolled' : ''}`}>
                <nav className="apple-nav__inner">
                    {/* Logo */}
                    <Link href="/" className="apple-nav__logo">
                        <svg className="apple-nav__logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        <span>SneakerIQ</span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <ul className="apple-nav__links">
                        {NAV_LINKS.map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={`apple-nav__link ${isActive(link.href) ? 'apple-nav__link--active' : ''}`}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {/* Right Actions */}
                    <div className="apple-nav__actions">
                        {/* Search */}
                        <div className="apple-nav__search-container" ref={searchContainerRef}>
                            <button
                                className="apple-nav__icon-btn"
                                onClick={toggleSearch}
                                aria-label="Tìm kiếm"
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                            </button>

                            <div className={`apple-nav__search-dropdown ${searchOpen ? 'apple-nav__search-dropdown--open' : ''}`}>
                                <form onSubmit={handleSearch} className="apple-nav__search-form">
                                    <svg className="apple-nav__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.35-4.35" />
                                    </svg>
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Tìm kiếm sneaker..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="apple-nav__search-input"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            className="apple-nav__search-clear"
                                            onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                                            aria-label="Xóa"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" />
                                                <path d="m15 9-6 6" />
                                                <path d="m9 9 6 6" />
                                            </svg>
                                        </button>
                                    )}
                                </form>
                                <div className="apple-nav__search-hints">
                                    <span className="apple-nav__search-hint">Thử tìm: </span>
                                    {['Air Force 1', 'Yeezy', 'Jordan 1', 'Dunk Low'].map((term) => (
                                        <button
                                            key={term}
                                            className="apple-nav__search-suggestion"
                                            onClick={() => {
                                                setSearchQuery(term);
                                                router.push(`/products?search=${encodeURIComponent(term)}`);
                                                setSearchOpen(false);
                                            }}
                                        >
                                            {term}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="apple-nav__hamburger"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Menu"
                        >
                            <span className={`apple-nav__hamburger-line ${mobileMenuOpen ? 'apple-nav__hamburger-line--open' : ''}`} />
                            <span className={`apple-nav__hamburger-line ${mobileMenuOpen ? 'apple-nav__hamburger-line--open' : ''}`} />
                        </button>
                    </div>
                </nav>
            </header>

            {/* Search Overlay (backdrop) */}
            <div
                className={`apple-nav__search-overlay ${searchOpen ? 'apple-nav__search-overlay--visible' : ''}`}
                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
            />

            {/* Mobile Menu */}
            <div className={`apple-nav__mobile-menu ${mobileMenuOpen ? 'apple-nav__mobile-menu--open' : ''}`}>
                <div className="apple-nav__mobile-inner">
                    {/* Mobile Search */}
                    <form onSubmit={handleSearch} className="apple-nav__mobile-search">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="apple-nav__mobile-search-input"
                        />
                    </form>

                    {/* Mobile Links */}
                    <ul className="apple-nav__mobile-links">
                        {NAV_LINKS.map((link, i) => (
                            <li
                                key={link.href}
                                className="apple-nav__mobile-link-item"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <Link
                                    href={link.href}
                                    className={`apple-nav__mobile-link ${isActive(link.href) ? 'apple-nav__mobile-link--active' : ''}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label}
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m9 18 6-6-6-6" />
                                    </svg>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="apple-nav__mobile-overlay"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
        </>
    );
}
