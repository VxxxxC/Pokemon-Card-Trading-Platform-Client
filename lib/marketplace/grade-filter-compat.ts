import {
  OTHER_GRADING_OPTION_ID,
  hasGradingOption,
} from "@/lib/grading/options";
import { isMarketplaceSealStateKey } from "@/lib/marketplace/filter-options";

export function isSealStateGradeKey(key: string): boolean {
  return isMarketplaceSealStateKey(key);
}

export function isCardGradeFilterKey(key: string): boolean {
  if (isSealStateGradeKey(key)) return false;
  if (hasGradingOption(key)) return true;
  if (key === OTHER_GRADING_OPTION_ID) return true;
  return key.startsWith("raw:");
}

export function pruneIncompatibleGradeKeys(
  activeGrades: string[],
  toggledKey: string,
): string[] {
  if (activeGrades.includes(toggledKey)) {
    return activeGrades.filter((key) => key !== toggledKey);
  }

  const withoutConflicts = activeGrades.filter((key) => {
    if (isSealStateGradeKey(toggledKey)) {
      return !isCardGradeFilterKey(key);
    }
    if (isCardGradeFilterKey(toggledKey)) {
      return !isSealStateGradeKey(key);
    }
    return true;
  });

  return [...withoutConflicts, toggledKey];
}

export function pruneGradesForProductKinds(
  activeGrades: string[],
  productKinds: string[],
): string[] {
  if (productKinds.length === 0) {
    return activeGrades;
  }

  const hasCard = productKinds.includes("single_card");
  const hasSealed = productKinds.includes("sealed_product");

  if (hasCard && hasSealed) {
    return activeGrades;
  }

  if (hasSealed) {
    return activeGrades.filter((key) => isSealStateGradeKey(key));
  }

  if (hasCard) {
    return activeGrades.filter((key) => !isSealStateGradeKey(key));
  }

  return activeGrades;
}
