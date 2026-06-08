"use client";

import { create } from "zustand";
import { type MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";
import { INITIAL_LISTINGS as CENTRAL_INITIAL_LISTINGS } from "@/app/lib/mock-data/cards";

export type SortKey = "最新" | "價格：由低到高" | "價格：由高到低";

export const INITIAL_LISTINGS: MarketplaceListing[] = CENTRAL_INITIAL_LISTINGS;

interface MarketState {
  query: string;
  activeRarities: string[];
  activeGrades: string[];
  activeConditions: string[];
  // 🟢 新增：刊登模式（MERCHANT | C2C | P2P）全域多維陣列
  activeTypes: string[]; 
  sortKey: SortKey;
  isSearchFocused: boolean;

  setQuery: (q: string) => void;
  setSortKey: (key: SortKey) => void;
  setIsSearchFocused: (focused: boolean) => void;

  toggleRarity: (rarity: string) => void;
  toggleGrade: (grade: string) => void;
  toggleCondition: (condition: string) => void;
  // 🟢 新增：切換刊登模式狀態控制線
  toggleType: (type: string) => void; 
  // 🟢 新增：全域一鍵滿血重置還原 Action 
  resetAll: () => void; 
}

export const useMarketStore = create<MarketState>((set) => ({
  query: "",
  activeRarities: [],
  activeGrades: [],
  activeConditions: [],
  activeTypes: [], // 預設清空
  sortKey: "最新",
  isSearchFocused: false,

  setQuery: (query) => set({ query }),
  setSortKey: (sortKey) => set({ sortKey }),
  setIsSearchFocused: (isSearchFocused) => set({ isSearchFocused }),

  toggleRarity: (rarity) =>
    set((state) => ({
      activeRarities: state.activeRarities.includes(rarity)
        ? state.activeRarities.filter((r) => r !== rarity)
        : [...state.activeRarities, rarity],
    })),

  toggleGrade: (grade) =>
    set((state) => ({
      activeGrades: state.activeGrades.includes(grade)
        ? state.activeGrades.filter((g) => g !== grade)
        : [...state.activeGrades, grade],
    })),

  toggleCondition: (condition) =>
    set((state) => ({
      activeConditions: state.activeConditions.includes(condition)
        ? state.activeConditions.filter((c) => c !== condition)
        : [...state.activeConditions, condition],
    })),

  // 🟢 實作：刊登來源模式的多維切換開關
  toggleType: (type) =>
    set((state) => ({
      activeTypes: state.activeTypes.includes(type)
        ? state.activeTypes.filter((t) => t !== type)
        : [...state.activeTypes, type],
    })),

  // 🟢 實作：原子級一鍵大抹平，只發動一次 set 徹底避免網頁集體連鎖重繪技術債
  resetAll: () =>
    set({
      query: "",
      activeRarities: [],
      activeGrades: [],
      activeConditions: [],
      activeTypes: [],
      sortKey: "最新",
      isSearchFocused: false,
    }),
}));
