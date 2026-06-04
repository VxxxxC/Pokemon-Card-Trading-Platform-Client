"use client";

import { create } from "zustand";
import { type MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";

export type SortKey = "最新" | "價格：由低到高" | "價格：由高到低";

export const INITIAL_LISTINGS: MarketplaceListing[] = [
  {
    id: "sv2a-182",
    name: "Charizard ex SAR (噴火龍)",
    set: "Pokémon 151",
    rarity: "SAR",
    grade: { authority: "PSA", score: "10" },
    price: 2250,
    delta: 120,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-charizard/400/280",
    seller: "旺角卡店 · 專業認證商戶",
  },
  {
    id: "sv2a-189",
    name: "Mewtwo ex SAR (超夢)",
    set: "Pokémon 151",
    rarity: "SAR",
    grade: { authority: "BGS", score: "9.5" },
    price: 2600,
    delta: 50,
    deltaDirection: "down",
    image: "https://picsum.photos/seed/poke-mewtwo/400/280",
    seller: "渡邊道館",
  },
  {
    id: "sv6a-109",
    name: "Umbreon ex SAR (月亮伊布)",
    set: "Night Wanderer",
    rarity: "SAR",
    grade: { authority: "PSA", score: "10" },
    price: 1900,
    delta: 75,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-umbreon/400/280",
    seller: "大阪收藏家",
  },
  {
    id: "sv2a-215",
    name: "Pikachu AR (皮卡丘)",
    set: "Pokémon 151",
    rarity: "AR",
    grade: { authority: "CGC", score: "9" },
    price: 425,
    delta: 15,
    deltaDirection: "down",
    image: "https://picsum.photos/seed/poke-pikachu/400/280",
    seller: "東京TCG市場",
  },
];

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
