import type { PokemonCard } from "@/app/api/pokemon-cards/route";
import type { CardData } from "@/app/components/cards/CardItem";

// TODO [API]: In production, all mock data will come from Supabase DB, not pokemontcg.io
// This module provides helpers to:
// 1. Fetch cards directly from pokemontcg.io (server components) or via /api/pokemon-cards (client)
// 2. Transform API responses into the types our components expect
// 3. Fall back to static mock data when the API is unavailable (SSR/build time)

const POKEMON_TCG_API = "https://api.pokemontcg.io/v2/cards";

/** Fetch Pokemon cards — calls pokemontcg.io directly (works in both SSR and client) */
export async function fetchPokemonCards(params?: {
  q?: string;
  page?: number;
  pageSize?: number;
  orderBy?: string;
}): Promise<PokemonCard[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set("q", params.q);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params?.orderBy) searchParams.set("orderBy", params.orderBy);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `${POKEMON_TCG_API}?${searchParams.toString()}`,
      { signal: controller.signal, next: { revalidate: 3600 } }
    );
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

/** Get a price for a Pokemon card from available pricing data */
function getCardPrice(card: PokemonCard): number {
  // Try cardmarket first (more common for Japanese cards)
  if (card.cardmarket?.prices?.averageSellPrice) {
    return Math.round(card.cardmarket.prices.averageSellPrice * 160); // EUR → JPY rough conversion
  }
  if (card.cardmarket?.prices?.trendPrice) {
    return Math.round(card.cardmarket.prices.trendPrice * 160);
  }
  // Try tcgplayer
  if (card.tcgplayer?.prices) {
    const firstType = Object.values(card.tcgplayer.prices)[0];
    if (firstType?.market) return Math.round(firstType.market * 150); // USD → JPY rough conversion
    if (firstType?.mid) return Math.round(firstType.mid * 150);
  }
  // Fallback: generate from card name hash for consistency
  let hash = 0;
  for (let i = 0; i < card.name.length; i++) {
    hash = (hash << 5) - hash + card.name.charCodeAt(i);
    hash |= 0;
  }
  return 5000 + Math.abs(hash % 50000);
}

/** Map API rarity string to our simplified rarity type */
function mapRarity(rarity?: string): "SAR" | "UR" | "SR" | "AR" {
  if (!rarity) return "AR";
  const r = rarity.toLowerCase();
  if (r.includes("special art") || r.includes("illustration")) return "SAR";
  if (r.includes("ultra") || r.includes("secret") || r.includes("hyper"))
    return "UR";
  if (r.includes("full art") || r.includes("holo") || r.includes("v"))
    return "SR";
  if (r.includes("rare")) return "SR";
  return "AR";
}

/** Transform a PokemonCard from the API into our CardData type */
export function toCardData(card: PokemonCard): CardData {
  const price = getCardPrice(card);
  const delta = Math.round(price * (Math.random() * 0.1));
  const deltaDirection = Math.random() > 0.4 ? "up" : "down";

  return {
    id: card.id,
    name: card.name,
    set: card.set.name,
    rarity: mapRarity(card.rarity),
    grade: {
      authority: ["PSA", "BGS", "CGC"][Math.floor(Math.random() * 3)],
      score: ["10", "9.5", "9"][Math.floor(Math.random() * 3)],
    },
    price,
    delta,
    deltaDirection: deltaDirection as "up" | "down",
    image: card.images.large || card.images.small,
    seller: mockSellers[Math.floor(Math.random() * mockSellers.length)],
  };
}

const mockSellers = [
  "渡邊道館",
  "京都卡牌專門店",
  "東京TCG市場",
  "大阪收藏家",
  "名古屋交易商",
  "福岡卡牌店",
];

const mockBuyers = [
  "玩家K***",
  "收藏家M***",
  "投資者T***",
  "玩家A***",
  "道館主S***",
  "收藏家R***",
  "玩家H***",
  "投資者N***",
];

/** Transform API cards into ticker transaction data */
export function toTickerTransaction(card: PokemonCard) {
  const price = getCardPrice(card);
  return {
    buyer: mockBuyers[Math.floor(Math.random() * mockBuyers.length)],
    price,
    card: `${card.name} ${mapRarity(card.rarity)}`,
  };
}

/** Transform API cards into Following Feed data */
export function toFollowingCard(card: PokemonCard) {
  const price = getCardPrice(card);
  return {
    id: card.id,
    name: card.name,
    rarity: mapRarity(card.rarity) as string,
    price,
    image: card.images.large || card.images.small,
    seller: mockSellers[Math.floor(Math.random() * mockSellers.length)],
  };
}

/** Transform API cards into Sniper Radar deal data */
export function toSniperDeal(card: PokemonCard) {
  const marketPrice = getCardPrice(card);
  const discountPct = 10 + Math.floor(Math.random() * 12); // -10% to -22%
  const price = Math.round(marketPrice * (1 - discountPct / 100));
  return {
    id: card.id,
    name: card.name,
    rarity: mapRarity(card.rarity) as string,
    price,
    marketPrice,
    deltaPercent: -discountPct,
    image: card.images.large || card.images.small,
    seller: mockSellers[Math.floor(Math.random() * mockSellers.length)],
    grade: `${["PSA", "BGS", "CGC"][Math.floor(Math.random() * 3)]} ${["10", "9.5", "9"][Math.floor(Math.random() * 3)]}`,
  };
}

