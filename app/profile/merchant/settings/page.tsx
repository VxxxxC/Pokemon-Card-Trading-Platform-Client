import type { Metadata } from "next";
import { LogoutModal } from "@/app/components/profile/LogoutModal";

export const metadata: Metadata = {
  title: "店舖設定 — PokéTrade JP",
  description: "管理店舖資料、Stripe 金流、運費設定及營業狀態",
};

export default function MerchantSettingsPage() {
  return (
    <div className="max-w-160 space-y-6">
      
      {/* Shop Info Section */}
      <section aria-labelledby="shop-info-heading" className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5">
        <h2 id="shop-info-heading" className="font-sans font-semibold text-[16px] text-text-primary mb-4">店舖資料</h2>
        <form className="space-y-4">
          <div>
            <label htmlFor="shop-name" className="font-mono text-[12px] text-text-secondary block mb-1.5">店舖名稱</label>
            <input id="shop-name" type="text" defaultValue="レン精選卡牌" className="w-full h-11 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-sans text-[14px] text-text-primary placeholder-text-disabled focus:outline-none focus:border-brand/50 transition-colors" />
          </div>
          <button type="submit" className="h-11 px-6 bg-brand text-[#17130f] font-sans font-semibold text-[14px] rounded-xl hover:bg-brand-hover active:scale-[0.98] active:translate-y-px transition-transform cursor-pointer">儲存店舖資料</button>
        </form>
      </section>

      {/* Stripe Connect Express Payouts Section */}
      <section aria-labelledby="stripe-express-heading" className="bg-[#26211C] rounded-2xl border border-[#d4a574]/30 p-5 space-y-4 shadow-[0_2px_12px_rgba(212,165,116,0.05)]">
        <div className="flex items-center gap-2">
          <span className="text-[20px]" aria-hidden="true">💳</span>
          <h2 id="stripe-express-heading" className="font-sans font-semibold text-[16px] text-[#eae1da]">
            Stripe Connect Express 收款專區
          </h2>
        </div>
        
        <p className="font-sans text-[13px] text-[#d4c4b7] leading-relaxed">
          為了保障 C2C 實體交易資金安全，PokéTrade JP 整合了 **Stripe Connect Express** 自動分賬收款系統。開啟綁定後，平台買家釋放款項時，您的銷售所得（扣除定額服務費）將自動結算並安全劃撥至您的銀行賬戶中。
        </p>

        <div className="bg-[#17130f] p-4 rounded-xl border border-[rgba(237,232,224,0.04)] font-mono text-[11px] text-[#d4c4b7] space-y-1">
          <p><span className="text-[#50453b]">當前商戶權限:</span> ✅ 已啟用賣家權限 (Merchant Role)</p>
          <p><span className="text-[#50453b]">金流提現狀態:</span> ❌ 尚未完成收款帳戶連結</p>
        </div>

        <button
          type="button"
          className="w-full h-11 bg-[#d4a574] hover:bg-[#e8b896] text-[#1A1612] font-sans font-bold text-[13px] rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform min-h-[44px] cursor-pointer"
        >
          ⚡ 連結 Stripe 帳戶以啟用自動分賬收款
        </button>
      </section>

      {/* Session Control Section */}
      <section aria-labelledby="session-ctrl" className="bg-bg-card border border-[rgba(237,232,224,0.08)] rounded-2xl p-4">
        <h2 id="session-ctrl" className="font-mono text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-3">Session Control</h2>
        <LogoutModal />
      </section>
      
    </div>
  );
}