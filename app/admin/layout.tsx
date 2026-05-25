import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminNav } from "@/app/components/admin/AdminNav";

export const metadata: Metadata = {
  title: "後台管理 — PokéTrade JP",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#111009] lg:flex">
      <AdminNav />
      <main className="flex-1 min-w-0 p-4 lg:p-8 pb-28 lg:pb-8">
        {children}
      </main>
    </div>
  );
}
