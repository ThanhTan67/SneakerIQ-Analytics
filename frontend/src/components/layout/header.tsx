"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

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

const userLinks = [
    { label: "Sign in", href: "/login" },
    { label: "Account", href: "/account" },
    { label: "Orders", href: "/orders" },
];

export default function Header() {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    return (
        <header className="header">
            <nav className="nav">
                <div className="logo">

                </div>

                <ul className="menu">
                    {menuItems.map((item) => (
                        <li key={item.label}>
                            <Link href={item.href}>{item.label}</Link>
                        </li>
                    ))}
                </ul>

                <div className="actions">
                    {/*{["🔍", "🛒"].map((icon, i) => (*/}
                    {/*    <button key={i} aria-label={icon}>{icon}</button>*/}
                    {/*))}*/}
                    <div className="user-menu" ref={menuRef}>
                        <button
                            className="user-btn"
                            aria-expanded={open}
                            onClick={() => setOpen(v => !v)}
                        >
                            User
                        </button>

                        <div className={`dropdown ${open ? "open" : ""}`} role="menu">
                            {userLinks.map((link) => (
                                <Link key={link.label} href={link.href} className="dropdown-item">
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                </div>
            </nav>
        </header>
    );
}