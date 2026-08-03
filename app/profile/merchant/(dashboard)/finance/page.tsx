import type { Metadata } from "next";
import { MerchantFinancePageData } from "./MerchantFinancePageData";

export const metadata: Metadata = {
  title: "資金金流 — HKCardVault",
  description: "查看本月總收入、資金流水記錄及 Stripe Connect 帳戶",
};

export default function MerchantFinancePage() {
  return <MerchantFinancePageData />;
}
