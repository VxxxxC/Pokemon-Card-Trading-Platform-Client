import Link from "next/link";

const navLinks = [
  { href: "/", label: "首頁" },
  { href: "/search", label: "搜尋" },
  { href: "/portfolio", label: "收藏集" },
  { href: "/market", label: "市場" },
];

export function TopNav({ activePath = "/" }: { activePath?: string }) {
  return (
    <header className="hidden lg:flex sticky top-0 z-50 w-full h-16 bg-[#1A1612] border-b border-[rgba(237,232,224,0.08)]">
      <div className="max-w-[1400px] mx-auto w-full px-8 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-sans font-bold text-[20px] text-text-primary tracking-tight shrink-0"
        >
          PokéTrade <span className="text-brand">JP</span>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-8">
          {navLinks.map(({ href, label }) => {
            const isActive = activePath === href;
            return (
              <Link
                key={href}
                href={href}
                className={`font-sans text-sm font-medium transition-colors ${
                  isActive
                    ? "text-text-primary"
                    : "text-text-secondary hover:text-brand"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button className="h-9 px-4 font-sans text-sm font-medium text-brand border border-[rgba(237,232,224,0.12)] rounded-[8px] hover:bg-bg-elevated active:scale-[0.98] active:translate-y-[1px] transition-transform">
            登入
          </button>
          <button className="h-9 px-4 font-sans text-sm font-medium text-[#17130f] bg-brand rounded-[8px] hover:bg-brand-hover active:scale-[0.98] active:translate-y-[1px] transition-transform">
            免費註冊
          </button>
        </div>
      </div>
    </header>
  );
}
