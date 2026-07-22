"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "數據總覽", icon: "📊" },
  { href: "/admin/payouts", label: "財務與結算管控台", icon: "💰" },
  { href: "/admin/merchants", label: "商戶與 KYC 審查", icon: "🪪" },
  { href: "/admin/disputes", label: "舉報與爭議仲裁", icon: "⚖️" },
  { href: "/admin/catalog", label: "卡牌字典與行情", icon: "🗃️" },
  { href: "/admin/campaigns", label: "任務活動建立器", icon: "🎯" },
  { href: "/admin/settings", label: "全局系統配置", icon: "⚙️" },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="relative flex min-h-[56px] items-center justify-center overflow-hidden">
          {/* Expanded brand */}
          <div className="flex w-full flex-col gap-1 group-data-[collapsible=icon]:hidden">
            <p className="font-mono text-[10px] uppercase tracking-widest text-sidebar-foreground/70">
              後台管理
            </p>
            <div className="flex items-center gap-2">
              <h1 className="font-sans text-lg font-bold text-sidebar-foreground">
                HKCV 🏛️
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-warning/20 bg-[rgba(239,68,68,0.10)] px-2 py-0.5 font-mono text-[10px] text-warning">
                <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />
                ADMIN
              </span>
            </div>
          </div>

          {/* Collapsed brand */}
          <div className="hidden items-center justify-center group-data-[collapsible=icon]:flex">
            <span className="font-sans text-lg font-black text-brand transition-transform hover:scale-105 active:scale-[0.98]">
              HK
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarMenu>
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={label}
                  render={<Link href={href} />}
                  className="active:scale-[0.98] data-[active=true]:text-brand"
                >
                  <span
                    aria-hidden="true"
                    className="block shrink-0 text-center text-base"
                  >
                    {icon}
                  </span>
                  <span className="truncate font-sans text-[13px] group-data-[collapsible=icon]:hidden">
                    {label}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 py-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand/20 bg-brand/10 font-mono text-sm font-bold text-brand">
            A
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate font-mono text-[11px] text-sidebar-foreground">
              admin@hkcv
            </p>
            <p className="truncate font-sans text-[11px] text-sidebar-foreground/70">
              超級管理員
            </p>
            <Link
              href="/profile/user"
              className="mt-0.5 inline-flex items-center gap-1 font-sans text-[11px] text-sidebar-foreground/70 transition-colors hover:text-brand active:scale-[0.98]"
            >
              返回前台
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
