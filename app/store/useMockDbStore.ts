"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { INITIAL_LISTINGS } from "@/app/lib/mock-data/cards";
import { MOCK_PUBLIC_MEMBERS } from "@/app/lib/mock-data/members";

// ── 契合持倉與商品的強型態契約 ──────────────────────────────────────────────
export interface OwnedCard {
  id: string;
  name: string;
  set: string;
  cardNo: string;
  grade: string;
  grader: "PSA" | "BGS" | "CGC" | "RAW";
  purchasePrice: number;
  currentValue: number;
  status: "holding" | "listed" | "grading";
  chartPoints: { price: number; date: string; day: number }[];
}

export interface UserListing {
  id: string;
  cardName: string;
  cardNo: string;
  grade: string;
  cardImage: string;
  price: number;
  status: "active" | "pending_trade" | "sold" | "unlisted";
  paymentMethods: string[];
  shippingMethods: string[];
  createdAt: string;
  views: number;
  watchers: number;
  linkedOrderId?: string;
  hasPriceOffer?: boolean;
  marketplaceOwnerId: string;
  marketplaceProductId: string;
}

interface MockDbState {
  ownedCards: OwnedCard[];
  tradingListings: UserListing[];
  // ── Database Mutation 模擬核心算力 ──
  removeCardFromCollection: (id: string) => void;
  publishCardToTradingMarket: (card: OwnedCard, price: number) => void;
  toggleListingStatus: (id: string) => void;
  cancelListingAndRemove: (id: string) => void;
}

const TRADING_MEMBER_ID = "HKCV-8839-44A";

// ── 數據庫初始種子（Seed Data） ──
const SEED_PORTFOLIO = [
  {
    id: "sv2a-182",
    grade: "PSA 10",
    grader: "PSA",
    purchasePrice: 2100,
    currentValue: 2250,
    status: "holding",
  },
  {
    id: "sv6a-109",
    grade: "BGS 9.5",
    grader: "BGS",
    purchasePrice: 1800,
    currentValue: 1900,
    status: "holding",
  },
  {
    id: "sv2a-215",
    grade: "CGC 9",
    grader: "CGC",
    purchasePrice: 410,
    currentValue: 425,
    status: "holding",
  },
  {
    id: "sv2a-189",
    grade: "PSA 10",
    grader: "PSA",
    purchasePrice: 2480,
    currentValue: 2350,
    status: "listed",
  },
  {
    id: "sv2a-205",
    grade: "PSA 9",
    grader: "PSA",
    purchasePrice: 880,
    currentValue: 950,
    status: "holding",
  },
  {
    id: "sv3pt5-067",
    grade: "BGS 9.5",
    grader: "BGS",
    purchasePrice: 1300,
    currentValue: 1380,
    status: "holding",
  },
  {
    id: "sv3w-085",
    grade: "PSA 10",
    grader: "PSA",
    purchasePrice: 2650,
    currentValue: 2950,
    status: "holding",
  },
  {
    id: "sv4pt5-086",
    grade: "PSA 9",
    grader: "PSA",
    purchasePrice: 2400,
    currentValue: 2550,
    status: "grading",
  },
] as const;

const initialOwned: OwnedCard[] = SEED_PORTFOLIO.flatMap((meta) => {
  const card = INITIAL_LISTINGS.find((c) => c.id === meta.id);
  if (!card) return [];
  return [
    {
      id: meta.id,
      name: card.name,
      set: card.set,
      cardNo: card.cardNo ?? meta.id,
      grade: meta.grade,
      grader: meta.grader as OwnedCard["grader"],
      purchasePrice: meta.purchasePrice,
      currentValue: meta.currentValue,
      status: meta.status as OwnedCard["status"],
      chartPoints: card.chartPoints,
    },
  ];
});

const initialListings: UserListing[] = (
  MOCK_PUBLIC_MEMBERS[TRADING_MEMBER_ID]?.activeListings ?? []
).map((listing) => ({
  id: listing.id,
  cardName: listing.name,
  cardNo: listing.cardNo ?? listing.id,
  grade:
    listing.grade.authority === "Raw Card"
      ? `【${listing.conditionLabel}】${listing.grade.label}`
      : `${listing.grade.authority} ${listing.grade.score} · ${listing.grade.label}`,
  cardImage: listing.image,
  price: listing.price,
  status: listing.status as UserListing["status"],
  paymentMethods: listing.paymentMethods ?? [],
  shippingMethods: listing.shippingMethods ?? [],
  createdAt: listing.createdAt ?? "2026-06-01",
  views: listing.views ?? 142,
  watchers: listing.watchers ?? 18,
  linkedOrderId: listing.linkedOrderId,
  hasPriceOffer: Boolean(listing.priceOfferContext),
  marketplaceOwnerId: TRADING_MEMBER_ID,
  marketplaceProductId: listing.id,
}));

// ── 永續資料庫倉庫宣告 ──
export const useMockDbStore = create<MockDbState>()(
  persist(
    (set) => ({
      ownedCards: initialOwned,
      tradingListings: initialListings,

      // 1. 從持倉剔除
      removeCardFromCollection: (id) =>
        set((state) => ({
          ownedCards: state.ownedCards.filter((c) => c.id !== id),
        })),

      // 2. 核心聯動：收藏品變更為商品，一鍵跨頁灌流
      publishCardToTradingMarket: (card, price) =>
        set((state) => {
          const newListing: UserListing = {
            id: `LST-C2C-${Math.floor(100 + Math.random() * 900)}`,
            cardName: card.name,
            cardNo: card.cardNo,
            grade: `${card.grader} ${card.grade.split(" ")[1] || "10"} · 完美鑑定`,
            cardImage: `https://picsum.photos/seed/${card.id}/600/420`,
            price: price,
            status: "active",
            paymentMethods: ["FPS", "PayMe"],
            shippingMethods: ["順豐到付"],
            createdAt: new Date().toISOString().split("T")[0],
            views: 0,
            watchers: 0,
            marketplaceOwnerId: TRADING_MEMBER_ID,
            marketplaceProductId: card.id,
          };

          return {
            ownedCards: state.ownedCards.filter((c) => c.id !== card.id),
            tradingListings: [newListing, ...state.tradingListings],
          };
        }),

      // 3. 上下架切換
      toggleListingStatus: (id) =>
        set((state) => ({
          tradingListings: state.tradingListings.map((l) => {
            if (l.id !== id) return l;
            return {
              ...l,
              status: l.status === "active" ? "unlisted" : "active",
            };
          }),
        })),

      // 4. 取消上架商品
      cancelListingAndRemove: (id) =>
        set((state) => ({
          tradingListings: state.tradingListings.filter((l) => l.id !== id),
        })),
    }),
    {
      name: "hkcardvault-mock-db", // LocalStorage 唯一金鑰鍵
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
