import { describe, expect, test } from "bun:test";
import {
  canonicalCardSearchKey,
  compactAlphanumeric,
  isCardIdentifierQuery,
  matchesCardIdentifier,
  matchesCatalogCardSearch,
  useCompactCatalogSearch,
} from "@/lib/search/card-identifier";

describe("compactAlphanumeric", () => {
  test("strips separators", () => {
    expect(compactAlphanumeric("M-P-133")).toBe("mp133");
    expect(compactAlphanumeric("M P 133")).toBe("mp133");
    expect(compactAlphanumeric("MP133")).toBe("mp133");
  });
});

describe("canonicalCardSearchKey", () => {
  test("matches promo id variants", () => {
    expect(canonicalCardSearchKey("M-P-133")).toBe("133mp");
    expect(canonicalCardSearchKey("MP133")).toBe("133mp");
    expect(canonicalCardSearchKey("133MP")).toBe("133mp");
    expect(canonicalCardSearchKey("133 MP")).toBe("133mp");
  });

  test("matches set + card variants", () => {
    expect(canonicalCardSearchKey("sv2a-062")).toBe("062sv2a");
    expect(canonicalCardSearchKey("sv2a062")).toBe("062sv2a");
    expect(canonicalCardSearchKey("062sv2a")).toBe("062sv2a");
  });
});

describe("matchesCardIdentifier", () => {
  test("finds M-P-133 from flexible queries", () => {
    const target = "M-P-133";
    for (const query of ["MP133", "M P 133", "133MP", "133 MP", "M-P-133"]) {
      expect(matchesCardIdentifier(query, target)).toBe(true);
    }
  });

  test("does not match unrelated short queries", () => {
    expect(matchesCardIdentifier("MP", "M-P-133")).toBe(false);
    expect(matchesCardIdentifier("13", "M-P-133")).toBe(false);
  });

  test("supports compact prefix when long enough", () => {
    expect(matchesCardIdentifier("MP13", "M-P-133")).toBe(true);
  });
});

describe("useCompactCatalogSearch", () => {
  test("routes short id prefixes and id variants to compact search", () => {
    expect(useCompactCatalogSearch("mp")).toBe(true);
    expect(useCompactCatalogSearch("mp 133")).toBe(true);
    expect(useCompactCatalogSearch("MP133")).toBe(true);
    expect(useCompactCatalogSearch("M-P-133")).toBe(true);
    expect(useCompactCatalogSearch("sv2a")).toBe(true);
    expect(useCompactCatalogSearch("062")).toBe(true);
  });

  test("keeps CJK and long English names on ILIKE path", () => {
    expect(useCompactCatalogSearch("ピカチュウ")).toBe(false);
    expect(useCompactCatalogSearch("皮卡丘")).toBe(false);
    expect(useCompactCatalogSearch("Pikachu")).toBe(false);
    expect(useCompactCatalogSearch("box")).toBe(true);
  });
});

describe("isCardIdentifierQuery", () => {
  test("treats CJK and English names as name queries", () => {
    expect(isCardIdentifierQuery("ピカチュウ")).toBe(false);
    expect(isCardIdentifierQuery("皮卡丘")).toBe(false);
    expect(isCardIdentifierQuery("Pikachu")).toBe(false);
    expect(isCardIdentifierQuery("box")).toBe(false);
  });

  test("treats card id variants as identifier queries", () => {
    expect(isCardIdentifierQuery("MP133")).toBe(true);
    expect(isCardIdentifierQuery("M-P-133")).toBe(true);
    expect(isCardIdentifierQuery("sv2a")).toBe(true);
    expect(isCardIdentifierQuery("062")).toBe(true);
    expect(isCardIdentifierQuery("sv2a 062")).toBe(true);
  });
});

describe("matchesCatalogCardSearch", () => {
  const catalog = {
    name_ja: "ピカチュウ",
    name_zh: "皮卡丘",
    set_code: "M-P",
    card_number: "133",
    display_id: "M-P-133",
  };

  test("matches flexible card identifiers", () => {
    expect(matchesCatalogCardSearch("MP133", catalog)).toBe(true);
    expect(matchesCatalogCardSearch("133 MP", catalog)).toBe(true);
  });

  test("still matches names literally", () => {
    expect(matchesCatalogCardSearch("皮卡丘", catalog)).toBe(true);
  });
});
