/** Minimum compact prefix length for partial identifier matches. */
export const MIN_COMPACT_PREFIX = 4;

const CJK_PATTERN = /[\u3040-\u30ff\u4e00-\u9fff]/;

/**
 * True when the query looks like a card/set identifier (not a display name).
 * Name queries (CJK, English words) should use fast ILIKE-only search paths.
 */
export function isCardIdentifierQuery(query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return false;
  if (CJK_PATTERN.test(trimmed)) return false;
  if (!/[a-zA-Z0-9]/.test(trimmed)) return false;
  if (/^[a-zA-Z]+$/.test(trimmed)) return false;
  if (/[0-9]/.test(trimmed)) return true;
  if (/[^a-zA-Z0-9]/.test(trimmed)) return true;

  const compact = compactAlphanumeric(trimmed);
  return (
    compact.length >= MIN_COMPACT_PREFIX &&
    /[a-z]/.test(compact) &&
    /[0-9]/.test(compact)
  );
}

/**
 * True when catalog autocomplete should use id_compact / id_canonical search.
 * Includes short letter prefixes (e.g. "mp") while excluding long English names.
 */
export function useCompactCatalogSearch(query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return false;
  if (CJK_PATTERN.test(trimmed)) return false;

  const compact = compactAlphanumeric(trimmed);
  if (compact.length < 2) return false;

  if (/^[a-zA-Z]+$/.test(trimmed) && trimmed.length > 4) return false;

  if (/[0-9]/.test(trimmed)) return true;
  if (/[^a-zA-Z0-9]/.test(trimmed)) return true;
  if (/^[a-zA-Z]+$/.test(trimmed) && trimmed.length <= 4) return true;

  return (
    compact.length >= MIN_COMPACT_PREFIX &&
    /[a-z]/.test(compact) &&
    /[0-9]/.test(compact)
  );
}

export function compactAlphanumeric(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function splitSingleToken(token: string): string[] {
  const lower = token.toLowerCase();
  const letterThenDigit = lower.match(/^([a-z0-9]*[a-z])(\d+)$/);
  if (letterThenDigit) {
    return [letterThenDigit[1], letterThenDigit[2]];
  }

  const digitThenLetter = lower.match(/^(\d+)([a-z0-9]*[a-z])$/);
  if (digitThenLetter) {
    return [digitThenLetter[1], digitThenLetter[2]];
  }

  return [lower];
}

export function cardSearchTokens(raw: string): string[] {
  const segments = raw
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  const parts =
    segments.length > 1
      ? segments
      : segments[0]
        ? splitSingleToken(segments[0])
        : [];

  return parts.slice().sort();
}

export function canonicalCardSearchKey(raw: string): string {
  return cardSearchTokens(raw).join("");
}

function compactContains(haystack: string, needle: string): boolean {
  if (!needle) return false;
  if (haystack === needle) return true;
  if (needle.length < MIN_COMPACT_PREFIX) return false;
  return haystack.includes(needle);
}

function canonicalMatches(query: string, target: string): boolean {
  const queryKey = canonicalCardSearchKey(query);
  const targetKey = canonicalCardSearchKey(target);
  if (!queryKey || !targetKey) return false;
  if (queryKey === targetKey) return true;
  if (queryKey.length < MIN_COMPACT_PREFIX) return false;
  return targetKey.includes(queryKey);
}

export function matchesCardIdentifier(
  query: string,
  ...targets: (string | null | undefined)[]
): boolean {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return true;

  const queryLower = normalizedQuery.toLowerCase();
  const queryCompact = compactAlphanumeric(normalizedQuery);
  const allowLiteral =
    /[^a-z0-9]/i.test(normalizedQuery) ||
    normalizedQuery.length >= MIN_COMPACT_PREFIX;

  for (const target of targets) {
    const value = target?.trim();
    if (!value) continue;

    if (allowLiteral && value.toLowerCase().includes(queryLower)) return true;

    const targetCompact = compactAlphanumeric(value);
    if (queryCompact && compactContains(targetCompact, queryCompact)) {
      return true;
    }
    if (
      queryCompact &&
      targetCompact.length >= MIN_COMPACT_PREFIX &&
      compactContains(queryCompact, targetCompact)
    ) {
      return true;
    }

    if (canonicalMatches(normalizedQuery, value)) return true;
  }

  return false;
}

export type CatalogSearchFields = {
  name_ja?: string | null;
  name_en?: string | null;
  name_zh?: string | null;
  set_code?: string | null;
  card_number?: string | null;
  display_id?: string | null;
};

export function matchesCatalogNameSearch(
  query: string,
  catalog: CatalogSearchFields,
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const names = [catalog.name_ja, catalog.name_en, catalog.name_zh]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.toLowerCase());

  return names.some((name) => name.includes(normalizedQuery));
}

export function matchesCatalogCardSearch(
  query: string,
  catalog: CatalogSearchFields,
): boolean {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return true;

  if (matchesCatalogNameSearch(normalizedQuery, catalog)) return true;

  const setCode = catalog.set_code?.trim() ?? "";
  const cardNumber = catalog.card_number?.trim() ?? "";
  const displayId = catalog.display_id?.trim() ?? "";

  if (
    matchesCardIdentifier(
      normalizedQuery,
      displayId,
      setCode,
      cardNumber,
    )
  ) {
    return true;
  }

  if (setCode && cardNumber) {
    return matchesCardIdentifier(
      normalizedQuery,
      `${setCode}${cardNumber}`,
      `${setCode}-${cardNumber}`,
      `${setCode} ${cardNumber}`,
      `${cardNumber}${setCode}`,
      `${cardNumber} ${setCode}`,
    );
  }

  return false;
}
