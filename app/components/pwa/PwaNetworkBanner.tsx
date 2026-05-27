"use client";

import { useEffect, useState } from "react";

export function PwaNetworkBanner() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === "undefined") return true;
    return navigator.onLine;
  });

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="sticky top-0 z-[60] border-b border-[rgba(237,232,224,0.08)] bg-bg-shell">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-2 lg:px-8">
        <p className="font-mono text-[12px] text-warning">
          離線模式：目前只顯示已快取資料，部份交易操作將暫停。
        </p>
      </div>
    </div>
  );
}
