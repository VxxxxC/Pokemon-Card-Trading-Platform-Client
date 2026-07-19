import type { CatalogType } from "@/lib/constants/commerce";
import {
  CATALOG_TYPES_BOX_SET,
  CATALOG_TYPES_CARD,
} from "@/lib/constants/commerce";

export type CatalogItemKind = "card" | "box_set";

export const SEALED_PRODUCT_GRADING_COMPANY = "OTHER" as const;
export const SEALED_PRODUCT_SCORES = ["SEALED", "UNSEALED"] as const;
export type SealedProductScore = (typeof SEALED_PRODUCT_SCORES)[number];

/** @deprecated Use sealedProductGradingFields() — legacy rows may still use company SEALED */
export const SEALED_LISTING_GRADE = {
  gradingCompany: SEALED_PRODUCT_GRADING_COMPANY,
  gradingScore: "SEALED" as SealedProductScore,
} as const;

export function isSealedCatalogType(type: CatalogType): boolean {
  return (CATALOG_TYPES_BOX_SET as readonly string[]).includes(type);
}

export function isCardCatalogType(type: CatalogType): boolean {
  return (CATALOG_TYPES_CARD as readonly string[]).includes(type);
}

export function catalogItemKindFromType(type: CatalogType): CatalogItemKind {
  return isSealedCatalogType(type) ? "box_set" : "card";
}

export function catalogTypesForItemKind(itemKind: CatalogItemKind): CatalogType[] {
  return itemKind === "box_set" ? [...CATALOG_TYPES_BOX_SET] : [...CATALOG_TYPES_CARD];
}

export function parseSealState(
  value: string | null | undefined,
): SealedProductScore | null {
  if (value === "SEALED" || value === "UNSEALED") return value;
  return null;
}

export function isSealedProductGrade(
  company: string,
  score: string | null | undefined,
): boolean {
  const normalizedCompany = company.toUpperCase().trim();
  if (normalizedCompany === "SEALED") return true;
  return (
    normalizedCompany === SEALED_PRODUCT_GRADING_COMPANY &&
    score != null &&
    (SEALED_PRODUCT_SCORES as readonly string[]).includes(score)
  );
}

export function defaultSealedProductScore(): SealedProductScore {
  return "SEALED";
}

export function normalizeSealedProductScore(
  company: string,
  score: string | null | undefined,
): SealedProductScore {
  const parsed = parseSealState(score);
  if (parsed) return parsed;
  if (company.toUpperCase().trim() === "SEALED") return "SEALED";
  return defaultSealedProductScore();
}

export function formatSealedProductLabel(
  company: string,
  score: string | null | undefined,
): string {
  const sealState = normalizeSealedProductScore(company, score);
  return sealState === "UNSEALED" ? "已開封" : "密封";
}

export function sealedProductGradingFields(
  sealState: SealedProductScore = defaultSealedProductScore(),
): { gradingCompany: typeof SEALED_PRODUCT_GRADING_COMPANY; gradingScore: SealedProductScore } {
  return {
    gradingCompany: SEALED_PRODUCT_GRADING_COMPANY,
    gradingScore: sealState,
  };
}

/** Synthetic grading option id aligned with MARKETPLACE_SEAL_STATE_OPTIONS keys. */
export function sealedProductGradingOptionId(
  score: SealedProductScore,
): string {
  return `sealed:${score}`;
}
