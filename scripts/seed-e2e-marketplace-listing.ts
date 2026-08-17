/**
 * Bootstrap E2E marketplace listing when staging wipe removed fixtures.
 * Run: bun run seed:e2e-marketplace-listing
 */
import {
  getProfileUsername,
  resolveE2eMarketplaceFixture,
} from "../e2e/fixtures/supabase-admin";
import { getMerchantProductDetailFixtures } from "../e2e/fixtures/test-data";

async function main(): Promise<void> {
  const env = getMerchantProductDetailFixtures();
  if (!env.sellerId) {
    throw new Error("Missing E2E_SELLER_ID in environment");
  }

  const result = await resolveE2eMarketplaceFixture();
  if (!result.ok) {
    console.error("Failed to resolve marketplace fixture:", result.skipReason);
    process.exit(1);
  }

  const { fixture } = result;
  const username =
    env.sellerUsername ?? (await getProfileUsername(fixture.sellerId));

  console.log("=== E2E marketplace listing ready ===");
  console.log(`E2E_LISTING_ID=${fixture.listingId}`);
  console.log(`E2E_SELLER_ID=${fixture.sellerId}`);
  if (fixture.displayId) {
    console.log(`E2E_LISTING_DISPLAY_ID=${fixture.displayId}`);
  }
  console.log(`E2E_LISTING_PRODUCT_ID=${fixture.productId}`);
  if (username) {
    console.log(`E2E_SELLER_USERNAME=${username}`);
  }
  console.log("");
  console.log("Copy the lines above into .env.local / GitHub secrets if stale.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
