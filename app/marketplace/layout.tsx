import type { Metadata } from "next";
import { MarketplaceChrome } from "./MarketplaceChrome";

export const metadata: Metadata = {
  title: "市場 — HKCardVault",
  description:
    "瀏覽日版 Pokémon 卡牌交易市場，精選 SAR、UR、SR、AR 稀有度卡牌。",
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketplaceChrome>{children}</MarketplaceChrome>;
}
