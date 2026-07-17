import { describe, expect, test } from "bun:test";
import {
  emptyMerchantPerformanceAnalytics,
  mapMerchantPerformanceRpcPayload,
} from "@/lib/dashboard/map-merchant-performance";

describe("mapMerchantPerformanceRpcPayload", () => {
  test("maps rpc numbers and spender avatars", () => {
    const mapped = mapMerchantPerformanceRpcPayload(
      {
        allTime: { turnover: "1000", txCount: 2, avgPrice: 500 },
        interval: { turnover: 300, txCount: 1, avgPrice: 300 },
        series: [{ label: "週一", turnover: 300, txCount: 1, avgPrice: 300 }],
        topProducts: [
          {
            rank: 1,
            productId: "prod-1",
            name: "Pikachu",
            skuNo: "sv2a-173",
            volume: 3,
            revenue: 900,
          },
        ],
        topSpenders: [
          {
            rank: 1,
            buyerId: "buyer-1",
            name: "Ash",
            avatarPath: "https://cdn.example.com/avatars/buyer.jpg",
            spending: 1200,
          },
        ],
        timeRange: "7d",
      },
      "7d",
    );

    expect(mapped.allTime.turnover).toBe(1000);
    expect(mapped.interval.txCount).toBe(1);
    expect(mapped.series[0]?.label).toBe("週一");
    expect(mapped.topProducts[0]?.skuNo).toBe("sv2a-173");
    expect(mapped.topSpenders[0]?.avatarUrl).toContain("cdn.example.com");
  });

  test("returns empty analytics fallback", () => {
    const empty = emptyMerchantPerformanceAnalytics("12m");
    expect(empty.timeRange).toBe("12m");
    expect(empty.series).toEqual([]);
  });
});
