"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { LogoutModal } from "@/app/components/profile/LogoutModal";

export default function MerchantSettingsPage() {
  // 🟢 遵守黃金工程標準：使用原生 useSyncExternalStore 封鎖 SSR 水合級聯重繪警告
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 精緻航線麵包屑：引流重返商戶總覽 */}
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

      {/* Page Title Header */}
      <div>
        <h2 className="font-sans font-black text-[22px] lg:text-[26px] text-[#eae1da] tracking-tight">
          店舖安全與設定中心
        </h2>
        <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mt-0.5">
          SHOP CONFIGURATION & SECURITY GATEWAY
        </p>
      </div>

      {/* 限制最大寬度 (max-w-[640px]) 確保在大螢幕看盤時依然維持洗鍊的金融看板感 */}
      <div className="max-w-[640px] w-full space-y-6">
        {/* ── Shop Info ──────────────────────────────────────────────────── */}
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
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              {/* TODO: [database] defaultValue="レン精選卡牌" is hardcoded — replace with value from `merchant_profiles.shop_name` for current merchant */}
              <label
                htmlFor="shop-name"
                className="font-mono text-[12px] text-text-secondary block mb-1.5"
              >
                店舖名稱
              </label>
              <input
                id="shop-name"
                type="text"
                defaultValue="レン精選卡牌"
                className="w-full h-11 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-sans text-[13.5px] text-text-primary placeholder-text-disabled focus:outline-none focus:border-brand/50 transition-colors"
              />
            </div>
            <div>
              {/* TODO: [database] defaultValue="ren_tcg_shop" is hardcoded — replace with value from `merchant_profiles.handle` for current merchant */}
              <label
                htmlFor="shop-handle"
                className="font-mono text-[12px] text-text-secondary block mb-1.5"
              >
                店舖帳號 (Handle)
              </label>
              <div className="flex items-center h-11 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden focus-within:border-brand/50 transition-colors">
                <span className="px-3 font-mono text-[13px] text-text-disabled border-r border-[rgba(237,232,224,0.08)] bg-[#17130f]/30">
                  @
                </span>
                <input
                  id="shop-handle"
                  type="text"
                  defaultValue="ren_tcg_shop"
                  className="flex-1 h-full bg-transparent px-3 font-mono text-[13.5px] text-text-primary focus:outline-none"
                />
              </div>
            </div>
            <div>
              {/* TODO: [database] defaultValue bio is hardcoded — replace with value from `merchant_profiles.bio` for current merchant */}
              <label
                htmlFor="shop-bio"
                className="font-mono text-[12px] text-text-secondary block mb-1.5"
              >
                店舖簡介
              </label>
              <textarea
                id="shop-bio"
                rows={3}
                defaultValue="東京秋葉原實體店直營，專營 PSA / BGS 高分鑑定卡，全品現貨即日順豐發貨。"
                className="w-full bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl px-4 py-3 font-sans text-[13.5px] text-text-primary resize-none focus:outline-none focus:border-brand/50 transition-colors"
              />
            </div>
            {/* TODO: [server] "儲存更改" form submit has no handler — must call server action to UPDATE `merchant_profiles` table (shop_name, handle, bio) for current merchant */}
            <button
              type="submit"
              className="h-11 px-6 bg-brand text-[#17130f] font-sans font-bold text-[13.5px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all cursor-pointer shadow-md"
            >
              儲存更改
            </button>
          </form>
        </section>

        {/* ── Security ──────────────────────────────────────────────────── */}
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
            {/* TODO: [database] Email "shop@ren-tcg.jp" is hardcoded — replace with values from `auth.users` for current merchant */}
            {[
              {
                label: "電郵地址",
                value: "shop@ren-tcg.jp",
                action: "修改",
              },
              { label: "登入密碼", value: "••••••••••••", action: "更改" },
            ].map(({ label, value, action }) => (
              <div
                key={label}
                className="flex items-center justify-between px-4 py-3 bg-bg-elevated rounded-xl border border-[rgba(237,232,224,0.08)]"
              >
                <div>
                  <p className="font-mono text-[11px] text-text-secondary mb-0.5">
                    {label}
                  </p>
                  <p className="font-sans text-[13px] text-text-primary font-medium">
                    {value}
                  </p>
                </div>
                {/* TODO: [server] "修改"/"更改" action buttons have no handlers — must open modals/flows: email update via Supabase auth.updateUser(), password reset via sendPasswordRecovery() */}
                <button
                  type="button"
                  className="font-mono text-[11px] text-brand hover:text-brand-hover border border-brand/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {action}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Notifications ─────────────────────────────────────────────── */}
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

        {/* ── Session Control ───────────────────────────────────────────── */}
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
    </div>
  );
}
