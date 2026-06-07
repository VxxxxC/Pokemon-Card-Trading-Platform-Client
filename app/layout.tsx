import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppSerwistProvider } from "@/app/components/serwist-provider";
import { PwaNetworkBanner } from "@/app/components/pwa/PwaNetworkBanner";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { AddAssetModal } from "@/app/components/shared/AddAssetModal";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const APP_NAME = "PokéTrade JP";
const APP_DEFAULT_TITLE = "PokéTrade JP — 寶可夢卡牌專業交易平台";
const APP_TITLE_TEMPLATE = "%s | PokéTrade JP";
const APP_DESCRIPTION =
  "寶可夢卡牌專業交易平台。即時市場數據、安全的第三方託管付款、收藏家及專業投資者服務。";

/* TODO: Import Hanken Grotesk and JetBrains Mono when available
   Currently: Geist (Headline), Geist (Body fallback)
   Target: Geist (Headline), Hanken Grotesk (Body), JetBrains Mono (Data)
   Reference: DESIGN.md Section 3 (字體規則)
 */

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#17130f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="zh-HK"
      className={cn(
        "h-full",
        "antialiased",
        GeistSans.variable,
        GeistMono.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <body className="min-h-dvh bg-bg-page text-text-primary font-sans">
        {/* 外層：PWA 基建環境供應商 */}
        <AppSerwistProvider>
          {/* 網絡狀態斷網警告條 */}
          <PwaNetworkBanner />

          {/* 全站主要內容渲染區 */}
          {children}
        </AppSerwistProvider>
        {/* Global Sonner Toast */}
        <Toaster position="top-center" closeButton richColors expand={false} />
        {/* Global Add Asset Modal */}
        <AddAssetModal />
      </body>
    </html>
  );
}
