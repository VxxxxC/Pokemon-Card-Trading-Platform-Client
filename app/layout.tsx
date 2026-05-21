import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppSerwistProvider } from "@/app/components/serwist-provider";
import "./globals.css";

const APP_NAME = "PokéTrade JP";
const APP_DEFAULT_TITLE = "PokéTrade JP — 日版寶可夢卡牌専業交易平台";
const APP_TITLE_TEMPLATE = "%s | PokéTrade JP";
const APP_DESCRIPTION =
  "専業日版寶可夢卡牌交易平台。透明市場成交數據，安全託管付款，針對收藏家及專業投資者。";

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
  themeColor: "#2563EB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-[100dvh] bg-[#F8F9FA] text-[#202124] font-sans">
        <AppSerwistProvider>{children}</AppSerwistProvider>
      </body>
    </html>
  );
}
