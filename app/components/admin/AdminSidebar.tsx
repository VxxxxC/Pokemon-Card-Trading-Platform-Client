"use client";

import Image from "next/image";
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
  { href: "/admin/announcements", label: "公告管理", icon: "📢" },
  { href: "/admin/payouts", label: "財務與結算管控台", icon: "💰" },
  { href: "/admin/user_control", label: "用戶管理", icon: "👥" },
  { href: "/admin/merchants", label: "商戶 KYC 審核", icon: "🪪" },
  { href: "/admin/grading", label: "鑑定工作台", icon: "🔍" },
  { href: "/admin/disputes", label: "舉報與爭議仲裁", icon: "⚖️" },
  { href: "/admin/catalog", label: "卡牌字典與行情", icon: "🗃️" },
  { href: "/admin/campaigns", label: "積分與任務活動", icon: "🎯" },
  { href: "/admin/settings", label: "全局系統配置", icon: "⚙️" },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="w-[250px] md:w-64">
      <SidebarHeader className="p-3">
        <div className="relative flex min-h-[56px] items-center overflow-hidden group-data-[collapsible=icon]:justify-center">
          {/* Expanded brand */}
          <div className="flex w-full items-center gap-3 group-data-[collapsible=icon]:hidden">
            <div className="relative shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-md">
              <Image
                src="/asset/logo.png"
                alt="HKCardVault Logo"
                width={100}
                height={100}
                className="h-10 w-10 rounded-xl object-cover"
                priority
              />
            </div>
            <div className="flex min-w-0 flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <h1 className="truncate font-sans text-[15px] font-extrabold text-sidebar-foreground">
                  HKCardVault
                </h1>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-warning/20 bg-[rgba(239,68,68,0.10)] px-1.5 py-0.5 font-mono text-[9px] font-bold text-warning">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-warning"
                    aria-hidden="true"
                  />
                  ADMIN
                </span>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
                後台管理
              </p>
            </div>
          </div>

          {/* Collapsed brand */}
          <div className="hidden items-center justify-center group-data-[collapsible=icon]:flex">
            <Image
              src="/asset/logo.png"
              alt="HKCardVault Logo"
              width={100}
              height={100}
              className="h-9 w-9 rounded-xl object-cover transition-transform hover:scale-105 active:scale-[0.98]"
            />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2.5 py-2">
        <SidebarMenu className="gap-2">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={label}
                  render={<Link href={href} />}
                  className="h-11 px-3 text-[14px] font-medium transition-all active:scale-[0.98] data-[active=true]:bg-brand/10 data-[active=true]:font-bold data-[active=true]:text-brand"
                >
                  <span
                    aria-hidden="true"
                    className="block shrink-0 text-center text-lg"
                  >
                    {icon}
                  </span>
                  <span className="truncate font-sans text-[14px] leading-normal group-data-[collapsible=icon]:hidden">
                    {label}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand/20 bg-brand/10 font-mono text-sm font-bold text-brand shadow-inner">
            A
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate font-mono text-[12px] font-bold text-sidebar-foreground">
              admin@hkcv
            </p>
            <div className="flex items-center gap-2">
              <span className="truncate font-sans text-[11px] text-sidebar-foreground/70">
                超級管理員
              </span>
              <span className="text-sidebar-foreground/30">·</span>
              <Link
                href="/profile/user"
                className="inline-flex items-center gap-0.5 font-sans text-[11px] font-semibold text-brand transition-colors hover:underline active:scale-[0.98]"
              >
                前台 →
              </Link>
            </div>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
