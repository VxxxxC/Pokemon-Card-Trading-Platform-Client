import type { Metadata } from "next";
import { LogoutModal } from "@/app/components/profile/LogoutModal";

export const metadata: Metadata = {
  title: "店舖設定 — PokéTrade JP",
  description: "管理店舖資料、Stripe 金流、運費設定及營業狀態",
};

export default function MerchantSettingsPage() {
  return (
    <div className="max-w-160 space-y-6">
      <section aria-labelledby="shop-info-heading" className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5">
        <h2 id="shop-info-heading" className="font-sans font-semibold text-[16px] text-text-primary mb-4">店舖資料</h2>
        <form className="space-y-4">
          <div>
            {/* TODO [MOCK DATA]: defaultValue="レン精選卡牌" is hardcoded — replace with value from `merchant_profiles.shop_name` queried for current user */}
            <label htmlFor="shop-name" className="font-mono text-[12px] text-text-secondary block mb-1.5">店舖名稱</label>
            <input id="shop-name" type="text" defaultValue="レン精選卡牌" className="w-full h-11 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-sans text-[14px] text-text-primary placeholder-text-disabled focus:outline-none focus:border-brand/50 transition-colors" />
          </div>
          {/* TODO [BACKEND]: "儲存店舖資料" form submit has no handler — must call server action to UPDATE `merchant_profiles.shop_name` for current user */}
          <button type="submit" className="h-11 px-6 bg-brand text-[#17130f] font-sans font-semibold text-[14px] rounded-xl hover:bg-brand-hover active:scale-[0.98] active:translate-y-px transition-transform">儲存店舖資料</button>
        </form>
      </section>
      <section aria-labelledby="session-ctrl" className="bg-bg-card border border-[rgba(237,232,224,0.08)] rounded-2xl p-4">
        <h2 id="session-ctrl" className="font-mono text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-3">Session Control</h2>
        <LogoutModal />
      </section>
    </div>
  );
}