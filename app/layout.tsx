import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppSerwistProvider } from "@/app/components/serwist-provider";
import { PwaNetworkBanner } from "@/app/components/pwa/PwaNetworkBanner";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { AddAssetModal } from "@/app/components/shared/AddAssetModal";
import { DemoRoleSwitcher } from "@/app/components/shared/DemoRoleSwitcher";
import { IosPwaModal } from "./components/pwa/IosPwaModal";

const APP_NAME = "HKCardVault";
const APP_DEFAULT_TITLE = "HKCardVault — 寶可夢卡牌專業交易平台";
const APP_TITLE_TEMPLATE = "%s | HKCardVault";
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
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
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
            )}
        >
            <head>
                {/* iOS Startup Splash Screens */}
                <link rel="apple-touch-startup-image" href="/splash/apple-splash-2796-1290.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/splash/apple-splash-2556-1179.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/splash/apple-splash-2778-1284.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/splash/apple-splash-2532-1170.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/splash/apple-splash-2436-1125.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/splash/apple-splash-1792-828.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/splash/apple-splash-2688-1242.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/splash/apple-splash-2208-1242.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/splash/apple-splash-1334-750.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/splash/apple-splash-2732-2048.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/splash/apple-splash-2388-1668.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/splash/apple-splash-2160-1620.png" media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/splash/apple-splash-2266-1488.png" media="(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
            </head>
            <body className="min-h-dvh bg-bg-page text-text-primary font-sans">
                {/* iOS PWA 安裝提示 */}
                <IosPwaModal />
                {/* Sticky Navbar Demo controller */}
                <DemoRoleSwitcher />
                {/* 外層：PWA 基建環境供應商 */}
                <AppSerwistProvider>
                    {/* 網絡狀態斷網警告條 */}
                    <PwaNetworkBanner />

                    {/* 全站主要內容渲染區 */}
                    {children}
                </AppSerwistProvider>
                {/* Global Sonner Toast */}
                <Toaster
                    position="top-center"
                    closeButton
                    richColors
                    expand={false}
                />
                {/* Global Add Asset Modal */}
                <AddAssetModal />
            </body>
        </html>
    );
}
