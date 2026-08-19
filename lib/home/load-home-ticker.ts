import { fetchHomeListingsByPersona } from "@/lib/home/load-home-listings";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { resolveProductName, type CatalogRow } from "@/lib/marketplace/portfolio-pricing";

export type HomePriceTickerItem = {
  id: string;
  name: string;
  price: number;
  delta: number;
  direction: "up" | "down";
};

type MarketPriceRow = {
  market_avg_price: number | null;
  market_trend_30d: number | null;
  product_id: string | null;
  product_catalog: CatalogRow | CatalogRow[] | null;
};

function catalogFromEmbed(
  embedded: MarketPriceRow["product_catalog"],
): CatalogRow | undefined {
  if (!embedded) return undefined;
  return Array.isArray(embedded) ? embedded[0] : embedded;
}

export async function loadHomePriceTickerItems(
  limit = 8,
): Promise<HomePriceTickerItem[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("product_grading_market_prices")
      .select(
        "market_avg_price, market_trend_30d, product_id, product_catalog(name_zh, name_en, name_ja, card_number, display_id, set_code)",
      )
      .not("market_avg_price", "is", null)
      .gt("market_avg_price", 0)
      .order("updated_at", { ascending: false })
      .limit(limit * 3);

    if (error || !data) {
      return loadTickerItemsFromHomeListings(limit);
    }

    const seen = new Set<string>();
    const items: HomePriceTickerItem[] = [];

    for (const raw of data as MarketPriceRow[]) {
      const price = Number(raw.market_avg_price);
      if (!Number.isFinite(price) || price <= 0) continue;

      const catalog = catalogFromEmbed(raw.product_catalog);
      const productKey = raw.product_id ?? catalog?.display_id ?? "";
      if (!productKey || seen.has(productKey)) continue;
      seen.add(productKey);

      const trend = Number(raw.market_trend_30d ?? 0);
      const delta = Number.isFinite(trend) ? Math.abs(trend) : 0;
      items.push({
        id: catalog?.display_id?.trim() || catalog?.set_code || productKey,
        name: resolveProductName(catalog),
        price: Math.round(price),
        delta: Math.round(delta),
        direction: trend < 0 ? "down" : "up",
      });

      if (items.length >= limit) break;
    }

    if (items.length > 0) {
      return items;
    }
  } catch {
    // Fall through to live listing prices.
  }

  return loadTickerItemsFromHomeListings(limit);
}

async function loadTickerItemsFromHomeListings(
  limit: number,
): Promise<HomePriceTickerItem[]> {
  try {
    const [merchant, member] = await Promise.all([
      fetchHomeListingsByPersona("merchant", limit),
      fetchHomeListingsByPersona("member", limit),
    ]);
    const seen = new Set<string>();
    const items: HomePriceTickerItem[] = [];
    for (const listing of [...merchant, ...member]) {
      if (!Number.isFinite(listing.price) || listing.price <= 0) continue;
      const key = listing.productId || listing.listingId;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      items.push({
        id: listing.cardCode || listing.displayId || listing.setCode || key,
        name: listing.name,
        price: Math.round(listing.price),
        delta: 0,
        direction: "up",
      });
      if (items.length >= limit) break;
    }
    return items;
  } catch {
    return [];
  }
}
