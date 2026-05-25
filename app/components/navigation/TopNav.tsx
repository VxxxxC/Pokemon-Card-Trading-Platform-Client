"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "首頁" },
  { href: "/search", label: "搜尋" },
  { href: "/market", label: "市場" },
  { href: "/profile", label: "會員中心" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="hidden lg:flex sticky top-0 z-50 w-full h-16 bg-[#1A1612] border-b border-[rgba(237,232,224,0.08)]">
      <div className="max-w-350 mx-auto w-full px-8 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-sans font-bold text-[20px] text-text-primary tracking-tight shrink-0"
        >
          PokéTrade <span className="text-brand">JP</span>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, label }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`font-sans text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[rgba(212,165,116,0.12)] text-brand"
                    : "text-text-secondary hover:text-brand hover:bg-[rgba(212,165,116,0.06)]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* CTA Button */}
        <div className="shrink-0">
          <Link
            href="/auth"
            className="h-9 px-4 font-sans text-sm font-medium text-[#17130f] bg-brand rounded-lg hover:bg-brand-hover active:scale-[0.98] active:translate-y-px transition-transform inline-flex items-center justify-center"
          >
            登入 / 註冊
          </Link>
        </div>
      </div>
    </header>
  );
}
