import { describe, expect, test } from "bun:test";
import { parseCatalogSearchQuery } from "@/app/lib/marketplace/searchParsers";

describe("parseCatalogSearchQuery", () => {
  test("parses structured set + card queries", () => {
    expect(parseCatalogSearchQuery("sv2a-062")).toEqual({
      setCode: "sv2a",
      cardNumber: "062",
      keyword: null,
    });
    expect(parseCatalogSearchQuery("sv2a 062")).toEqual({
      setCode: "sv2a",
      cardNumber: "062",
      keyword: null,
    });
  });

  test("keeps promo-style ids on keyword path", () => {
    for (const query of ["MP133", "M P 133", "M-P-133", "133MP", "133 MP"]) {
      expect(parseCatalogSearchQuery(query)).toEqual({
        setCode: null,
        cardNumber: null,
        keyword: query,
      });
    }
  });
});
