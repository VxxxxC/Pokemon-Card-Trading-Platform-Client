"use client";

import { create } from "zustand";
import {
  pruneGradesForProductKinds,
  pruneIncompatibleGradeKeys,
} from "@/lib/marketplace/grade-filter-compat";

export type SortKey = "最新" | "價格：由低到高" | "價格：由高到低";

interface MarketState {
  query: string;
  activeRarities: string[];
  activeGrades: string[];
  // Seller source filter (MEMBER | MERCHANT)
  activeTypes: string[];
  // Product kind filter (single_card | sealed_product)
  activeProductKinds: string[];
  sortKey: SortKey;
  isSearchFocused: boolean;

  setQuery: (q: string) => void;
  setSortKey: (key: SortKey) => void;
  setIsSearchFocused: (focused: boolean) => void;

  toggleRarity: (rarity: string) => void;
  toggleGrade: (grade: string) => void;
  // Seller source multi-select (MEMBER | MERCHANT)
  toggleType: (type: string) => void;
  toggleProductKind: (kind: string) => void;
  resetAll: () => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  query: "",
  activeRarities: [],
  activeGrades: [],
  activeTypes: [],
  activeProductKinds: [],
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
      activeGrades: pruneIncompatibleGradeKeys(state.activeGrades, grade),
    })),

  toggleType: (type) =>
    set((state) => ({
      activeTypes: state.activeTypes.includes(type)
        ? state.activeTypes.filter((t) => t !== type)
        : [...state.activeTypes, type],
    })),

  toggleProductKind: (kind) =>
    set((state) => {
      const nextProductKinds = state.activeProductKinds.includes(kind)
        ? state.activeProductKinds.filter((k) => k !== kind)
        : [...state.activeProductKinds, kind];
      return {
        activeProductKinds: nextProductKinds,
        activeGrades: pruneGradesForProductKinds(
          state.activeGrades,
          nextProductKinds,
        ),
      };
    }),

  resetAll: () =>
    set({
      query: "",
      activeRarities: [],
      activeGrades: [],
      activeTypes: [],
      activeProductKinds: [],
      sortKey: "最新",
      isSearchFocused: false,
    }),
}));
