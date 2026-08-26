"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  Wallet,
  Users,
  BadgeCheck,
  Search,
  Scale,
  Database,
  Target,
  Settings,
  type LucideIcon,
} from "lucide-react";
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
import { FORM_SECTION_CLASS } from "@/app/admin/campaigns/campaigns-ui";
import { ADMIN_NAV_ITEMS } from "@/app/admin/admin-nav";
import { cn } from "@/lib/utils";

const NAV_ICONS: Record<
  (typeof ADMIN_NAV_ITEMS)[number]["href"],
  LucideIcon
> = {
  "/admin/dashboard": LayoutDashboard,
  "/admin/announcements": Megaphone,
  "/admin/payouts": Wallet,
  "/admin/user_control": Users,
  "/admin/merchants": BadgeCheck,
  "/admin/grading": Search,
  "/admin/disputes": Scale,
  "/admin/catalog": Database,
  "/admin/campaigns": Target,
  "/admin/settings": Settings,
};

const NAV_ITEMS = ADMIN_NAV_ITEMS.map((item) => ({
  ...item,
  icon: NAV_ICONS[item.href],
}));

const NAV_BUTTON_CLASS =
  "h-9 gap-2.5 rounded-lg border border-transparent px-2.5 font-sans text-[12px] font-medium text-text-secondary shadow-none transition-colors active:scale-[0.98] hover:border-brand/30 hover:bg-brand/10 hover:text-brand data-[active=true]:border-brand/40 data-[active=true]:bg-brand/15 data-[active=true]:font-semibold data-[active=true]:text-brand group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:border-white/10 group-data-[collapsible=icon]:p-2!";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="w-[250px] md:w-64">
      <SidebarHeader className="border-b border-white/[0.06] p-3">
        <div className="relative flex min-h-[52px] items-center overflow-hidden group-data-[collapsible=icon]:justify-center">
          <div className="flex w-full items-center gap-3 group-data-[collapsible=icon]:hidden">
            <div className="relative shrink-0 overflow-hidden rounded-lg border border-white/10">
              <Image
                src="/asset/logo.png"
                alt="HKCardVault Logo"
                width={100}
                height={100}
                className="h-9 w-9 rounded-lg object-cover"
                priority
              />
            </div>
            <div className="flex min-w-0 flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <h1 className="truncate font-sans text-[14px] font-bold tracking-tight text-text-primary">
                  HKCardVault
                </h1>
                <span className="inline-flex shrink-0 items-center rounded-full border border-brand/20 bg-brand/10 px-2 py-0.5 font-mono text-[9px] font-medium text-brand">
                  ADMIN
                </span>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-text-disabled">
                後台管理
              </p>
            </div>
          </div>

          <div className="hidden items-center justify-center group-data-[collapsible=icon]:flex">
            <Image
              src="/asset/logo.png"
              alt="HKCardVault Logo"
              width={100}
              height={100}
              className="h-8 w-8 rounded-lg object-cover transition-transform hover:scale-105 active:scale-[0.98]"
            />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2.5">
        <p
          className={cn(
            FORM_SECTION_CLASS,
            "mb-2 px-1 group-data-[collapsible=icon]:hidden",
          )}
        >
          功能導航
        </p>
        <SidebarMenu className="gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={label}
                  render={<Link href={href} />}
                  className={NAV_BUTTON_CLASS}
                >
                  <Icon
                    className={cn(
                      "size-3.5 shrink-0",
                      isActive ? "text-brand" : "text-text-disabled",
                    )}
                    strokeWidth={isActive ? 2.25 : 2}
                  />
                  <span className="truncate leading-snug group-data-[collapsible=icon]:hidden">
                    {label}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-brand/20 bg-brand/10 font-mono text-[11px] font-bold text-brand">
            A
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate font-mono text-[11px] font-semibold text-text-primary">
              admin@hkcv
            </p>
            <div className="flex items-center gap-1.5">
              <span className="truncate font-sans text-[10px] text-text-secondary">
                超級管理員
              </span>
              <span className="text-text-disabled">·</span>
              <Link
                href="/profile/user"
                className="inline-flex items-center gap-0.5 font-sans text-[10px] font-semibold text-brand transition-colors hover:underline active:scale-[0.98]"
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
