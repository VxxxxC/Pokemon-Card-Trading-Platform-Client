"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";

interface PageProps {
  searchParams: Promise<{ status?: string; id?: string }>;
}

export default function PaymentStatusPage({ searchParams }: PageProps) {
  const router = useRouter();
  const params = use(searchParams);
  const status = params.status || "success";
  const id = params.id || "sv2a-182";

  const [counter, setCounter] = useState(5);

  // Auto-redirect to orders page after successful mock checkout
  useEffect(() => {
    if (status === "success") {
      const timer = setInterval(() => {
        setCounter((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push("/profile/user/trading");
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, router]);

  // Mock Stripe txn metadata (deterministic, render-safe)
  const normalizedId = id.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const mockStripeId = `ch_stripe_pk_${normalizedId.slice(0, 14).padEnd(14, "X")}`;
  const mockOrderId = `ORD-MOCK-${normalizedId}`;

  return (
    <div className="min-h-dvh bg-[#17130f] text-[#eae1da] flex flex-col font-sans">
      <TopNav />
      <MobileHeader />

      <main className="flex-1 flex items-center justify-center p-4 py-16">
        <div className="max-w-md w-full bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-[0_8px_32px_rgba(0,0,0,0.60)]">
          {status === "success" ? (
            /* SUCCESS STATUS VIEW */
            <div className="space-y-6">
              {/* Green radial glowing pulse */}
              <div className="mx-auto w-16 h-16 rounded-full bg-[rgba(16,185,129,0.15)] flex items-center justify-center border-2 border-[#10b981] animate-ring-pulse">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <div className="space-y-2">
                <h1 className="font-sans font-bold text-[22px] text-[#eae1da]">
                  交易付款成功
                </h1>
                <p className="font-sans text-[13px] text-[#d4c4b7]">
                  您已成功支付 10% Escrow
                  交易定金！實物資產已即時進入託管及發貨鑑定流程。
                </p>
              </div>

              {/* Financial stripe log */}
              <div className="bg-[#17130f] p-4 rounded-xl border border-[rgba(237,232,224,0.04)] font-mono text-[11px] text-[#d4c4b7] text-left space-y-1.5">
                <p>
                  <span className="text-[#50453b]">訂單編號:</span>{" "}
                  {mockOrderId}
                </p>
                <p className="truncate">
                  <span className="text-[#50453b]">Stripe 流水號:</span>{" "}
                  {mockStripeId}
                </p>
                <p>
                  <span className="text-[#50453b]">支付保障:</span> 🔒 ESCROW
                  STANDARD DEPOSIT
                </p>
                <p>
                  <span className="text-[#50453b]">確認機制:</span> ⚡ RLS
                  ATOMIC LOCK APPROVED
                </p>
              </div>

              <p className="font-mono text-[11px] text-[#8c7355] animate-pulse">
                將於 {counter} 秒內自動跳轉至交易管理追蹤詳情...
              </p>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/profile/user/trading"
                  className="h-11 bg-[#d4a574] hover:bg-[#e8b896] text-[#1A1612] font-sans font-bold text-[13px] rounded-xl flex items-center justify-center transition-colors min-h-11"
                >
                  前往交易管理追蹤
                </Link>
                <Link
                  href="/marketplace"
                  className="h-11 border border-[rgba(237,232,224,0.12)] text-[#d4c4b7] hover:bg-[#39342f] font-sans font-medium text-[13px] rounded-xl flex items-center justify-center transition-colors min-h-11"
                >
                  繼續瀏覽探索市場
                </Link>
              </div>
            </div>
          ) : (
            /* FAIL STATUS VIEW */
            <div className="space-y-6">
              {/* Crimson red blinker */}
              <div className="mx-auto w-16 h-16 rounded-full bg-[rgba(239,68,68,0.15)] flex items-center justify-center border-2 border-[#ef4444]">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>

              <div className="space-y-2">
                <h1 className="font-sans font-bold text-[22px] text-[#eae1da]">
                  交易付款失敗
                </h1>
                <p className="font-sans text-[13px] text-[#d4c4b7]">
                  很抱歉，本次交易下單失敗。可能原因：
                </p>
              </div>

              {/* Error causes */}
              <div className="bg-[#17130f] p-4 rounded-xl border border-[rgba(239,68,68,0.12)] font-mono text-[11px] text-[#ef4444] text-left space-y-1.5">
                <p>🔴 錯誤代碼: [HKCV_STRIPE_DECLINED_402]</p>
                <p>🔴 失敗原因: Stripe 信用卡安全授權失敗，或可用餘額不足。</p>
                <p>
                  🔴 競態提示: 或該卡牌現貨剛剛已被其他玩家優先直接購買截胡。
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/marketplace"
                  className="h-11 bg-[#d4a574] hover:bg-[#e8b896] text-[#1A1612] font-sans font-bold text-[13px] rounded-xl flex items-center justify-center transition-colors min-h-11"
                >
                  返回 Marketplace 重新狙擊
                </Link>
                <button
                  onClick={() => router.back()}
                  className="h-11 border border-[rgba(237,232,224,0.12)] text-[#d4c4b7] hover:bg-[#39342f] font-sans font-medium text-[13px] rounded-xl flex items-center justify-center transition-colors min-h-11"
                >
                  返回重試付款
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
