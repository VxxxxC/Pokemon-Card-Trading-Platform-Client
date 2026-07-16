"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { LogoutModal } from "@/app/components/profile/LogoutModal";
import {
  updateMerchantShopProfile,
  type MerchantSettingsData,
} from "@/app/actions/merchant-settings";
import type { MerchantShopFormErrors } from "@/lib/merchant/validation";

type Props = {
  initialData: MerchantSettingsData;
};

function fieldClass(hasError: boolean): string {
  return [
    "w-full bg-bg-elevated border rounded-xl font-sans text-[13.5px] text-text-primary placeholder-text-disabled focus:outline-none transition-colors",
    hasError
      ? "border-warning focus:border-warning"
      : "border-[rgba(237,232,224,0.12)] focus:border-brand/50",
  ].join(" ");
}

export function MerchantSettingsClient({ initialData }: Props) {
  const router = useRouter();
  const [errors, formAction, isPending] = useActionState<
    MerchantShopFormErrors | null,
    FormData
  >(updateMerchantShopProfile, null);

  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending) {
      if (errors === null) {
        toast.success("店舖資料已更新");
        router.refresh();
      } else if (errors.shopHandle) {
        toast.error(errors.shopHandle);
      } else if (errors.shopName) {
        toast.error(errors.shopName);
      } else if (errors.form) {
        toast.error(errors.form);
      }
    }
    wasPending.current = isPending;
  }, [isPending, errors, router]);

  return (
    <div className="min-h-dvh bg-bg-page flex flex-col">
      <TopNav />
      <MobileHeader />
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 lg:px-8 pt-4 pb-28 lg:pb-12 space-y-6 animate-fadeIn">
        <div className="font-mono text-[11px] text-[#d4c4b7] flex items-center gap-1.5 select-none">
          <Link
            href="/profile/merchant"
            className="hover:text-brand transition-colors"
          >
            🏪 商戶後台總覽
          </Link>
          <span className="text-text-disabled">/</span>
          <span className="text-text-disabled uppercase">
            Settings 店舖設定
          </span>
        </div>

        <div>
          <h2 className="font-sans font-black text-[22px] lg:text-[26px] text-[#eae1da] tracking-tight">
            店舖安全與設定中心
          </h2>
          <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mt-0.5">
            SHOP CONFIGURATION & SECURITY GATEWAY
          </p>
        </div>

        <div className="max-w-[640px] w-full space-y-6">
          <section
            aria-labelledby="shop-info-heading"
            className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 shadow-xs"
          >
            <h2
              id="shop-info-heading"
              className="font-sans font-bold text-[15px] text-text-primary mb-4"
            >
              店舖資料
            </h2>
            <form action={formAction} className="space-y-4">
              {errors?.form && (
                <p className="font-sans text-[12px] text-warning">{errors.form}</p>
              )}
              <div>
                <label
                  htmlFor="shop-name"
                  className="font-mono text-[12px] text-text-secondary block mb-1.5"
                >
                  店舖名稱
                </label>
                <input
                  id="shop-name"
                  name="shopName"
                  type="text"
                  required
                  defaultValue={initialData.shopName}
                  key={`shopName-${initialData.shopName}`}
                  className={`${fieldClass(!!errors?.shopName)} h-11 px-4`}
                />
                {errors?.shopName && (
                  <p className="mt-1 font-sans text-[12px] text-warning">
                    {errors.shopName}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="shop-handle"
                  className="font-mono text-[12px] text-text-secondary block mb-1.5"
                >
                  店舖帳號 (Handle)
                </label>
                <div
                  className={`flex items-center h-11 bg-bg-elevated border rounded-xl overflow-hidden transition-colors ${errors?.shopHandle ? "border-warning" : "border-[rgba(237,232,224,0.12)] focus-within:border-brand/50"}`}
                >
                  <span className="px-3 font-mono text-[13px] text-text-disabled border-r border-[rgba(237,232,224,0.08)] bg-[#17130f]/30">
                    @
                  </span>
                  <input
                    id="shop-handle"
                    name="shopHandle"
                    type="text"
                    defaultValue={initialData.shopHandle}
                    key={`shopHandle-${initialData.shopHandle}`}
                    placeholder="選填"
                    className="flex-1 h-full bg-transparent px-3 font-mono text-[13.5px] text-text-primary focus:outline-none"
                  />
                </div>
                {errors?.shopHandle && (
                  <p className="mt-1 font-sans text-[12px] text-warning">
                    {errors.shopHandle}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="shop-bio"
                  className="font-mono text-[12px] text-text-secondary block mb-1.5"
                >
                  店舖簡介
                </label>
                <textarea
                  id="shop-bio"
                  name="shopDescription"
                  rows={3}
                  defaultValue={initialData.shopDescription}
                  key={`shopDescription-${initialData.shopDescription}`}
                  className={`${fieldClass(!!errors?.shopDescription)} px-4 py-3 resize-none`}
                />
                {errors?.shopDescription && (
                  <p className="mt-1 font-sans text-[12px] text-warning">
                    {errors.shopDescription}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="h-11 px-6 bg-brand text-[#17130f] font-sans font-bold text-[13.5px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "儲存中…" : "儲存更改"}
              </button>
            </form>
          </section>

          <section
            aria-labelledby="security-heading"
            className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 shadow-xs"
          >
            <h2
              id="security-heading"
              className="font-sans font-bold text-[15px] text-text-primary mb-4"
            >
              安全設定
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between px-4 py-3 bg-bg-elevated rounded-xl border border-[rgba(237,232,224,0.08)]">
                <div>
                  <p className="font-mono text-[11px] text-text-secondary mb-0.5">
                    電郵地址
                  </p>
                  <p className="font-sans text-[13px] text-text-primary font-medium break-all">
                    {initialData.email || "—"}
                  </p>
                </div>
                <button
                  type="button"
                  className="font-mono text-[11px] text-brand hover:text-brand-hover border border-brand/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  修改
                </button>
              </div>
              <div className="flex items-center justify-between px-4 py-3 bg-bg-elevated rounded-xl border border-[rgba(237,232,224,0.08)]">
                <div>
                  <p className="font-mono text-[11px] text-text-secondary mb-0.5">
                    登入密碼
                  </p>
                  <p className="font-sans text-[13px] text-text-primary font-medium">
                    ••••••••••••
                  </p>
                </div>
                <Link
                  href="/auth/reset-password"
                  className="font-mono text-[11px] text-brand hover:text-brand-hover border border-brand/30 px-2.5 py-1 rounded-lg transition-colors"
                >
                  更改
                </Link>
              </div>
            </div>
          </section>

          <section
            aria-labelledby="notif-heading"
            className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 shadow-xs"
          >
            <h2
              id="notif-heading"
              className="font-sans font-bold text-[15px] text-text-primary mb-4"
            >
              通知設定
            </h2>
            <div className="space-y-3">
              {/* TODO: [database] Notification preferences (`on: true/false`) are hardcoded — replace with merchant's actual preferences from `notification_settings` table in Supabase */}
              {/* TODO: [server] Toggle buttons have no onClick handlers — must call server action to UPDATE `notification_settings` for current merchant */}
              {[
                {
                  label: "新訂單通知",
                  desc: "買家下單即時推送提醒",
                  on: true,
                },
                { label: "出貨期限提醒", desc: "48 小時內未發貨警示", on: true },
                {
                  label: "商品價格波動",
                  desc: "上架商品市價超出 ±10% 提醒",
                  on: false,
                },
                {
                  label: "平台公告",
                  desc: "佣金費率與功能更新通知",
                  on: false,
                },
              ].map(({ label, desc, on }) => (
                <div
                  key={label}
                  className="flex items-center justify-between px-4 py-3 bg-bg-elevated rounded-xl border border-[rgba(237,232,224,0.08)] hover:border-[rgba(237,232,224,0.15)] transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-sans text-[13px] font-bold text-text-primary">
                      {label}
                    </p>
                    <p className="font-mono text-[11px] text-text-secondary truncate">
                      {desc}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`切換 ${label} 通知狀態`}
                    className={`w-10 h-5 rounded-full flex items-center transition-colors shrink-0 cursor-pointer ${on ? "bg-brand justify-end pr-0.5" : "bg-bg-hover justify-start pl-0.5"}`}
                  >
                    <div className="w-4 h-4 rounded-full bg-[#17130f] shadow" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="session-ctrl"
            className="bg-bg-card border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 shadow-sm"
          >
            <h2
              id="session-ctrl"
              className="font-mono text-[10.5px] font-bold text-text-disabled uppercase tracking-wider mb-3"
            >
              Session Control
            </h2>
            <LogoutModal />
          </section>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
