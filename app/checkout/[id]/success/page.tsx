"use client";

import { useEffect, useState, useSyncExternalStore, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import {
  getCheckoutPaymentStatus,
  loadCheckoutSession,
} from "@/app/actions/checkout";
import type { CheckoutSession } from "@/lib/checkout/types";

const ESCROW_POLL_INTERVAL_MS = 2000;
const ESCROW_POLL_MAX_ATTEMPTS = 8;

interface SuccessPageProps {
  params: Promise<{ id: string }>;
}

export default function CheckoutSuccessPage({ params }: SuccessPageProps) {
  const resolvedParams = use(params);
  const paramsId = resolvedParams.id;

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      const sessionResult = await loadCheckoutSession(paramsId);
      if (cancelled) {
        return;
      }

      if (!sessionResult.success) {
        setLoadError(sessionResult.error);
        setIsLoading(false);
        return;
      }

      setSession(sessionResult.data);

      const statusResult = await getCheckoutPaymentStatus(paramsId);
      if (cancelled) {
        return;
      }

      if (statusResult.success) {
        setIsPaid(statusResult.data.isPaid);
      }

      setIsLoading(false);
      attempts += 1;

      const stillWaiting =
        statusResult.success &&
        !statusResult.data.isPaid &&
        attempts < ESCROW_POLL_MAX_ATTEMPTS;

      if (stillWaiting) {
        timer = setTimeout(poll, ESCROW_POLL_INTERVAL_MS);
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [paramsId]);

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-[#17130f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#17130f] text-[#eae1da] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-sans text-[14px] text-[#d4c4b7]">
          {loadError ?? "找不到此訂單"}
        </p>
        <Link
          href="/profile/user/trading"
          className="h-11 px-5 rounded-xl bg-brand text-[#1A1612] font-sans font-bold text-[13.5px] flex items-center focus:outline-none"
        >
          前往交易管理
        </Link>
      </div>
    );
  }

  const { product, counterparty } = session;
  const rarity = product.displayId ?? product.cardNumber ?? "—";
  const orderReference = session.orderNumber ?? session.orderId;
  const isMerchant = session.orderKind === "merchant";
  const isAuthVariant =
    session.variant === "merchant_auth" || session.variant === "member_auth";

  return (
    <div className="min-h-screen bg-[#17130f] text-[#eae1da] p-4 lg:p-8 flex flex-col justify-center items-center">
      <div className="max-w-[650px] w-full space-y-6 pb-24 pt-4 sm:pt-12 animate-fadeIn">
        <section className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center space-y-5 shadow-xl">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-brand/10 rounded-full blur-xl scale-150 animate-pulse" />
            <div className="w-16 h-16 rounded-full bg-brand/15 border border-brand/30 flex items-center justify-center text-brand relative z-10">
              <ShieldCheck className="w-9 h-9 stroke-[1.5]" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-sans font-black text-[22px] sm:text-[26px] text-[#eae1da] leading-tight tracking-tight">
              {isPaid ? "🎉 交易成功設立" : "⏳ 付款處理中"}
            </h1>
            <p className="font-sans text-[13px] text-text-secondary">
              {isPaid
                ? isMerchant
                  ? "此筆 B2C 專業商戶交易已建立，資金已由平台託管鎖定"
                  : "平台已託管款項，請依指引將卡牌寄往平台倉庫"
                : "已收到付款指令，正在等待金流確認並鎖定託管，稍後可於交易管理查看"}
            </p>
          </div>

          <div className="bg-[#17130f] border border-white/5 rounded-lg px-4 py-2 flex flex-col sm:flex-row items-center gap-2 select-none w-full justify-center">
            <span className="font-mono text-[10px] text-text-primary uppercase tracking-wider text-center sm:text-left">
              交易結單號碼 (Order ID):
            </span>
            <code className="font-mono font-bold text-[11px] text-brand tracking-tight text-center sm:text-left">
              {orderReference}
            </code>
          </div>
        </section>

        <section className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="font-sans font-bold text-[14.5px] text-[#eae1da] border-b border-white/5 pb-2 uppercase tracking-wide flex items-center gap-1.5">
            <span>🧾 訂單資產明細收條</span>
          </h2>

          <div className="flex gap-4 items-center bg-[#17130f] p-3 rounded-xl border border-white/5">
            <div className="relative w-12 h-16 rounded overflow-hidden shrink-0 border border-white/10">
              <Image
                src={product.imageUrl}
                alt={product.cardName}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="font-sans font-bold text-[13.5px] text-[#eae1da] truncate">
                {product.cardName}
              </h3>
              <p className="font-mono text-[10px] text-text-disabled uppercase">
                {product.setCode} · {rarity}
              </p>
              <div className="inline-flex font-mono text-[9px] text-brand bg-brand/10 border border-brand/20 px-1.5 py-0.5 rounded leading-none">
                {product.gradeLabel}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1 text-[13px] font-sans">
            <div className="flex justify-between items-center py-1.5 border-b border-white/[0.03]">
              <span className="text-[#d4c4b7]">賣方</span>
              <span className="font-semibold text-[#eae1da]">
                {counterparty.name}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-white/[0.03]">
              <span className="text-[#d4c4b7]">交易結算價</span>
              <span className="font-mono font-bold text-brand">
                HK$ {session.pricing.totalAmount.toLocaleString("en-HK")}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-white/[0.03]">
              <span className="text-[#d4c4b7]">平台防偽鑑定</span>
              <span className="text-success font-medium">
                {isAuthVariant
                  ? "已啟用鑑定驗證服務"
                  : "未加購鑑定服務"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-[#d4c4b7]">交易性質</span>
              <span className="font-medium text-[#eae1da]">
                {isMerchant ? "B2C 專業商戶" : "C2C 鑑定託管"}
              </span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link
            href={`/profile/user/orderDetail/${session.orderId}`}
            className="bg-brand text-[#1A1612] h-11 w-full font-bold text-[13.5px] rounded-xl flex items-center justify-center hover:bg-[#e8b896] transition-all active:scale-[0.98] cursor-pointer shadow-md focus:outline-none"
          >
            查看訂單
          </Link>
          <Link
            href="/profile/user/trading"
            className="bg-[#17130f] border border-white/10 text-text-secondary h-11 w-full font-bold text-[13.5px] rounded-xl flex items-center justify-center hover:border-brand/30 hover:text-brand transition-all active:scale-[0.98] cursor-pointer focus:outline-none"
          >
            ⚡ 進入交易管理中心
          </Link>
        </div>
      </div>
    </div>
  );
}
