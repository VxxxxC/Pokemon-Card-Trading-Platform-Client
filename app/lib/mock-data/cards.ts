// TODO [MOCK DATA]: Unified Single Source of Truth (SSOT) — PokéTrade JP Card Asset Registry
// Replace with real-time Supabase queries upon backend integration.

export interface SellOrder {
  readonly sellerName: string;
  readonly sellerId: string;
  readonly price: number;
  readonly sellerRating: number;
  readonly customGrade: { authority: string; score: string };
}

export interface UnifiedProductSpec {
  id: string;
  cardNo?: string;
  name: string;
  jpName: string;
  set: string;
  rarity: "SAR" | "UR" | "SR" | "AR";
  // The global price field is now DEPRECATED in source data; computed dynamically downstream
  delta: number;
  deltaDirection: "up" | "down";
  images: string[];
  type: string;
  stage: string;
  weakness: string;
  retreatCost: string;
  moveDamage: string;
  artist: string;
  soldHistory: { date: string; grade: string; price: number }[];
  chartPoints: { day: number; date: string; price: number }[];
  sellOrders: SellOrder[];
}

export const INITIAL_LISTINGS: UnifiedProductSpec[] = [
  // ── sv2a-182 ─────────────────────────────────────────────────────────────
  {
    id: "sv2a-182",
    cardNo: "sv2a-182",
    name: "Charizard ex SAR (噴火龍)",
    jpName: "リザードン ex SAR",
    set: "Pokémon 151",
    rarity: "SAR",
    delta: 120,
    deltaDirection: "up",
    images: [
      "https://picsum.photos/seed/poke-charizard/600/420",
      "https://picsum.photos/seed/char-corner1/600/420",
      "https://picsum.photos/seed/char-back/600/420",
    ],
    type: "火 (Fire)",
    stage: "Stage 2 (二階進化)",
    weakness: "水 x2",
    retreatCost: "◆◆",
    moveDamage: "爆裂燃燒 330 (Crimson Storm)",
    artist: "AKIRA EGAWA",
    soldHistory: [
      { date: "2026-06-03", grade: "PSA 10", price: 2250 },
      { date: "2026-05-26", grade: "PSA 10", price: 2210 },
      { date: "2026-05-24", grade: "PSA 10", price: 2180 },
    ],
    chartPoints: [
      { day: 1, date: "05-01", price: 2000 },
      { day: 10, date: "05-10", price: 2100 },
      { day: 20, date: "05-20", price: 2150 },
      { day: 30, date: "06-03", price: 2250 },
    ],
    // Prices deliberately out-of-order to validate dynamic sort
    sellOrders: [
      {
        sellerName: "渡邊道館",
        sellerId: "PKT-8839-44A",
        price: 2250,
        sellerRating: 5.0,
        customGrade: { authority: "PSA", score: "10" },
      },
      {
        sellerName: "旺角天線卡王",
        sellerId: "PKT-1122-33B",
        price: 2150,
        sellerRating: 4.8,
        customGrade: { authority: "PSA", score: "9" },
      },
      {
        sellerName: "秋葉原海外直送店",
        sellerId: "PKT-4455-66C",
        price: 2400,
        sellerRating: 4.9,
        customGrade: { authority: "Raw Card", score: "" }, // Raw — tests graded-only filter
      },
      {
        sellerName: "信和執雞大師",
        sellerId: "PKT-7788-99D",
        price: 2100,
        sellerRating: 4.5,
        customGrade: { authority: "BGS", score: "9.5" },
      },
      {
        sellerName: "深水埗精品角落",
        sellerId: "PKT-2210-55E",
        price: 1980, // ← lowest ask — this becomes the effective market price
        sellerRating: 4.3,
        customGrade: { authority: "Raw Card", score: "" }, // Raw — tests graded-only filter
      },
    ],
  },

  // ── sv2a-189 ─────────────────────────────────────────────────────────────
  {
    id: "sv2a-189",
    cardNo: "sv2a-189",
    name: "Mewtwo ex SAR (超夢)",
    jpName: "ミュウツー ex SAR",
    set: "Pokémon 151",
    rarity: "SAR",
    delta: 50,
    deltaDirection: "down",
    images: [
      "https://picsum.photos/seed/poke-mewtwo/600/420",
      "https://picsum.photos/seed/mewtwo-alt/600/420",
    ],
    type: "超能力 (Psychic)",
    stage: "Basic (基礎)",
    weakness: "惡 x2",
    retreatCost: "◆",
    moveDamage: "心靈震撼 220",
    artist: "GIDORA",
    soldHistory: [
      { date: "2026-06-02", grade: "BGS 9.5", price: 2600 },
      { date: "2026-05-30", grade: "PSA 9", price: 2480 },
    ],
    chartPoints: [
      { day: 1, date: "05-01", price: 2700 },
      { day: 15, date: "05-15", price: 2640 },
      { day: 30, date: "06-02", price: 2600 },
    ],
    sellOrders: [
      {
        sellerName: "銅鑼灣收藏家",
        sellerId: "PKT-5566-77C",
        price: 2750,
        sellerRating: 5.0,
        customGrade: { authority: "PSA", score: "10" },
      },
      {
        sellerName: "尖沙咀卡神",
        sellerId: "PKT-9900-11A",
        price: 2600,
        sellerRating: 4.9,
        customGrade: { authority: "BGS", score: "9.5" },
      },
      {
        sellerName: "荔枝角大師傅",
        sellerId: "PKT-3311-22D",
        price: 2380,
        sellerRating: 4.6,
        customGrade: { authority: "CGC", score: "9" },
      },
      {
        sellerName: "元朗李生精品",
        sellerId: "PKT-2233-44B",
        price: 2450,
        sellerRating: 4.7,
        customGrade: { authority: "Raw Card", score: "" }, // Raw — tests graded-only filter
      },
    ],
  },

  // ── sv6a-109 ─────────────────────────────────────────────────────────────
  {
    id: "sv6a-109",
    cardNo: "sv6a-109",
    name: "Umbreon ex SAR (月亮伊布)",
    jpName: "ブラッキー ex SAR",
    set: "Night Wanderer",
    rarity: "SAR",
    delta: 75,
    deltaDirection: "up",
    images: [
      "https://picsum.photos/seed/poke-umbreon/600/420",
      "https://picsum.photos/seed/umbreon-alt/600/420",
      "https://picsum.photos/seed/umbreon-back/600/420",
    ],
    type: "惡 (Dark)",
    stage: "Stage 1 (一階進化)",
    weakness: "格鬥 x2",
    retreatCost: "◆◆",
    moveDamage: "暗夜崩潰 180 + 40 (Midnight Zone)",
    artist: "RYUTA FUSE",
    soldHistory: [
      { date: "2026-06-04", grade: "PSA 10", price: 1900 },
      { date: "2026-05-29", grade: "PSA 10", price: 1850 },
      { date: "2026-05-22", grade: "BGS 9.5", price: 1780 },
    ],
    chartPoints: [
      { day: 1, date: "05-01", price: 1700 },
      { day: 10, date: "05-10", price: 1780 },
      { day: 20, date: "05-20", price: 1850 },
      { day: 30, date: "06-04", price: 1900 },
    ],
    sellOrders: [
      {
        sellerName: "觀塘夜市收藏王",
        sellerId: "PKT-8866-00C",
        price: 2050,
        sellerRating: 4.6,
        customGrade: { authority: "PSA", score: "10" },
      },
      {
        sellerName: "新宿夜行商",
        sellerId: "PKT-6644-88A",
        price: 1900,
        sellerRating: 5.0,
        customGrade: { authority: "PSA", score: "10" },
      },
      {
        sellerName: "石籬二手精品鋪",
        sellerId: "PKT-1188-22E",
        price: 1820,
        sellerRating: 4.7,
        customGrade: { authority: "CGC", score: "9.5" },
      },
      {
        sellerName: "大阪神秘珍品室",
        sellerId: "PKT-7755-99B",
        price: 1750,
        sellerRating: 4.8,
        customGrade: { authority: "BGS", score: "9.5" },
      },
      {
        sellerName: "九龍城無框生品",
        sellerId: "PKT-9977-11D",
        price: 1650, // ← lowest ask
        sellerRating: 4.4,
        customGrade: { authority: "Raw Card", score: "" }, // Raw — tests graded-only filter
      },
    ],
  },

  // ── sv2a-215 ─────────────────────────────────────────────────────────────
  {
    id: "sv2a-215",
    cardNo: "sv2a-215",
    name: "Pikachu AR (皮卡丘)",
    jpName: "ピカチュウ AR",
    set: "Pokémon 151",
    rarity: "AR",
    delta: 15,
    deltaDirection: "down",
    images: [
      "https://picsum.photos/seed/poke-pikachu/600/420",
      "https://picsum.photos/seed/pikachu-alt/600/420",
    ],
    type: "電 (Lightning)",
    stage: "Basic (基礎)",
    weakness: "格鬥 x2",
    retreatCost: "◆",
    moveDamage: "十萬伏特 90",
    artist: "KAWAYOO",
    soldHistory: [
      { date: "2026-06-01", grade: "CGC 9", price: 425 },
      { date: "2026-05-28", grade: "Raw Card", price: 380 },
      { date: "2026-05-20", grade: "PSA 9", price: 440 },
    ],
    chartPoints: [
      { day: 1, date: "05-01", price: 450 },
      { day: 10, date: "05-10", price: 440 },
      { day: 20, date: "05-20", price: 430 },
      { day: 30, date: "06-01", price: 425 },
    ],
    sellOrders: [
      {
        sellerName: "元朗動漫城",
        sellerId: "PKT-5544-77C",
        price: 460,
        sellerRating: 4.9,
        customGrade: { authority: "PSA", score: "9" },
      },
      {
        sellerName: "西環電力站",
        sellerId: "PKT-3322-55A",
        price: 425,
        sellerRating: 4.8,
        customGrade: { authority: "CGC", score: "9" },
      },
      {
        sellerName: "藍田玩具商",
        sellerId: "PKT-4433-66B",
        price: 380,
        sellerRating: 4.5,
        customGrade: { authority: "Raw Card", score: "" }, // Raw — tests graded-only filter
      },
      {
        sellerName: "將軍澳小卡鋪",
        sellerId: "PKT-6655-88D",
        price: 350, // ← lowest ask
        sellerRating: 4.2,
        customGrade: { authority: "Raw Card", score: "" }, // Raw — tests graded-only filter
      },
    ],
  },
];

/** Looks up a product specification by its canonical ID. */
export function getCardById(id: string): UnifiedProductSpec | null {
  return INITIAL_LISTINGS.find((c) => c.id === id) ?? null;
}

/**
 * Computes the effective (lowest) ask price for a product.
 * Falls back to 999_999 if the order book is empty.
 */
export function getEffectivePrice(card: UnifiedProductSpec): number {
  if (card.sellOrders.length === 0) return 999_999;
  return Math.min(...card.sellOrders.map((o) => o.price));
}

/**
 * Returns the SellOrder with the absolute lowest ask price.
 * Returns null if the order book is empty.
 */
export function getBestAsk(card: UnifiedProductSpec): SellOrder | null {
  if (card.sellOrders.length === 0) return null;
  return card.sellOrders.reduce((best, o) => (o.price < best.price ? o : best));
}

export default INITIAL_LISTINGS;
