import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppSerwistProvider } from "@/app/components/serwist-provider";
import "./globals.css";

const APP_NAME = "PokéTrade JP";
const APP_DEFAULT_TITLE = "PokéTrade JP — 日本版ポケモンカード専門取引プラットフォーム";
const APP_TITLE_TEMPLATE = "%s | PokéTrade JP";
const APP_DESCRIPTION =
  "日本版ポケモンカードの専門取引プラットフォーム。リアルタイム市場データ、安全なエスクロー決済、コレクター・専門投資家向けサービス。";

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
      lang="zh-TW"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-[100dvh] bg-[#F8F9FA] text-[#202124] font-sans">
        <AppSerwistProvider>{children}</AppSerwistProvider>
      </body>
    </html>
  );
}
