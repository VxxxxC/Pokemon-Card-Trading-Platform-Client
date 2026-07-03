/**
 * Pokémon TCG element type labels for `product_catalog.element_type`.
 * Maps JP / EN catalog values to Traditional Chinese (繁體中文).
 */

const ELEMENT_TYPE_ZH: Record<string, string> = {
  // Japanese (kanji / kana / romaji keys)
  草: "草",
  くさ: "草",
  kusa: "草",
  炎: "火",
  ほのお: "火",
  honoo: "火",
  火: "火",
  水: "水",
  みず: "水",
  mizu: "水",
  雷: "雷",
  かみなり: "雷",
  kaminari: "雷",
  超: "超能力",
  超能力: "超能力",
  エスパー: "超能力",
  闘: "格鬥",
  格: "格鬥",
  格闘: "格鬥",
  格鬥: "格鬥",
  かくとう: "格鬥",
  kakutou: "格鬥",
  悪: "惡",
  恶: "惡",
  あく: "惡",
  aku: "惡",
  鋼: "鋼",
  钢: "鋼",
  はがね: "鋼",
  hagane: "鋼",
  ドラゴン: "龍",
  龍: "龍",
  龙: "龍",
  dragon: "龍",
  フェアリー: "妖精",
  妖精: "妖精",
  fairy: "妖精",
  無: "無色",
  无: "無色",
  無色: "無色",
  无色: "無色",
  ノーマル: "一般",
  normal: "一般",
  一般: "一般",

  // English (Pokémon TCG)
  grass: "草",
  fire: "火",
  water: "水",
  lightning: "雷",
  electric: "雷",
  psychic: "超能力",
  fighting: "格鬥",
  darkness: "惡",
  dark: "惡",
  metal: "鋼",
  steel: "鋼",
  colorless: "無色",
  colourless: "無色",

  // Simplified → Traditional (if catalog stores simplified)
  格斗: "格鬥",
};

const ELEMENT_TYPE_ZH_VALUES = new Set(Object.values(ELEMENT_TYPE_ZH));

const MULTI_TYPE_SPLIT = /[/|・·&]+/;

function normalizeLookupKey(value: string): string {
  return value.trim().toLowerCase();
}

function translateElementToken(token: string): string {
  const trimmed = token.trim();
  if (!trimmed) return "";

  const withoutParen = trimmed.replace(/[(（].*[)）]/g, "").trim();
  const candidate = withoutParen || trimmed;

  if (ELEMENT_TYPE_ZH[candidate]) {
    return ELEMENT_TYPE_ZH[candidate];
  }

  const lowerKey = normalizeLookupKey(candidate);
  if (ELEMENT_TYPE_ZH[lowerKey]) {
    return ELEMENT_TYPE_ZH[lowerKey];
  }

  if (ELEMENT_TYPE_ZH_VALUES.has(candidate)) {
    return candidate;
  }

  if (/[\u4e00-\u9fff]/.test(candidate)) {
    return candidate;
  }

  return trimmed;
}

/**
 * Returns a Traditional Chinese label for a catalog `element_type` value.
 * Supports single / dual types and mixed JP·EN strings (e.g. `炎`, `Fire`, `草 / 水`).
 */
export function formatElementTypeZh(
  raw: string | null | undefined,
  fallback = "—",
): string {
  const value = raw?.trim();
  if (!value) return fallback;

  const parts = value
    .split(MULTI_TYPE_SPLIT)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    const translated = parts.map(translateElementToken).filter(Boolean);
    return translated.length > 0 ? translated.join(" / ") : value;
  }

  return translateElementToken(value);
}
