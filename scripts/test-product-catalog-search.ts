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

async function runSearch(label: string, query: string, itemType: "card" | "box_set") {
  const { data, error } = await supabase.rpc("search_product_catalog", {
    p_query: query,
    p_item_type: itemType,
  });

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
      `  • ${row.display_id ?? row.jan_code ?? row.card_number ?? row.id} | ${name} | set=${row.set_code} | ${row.type}`,
    );
  }

  console.log(`✅ ${data.length} result(s), total_count=${data[0]?.total_count ?? data.length}`);
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

  console.log("\nDone. If you see results above, RPC search_product_catalog is working.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
