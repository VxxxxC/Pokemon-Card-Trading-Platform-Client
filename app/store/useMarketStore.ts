"use client";

import { create } from "zustand";

export type SortKey = "最新" | "價格：由低到高" | "價格：由高到低";

interface MarketState {
  query: string;
  activeRarities: string[];
  activeGrades: string[];
  // Seller source filter (MEMBER | MERCHANT)
  activeTypes: string[];
  sortKey: SortKey;
  isSearchFocused: boolean;

  setQuery: (q: string) => void;
  setSortKey: (key: SortKey) => void;
  setIsSearchFocused: (focused: boolean) => void;

  toggleRarity: (rarity: string) => void;
  toggleGrade: (grade: string) => void;
  // Seller source multi-select (MEMBER | MERCHANT)
  toggleType: (type: string) => void;
  // 🟢 新增：全域一鍵滿血重置還原 Action
  resetAll: () => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  query: "",
  activeRarities: [],
  activeGrades: [],
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

  // Seller source multi-select toggle
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
      activeTypes: [],
      sortKey: "最新",
      isSearchFocused: false,
    }),
}));
