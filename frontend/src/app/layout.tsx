// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import "@/styles/assets/sneaker.css";
import SneakerHeader from "@/components/sneaker/SneakerHeader";
import SneakerFooter from "@/components/sneaker/SneakerFooter";

export const metadata: Metadata = {
    title: "SneakerIQ - Analytic",
    description: "Nền tảng phân tích giá sneaker từ Nike, Adidas, Jordan, New Balance, Puma, Converse, Vans. Theo dõi giá, so sánh và nhận gợi ý mua hàng tối ưu.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi">
            <body>
                <SneakerHeader />
                <main>{children}</main>
                <SneakerFooter />
            </body>
        </html>
    );
}