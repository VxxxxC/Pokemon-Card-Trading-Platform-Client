import Link from "next/link";
import { FooterMemberCenterLinks } from "@/app/components/navigation/FooterMemberCenterLinks";

// TODO: [server] Footer links (customer service, FAQ) should be fetched from CMS or Supabase `site_config` table

const footerSections = [
  {
    title: "交易服務",
    links: [
      { label: "市場瀏覽", href: "/marketplace" },
      { label: "搜尋卡牌", href: "/search" },
      { label: "鑑定託管流程", href: "/terms#escrow" },
      { label: "賣家入駐", href: "/auth?role=merchant" },
    ],
  },
  {
    title: "關於平台",
    links: [
      { label: "關於 HKcardvault", href: "#" },
      { label: "服務條款", href: "/terms" },
      { label: "私隱政策", href: "/privacy" },
      { label: "聯絡我們", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="w-full bg-bg-shell border-t border-[rgba(237,232,224,0.08)] mt-auto">
      <div className="max-w-[1100px] mx-auto px-4 lg:px-8 py-10">
        {/* Main footer grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-1 flex flex-col items-start">
            <Link
              href="/"
              className="font-sans font-bold text-[18px] text-text-primary tracking-tight inline-block mb-3"
            >
              HKCardVault <span className="text-brand">JP</span>
            </Link>
            <p className="font-sans text-[12px] text-text-secondary leading-relaxed max-w-[220px]">
              香港首個日版寶可夢卡牌專業交易平台。鑑定託管・安心交易・全港免運。
            </p>

            {/* 🟢 頂級優化：大幅放大 Web View 網頁端按鈕體積，升格為中大型黑金控局 Button */}
            <Link
              href="/auth?role=merchant"
              className="inline-flex items-center justify-center px-5 h-10 md:px-6 md:h-12 mt-4 bg-brand hover:bg-brand-hover text-[#17130f] font-sans text-[13px] md:text-[14.5px] font-black rounded-xl transition-colors shadow-[0_6px_20px_rgba(212,165,116,0.22)] active:scale-[0.98] select-none cursor-pointer focus:outline-none"
            >
              🏪 申請商戶入駐
            </Link>
          </div>

          <div>
            <h3 className="font-sans font-semibold text-[13px] text-text-primary mb-3">
              會員中心
            </h3>
            <ul className="space-y-2">
              <FooterMemberCenterLinks />
            </ul>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-sans font-semibold text-[13px] text-text-primary mb-3">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-sans text-[12px] text-text-secondary hover:text-brand transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-[rgba(237,232,224,0.08)] pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="font-sans text-[11px] text-text-disabled">
              © {new Date().getFullYear()} HKCardVault (HKcardvault). All
              rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] text-text-disabled">
                HKD 港幣結算
              </span>
              <span className="font-mono text-[10px] text-text-disabled">
                Powered by Stripe Connect
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
