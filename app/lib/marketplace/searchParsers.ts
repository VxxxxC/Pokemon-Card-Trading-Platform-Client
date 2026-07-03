import type { GradeFilter } from "@/app/lib/marketplace/types";
import {
  getGradingOption,
  hasGradingOption,
  normalizeGradingCompany,
} from "@/lib/grading/options";
import type { MarketplaceSellerSourceKey } from "@/lib/marketplace/filter-options";

const MAX_QUERY_LENGTH = 100;
const KNOWN_GRADING_COMPANIES = new Set(["PSA", "CGC", "BGS", "RAW", "ARS"]);

function normalizeText(raw: string | undefined, max = MAX_QUERY_LENGTH): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().slice(0, max);
  return trimmed.length > 0 ? trimmed : null;
}

/** Split "sv2a-062" / "sv2a 062" into set + card number when possible. */
export function parseCatalogSearchQuery(query: string | undefined): {
  setCode: string | null;
  cardNumber: string | null;
  nameQuery: string | null;
} {
  const normalized = normalizeText(query);
  if (!normalized) {
    return { setCode: null, cardNumber: null, nameQuery: null };
  }

  const combo = normalized.match(/^([a-zA-Z0-9]+)[\s\-\/#]+([a-zA-Z0-9]+)$/);
  if (combo) {
    return {
      setCode: combo[1],
      cardNumber: combo[2],
      nameQuery: null,
    };
  }

  if (/^[a-zA-Z0-9]{2,12}$/.test(normalized)) {
    return { setCode: normalized, cardNumber: null, nameQuery: null };
  }

  return { setCode: null, cardNumber: null, nameQuery: normalized };
}

/** Map unified grading option ids (or legacy chip labels) to RPC grade filter objects. */
export function parseGradeFilters(activeGrades: string[]): GradeFilter[] {
  return activeGrades.map((gradeKey) => {
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

    if (KNOWN_GRADING_COMPANIES.has(companyUpper) && scoreParts.length > 0) {
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
