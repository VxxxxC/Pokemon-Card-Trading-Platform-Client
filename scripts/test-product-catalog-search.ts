/**
 * Quick connectivity test for product_catalog search.
 * Run: bun run test:catalog-search
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

if (url.includes("/rest/v1")) {
  console.error(
    "❌ NEXT_PUBLIC_SUPABASE_URL should be https://<project>.supabase.co (no /rest/v1/)",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, anonKey);

const SEARCH_COLUMNS = [
  "set_code",
  "name_ja",
  "name_en",
  "name_zh",
  "card_number",
  "display_id",
] as const;

function toIlikePattern(query: string): string {
  const escaped = query.replace(/[%_\\]/g, "\\$&");
  return `%${escaped}%`;
}

function buildOrIlikeFilter(pattern: string): string {
  const quotedPattern = `"${pattern.replace(/"/g, '""')}"`;
  return SEARCH_COLUMNS.map((col) => `${col}.ilike.${quotedPattern}`).join(",");
}

async function runSearch(label: string, query: string, itemType: "card" | "box_set") {
  const pattern = toIlikePattern(query);
  const types =
    itemType === "card"
      ? (["single_card"] as const)
      : (["booster_box", "gift_set", "booster_pack", "starter_deck"] as const);

  const { data, error } = await supabase
    .from("product_catalog")
    .select("id, name_ja, name_en, name_zh, set_code, card_number, display_id, type")
    .in("type", [...types])
    .or(buildOrIlikeFilter(pattern))
    .limit(5);

  console.log(`\n--- ${label} (query="${query}", itemType=${itemType}) ---`);

  if (error) {
    console.error("❌", error.message);
    return false;
  }

  if (!data?.length) {
    console.log("⚠️  No rows returned (table empty or RLS blocking SELECT?)");
    return true;
  }

  for (const row of data) {
    const name = row.name_zh ?? row.name_ja;
    console.log(
      `  • ${row.display_id ?? row.card_number ?? row.id} | ${name} | set=${row.set_code} | ${row.type}`,
    );
  }

  console.log(`✅ ${data.length} result(s)`);
  return true;
}

async function main() {
  console.log("Supabase URL:", url);

  const countResult = await supabase
    .from("product_catalog")
    .select("id", { count: "exact", head: true });

  if (countResult.error) {
    console.error("❌ Cannot reach product_catalog:");
    console.error(JSON.stringify(countResult.error, null, 2));
    process.exit(1);
  }

  console.log(`\n📦 product_catalog row count: ${countResult.count ?? "unknown"}`);

  await runSearch("Card search", "ピカチュウ", "card");
  await runSearch("Card by set", "sv2a", "card");
  await runSearch("Box/set search", "box", "box_set");

  console.log("\nDone. If you see results above, DB + RLS + search columns are working.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
