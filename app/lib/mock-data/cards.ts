// Centralized mock card asset bank for the marketplace
import type { MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";

export const INITIAL_LISTINGS: MarketplaceListing[] = [
  {
    id: "sv2a-182",
    cardNo: "sv2a-182",
    name: "Charizard ex SAR (噴火龍)",
    set: "Pokémon 151",
    rarity: "SAR",
    grade: { authority: "PSA", score: "10" },
    conditionLabel: "美品 S",
    price: 2250,
    delta: 120,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-charizard/600/420",
    seller: "大盤最優定價資產",
    sellerId: "PKT-AGG-001",
  },
  {
    id: "sv2a-189",
    cardNo: "sv2a-189",
    name: "Mewtwo ex SAR (超夢)",
    set: "Pokémon 151",
    rarity: "SAR",
    grade: { authority: "BGS", score: "9.5" },
    conditionLabel: "美品 S",
    price: 2600,
    delta: 50,
    deltaDirection: "down",
    image: "https://picsum.photos/seed/poke-mewtwo/600/420",
    seller: "大盤最優定價資產",
    sellerId: "PKT-AGG-001",
  },
  {
    id: "sv6a-109",
    cardNo: "sv6a-109",
    name: "Umbreon ex SAR (月亮伊布)",
    set: "Night Wanderer",
    rarity: "SAR",
    grade: { authority: "PSA", score: "10" },
    conditionLabel: "美品 S",
    price: 1900,
    delta: 75,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-umbreon/600/420",
    seller: "大盤最優定價資產",
    sellerId: "PKT-AGG-001",
  },
  {
    id: "sv2a-215",
    cardNo: "sv2a-215",
    name: "Pikachu AR (皮卡丘)",
    set: "Pokémon 151",
    rarity: "AR",
    grade: { authority: "CGC", score: "9" },
    conditionLabel: "美品 S",
    price: 425,
    delta: 15,
    deltaDirection: "down",
    image: "https://picsum.photos/seed/poke-pikachu/600/420",
    seller: "大盤最優定價資產",
    sellerId: "PKT-AGG-001",
  },
];

export function getCardById(id: string) {
  return INITIAL_LISTINGS.find((c) => c.id === id) ?? null;
}

export default INITIAL_LISTINGS;
