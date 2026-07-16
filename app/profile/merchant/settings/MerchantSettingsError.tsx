import Link from "next/link";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";

type Props = {
  message: string;
};

export function MerchantSettingsError({ message }: Props) {
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

        <div className="max-w-[640px] w-full">
          <section className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 shadow-xs">
            <h2 className="font-sans font-bold text-[15px] text-text-primary mb-2">
              無法載入店舖設定
            </h2>
            <p className="font-sans text-[13px] text-text-secondary">{message}</p>
            <Link
              href="/profile/merchant"
              className="inline-flex mt-4 h-11 px-6 items-center bg-brand text-[#17130f] font-sans font-bold text-[13.5px] rounded-xl hover:bg-brand-hover transition-all"
            >
              返回商戶總覽
            </Link>
          </section>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
