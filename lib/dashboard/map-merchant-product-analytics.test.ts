import { describe, expect, test } from "bun:test";
import {
  emptyMerchantProductAnalytics,
  mapMerchantProductAnalyticsRpcPayload,
} from "@/lib/dashboard/map-merchant-product-analytics";

describe("mapMerchantProductAnalyticsRpcPayload", () => {
  test("maps rpc numbers and nested history", () => {
    const result = mapMerchantProductAnalyticsRpcPayload(
      {
        product: {
          id: "prod-1",
          name: " 皮卡丘 ",
          skuNo: "SV-P-001",
          imageUrl: "https://cdn.example/card.png",
        },
        summary: {
          avgSoldPrice: "42000",
          marketLowestPrice: 38000,
          totalViews: "12",
          totalOffers: 3,
        },
        series: [
          {
            label: "週一",
            totalSales: 1000,
            viewCount: "5",
            txCount: 1,
            offerCount: "2",
          },
        ],
        history: {
          items: [
            {
              orderId: "ord-1",
              orderNumber: "ORD-2026-001",
              buyerId: "buyer-1",
              buyerName: "測試買家",
              finalPrice: "5000",
              eventAt: "2026-06-01T10:00:00.000Z",
            },
          ],
          meta: {
            totalCount: 1,
            page: 1,
            pageSize: 6,
            totalPages: 1,
          },
        },
        timeRange: "7d",
      },
      "7d",
      "prod-1",
    );

    expect(result.product.name).toBe("皮卡丘");
    expect(result.summary.avgSoldPrice).toBe(42000);
    expect(result.series[0]?.offerCount).toBe(2);
    expect(result.history.items[0]?.orderNumber).toBe("ORD-2026-001");
    expect(result.timeRange).toBe("7d");
  });

  test("returns empty analytics fallback", () => {
    const result = emptyMerchantProductAnalytics("prod-empty", "1m");
    expect(result.product.id).toBe("prod-empty");
    expect(result.series).toEqual([]);
    expect(result.timeRange).toBe("1m");
  });
});
