"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import type { ReactNode } from "react";

export function AppSerwistProvider({ children }: { children: ReactNode }) {
  // 🟢 在開發環境 (NODE_ENV === "development") 下禁用 Service Worker
  // 防止 Service Worker 攔截 Next.js Turbopack HMR (熱模組重載) 隨機 chunk 請求，解決 ChunkLoadError 與無限 reload 問題。
  if (process.env.NODE_ENV === "development") {
    return <>{children}</>;
  }
  return <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>;
}
