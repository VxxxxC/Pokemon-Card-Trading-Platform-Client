import Link from "next/link";

const navLinks = [
  { href: "/", label: "首頁" },
  { href: "/search", label: "搜尋" },
  { href: "/portfolio", label: "收藏集" },
  { href: "/market", label: "市場" },
];

export function TopNav({ activePath = "/" }: { activePath?: string }) {
  return (
    <header className="hidden lg:flex sticky top-0 z-50 w-full h-16 bg-white border-b border-[rgba(226,232,240,0.6)]">
      <div className="max-w-[1400px] mx-auto w-full px-8 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-sans font-bold text-[20px] text-[#202124] tracking-tight shrink-0"
        >
          PokéTrade <span className="text-[#2563EB]">JP</span>
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
                    ? "text-[#202124]"
                    : "text-[#5F6368] hover:text-[#2563EB]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button className="h-9 px-4 font-sans text-sm font-medium text-[#2563EB] border border-[rgba(226,232,240,0.6)] rounded-[8px] hover:bg-[#F8F9FA] active:scale-[0.98] active:translate-y-[1px] transition-transform">
            登入
          </button>
          <button className="h-9 px-4 font-sans text-sm font-medium text-white bg-[#2563EB] rounded-[8px] hover:bg-[#1d4ed8] active:scale-[0.98] active:translate-y-[1px] transition-transform">
            免費註冊
          </button>
        </div>
      </div>
    </header>
  );
}
