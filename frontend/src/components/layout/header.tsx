"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/useAuth";

const menuItems = [
    { label: "Store", href: "/" },
    { label: "Nike", href: "/nike" },
    { label: "Adidas", href: "/adidas" },
    { label: "Puma", href: "/puma" },
    { label: "New Balance", href: "/new-balance" },
    { label: "Converse", href: "/converse" },
    { label: "Vans", href: "/vans" },
    { label: "Jordan", href: "/jordan" },
    { label: "Accessories", href: "/accessories" },
    { label: "Support", href: "/support" },
];

const authenticatedUserLinks = [
    { label: "Account", href: "/account" },
    { label: "Orders", href: "/orders" },
    { divider: true },
    { label: "Sign out", href: "#", action: "logout" },
];

export default function Header() {
    const [open, setOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const { user, isAuthenticated, logout } = useAuth();

    // Click outside cho dropdown
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Đóng mobile menu khi resize lên desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Xử lý click item trong dropdown
    const handleDropdownItemClick = (item: any) => {
        if (item.action === "logout") {
            logout();
        }
        setOpen(false);
    };

    // Xử lý click item trong mobile menu - QUAN TRỌNG: đóng menu
    const handleMobileMenuItemClick = () => {
        setMobileMenuOpen(false);
    };

    return (
        <header className="header">
            <nav className="nav">
                <div className="logo">SNEAKER</div>

                {/* Desktop Menu */}
                <ul className="menu">
                    {menuItems.map((item) => (
                        <li key={item.label}>
                            <Link href={item.href}>{item.label}</Link>
                        </li>
                    ))}
                </ul>

                <div className="actions">
                    {/* Mobile Menu Button */}
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            {mobileMenuOpen ? (
                                <path d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>

                    {/* User Section */}
                    {isAuthenticated ? (
                        <div className="user-menu" ref={menuRef}>
                            <button
                                className="user-btn"
                                aria-expanded={open}
                                onClick={() => setOpen(!open)}
                            >
                                {user?.fullName || "Account"}
                            </button>

                            <div className={`dropdown ${open ? "open" : ""}`} role="menu">
                                {authenticatedUserLinks.map((item, index) => {
                                    if ('divider' in item) {
                                        return <div key={`divider-${index}`} className="dropdown-divider" />;
                                    }
                                    return (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            className="dropdown-item"
                                            onClick={() => handleDropdownItemClick(item)}
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="auth-links">
                            <Link href="/login" className="sign-link">
                                Sign in
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
                <ul className="mobile-menu-list">
                    {menuItems.map((item) => (
                        <li key={item.label} className="mobile-menu-item">
                            <Link
                                href={item.href}
                                onClick={handleMobileMenuItemClick} // Đóng menu khi click
                            >
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </header>
    );
}