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

// Links cho user đã đăng nhập
const authenticatedUserLinks = [
    { label: "Account", href: "/account" },
    { label: "Orders", href: "/orders" },
    { divider: true },
    { label: "Sign out", href: "#", action: "logout" },
];

export default function Header() {
    const [open, setOpen] = useState(false);
    const [userKey, setUserKey] = useState(Date.now()); // Key để force re-render
    const menuRef = useRef<HTMLDivElement | null>(null);
    const { user, isAuthenticated, logout } = useAuth();

    // Force re-render khi user thay đổi
    useEffect(() => {
        setUserKey(Date.now());
    }, [user]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleItemClick = (item: any) => {
        if (item.action === "logout") {
            logout();
        }
        setOpen(false);
    };

    return (
        <header className="header" key={userKey}> {/* Thêm key để force re-render */}
            <nav className="nav">
                <div className="logo">SNEAKER</div>

                <ul className="menu">
                    {menuItems.map((item) => (
                        <li key={item.label}>
                            <Link href={item.href}>{item.label}</Link>
                        </li>
                    ))}
                </ul>

                <div className="actions">
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
                                            onClick={() => handleItemClick(item)}
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
        </header>
    );
}