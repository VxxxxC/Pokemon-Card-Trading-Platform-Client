import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/app/components/admin/AdminSidebar";

export const metadata: Metadata = { title: "後台管理 — HKCardVault" };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // 預設收合；用戶切換後以 cookie 記憶側欄開合狀態（跨頁面 / 重載持久化）
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AdminSidebar />
      <SidebarInset className="min-w-0 bg-[#17130f]">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[rgba(237,232,224,0.08)] bg-bg-card/80 px-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="text-text-secondary hover:text-text-primary hover:bg-bg-elevated active:scale-[0.98]" />
            <span className="h-4 w-px bg-[rgba(237,232,224,0.12)]" aria-hidden="true" />
            <span className="font-sans text-sm font-bold text-text-primary">後台管理控制艙</span>
            <span className="rounded-full border border-warning/20 bg-[rgba(239,68,68,0.10)] px-2 py-0.5 font-mono text-[10px] text-warning">
              ADMIN
            </span>
          </div>
          <Link href="/profile/user" className="flex items-center gap-1 font-mono text-xs text-text-secondary transition-colors hover:text-brand active:scale-[0.98]">
            返回前台 →
          </Link>
        </header>
        <div className="overflow-x-hidden p-4 lg:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
