import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TikTok Video Downloader - Download TikTok Videos Without Watermark",
  description: "Free online tool to download TikTok videos without watermark in high quality. Save TikTok videos directly to your device.",
  keywords: "tiktok, download tiktok, tiktok downloader, tiktok without watermark, download tiktok videos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