/** Transform API cards into C2C new arrivals data */
export function toNewArrival(card: PokemonCard, index: number) {
  const price = getCardPrice(card);
  const timeOffsets = [
    "3分鐘前",
    "8分鐘前",
    "15分鐘前",
    "22分鐘前",
    "31分鐘前",
    "45分鐘前",
  ];
  return {
    id: card.id,
    name: card.name,
    set: card.set.name,
    rarity: mapRarity(card.rarity) as string,
    price,
    image: card.images.large || card.images.small,
    seller: mockBuyers[index % mockBuyers.length],
    timeAgo: timeOffsets[index % timeOffsets.length],
  };
}

/** Transform API cards into Tokyo Market Index data */
export function toMarketIndex(card: PokemonCard) {
  const jpPrice = getCardPrice(card);
  const delta = Math.round(jpPrice * (Math.random() * 0.08));
  const deltaDir = Math.random() > 0.4 ? ("up" as const) : ("down" as const);
  // Generate plausible 7-day sparkline data
  const base = jpPrice / 1000;
  const sparkline = Array.from({ length: 7 }, (_, i) => {
    const trend = deltaDir === "up" ? i * 0.3 : -i * 0.2;
    return Math.round((base + trend + (Math.random() - 0.5) * 0.5) * 10) / 10;
  });
  return {
    id: card.id,
    name: `${card.name} ${mapRarity(card.rarity)}`,
    jpPrice,
    delta,
    deltaDir,
    sparkline,
  };
}

/** Transform API cards into Transaction Wall data */
export function toTransaction(card: PokemonCard, index: number) {
  const price = getCardPrice(card);
  const delta = Math.round(price * (Math.random() * 0.08));
  const deltaDir = Math.random() > 0.4 ? ("up" as const) : ("down" as const);
  const timeStamps = [
    "2分鐘前",
    "8分鐘前",
    "15分鐘前",
    "23分鐘前",
    "31分鐘前",
    "45分鐘前",
    "1小時前",
    "1小時前",
  ];
  return {
    id: card.id,
    name: `${card.name} ${mapRarity(card.rarity)}`,
    price,
    delta,
    deltaDir,
    grade: `${["PSA", "BGS", "CGC", "RAW"][Math.floor(Math.random() * 4)]} ${["10", "9.5", "9", "NM"][Math.floor(Math.random() * 4)]}`,
    time: timeStamps[index % timeStamps.length],
  };
}

/** Transform API cards into market series data for page.tsx sidebar */
export function toMarketSeries(card: PokemonCard) {
  const price = getCardPrice(card);
  const deltaPct = Math.floor(Math.random() * 15) + 1;
  const dir = Math.random() > 0.4 ? ("up" as const) : ("down" as const);
  return {
    code: card.set.id,
    name: `${card.set.name} Box`,
    price: `¥${price.toLocaleString("zh-TW")}`,
    delta: `${dir === "up" ? "+" : "-"}${deltaPct}%`,
    dir,
  };
}

// ─── Static fallback data (used when API is unavailable at build/SSR time) ───

export const FALLBACK_CARDS: CardData[] = [
  {
    id: "sv2a-182",
    name: "Charizard ex",
    set: "151",
    rarity: "SAR",
    grade: { authority: "PSA", score: "10" },
    price: 45000,
    delta: 2400,
    deltaDirection: "up",
    image: "https://images.pokemontcg.io/sv3pt5/215_hires.png",
    seller: "渡邊道館",
  },
  {
    id: "sv2a-189",
    name: "Mewtwo ex",
    set: "151",
    rarity: "SAR",
    grade: { authority: "BGS", score: "9.5" },
    price: 52000,
    delta: 1000,
    deltaDirection: "down",
    image: "https://images.pokemontcg.io/sv3pt5/222_hires.png",
    seller: "京都卡牌專門店",
  },
  {
    id: "sv6a-109",
    name: "Umbreon ex",
    set: "Night Wanderer",
    rarity: "SAR",
    grade: { authority: "PSA", score: "10" },
    price: 38000,
    delta: 1500,
    deltaDirection: "up",
    image: "https://images.pokemontcg.io/sv3pt5/198_hires.png",
    seller: "大阪收藏家",
  },
  {
    id: "sv2a-215",
    name: "Pikachu",
    set: "151",
    rarity: "AR",
    grade: { authority: "CGC", score: "9" },
    price: 8500,
    delta: 300,
    deltaDirection: "down",
    image: "https://images.pokemontcg.io/sv3pt5/207_hires.png",
    seller: "東京TCG市場",
  },
  {
    id: "sv2a-233",
    name: "Mimikyu ex",
    set: "151",
    rarity: "SAR",
    grade: { authority: "PSA", score: "9" },
    price: 28000,
    delta: 3200,
    deltaDirection: "up",
    image: "https://images.pokemontcg.io/sv3pt5/201_hires.png",
    seller: "名古屋交易商",
  },
  {
    id: "sv2a-213",
    name: "Eevee",
    set: "151",
    rarity: "AR",
    grade: { authority: "RAW", score: "NM" },
    price: 6200,
    delta: 800,
    deltaDirection: "up",
    image: "https://images.pokemontcg.io/sv3pt5/196_hires.png",
    seller: "福岡卡牌店",
  },
];
