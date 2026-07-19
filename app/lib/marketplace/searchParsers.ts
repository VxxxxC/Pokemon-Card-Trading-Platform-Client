import type { GradeFilter } from "@/app/lib/marketplace/types";
import {
  getGradingOption,
  hasGradingOption,
  normalizeGradingCompany,
} from "@/lib/grading/options";
import {
  getMarketplaceSealStateOption,
  isMarketplaceSealStateKey,
  type MarketplaceSellerSourceKey,
} from "@/lib/marketplace/filter-options";

const MAX_QUERY_LENGTH = 100;

function normalizeText(raw: string | undefined, max = MAX_QUERY_LENGTH): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().slice(0, max);
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Parse marketplace search input.
 * - "sv2a-062" / "sv2a 062" → structured set + card (AND match in RPC).
 * - Everything else → unified keyword (OR match across name/set/card/display_id).
 */
export function parseCatalogSearchQuery(query: string | undefined): {
  setCode: string | null;
  cardNumber: string | null;
  keyword: string | null;
} {
  const normalized = normalizeText(query);
  if (!normalized) {
    return { setCode: null, cardNumber: null, keyword: null };
  }

  const combo = normalized.match(/^([a-zA-Z0-9]+)[\s\-\/#]+([a-zA-Z0-9]+)$/);
  if (combo) {
    const left = combo[1];
    const right = combo[2];
    const leftHasLetter = /[a-zA-Z]/.test(left);
    const rightIsNumeric = /^\d+$/.test(right);

    if (leftHasLetter && rightIsNumeric) {
      return {
        setCode: left,
        cardNumber: right,
        keyword: null,
      };
    }
  }

  return { setCode: null, cardNumber: null, keyword: normalized };
}

/** Map unified grading option ids (or legacy chip labels) to RPC grade filter objects. */
export function parseGradeFilters(activeGrades: string[]): GradeFilter[] {
  return activeGrades.map((gradeKey) => {
    if (isMarketplaceSealStateKey(gradeKey)) {
      const option = getMarketplaceSealStateOption(gradeKey)!;
      return { company: option.company, score: option.score };
    }

    if (hasGradingOption(gradeKey)) {
      const option = getGradingOption(gradeKey);
      return { company: option.company, score: option.score };
    }

    const trimmed = gradeKey.trim();
    const upper = trimmed.toUpperCase();

    if (upper === "RAW") return { company: "RAW", score: null };
    if (upper === "OTHER") return { company: "OTHER", score: null };

    const [company, ...scoreParts] = trimmed.split(/\s+/);
    const companyUpper = normalizeGradingCompany(company);

    if (
      companyUpper !== "OTHER" &&
      scoreParts.length > 0 &&
      (companyUpper === "PSA" ||
        companyUpper === "CGC" ||
        companyUpper === "BGS" ||
        companyUpper === "ARS" ||
        companyUpper === "RAW")
    ) {
      return { company: companyUpper, score: scoreParts.join(" ") };
    }

    return { company: companyUpper, score: null };
  });
}

/** Map UI seller source chips to RPC seller mode values. */
export function mapSellerModes(
  sellerTypes: string[],
): MarketplaceSellerSourceKey[] {
  return sellerTypes
    .map((type) => {
      if (type === "MERCHANT") return "MERCHANT";
      if (type === "MEMBER" || type === "C2C") return "MEMBER";
      return null;
    })
    .filter((mode): mode is MarketplaceSellerSourceKey => mode !== null);
}

export function normalizeMarketplaceText(
  raw: string | undefined,
  max = MAX_QUERY_LENGTH,
): string | null {
  return normalizeText(raw, max);
}
