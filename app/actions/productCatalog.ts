"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type CatalogType = Database["public"]["Enums"]["catalog_type"];

const CARD_TYPES: CatalogType[] = ["single_card"];
const BOX_SET_TYPES: CatalogType[] = [
  "booster_box",
  "gift_set",
  "booster_pack",
  "starter_deck",
];

const SEARCH_COLUMNS = [
  "set_code",
  "name_ja",
  "name_en",
  "name_zh",
  "card_number",
  "display_id",
] as const;

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;
/** Rows pulled from DB for relevance ranking (not shown to user) */
const DB_FETCH_LIMIT = 50;
/** Max rows in autocomplete dropdown — keep small for UX + performance */
const RESULT_LIMIT = 12;

export type ProductCatalogSuggestion = {
  id: string;
  name: string;
  nameJa: string;
  nameEn: string | null;
  nameZh: string | null;
  setCode: string;
  cardNumber: string | null;
  displayId: string | null;
  imageUrl: string;
  type: CatalogType;
  rarity: string | null;
  pokemonStage: string | null;
};

type SearchSuccess = {
  success: true;
  data: ProductCatalogSuggestion[];
  /** Total rows matching the query in DB */
  total: number;
  /** True when total > RESULT_LIMIT */
  hasMore: boolean;
};
type SearchFailure = { success: false; error: string };
export type SearchProductCatalogResult = SearchSuccess | SearchFailure;

function normalizeQuery(raw: string): string {
  return raw.trim().replace(/,/g, " ").slice(0, MAX_QUERY_LENGTH);
}

function toIlikePattern(query: string): string {
  const escaped = query.replace(/[%_\\]/g, "\\$&");
  return `%${escaped}%`;
}

function buildOrIlikeFilter(pattern: string): string {
  const quotedPattern = `"${pattern.replace(/"/g, '""')}"`;
  return SEARCH_COLUMNS.map(
    (column) => `${column}.ilike.${quotedPattern}`,
  ).join(",");
}

function displayName(row: {
  name_zh: string | null;
  name_ja: string;
}): string {
  return row.name_zh ?? row.name_ja;
}

function scoreMatch(
  row: {
    set_code: string;
    name_ja: string;
    name_en: string | null;
    name_zh: string | null;
    card_number: string | null;
    display_id: string | null;
    snkr_rank: number | null;
  },
  query: string,
): number {
  const q = query.toLowerCase();
  const cardNumber = row.card_number?.toLowerCase() ?? "";
  const displayId = row.display_id?.toLowerCase() ?? "";
  const setCode = row.set_code.toLowerCase();
  const names = [row.name_ja, row.name_en, row.name_zh]
    .filter(Boolean)
    .map((value) => value!.toLowerCase());

  let score = 0;

  if (cardNumber === q || displayId === q) score += 120;
  if (setCode === q) score += 110;

  if (cardNumber.startsWith(q) || displayId.startsWith(q)) score += 90;
  if (setCode.startsWith(q)) score += 80;

  for (const name of names) {
    if (name === q) score += 70;
    else if (name.startsWith(q)) score += 60;
    else if (name.includes(q)) score += 40;
  }

  if (cardNumber.includes(q) || displayId.includes(q)) score += 30;
  if (setCode.includes(q)) score += 20;

  if (row.snkr_rank != null) {
    score += Math.max(0, 15 - Math.min(row.snkr_rank, 15));
  }

  return score;
}

function toSuggestion(
  row: Database["public"]["Tables"]["product_catalog"]["Row"],
): ProductCatalogSuggestion {
  return {
    id: row.id,
    name: displayName(row),
    nameJa: row.name_ja,
    nameEn: row.name_en,
    nameZh: row.name_zh,
    setCode: row.set_code,
    cardNumber: row.card_number,
    displayId: row.display_id,
    imageUrl: row.image_url,
    type: row.type,
    rarity: row.rarity,
    pokemonStage: row.pokemon_stage,
  };
}

export async function searchProductCatalog(
  rawQuery: string,
  itemType: "card" | "box_set",
): Promise<SearchProductCatalogResult> {
  const query = normalizeQuery(rawQuery);

  if (query.length < MIN_QUERY_LENGTH) {
    return {
      success: false,
      error: `請輸入至少 ${MIN_QUERY_LENGTH} 個字元`,
    };
  }

  try {
    const supabase = await createClient();
    const pattern = toIlikePattern(query);
    const typeFilter = itemType === "card" ? CARD_TYPES : BOX_SET_TYPES;

    const { data, error, count } = await supabase
      .from("product_catalog")
      .select(
        "id, name_ja, name_en, name_zh, set_code, card_number, display_id, image_url, type, rarity, pokemon_stage, snkr_rank",
        { count: "exact" },
      )
      .in("type", typeFilter)
      .or(buildOrIlikeFilter(pattern))
      .limit(DB_FETCH_LIMIT);

    if (error) {
      console.error("[searchProductCatalog]", error.message);
      return { success: false, error: "搜尋商品目錄時發生錯誤" };
    }

    const total = count ?? 0;
    const ranked = (data ?? [])
      .map((row) => ({ row, score: scoreMatch(row, query) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, RESULT_LIMIT)
      .map(({ row }) => toSuggestion(row));

    return {
      success: true,
      data: ranked,
      total,
      hasMore: total > RESULT_LIMIT,
    };
  } catch (error) {
    console.error("[searchProductCatalog]", error);
    return { success: false, error: "無法連線至商品目錄" };
  }
}
