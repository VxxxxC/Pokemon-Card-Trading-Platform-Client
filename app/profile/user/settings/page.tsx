"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { LogoutModal } from "@/app/components/profile/LogoutModal";

export default function UserSettingsPage() {
  // 🟢 遵守黃金工程標準：使用原生 useSyncExternalStore 封鎖 SSR 水合級聯重繪警告
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#17130f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page flex flex-col text-[#eae1da]">
      {/* 🟢 越獄後自主承載全站看盤外框鏈 */}
      <TopNav />
      <MobileHeader />

      {/* 主線設定跑道容器 */}
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 lg:px-8 pt-4 pb-28 lg:pb-12 space-y-6 animate-fadeIn">
        {/* 精緻航線麵包屑：引流重返帳號總覽 */}
        <div className="font-mono text-[11px] text-[#d4c4b7] flex items-center gap-1.5 select-none">
          <Link
            href="/profile/user"
            className="hover:text-brand transition-colors"
          >
            👤 我的帳號總覽
          </Link>
          <span className="text-text-disabled">/</span>
          <span className="text-text-disabled uppercase">
            Settings 帳戶設定
          </span>
        </div>

        {/* Page Title Header */}
        <div>
          <h2 className="font-sans font-black text-[22px] lg:text-[26px] text-[#eae1da] tracking-tight">
            帳戶安全與設定中心
          </h2>
          <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mt-0.5">
            PROFILE CONFIGURATION & SECURITY GATEWAY
          </p>
        </div>

        {/* 限制最大寬度 (max-w-[640px]) 確保在大螢幕看盤時依然維持洗鍊的金融看板感 */}
        <div className="max-w-[640px] w-full space-y-6">
          {/* ── Personal Info ──────────────────────────────────────────────── */}
          <section
            aria-labelledby="personal-info-heading"
            className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 shadow-xs"
          >
            <h2
              id="personal-info-heading"
              className="font-sans font-bold text-[15px] text-text-primary mb-4"
            >
              個人資料
            </h2>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                {/* TODO: [database] defaultValue="山田レン" is hardcoded — replace with value from `profiles.display_name` for current user */}
                <label
                  htmlFor="display-name"
                  className="font-mono text-[12px] text-text-secondary block mb-1.5"
                >
                  顯示名稱
                </label>
                <input
                  id="display-name"
                  type="text"
                  defaultValue="山田レン"
                  className="w-full h-11 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-sans text-[13.5px] text-text-primary placeholder-text-disabled focus:outline-none focus:border-brand/50 transition-colors"
                />
              </div>
              <div>
                {/* TODO: [database] defaultValue="yamada_ren" is hardcoded — replace with value from `profiles.handle` for current user */}
                <label
                  htmlFor="handle"
                  className="font-mono text-[12px] text-text-secondary block mb-1.5"
                >
                  用戶名 (Handle)
                </label>
                <div className="flex items-center h-11 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden focus-within:border-brand/50 transition-colors">
                  <span className="px-3 font-mono text-[13px] text-text-disabled border-r border-[rgba(237,232,224,0.08)] bg-[#17130f]/30">
                    @
                  </span>
                  <input
                    id="handle"
                    type="text"
                    defaultValue="yamada_ren"
                    className="flex-1 h-full bg-transparent px-3 font-mono text-[13.5px] text-text-primary focus:outline-none"
                  />
                </div>
              </div>
              <div>
                {/* TODO: [database] defaultValue bio is hardcoded — replace with value from `profiles.bio` for current user */}
                <label
                  htmlFor="bio"
                  className="font-mono text-[12px] text-text-secondary block mb-1.5"
                >
                  個人簡介
                </label>
                <textarea
                  id="bio"
                  rows={3}
                  defaultValue="專注 151 系列 SAR 高分鑑定卡，PSA 10 追求者。"
                  className="w-full bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl px-4 py-3 font-sans text-[13.5px] text-text-primary resize-none focus:outline-none focus:border-brand/50 transition-colors"
                />
              </div>
              {/* TODO: [server] "儲存更改" form submit has no handler — must call server action to UPDATE `profiles` table (display_name, handle, bio) for current user */}
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
              {/* TODO: [database] Email "yamada.ren@example.com" and 2FA status "已停用" are hardcoded — replace with values from `auth.users` and `profiles.two_factor_enabled` for current user */}
              {[
                {
                  label: "電郵地址",
                  value: "yamada.ren@example.com",
                  action: "修改",
                },
                { label: "登入密碼", value: "••••••••••••", action: "更改" },
                { label: "兩步驗證", value: "已停用", action: "開啟" },
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
                  {/* TODO: [server] "修改"/"更改"/"開啟" action buttons have no handlers — must open modals/flows: email update via Supabase auth.updateUser(), password reset via sendPasswordRecovery(), 2FA via MFA enrollment API */}
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

          {/* ── KYC — Apply for Merchant ───────────────────────────────────── */}
          <section
            aria-labelledby="kyc-heading"
            className="bg-bg-card rounded-2xl border border-[rgba(212,165,116,0.25)] p-5 shadow-md"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[rgba(212,165,116,0.12)] border border-brand/20 flex items-center justify-center shrink-0 shadow-inner">
                <span className="text-[18px]" aria-hidden="true">
                  🏪
                </span>
              </div>
              <div>
                <h2
                  id="kyc-heading"
                  className="font-sans font-bold text-[15px] text-text-primary"
                >
                  申請成為商戶
                </h2>
                <p className="font-sans text-[12.5px] text-text-secondary mt-0.5 leading-relaxed">
                  通過 KYC 審核後，即可開設店舖並上架卡牌銷售，解鎖 Stripe
                  Connect 金流功能。
                </p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label
                  htmlFor="shop-name"
                  className="font-mono text-[12px] text-text-secondary block mb-1.5"
                >
                  店舖名稱 <span className="text-error font-bold">*</span>
                </label>
                <input
                  id="shop-name"
                  type="text"
                  placeholder="例：レン精選卡牌 / Ren Premium Cards"
                  className="w-full h-11 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-sans text-[13.5px] text-text-primary placeholder-text-disabled focus:outline-none focus:border-brand/50 transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="kyc-doc"
                  className="font-mono text-[12px] text-text-secondary block mb-1.5"
                >
                  身份證明文件 (JPG / PDF){" "}
                  <span className="text-error font-bold">*</span>
                </label>
                {/* TODO: [server] File upload div is decorative — no `<input type="file">` element, no Supabase Storage upload handler. Implement with supabase.storage.from('kyc-docs').upload(userId, file) */}
                <div className="h-24 bg-bg-elevated border border-dashed border-[rgba(237,232,224,0.20)] rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-brand/40 transition-colors group">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#50453b"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="group-hover:stroke-brand transition-colors"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="font-mono text-[11px] text-text-disabled group-hover:text-brand transition-colors">
                    點擊上載或拖放文件
                  </p>
                </div>
                <p className="font-mono text-[10px] text-text-disabled mt-1.5 leading-normal">
                  接受：護照、政府認可身份證、公司商業登記證。審核需 1–3
                  個工作天。
                </p>
              </div>

              <div className="flex items-start gap-2.5 px-3 py-2.5 bg-[rgba(212,165,116,0.06)] rounded-lg border border-[rgba(212,165,116,0.12)]">
                <input
                  id="kyc-agree"
                  type="checkbox"
                  className="mt-0.5 accent-[#d4a574] cursor-pointer"
                />
                <label
                  htmlFor="kyc-agree"
                  className="font-sans text-[12px] text-text-secondary leading-relaxed cursor-pointer"
                >
                  我確認所提交之資料真實無誤，並同意 PokéTrade JP
                  商戶服務條款及平台佣金政策（成交金額之 3–5%）。
                </label>
              </div>

              {/* TODO: [server] "提交 KYC 申請" form submit has no handler — must call server action to INSERT into `kyc_applications` table and update `profiles.role = 'PENDING_MERCHANT'` */}
              <button
                type="submit"
                className="w-full h-11 bg-brand text-[#17130f] font-sans font-bold text-[13.5px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all cursor-pointer shadow-md"
              >
                提交 KYC 申請
              </button>
            </form>

            <p className="font-mono text-[10px] text-text-disabled mt-3 text-center">
              提交後狀態將變更為 PENDING_MERCHANT · 審核完成後電郵通知
            </p>
          </section>

          {/* ── Notifications ─────────────────────────────────────────────── */}
          <section
            aria-labelledby="notif-heading"
            className="bg-bg-card rounded-2xl border border border-[rgba(237,232,224,0.08)] p-5 shadow-xs"
          >
            <h2
              id="notif-heading"
              className="font-sans font-bold text-[15px] text-text-primary mb-4"
            >
              通知設定
            </h2>
            <div className="space-y-3">
              {/* TODO: [database] Notification preferences (`on: true/false`) are hardcoded — replace with user's actual preferences from `notification_settings` table in Supabase */}
              {/* TODO: [server] Toggle buttons have no onClick handlers — must call server action to UPDATE `notification_settings` for current user */}
              {[
                {
                  label: "訂單狀態更新",
                  desc: "Escrow 進度變更即時推送",
                  on: true,
                },
                { label: "每日簽到提醒", desc: "連續簽到里程碑提醒", on: true },
                {
                  label: "市場價格波動",
                  desc: "持有卡牌超出 ±10% 提醒",
                  on: false,
                },
                {
                  label: "新卡上架提醒",
                  desc: "追蹤系列有新商品時通知",
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
      </main>

      {/* 底部全域手機導航吧 */}
      <BottomNav />
    </div>
  );
}
