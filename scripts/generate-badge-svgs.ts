import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "public", "assets", "badges");

function shieldMedal(level: string, accent: string, inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <circle cx="32" cy="32" r="30" fill="#17130f" stroke="${accent}" stroke-width="2"/>
  <path d="M32 10 L48 18 V32 C48 42 32 52 32 52 C32 52 16 42 16 32 V18 Z" fill="#26211C" stroke="${accent}" stroke-width="2"/>
  <text x="32" y="36" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="${inner}">${level}</text>
</svg>`;
}

function shopMedal(level: string, accent: string, inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect x="6" y="6" width="52" height="52" rx="12" fill="#17130f" stroke="${accent}" stroke-width="2"/>
  <path d="M12 28 H52 L48 18 H16 Z" fill="${accent}" opacity="0.35"/>
  <rect x="18" y="28" width="28" height="22" rx="2" fill="#26211C" stroke="${accent}" stroke-width="1.5"/>
  <rect x="28" y="36" width="8" height="14" fill="${accent}" opacity="0.6"/>
  <text x="32" y="24" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="${inner}">${level}</text>
</svg>`;
}

function activityBadge(symbol: string, accent: string, label?: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <circle cx="32" cy="32" r="28" fill="#17130f" stroke="${accent}" stroke-width="2"/>
  <circle cx="32" cy="32" r="20" fill="#26211C" stroke="${accent}" stroke-width="1" opacity="0.5"/>
  <text x="32" y="38" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${label ? 10 : 22}" font-weight="700" fill="${accent}">${label ?? symbol}</text>
</svg>`;
}

function cardStackBadge(count: string, accent: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <circle cx="32" cy="32" r="28" fill="#17130f" stroke="${accent}" stroke-width="2"/>
  <rect x="18" y="22" width="20" height="28" rx="3" fill="#26211C" stroke="${accent}" stroke-width="1.5" transform="rotate(-8 28 36)"/>
  <rect x="24" y="18" width="20" height="28" rx="3" fill="#26211C" stroke="${accent}" stroke-width="1.5"/>
  <text x="34" y="36" text-anchor="middle" font-family="system-ui,sans-serif" font-size="9" font-weight="700" fill="${accent}">${count}</text>
</svg>`;
}

const files: Record<string, string> = {
  "member_l1.svg": shieldMedal("I", "#94a3b8", "#cbd5e1"),
  "member_l2.svg": shieldMedal("II", "#22d3ee", "#a5f3fc"),
  "member_l3.svg": shieldMedal("III", "#818cf8", "#c7d2fe"),
  "member_l4.svg": shieldMedal("IV", "#f59e0b", "#fde68a"),
  "merchant_l1.svg": shopMedal("L1", "#10b981", "#6ee7b7"),
  "merchant_l2.svg": shopMedal("L2", "#e5e7eb", "#f9fafb"),
  "merchant_l3.svg": shopMedal("L3", "#eab308", "#fde047"),
  "merchant_l4.svg": shopMedal("L4", "#f43f5e", "#fda4af"),
  "badge_founding.svg": activityBadge("★", "#d4a574"),
  "badge_veteran.svg": activityBadge("365", "#d4a574", "365"),
  "badge_flawless.svg": activityBadge("✓", "#10b981"),
  "badge_recommended.svg": activityBadge("★", "#eab308"),
  "badge_cards_100.svg": cardStackBadge("100", "#818cf8"),
  "badge_cards_1k.svg": cardStackBadge("1K", "#6366f1"),
  "badge_cards_10k.svg": cardStackBadge("10K", "#f59e0b"),
  "badge_streak_30.svg": activityBadge("30", "#22d3ee", "30"),
  "badge_hunter.svg": activityBadge("⚡", "#d4a574"),
  "badge_merchant_founding.svg": activityBadge("M★", "#10b981", "M★"),
  "badge_merchant_veteran.svg": activityBadge("M365", "#10b981", "365"),
  "badge_merchant_flawless.svg": activityBadge("M✓", "#10b981", "✓"),
  "badge_merchant_recommended.svg": activityBadge("M★", "#eab308", "★"),
  "badge_merchant_sales_100.svg": activityBadge("100", "#d4a574", "100"),
  "badge_merchant_sales_500.svg": activityBadge("500", "#d4a574", "500"),
  "badge_merchant_sales_1k.svg": activityBadge("1K", "#d4a574", "1K"),
};

mkdirSync(OUT, { recursive: true });
for (const [name, svg] of Object.entries(files)) {
  writeFileSync(join(OUT, name), svg.trim() + "\n");
}
console.log(`Wrote ${Object.keys(files).length} badge SVGs to ${OUT}`);
