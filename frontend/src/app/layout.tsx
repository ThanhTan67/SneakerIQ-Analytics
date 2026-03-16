// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import "@/styles/assets/globals.css";
import "@/styles/assets/header.css";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export const metadata: Metadata = {
    title: "Glow Mart",
    description: "Cửa hàng chính hãng",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="main">
                <Header />
                {children}
                <Footer />
            </body>
        </html>
    );
}