import { NextResponse } from "next/server";
import {
  resolveMarketPriceDbCompany,
  resolveMarketPriceDbScore,
} from "@/lib/marketplace/market-price";
import {
  isPlatformSnapshotSource,
  SNAPSHOT_SOURCE_PLATFORM,
  SNAPSHOT_SOURCE_SNKRDUNK,
  type MarketDataSource,
} from "@/lib/marketplace/snapshot-source";
import { handleCronRoute } from "@/lib/cron/request";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, Tables, TablesInsert } from "@/types/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const LOOKBACK_DAYS = 30;
const LATEST_PRICES_COUNT = 5;
const PRODUCT_ID_BATCH_SIZE = 50;
const UPSERT_BATCH_SIZE = 50;
const SNAPSHOT_PAGE_SIZE = 1000;

type SnapshotRow = Pick<
  Tables<"product_price_snapshots">,
  | "product_id"
  | "price_hkd"
  | "snapshot_date"
  | "grading_company"
  | "grading_score"
  | "condition_type"
  | "created_at"
  | "source"
>;

type SnapshotWithPrice = SnapshotRow & { price_hkd: number };

type ChartPoint = { date: string; price: number };

type MarketPriceUpsert = Pick<
  TablesInsert<"product_grading_market_prices">,
  | "product_id"
  | "grading_company"
  | "grading_score"
  | "market_avg_price"
  | "market_trend_30d"
  | "market_chart_data"
  | "market_data_source"
  | "updated_at"
> & {
  grading_score: string;
};

function getLookbackDate(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - LOOKBACK_DAYS);
  return date.toISOString().slice(0, 10);
}

function gradingGroupKey(snapshot: SnapshotRow): string {
  const company = resolveMarketPriceDbCompany(
    snapshot.grading_company,
    snapshot.condition_type,
  );
  const score = resolveMarketPriceDbScore(
    snapshot.grading_company,
    snapshot.grading_score,
    snapshot.condition_type,
  );
  return `${company}\0${score}`;
}

