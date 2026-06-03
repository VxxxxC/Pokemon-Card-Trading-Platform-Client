"use client";

import { useSyncExternalStore } from "react";

function subscribeToNetworkStatus(onStoreChange: () => void) {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);

  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function getNetworkStatusSnapshot() {
  return navigator.onLine;
}

function getServerNetworkStatusSnapshot() {
  return true;
}

export function PwaNetworkBanner() {
  // Safe SSR environment isolation via useSyncExternalStore
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isOnline = useSyncExternalStore(
    subscribeToNetworkStatus,
    getNetworkStatusSnapshot,
    getServerNetworkStatusSnapshot,
  );

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
