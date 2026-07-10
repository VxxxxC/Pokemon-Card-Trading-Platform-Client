import { NextResponse } from "next/server";
import { handleCronRoute } from "@/lib/cron/request";
import {
  buildPlatformSnapshotInsert,
  type CompletedPlatformTradeRow,
} from "@/lib/marketplace/platform-snapshot-ingest";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const LOOKBACK_DAYS = 30;
const ORDER_PAGE_SIZE = 500;
const INSERT_BATCH_SIZE = 100;

type TradeQueryRow = {
  id: string;
  final_price: number;
  created_at: string | null;
  listings: {
    product_id: string;
    grading_company: string;
    grading_score: string | null;
  };
};

function getLookbackIso(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - LOOKBACK_DAYS);
  return date.toISOString();
}

async function fetchCompletedTradesPage(
  lookbackIso: string,
  offset: number,
): Promise<TradeQueryRow[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("member_orders")
    .select(
      `
        id,
        final_price,
        created_at,
        listings!inner (
          product_id,
          grading_company,
          grading_score
        )
      `,
    )
    .eq("status", "completed")
    .gte("created_at", lookbackIso)
    .order("created_at", { ascending: true })
    .range(offset, offset + ORDER_PAGE_SIZE - 1);

  if (error) {
    throw new Error(`Failed to fetch completed trades: ${error.message}`);
  }

  return (data ?? []) as TradeQueryRow[];
}

async function fetchIngestedOrderIds(orderIds: string[]): Promise<Set<string>> {
  if (orderIds.length === 0) {
    return new Set();
  }

  const supabase = createAdminClient();
  const ingested = new Set<string>();

  for (let index = 0; index < orderIds.length; index += INSERT_BATCH_SIZE) {
    const batch = orderIds.slice(index, index + INSERT_BATCH_SIZE);
    const { data, error } = await supabase
      .from("product_price_snapshots")
      .select("member_order_id")
      .in("member_order_id", batch);

    if (error) {
      throw new Error(`Failed to fetch ingested order ids: ${error.message}`);
    }

    for (const row of data ?? []) {
      if (row.member_order_id) {
        ingested.add(row.member_order_id);
      }
    }
  }

  return ingested;
}

function toCompletedTrade(row: TradeQueryRow): CompletedPlatformTradeRow | null {
  const createdAt = row.created_at?.trim();
  if (!createdAt) {
    return null;
  }

  return {
    orderId: row.id,
    finalPrice: Number(row.final_price),
    createdAt,
    productId: row.listings.product_id,
    gradingCompany: row.listings.grading_company,
    gradingScore: row.listings.grading_score,
  };
}

async function insertSnapshotBatch(
  rows: ReturnType<typeof buildPlatformSnapshotInsert>[],
): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("product_price_snapshots").insert(rows);

  if (error) {
    throw new Error(`Failed to insert platform snapshots: ${error.message}`);
  }

  return rows.length;
}

async function runIngestPlatformTrades(): Promise<NextResponse> {
  const lookbackIso = getLookbackIso();

  console.log(
    `[cron/ingest-platform-trades] Starting ingest (lookbackIso=${lookbackIso})`,
  );

  let offset = 0;
  let ordersScanned = 0;
  let snapshotsInserted = 0;
  const pendingInserts: ReturnType<typeof buildPlatformSnapshotInsert>[] = [];

  while (true) {
    const page = await fetchCompletedTradesPage(lookbackIso, offset);
    if (page.length === 0) {
      break;
    }

    ordersScanned += page.length;
    const orderIds = page.map((row) => row.id);
    const ingestedOrderIds = await fetchIngestedOrderIds(orderIds);

    for (const row of page) {
      if (ingestedOrderIds.has(row.id)) {
        continue;
      }

      const trade = toCompletedTrade(row);
      if (!trade) {
        continue;
      }

      try {
        pendingInserts.push(buildPlatformSnapshotInsert(trade));
      } catch (error) {
        console.warn(
          `[cron/ingest-platform-trades] Skip order ${row.id}:`,
          error,
        );
      }
    }

    while (pendingInserts.length >= INSERT_BATCH_SIZE) {
      const batch = pendingInserts.splice(0, INSERT_BATCH_SIZE);
      snapshotsInserted += await insertSnapshotBatch(batch);
    }

    if (page.length < ORDER_PAGE_SIZE) {
      break;
    }

    offset += ORDER_PAGE_SIZE;
  }

  if (pendingInserts.length > 0) {
    snapshotsInserted += await insertSnapshotBatch(pendingInserts);
  }

  console.log(
    `[cron/ingest-platform-trades] Complete — ordersScanned=${ordersScanned}, snapshotsInserted=${snapshotsInserted}`,
  );

  return NextResponse.json({
    success: true,
    data: {
      lookbackIso,
      ordersScanned,
      snapshotsInserted,
    },
  });
}

export async function GET(request: Request) {
  return handleCronRoute(
    request,
    runIngestPlatformTrades,
    "[cron/ingest-platform-trades]",
    "Failed to ingest platform trade snapshots",
  );
}

export async function POST(request: Request) {
  return handleCronRoute(
    request,
    runIngestPlatformTrades,
    "[cron/ingest-platform-trades]",
    "Failed to ingest platform trade snapshots",
  );
}
