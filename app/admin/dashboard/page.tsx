import type { Metadata } from "next";
import AdminDashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "數據總覽 — HKCardVault 後台",
  description: "全平台用戶生態、交易量、營收及系統健康度實時監控",
};

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
