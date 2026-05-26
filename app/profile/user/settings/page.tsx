import type { Metadata } from "next";
import { LogoutModal } from "@/app/components/profile/LogoutModal";

export const metadata: Metadata = {
  title: "帳戶設定 — PokéTrade JP",
  description: "修改個人資料、安全設定，以及申請成為商戶 (KYC)",
};

export default function UserSettingsPage() {
  return (
    <div className="max-w-160 space-y-6">
      {/* ── Personal Info ──────────────────────────────────────────────── */}
      <section
        aria-labelledby="personal-info-heading"
        className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5"
      >
        <h2 id="personal-info-heading" className="font-sans font-semibold text-[16px] text-text-primary mb-4">
          個人資料
        </h2>
        <form className="space-y-4">
          <div>
            {/* TODO [database]: defaultValue="山田レン" is hardcoded — replace with value from `profiles.display_name` for current user */}
            <label htmlFor="display-name" className="font-mono text-[12px] text-text-secondary block mb-1.5">
              顯示名稱
            </label>
            <input
              id="display-name"
              type="text"
              defaultValue="山田レン"
              className="w-full h-11 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-sans text-[14px] text-text-primary placeholder-text-disabled focus:outline-none focus:border-brand/50 transition-colors"
            />
          </div>
          <div>
            {/* TODO [database]: defaultValue="yamada_ren" is hardcoded — replace with value from `profiles.handle` for current user */}
            <label htmlFor="handle" className="font-mono text-[12px] text-text-secondary block mb-1.5">
              用戶名 (Handle)
            </label>
            <div className="flex items-center h-11 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden">
              <span className="px-3 font-mono text-[13px] text-text-disabled border-r border-[rgba(237,232,224,0.08)]">@</span>
              <input
                id="handle"
                type="text"
                defaultValue="yamada_ren"
                className="flex-1 h-full bg-transparent px-3 font-mono text-[14px] text-text-primary focus:outline-none"
              />
            </div>
          </div>
          <div>
            {/* TODO [database]: defaultValue bio is hardcoded — replace with value from `profiles.bio` for current user */}
            <label htmlFor="bio" className="font-mono text-[12px] text-text-secondary block mb-1.5">
              個人簡介
            </label>
            <textarea
              id="bio"
              rows={3}
              defaultValue="專注 151 系列 SAR 高分鑑定卡，PSA 10 追求者。"
              className="w-full bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl px-4 py-3 font-sans text-[14px] text-text-primary resize-none focus:outline-none focus:border-brand/50 transition-colors"
            />
          </div>
          {/* TODO [server]: "儲存更改" form submit has no handler — must call server action to UPDATE `profiles` table (display_name, handle, bio) for current user */}
          <button
            type="submit"
            className="h-11 px-6 bg-brand text-[#17130f] font-sans font-semibold text-[14px] rounded-xl hover:bg-brand-hover active:scale-[0.98] active:translate-y-px transition-transform"
          >
            儲存更改
          </button>
        </form>
      </section>

      {/* ── Security ──────────────────────────────────────────────────── */}
      <section
        aria-labelledby="security-heading"
        className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5"
      >
        <h2 id="security-heading" className="font-sans font-semibold text-[16px] text-text-primary mb-4">
          安全設定
        </h2>
        <div className="space-y-3">
          {/* TODO [database]: Email "yamada.ren@example.com" and 2FA status "已停用" are hardcoded — replace with values from `auth.users` and `profiles.two_factor_enabled` for current user */}
          {[
            { label: "電郵地址",   value: "yamada.ren@example.com", action: "修改" },
            { label: "登入密碼",   value: "••••••••••••",            action: "更改" },
            { label: "兩步驗證",   value: "已停用",                   action: "開啟" },
          ].map(({ label, value, action }) => (
            <div
              key={label}
              className="flex items-center justify-between px-4 py-3 bg-bg-elevated rounded-xl border border-[rgba(237,232,224,0.08)]"
            >
              <div>
                <p className="font-mono text-[11px] text-text-secondary mb-0.5">{label}</p>
                <p className="font-sans text-[13px] text-text-primary">{value}</p>
              </div>
              {/* TODO [server]: "修改"/"更改"/"開啟" action buttons have no handlers — must open modals/flows: email update via Supabase auth.updateUser(), password reset via sendPasswordRecovery(), 2FA via MFA enrollment API */}
              <button
                type="button"
                className="font-mono text-[12px] text-brand hover:text-brand-hover border border-brand/30 px-2.5 py-1 rounded-lg transition-colors"
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
        className="bg-bg-card rounded-2xl border border-[rgba(212,165,116,0.25)] p-5"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[rgba(212,165,116,0.12)] border border-brand/20 flex items-center justify-center shrink-0">
            <span className="text-[18px]" aria-hidden="true">🏪</span>
          </div>
          <div>
            <h2 id="kyc-heading" className="font-sans font-semibold text-[16px] text-text-primary">
              申請成為商戶
            </h2>
            <p className="font-sans text-[13px] text-text-secondary mt-0.5">
              通過 KYC 審核後，即可開設店舖並上架卡牌銷售，解鎖 Stripe Connect 金流功能。
            </p>
          </div>
        </div>

        <form className="space-y-4">
          <div>
            <label htmlFor="shop-name" className="font-mono text-[12px] text-text-secondary block mb-1.5">
              店舖名稱 <span className="text-warning">*</span>
            </label>
            <input
              id="shop-name"
              type="text"
              placeholder="例：レン精選卡牌 / Ren Premium Cards"
              className="w-full h-11 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-sans text-[14px] text-text-primary placeholder-text-disabled focus:outline-none focus:border-brand/50 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="kyc-doc" className="font-mono text-[12px] text-text-secondary block mb-1.5">
              身份證明文件 (JPG / PDF) <span className="text-warning">*</span>
            </label>
            {/* TODO [server]: File upload div is decorative — no `<input type="file">` element, no Supabase Storage upload handler. Implement with supabase.storage.from('kyc-docs').upload(userId, file) */}
          <div className="h-24 bg-bg-elevated border border-dashed border-[rgba(237,232,224,0.20)] rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-brand/40 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#50453b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="font-mono text-[11px] text-text-disabled">點擊上載或拖放文件</p>
            </div>
            <p className="font-mono text-[10px] text-text-disabled mt-1.5">
              接受：護照、政府認可身份證、公司商業登記證。審核需 1–3 個工作天。
            </p>
          </div>

          <div className="flex items-start gap-2.5 px-3 py-2.5 bg-[rgba(212,165,116,0.06)] rounded-lg">
            <input id="kyc-agree" type="checkbox" className="mt-0.5 accent-[#d4a574]" />
            <label htmlFor="kyc-agree" className="font-sans text-[12px] text-text-secondary leading-relaxed">
              我確認所提交之資料真實無誤，並同意 PokéTrade JP 商戶服務條款及平台佣金政策（成交金額之 3–5%）。
            </label>
          </div>

          {/* TODO [server]: "提交 KYC 申請" form submit has no handler — must call server action to INSERT into `kyc_applications` table and update `profiles.role = 'PENDING_MERCHANT'` */}
          <button
            type="submit"
            className="w-full h-11 bg-brand text-[#17130f] font-sans font-semibold text-[14px] rounded-xl hover:bg-brand-hover active:scale-[0.98] active:translate-y-px transition-transform"
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
        className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5"
      >
        <h2 id="notif-heading" className="font-sans font-semibold text-[16px] text-text-primary mb-4">
          通知設定
        </h2>
        <div className="space-y-3">
          {/* TODO [database]: Notification preferences (`on: true/false`) are hardcoded — replace with user's actual preferences from `notification_settings` table in Supabase */}
          {/* TODO [server]: Toggle buttons have no onClick handlers — must call server action to UPDATE `notification_settings` for current user */}
          {[
            { label: "訂單狀態更新",    desc: "Escrow 進度變更即時推送", on: true  },
            { label: "每日簽到提醒",    desc: "連續簽到里程碑提醒",       on: true  },
            { label: "市場價格波動",    desc: "持有卡牌超出 ±10% 提醒",   on: false },
            { label: "新卡上架提醒",    desc: "追蹤系列有新商品時通知",   on: false },
          ].map(({ label, desc, on }) => (
            <div key={label} className="flex items-center justify-between px-4 py-3 bg-bg-elevated rounded-xl border border-[rgba(237,232,224,0.08)]">
              <div>
                <p className="font-sans text-[13px] font-medium text-text-primary">{label}</p>
                <p className="font-mono text-[11px] text-text-secondary">{desc}</p>
              </div>
              <div className={`w-10 h-5 rounded-full flex items-center transition-colors ${on ? "bg-brand justify-end pr-0.5" : "bg-bg-hover justify-start pl-0.5"}`}>
                <div className="w-4 h-4 rounded-full bg-[#17130f] shadow" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Session Control ───────────────────────────────────────────── */}
      <section
        aria-labelledby="session-ctrl"
        className="bg-bg-card border border-[rgba(237,232,224,0.08)] rounded-2xl p-4"
      >
        <h2 id="session-ctrl" className="font-mono text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-3">
          Session Control
        </h2>
        <LogoutModal />
      </section>
    </div>
  );
}
