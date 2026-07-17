import { describe, expect, test } from "bun:test";
import {
  parseListingImageObjects,
  parseListingImageUrls,
  resolveListingCoverImageUrl,
} from "@/lib/listings/images";

describe("parseListingImageUrls", () => {
  test("parses standard ordered objects", () => {
    const value = [
      { url: "https://cdn.example/b.jpg", order: 2 },
      { url: "https://cdn.example/a.jpg", order: 1 },
    ];

    expect(parseListingImageUrls(value)).toEqual([
      "https://cdn.example/a.jpg",
      "https://cdn.example/b.jpg",
    ]);
  });

  test("parses legacy string array", () => {
    expect(
      parseListingImageUrls([
        "https://cdn.example/1.jpg",
        "https://cdn.example/2.jpg",
      ]),
    ).toEqual(["https://cdn.example/1.jpg", "https://cdn.example/2.jpg"]);
  });

  test("accepts objects without order using array index", () => {
    expect(
      parseListingImageUrls([
        { url: "https://cdn.example/first.jpg" },
        { url: "https://cdn.example/second.jpg" },
      ]),
    ).toEqual([
      "https://cdn.example/first.jpg",
      "https://cdn.example/second.jpg",
    ]);
  });

  test("accepts string order values", () => {
    expect(
      parseListingImageUrls([
        { url: "https://cdn.example/b.jpg", order: "2" },
        { url: "https://cdn.example/a.jpg", order: "1" },
      ]),
    ).toEqual([
      "https://cdn.example/a.jpg",
      "https://cdn.example/b.jpg",
    ]);
  });

  test("returns empty for invalid or empty input", () => {
    expect(parseListingImageUrls(null)).toEqual([]);
    expect(parseListingImageUrls([])).toEqual([]);
    expect(parseListingImageUrls([{ order: 1 }])).toEqual([]);
    expect(parseListingImageUrls(["", "   "])).toEqual([]);
  });
});

describe("parseListingImageObjects", () => {
  test("preserves remarks when present", () => {
    expect(
      parseListingImageObjects([
        { url: "https://cdn.example/front.jpg", order: 1, remark: "正面" },
      ]),
    ).toEqual([
      {
        url: "https://cdn.example/front.jpg",
        order: 1,
        remark: "正面",
      },
    ]);
  });
});

describe("resolveListingCoverImageUrl", () => {
  test("prefers first listing image over catalog", () => {
    expect(
      resolveListingCoverImageUrl(
        [{ url: "https://cdn.example/listing.jpg", order: 1 }],
        "https://cdn.example/catalog.jpg",
      ),
    ).toBe("https://cdn.example/listing.jpg");
  });

  test("falls back to catalog when listing images are empty", () => {
    expect(
      resolveListingCoverImageUrl([], "https://cdn.example/catalog.jpg"),
    ).toBe("https://cdn.example/catalog.jpg");
  });

  test("returns null when no usable image exists", () => {
    expect(resolveListingCoverImageUrl([], null)).toBeNull();
    expect(resolveListingCoverImageUrl(null, "   ")).toBeNull();
  });
});
