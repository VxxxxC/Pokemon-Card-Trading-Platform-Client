import { normalizeGradingCompany } from "@/lib/grading/options";
import {
  GRADED_CONDITION_TYPE,
  isRawConditionCode,
  RAW_MARKET_PRICE_GRADING_SCORE,
} from "@/lib/marketplace/market-price";
import { SNAPSHOT_SOURCE_PLATFORM } from "@/lib/marketplace/snapshot-source";
import type { TablesInsert } from "@/types/supabase";

export type CompletedPlatformTradeRow = {
  orderId: string;
  finalPrice: number;
  createdAt: string;
  productId: string;
  gradingCompany: string;
  gradingScore: string | null;
};

export function resolvePlatformSnapshotConditionType(
  gradingCompany: string,
  gradingScore: string | null,
): string {
  const company = normalizeGradingCompany(gradingCompany);

  if (company === "RAW") {
    const score = (gradingScore ?? "").trim().toUpperCase();
    if (isRawConditionCode(score)) {
      return score;
    }
    return RAW_MARKET_PRICE_GRADING_SCORE;
  }

  return GRADED_CONDITION_TYPE;
}

export function buildPlatformSnapshotInsert(
  trade: CompletedPlatformTradeRow,
): TablesInsert<"product_price_snapshots"> {
  const finalPrice = Number(trade.finalPrice);
  if (!Number.isFinite(finalPrice) || finalPrice <= 0) {
    throw new Error(`Invalid final price for order ${trade.orderId}`);
  }

  const createdAt = trade.createdAt.trim();
  const snapshotDate = createdAt.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshotDate)) {
    throw new Error(`Invalid created_at for order ${trade.orderId}`);
  }

  return {
    product_id: trade.productId,
    price_hkd: finalPrice,
    price_jpy: 0,
    snapshot_date: snapshotDate,
    grading_company: trade.gradingCompany,
    grading_score: trade.gradingScore,
    condition_type: resolvePlatformSnapshotConditionType(
      trade.gradingCompany,
      trade.gradingScore,
    ),
    source: SNAPSHOT_SOURCE_PLATFORM,
    member_order_id: trade.orderId,
  };
}