function toMMDD(snapshotDate: string): string {
  const [, month, day] = snapshotDate.split("-");
  return `${month}-${day}`;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function isValidPrice(price: number | null): price is number {
  return price != null && Number.isFinite(price) && price > 0;
}

function compareSnapshotsAsc(a: SnapshotRow, b: SnapshotRow): number {
  const dateCmp = a.snapshot_date.localeCompare(b.snapshot_date);
  if (dateCmp !== 0) {
    return dateCmp;
  }
  return a.created_at.localeCompare(b.created_at);
}

function compareSnapshotsDesc(a: SnapshotRow, b: SnapshotRow): number {
  return compareSnapshotsAsc(b, a);
}

function buildChartData(validSnapshots: SnapshotWithPrice[]): ChartPoint[] {
  const pricesByDate = new Map<string, number[]>();

  for (const snapshot of validSnapshots) {
    const prices = pricesByDate.get(snapshot.snapshot_date) ?? [];
    prices.push(snapshot.price_hkd);
    pricesByDate.set(snapshot.snapshot_date, prices);
  }

  return [...pricesByDate.entries()]
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
    .map(([snapshotDate, prices]) => ({
      date: toMMDD(snapshotDate),
      price: round2(
        prices.reduce((sum, price) => sum + price, 0) / prices.length,
      ),
    }));
}

function computeGroupMetrics(
  snapshots: SnapshotRow[],
  marketDataSource: MarketDataSource,
): MarketPriceUpsert | null {
  const validSnapshots = snapshots
    .filter((snapshot): snapshot is SnapshotWithPrice =>
      isValidPrice(snapshot.price_hkd),
    )
    .sort(compareSnapshotsAsc);

  if (validSnapshots.length === 0) {
    return null;
  }

  const representative = validSnapshots[0];
  const chartData = buildChartData(validSnapshots);

  const latestSnapshots = [...validSnapshots]
    .sort(compareSnapshotsDesc)
    .slice(0, LATEST_PRICES_COUNT);

  const marketAvgPrice = round2(
    latestSnapshots.reduce((sum, snapshot) => sum + snapshot.price_hkd, 0) /
      latestSnapshots.length,
  );

  let marketTrend30d = 0;
  if (validSnapshots.length > 1) {
    const oldestPrice = validSnapshots[0].price_hkd;
    const latestPrice = validSnapshots[validSnapshots.length - 1].price_hkd;
    marketTrend30d = round2(((latestPrice - oldestPrice) / oldestPrice) * 100);
  }

  return {
    product_id: representative.product_id,
    grading_company: resolveMarketPriceDbCompany(
      representative.grading_company,
      representative.condition_type,
    ),
    grading_score: resolveMarketPriceDbScore(
      representative.grading_company,
      representative.grading_score,
      representative.condition_type,
    ),
    market_avg_price: marketAvgPrice,
    market_trend_30d: marketTrend30d,
    market_chart_data: chartData as unknown as Json,
    market_data_source: marketDataSource,
    updated_at: new Date().toISOString(),
  };
}

function pickSnapshotsForAggregation(
  snapshots: SnapshotRow[],
): { snapshots: SnapshotRow[]; source: MarketDataSource } | null {
  const snkrdunkSnapshots = snapshots.filter((snapshot) =>
    !isPlatformSnapshotSource(snapshot.source),
  );
  const platformSnapshots = snapshots.filter((snapshot) =>
    isPlatformSnapshotSource(snapshot.source),
  );

  if (snkrdunkSnapshots.some((snapshot) => isValidPrice(snapshot.price_hkd))) {
    return {
      snapshots: snkrdunkSnapshots,
      source: SNAPSHOT_SOURCE_SNKRDUNK,
    };
  }

  if (platformSnapshots.some((snapshot) => isValidPrice(snapshot.price_hkd))) {
    return {
      snapshots: platformSnapshots,
      source: SNAPSHOT_SOURCE_PLATFORM,
    };
  }

  return null;
}

function validHkdSnapshotQuery<T extends ReturnType<typeof createAdminClient>>(
  supabase: T,
  lookbackDate: string,
) {
  return supabase
    .from("product_price_snapshots")
    .select("product_id")
    .gte("snapshot_date", lookbackDate)
    .not("price_hkd", "is", null)
    .gt("price_hkd", 0);
}

async function fetchRecentProductIds(
  lookbackDate: string,
): Promise<string[]> {
  const supabase = createAdminClient();
  const productIds = new Set<string>();
  let offset = 0;

  while (true) {
    const { data, error } = await validHkdSnapshotQuery(supabase, lookbackDate)
      .order("product_id", { ascending: true })
      .range(offset, offset + SNAPSHOT_PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Failed to fetch product ids: ${error.message}`);
    }

    if (!data?.length) {
      break;
    }

    for (const row of data) {
      productIds.add(row.product_id);
    }

    if (data.length < SNAPSHOT_PAGE_SIZE) {
      break;
    }

    offset += SNAPSHOT_PAGE_SIZE;
  }

  return [...productIds];
}

async function fetchSnapshotsForProducts(
  productIds: string[],
  lookbackDate: string,
): Promise<SnapshotRow[]> {
  const supabase = createAdminClient();
  const snapshots: SnapshotRow[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("product_price_snapshots")
      .select(
        "product_id, price_hkd, snapshot_date, grading_company, grading_score, condition_type, created_at, source",
      )
      .in("product_id", productIds)
      .gte("snapshot_date", lookbackDate)
      .not("price_hkd", "is", null)
      .gt("price_hkd", 0)
      .order("snapshot_date", { ascending: true })
      .order("created_at", { ascending: true })
      .range(offset, offset + SNAPSHOT_PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Failed to fetch snapshots: ${error.message}`);
    }

    if (!data?.length) {
      break;
    }

    snapshots.push(...data);

    if (data.length < SNAPSHOT_PAGE_SIZE) {
      break;
    }

    offset += SNAPSHOT_PAGE_SIZE;
  }

  return snapshots;
}

