"use client";

import Link from "next/link";
import { useIsMemberPersonaActive } from "@/app/lib/hooks/useIsMemberPersonaActive";

const memberCenterLinks = [
  { label: "我的收藏", href: "/profile/user/collection", memberOnly: true },
  { label: "交易管理", href: "/profile/user/trading", memberOnly: false },
  { label: "帳戶設定", href: "/profile/user/settings", memberOnly: false },
  { label: "商家後台", href: "/profile/merchant", memberOnly: false },
] as const;

export function FooterMemberCenterLinks() {
  const isMemberPersonaActive = useIsMemberPersonaActive();

  return (
    <>
      {memberCenterLinks
        .filter((link) => isMemberPersonaActive || !link.memberOnly)
        .map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="font-sans text-[12px] text-text-secondary hover:text-brand transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
    </>
  );
}
