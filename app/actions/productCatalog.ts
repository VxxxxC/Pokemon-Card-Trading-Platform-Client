"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import {
  canonicalCardSearchKey,
  compactAlphanumeric,
  MIN_COMPACT_PREFIX,
  matchesCatalogCardSearch,
  isCompactCatalogSearchQuery,
} from "@/lib/search/card-identifier";

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

type CatalogSearchRow = {
  id: string;
  name_ja: string;
  name_en: string | null;
  name_zh: string | null;
  set_code: string;
  card_number: string | null;
  display_id: string | null;
  image_url: string;
  type: CatalogType;
  rarity: string | null;
  pokemon_stage: string | null;
  snkr_rank: number | null;
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

type CatalogSupabaseClient = Awaited<ReturnType<typeof createClient>>;

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

function quotePostgrestPattern(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function escapeIlikeUserInput(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&");
}

function buildCompactOrFilter(query: string, ilikePattern: string): string {
  const compact = compactAlphanumeric(query);
  const canonical = canonicalCardSearchKey(query);
  const quotedIlike = quotePostgrestPattern(ilikePattern);

  const parts = [
    `id_compact.ilike.${quotePostgrestPattern(`${escapeIlikeUserInput(compact)}%`)}`,
    `id_compact.ilike.${quotePostgrestPattern(`%${escapeIlikeUserInput(compact)}%`)}`,
    ...SEARCH_COLUMNS.map((column) => `${column}.ilike.${quotedIlike}`),
  ];

  if (canonical.length >= MIN_COMPACT_PREFIX) {
    parts.push(
      `id_canonical.ilike.${quotePostgrestPattern(`%${escapeIlikeUserInput(canonical)}%`)}`,
    );
  }

  return parts.join(",");
}

function displayName(row: {
  name_zh: string | null;
  name_ja: string;
}): string {
  return row.name_zh ?? row.name_ja;
}

function scoreMatch(row: CatalogSearchRow, query: string): number {
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

  const queryCompact = compactAlphanumeric(query);
  const queryCanonical = canonicalCardSearchKey(query);
  for (const target of [displayId, setCode, cardNumber, `${setCode}${cardNumber}`]) {
    if (!target) continue;
    if (queryCompact && compactAlphanumeric(target) === queryCompact) {
      score += 100;
    }
    if (queryCanonical && canonicalCardSearchKey(target) === queryCanonical) {
      score += 95;
    }
  }

  if (matchesCatalogCardSearch(query, row)) {
    score += 10;
  }

  if (row.snkr_rank != null) {
    score += Math.max(0, 15 - Math.min(row.snkr_rank, 15));
  }

  return score;
}

function toSuggestion(row: CatalogSearchRow): ProductCatalogSuggestion {
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

function rankSuggestions(
  rows: CatalogSearchRow[],
  query: string,
): ProductCatalogSuggestion[] {
  return rows
    .map((row) => ({ row, score: scoreMatch(row, query) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, RESULT_LIMIT)
    .map(({ row }) => toSuggestion(row));
}

function buildSearchSuccess(
  rows: CatalogSearchRow[],
  query: string,
  total: number,
): SearchSuccess {
  return {
    success: true,
    data: rankSuggestions(rows, query),
    total,
    hasMore: total > RESULT_LIMIT,
  };
}

async function searchCatalogByIlike(
  supabase: CatalogSupabaseClient,
  query: string,
  itemType: "card" | "box_set",
): Promise<SearchProductCatalogResult> {
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
    console.error("[searchProductCatalog] ilike", error.message);
    return { success: false, error: "搜尋商品目錄時發生錯誤" };
  }

  const rows = (data ?? []) as CatalogSearchRow[];
  return buildSearchSuccess(rows, query, count ?? rows.length);
}

async function searchCatalogByCompact(
  supabase: CatalogSupabaseClient,
  query: string,
  itemType: "card" | "box_set",
): Promise<SearchProductCatalogResult> {
  const pattern = toIlikePattern(query);
  const typeFilter = itemType === "card" ? CARD_TYPES : BOX_SET_TYPES;

  const { data, error, count } = await supabase
    .from("product_catalog")
    .select(
      "id, name_ja, name_en, name_zh, set_code, card_number, display_id, image_url, type, rarity, pokemon_stage, snkr_rank",
      { count: "exact" },
    )
    .in("type", typeFilter)
    .or(buildCompactOrFilter(query, pattern))
    .limit(DB_FETCH_LIMIT);

  if (error) {
    console.error("[searchProductCatalog] compact", error.message);
    return { success: false, error: "搜尋商品目錄時發生錯誤" };
  }

  const rows = (data ?? []) as CatalogSearchRow[];
  return buildSearchSuccess(rows, query, count ?? rows.length);
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

    if (isCompactCatalogSearchQuery(query)) {
      return searchCatalogByCompact(supabase, query, itemType);
    }

    return searchCatalogByIlike(supabase, query, itemType);
  } catch (error) {
    console.error("[searchProductCatalog]", error);
    return { success: false, error: "無法連線至商品目錄" };
  }
}
