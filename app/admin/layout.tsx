import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AdminSidebar } from "@/app/components/admin/AdminSidebar";
import { AdminBreadcrumb } from "@/app/components/admin/AdminBreadcrumb";

export const metadata: Metadata = { title: "後台管理 — HKCardVault" };

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 預設收合；用戶切換後以 cookie 記憶側欄開合狀態（跨頁面 / 重載持久化）
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AdminSidebar />
      <SidebarInset className="min-w-0 bg-[#17130f]">
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-white/[0.08] bg-[#17130f]/90 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="size-8 rounded-lg border border-white/10 text-text-secondary hover:border-brand/30 hover:bg-brand/10 hover:text-brand active:scale-[0.98]" />
            <span
              className="h-4 w-px bg-white/10"
              aria-hidden="true"
            />
            <AdminBreadcrumb />
            <span className="rounded-full border border-brand/20 bg-brand/10 px-2 py-0.5 font-mono text-[10px] font-medium text-brand">
              ADMIN
            </span>
          </div>
        </header>
        <div className="overflow-x-hidden p-4 lg:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
