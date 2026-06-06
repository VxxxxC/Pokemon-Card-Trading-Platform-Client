"use client";

import { create } from "zustand";
import { type MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";
import {
  MOCK_PUBLIC_MEMBERS,
  getStorefrontListingsByMember,
} from "@/app/lib/mock-public-members";

export type SortKey = "最新" | "價格：由低到高" | "價格：由高到低";

const MARKETPLACE_MEMBER_IDS = ["PKT-8839-44A"] as const;

export const INITIAL_LISTINGS: MarketplaceListing[] =
  MARKETPLACE_MEMBER_IDS.flatMap((memberId) => {
    const member = MOCK_PUBLIC_MEMBERS[memberId];
    return member ? getStorefrontListingsByMember(member) : [];
  });

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