async function upsertMarketPrices(rows: MarketPriceUpsert[]): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }

  const supabase = createAdminClient();
  let upserted = 0;

  for (let index = 0; index < rows.length; index += UPSERT_BATCH_SIZE) {
    const batch = rows.slice(index, index + UPSERT_BATCH_SIZE);
    const batchNumber = Math.floor(index / UPSERT_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(rows.length / UPSERT_BATCH_SIZE);

    console.log(
      `[cron/aggregate-prices] Upserting batch ${batchNumber}/${totalBatches} (${batch.length} rows)`,
    );

    const { error } = await supabase
      .from("product_grading_market_prices")
      .upsert(batch, {
        onConflict: "product_id,grading_company,grading_score",
      });

    if (error) {
      throw new Error(`Failed to upsert market prices: ${error.message}`);
    }

    upserted += batch.length;
  }

  return upserted;
}

function aggregateSnapshots(
  snapshots: SnapshotRow[],
): MarketPriceUpsert[] {
  const grouped = new Map<string, SnapshotRow[]>();

  for (const snapshot of snapshots) {
    const key = `${snapshot.product_id}\0${gradingGroupKey(snapshot)}`;
    const group = grouped.get(key) ?? [];
    group.push(snapshot);
    grouped.set(key, group);
  }

  const results: MarketPriceUpsert[] = [];

  for (const groupSnapshots of grouped.values()) {
    const picked = pickSnapshotsForAggregation(groupSnapshots);
    if (!picked) {
      continue;
    }

    const metrics = computeGroupMetrics(picked.snapshots, picked.source);
    if (metrics) {
      results.push(metrics);
    }
  }

  return results;
}

async function runAggregatePrices(): Promise<NextResponse> {
  const lookbackDate = getLookbackDate();

  console.log(
    `[cron/aggregate-prices] Starting aggregation (lookbackDate=${lookbackDate})`,
  );

  const productIds = await fetchRecentProductIds(lookbackDate);

  console.log(
    `[cron/aggregate-prices] Found ${productIds.length} products with valid HKD snapshots`,
  );

  if (productIds.length === 0) {
    console.log("[cron/aggregate-prices] No products to process — exiting");
    return NextResponse.json({
      success: true,
      data: {
        lookbackDate,
        productsProcessed: 0,
        rowsUpserted: 0,
      },
    });
  }

  let rowsUpserted = 0;
  const totalProductBatches = Math.ceil(
    productIds.length / PRODUCT_ID_BATCH_SIZE,
  );

  for (let index = 0; index < productIds.length; index += PRODUCT_ID_BATCH_SIZE) {
    const productBatch = productIds.slice(index, index + PRODUCT_ID_BATCH_SIZE);
    const batchNumber = Math.floor(index / PRODUCT_ID_BATCH_SIZE) + 1;

    console.log(
      `[cron/aggregate-prices] Processing product batch ${batchNumber}/${totalProductBatches} (${productBatch.length} products)`,
    );

    const snapshots = await fetchSnapshotsForProducts(productBatch, lookbackDate);
    const marketPrices = aggregateSnapshots(snapshots);

    console.log(
      `[cron/aggregate-prices] Aggregated ${marketPrices.length} grading groups from ${snapshots.length} snapshots`,
    );

    const batchUpserted = await upsertMarketPrices(marketPrices);
    rowsUpserted += batchUpserted;
  }

  console.log(
    `[cron/aggregate-prices] Complete — productsProcessed=${productIds.length}, rowsUpserted=${rowsUpserted}`,
  );

  return NextResponse.json({
    success: true,
    data: {
      lookbackDate,
      productsProcessed: productIds.length,
      rowsUpserted,
    },
  });
}

export async function GET(request: Request) {
  return handleCronRoute(
    request,
    runAggregatePrices,
    "[cron/aggregate-prices]",
    "Failed to aggregate market prices",
  );
}

export async function POST(request: Request) {
  return handleCronRoute(
    request,
    runAggregatePrices,
    "[cron/aggregate-prices]",
    "Failed to aggregate market prices",
  );
}
