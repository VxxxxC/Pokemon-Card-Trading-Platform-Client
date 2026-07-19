"use server";

import type { CatalogItemKind } from "@/lib/catalog/item-kind";
import type { CatalogType } from "@/lib/constants/commerce";
import { createClient } from "@/lib/supabase/server";
import {
  canonicalCardSearchKey,
  compactAlphanumeric,
  matchesCatalogCardSearch,
} from "@/lib/search/card-identifier";

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;
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
  jan_code: string | null;
  image_url: string;
  type: CatalogType;
  rarity: string | null;
  pokemon_stage: string | null;
  snkr_rank: number | null;
};

type SearchProductCatalogRpcRow = CatalogSearchRow & {
  total_count: number | null;
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
  const janCode = row.jan_code?.toLowerCase() ?? "";
  const names = [row.name_ja, row.name_en, row.name_zh]
    .filter(Boolean)
    .map((value) => value!.toLowerCase());

  let score = 0;

  if (cardNumber === q || displayId === q) score += 120;
  if (janCode === q) score += 130;
  if (setCode === q) score += 110;

  if (cardNumber.startsWith(q) || displayId.startsWith(q)) score += 90;
  if (janCode.startsWith(q)) score += 105;
  if (setCode.startsWith(q)) score += 80;

  for (const name of names) {
    if (name === q) score += 70;
    else if (name.startsWith(q)) score += 60;
    else if (name.includes(q)) score += 40;
  }

  if (cardNumber.includes(q) || displayId.includes(q)) score += 30;
  if (janCode.includes(q)) score += 55;
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

function mapRpcRowToCatalogSearchRow(row: SearchProductCatalogRpcRow): CatalogSearchRow {
  return {
    id: row.id,
    name_ja: row.name_ja,
    name_en: row.name_en,
    name_zh: row.name_zh,
    set_code: row.set_code,
    card_number: row.card_number,
    display_id: row.display_id,
    jan_code: row.jan_code ?? null,
    image_url: row.image_url,
    type: row.type,
    rarity: row.rarity,
    pokemon_stage: row.pokemon_stage,
    snkr_rank: row.snkr_rank,
  };
}

export async function searchProductCatalog(
  rawQuery: string,
  itemType: CatalogItemKind,
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

    const { data, error } = await (
      supabase as unknown as {
        rpc: (
          fn: "search_product_catalog",
          args: { p_query: string; p_item_type: CatalogItemKind },
        ) => Promise<{
          data: SearchProductCatalogRpcRow[] | null;
          error: { message: string } | null;
        }>;
      }
    ).rpc("search_product_catalog", {
      p_query: query,
      p_item_type: itemType,
    });

    if (error) {
      console.error("[searchProductCatalog] rpc", error.message);
      return { success: false, error: "搜尋商品目錄時發生錯誤" };
    }

    const rpcRows = (data ?? []) as SearchProductCatalogRpcRow[];
    const rows = rpcRows.map(mapRpcRowToCatalogSearchRow);
    const total = Number(rpcRows[0]?.total_count ?? rows.length);

    return {
      success: true,
      data: rankSuggestions(rows, query),
      total,
      hasMore: total > RESULT_LIMIT,
    };
  } catch (error) {
    console.error("[searchProductCatalog]", error);
    return { success: false, error: "無法連線至商品目錄" };
  }
}
