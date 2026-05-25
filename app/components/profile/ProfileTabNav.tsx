"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface TabItem {
  href: string;
  label: string;
  icon: string;
}

interface ProfileTabNavProps {
  tabs: TabItem[];
}

export function ProfileTabNav({ tabs }: ProfileTabNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-0.5 overflow-x-auto overflow-y-hidden scrollbar-none border-b border-[rgba(237,232,224,0.08)] mb-6"
      aria-label="個人頁面導航"
    >
      {tabs.map(({ href, label, icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 shrink-0 px-3.5 py-2.5 font-mono text-[12px] font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? "text-brand border-brand"
                : "text-text-secondary border-transparent hover:text-text-primary"
            }`}
          >
            <span aria-hidden="true">{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
