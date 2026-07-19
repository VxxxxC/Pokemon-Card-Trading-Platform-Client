export type MarketplaceQuickCategoryId =
  | "all"
  | "trending"
  | "sar"
  | "ar"
  | "ur"
  | "pikachu"
  | "charizard"
  | "sealed";

export type MarketplaceQuickCategory = {
  id: MarketplaceQuickCategoryId;
  label: string;
};

export const MARKETPLACE_QUICK_CATEGORIES: MarketplaceQuickCategory[] = [
  { id: "all", label: "All" },
  { id: "trending", label: "Trending" },
  { id: "sar", label: "SAR" },
  { id: "ar", label: "AR" },
  { id: "ur", label: "UR" },
  { id: "pikachu", label: "Pikachu" },
  { id: "charizard", label: "Charizard" },
  { id: "sealed", label: "Sealed Box" },
];

/** Build `/marketplace` href for a quick category pill. */
export function marketplaceHrefForQuickCategory(
  categoryId: MarketplaceQuickCategoryId,
): string {
  switch (categoryId) {
    case "all":
      return "/marketplace";
    case "sealed":
      return "/marketplace?kind=sealed_product";
    case "sar":
      return "/marketplace?rarity=SAR";
    case "ar":
      return "/marketplace?rarity=AR";
    case "ur":
      return "/marketplace?rarity=UR";
    case "pikachu":
      return "/marketplace?q=pikachu";
    case "charizard":
      return "/marketplace?q=charizard";
    case "trending":
    default:
      return "/marketplace?sort=latest";
  }
}

export function activeQuickCategoryFromParams(
  searchParams: URLSearchParams,
): MarketplaceQuickCategoryId {
  const kind = searchParams.get("kind");
  if (kind === "sealed_product") return "sealed";

  const rarity = searchParams.get("rarity")?.toUpperCase();
  if (rarity === "SAR") return "sar";
  if (rarity === "AR") return "ar";
  if (rarity === "UR") return "ur";

  const query = searchParams.get("q")?.toLowerCase();
  if (query?.includes("pikachu")) return "pikachu";
  if (query?.includes("charizard")) return "charizard";

  if (searchParams.get("sort") === "latest") return "trending";

  return "all";
}
