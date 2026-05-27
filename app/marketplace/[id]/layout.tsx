import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "商品詳情 — PokéTrade JP",
  description: "查看日版 Pokémon 卡牌的詳細資訊、價格走勢與賣家評價。",
};

export default function ProductDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
