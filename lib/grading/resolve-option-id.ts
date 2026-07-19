import {
  isSealedProductGrade,
  normalizeSealedProductScore,
  sealedProductGradingOptionId,
} from "@/lib/catalog/item-kind";
import {
  DEFAULT_GRADING_OPTION_ID,
  GRADING_OPTIONS,
  OTHER_GRADING_OPTION_ID,
  isOtherGradingCompany,
  normalizeGradingCompany,
  type RawCondition,
} from "@/lib/grading/options";

/** Reverse-map DB `grading_company` + `grading_score` to a grading option id. */
export function resolveGradingOptionId(
  gradingCompany: string,
  gradingScore: string | null | undefined,
): string {
  const normalized = normalizeGradingCompany(gradingCompany);

  if (normalized === "RAW") {
    const condition = (gradingScore?.trim() || "A") as RawCondition;
    const rawId = `raw:${condition}`;
    return GRADING_OPTIONS.some((option) => option.id === rawId)
      ? rawId
      : DEFAULT_GRADING_OPTION_ID;
  }

  if (isSealedProductGrade(gradingCompany, gradingScore)) {
    return sealedProductGradingOptionId(
      normalizeSealedProductScore(gradingCompany, gradingScore),
    );
  }

  if (isOtherGradingCompany(gradingCompany)) {
    return OTHER_GRADING_OPTION_ID;
  }

  const score = (gradingScore ?? "").trim();
  const match = GRADING_OPTIONS.find(
    (option) =>
      option.company === normalized && (option.score ?? "") === score,
  );

  return match?.id ?? DEFAULT_GRADING_OPTION_ID;
}
