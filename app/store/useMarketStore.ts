"use client";

import { create } from "zustand";
import { type MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";
import { INITIAL_LISTINGS as CENTRAL_INITIAL_LISTINGS } from "@/app/lib/mock-data/cards";

export type SortKey = "最新" | "價格：由低到高" | "價格：由高到低";

// Bridge: expose a project-level INITIAL_LISTINGS that is fed from the central mock-data bank
export const INITIAL_LISTINGS: MarketplaceListing[] = CENTRAL_INITIAL_LISTINGS;

interface MarketState {
  query: string;
  activeRarities: string[];
  activeGrades: string[];
  activeConditions: string[];
  sortKey: SortKey;
  isSearchFocused: boolean;

  setQuery: (q: string) => void;
  setSortKey: (key: SortKey) => void;
  setIsSearchFocused: (focused: boolean) => void;

  toggleRarity: (rarity: string) => void;
  toggleGrade: (grade: string) => void;
  toggleCondition: (condition: string) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  query: "",
  activeRarities: [],
  activeGrades: [],
  activeConditions: [],
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
}));
