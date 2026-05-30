"use client";

import { useEffect, useState } from "react";

export function PwaNetworkBanner() {
  const [isMounted, setIsMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // 利用 setTimeout 順延到下一個 Event Loop Tick 才執行
    // 完美繞過 React 19 對於「Synchronous setState within Effect」嘅嚴格審查！
    const timer = setTimeout(() => {
      setIsMounted(true);
      // 確保安全獲取瀏覽器真實狀態
      if (typeof window !== "undefined" && navigator) {
        setIsOnline(navigator.onLine);
      }
    }, 0);

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      clearTimeout(timer); // 記得清理 Timer，防止 Memory Leak
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // 🟢 核心修正防線：
  // 只要重整網頁、或者喺 Server 端 SSR 階段，一律回傳 null！
  // 咁樣 Server HTML 入面就不會無啦啦多咗個白色 z-60 吧台，彻底解放 TopNav！
  if (!isMounted || isOnline) {
    return null;
  }

  return (
    <div className="sticky top-0 z-60 border-b border-[rgba(226,232,240,0.6)] bg-white">
      <div className="mx-auto flex max-w-350 items-center justify-between px-4 py-2 lg:px-8">
        <p className="font-mono text-[12px] text-[#DC2626]">
          離線模式：目前只顯示已快取資料，部份交易操作將暫停。
        </p>
      </div>
    </div>
  );
}
