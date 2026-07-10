import type { TestType } from "@playwright/test";

function readEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

export type ChatRealtimeFixtures = {
  sellerId: string;
  sellerUsername: string | null;
  sellerEmail: string;
  sellerPassword: string;
  listingId: string;
  buyerEmail: string;
  buyerPassword: string;
};

export function getChatRealtimeFixtures(): Partial<ChatRealtimeFixtures> {
  return {
    sellerId: readEnv("E2E_SELLER_ID"),
    sellerUsername: readEnv("E2E_SELLER_USERNAME") ?? null,
    sellerEmail: readEnv("E2E_SELLER_EMAIL"),
    sellerPassword: readEnv("E2E_SELLER_PASSWORD"),
    listingId: readEnv("E2E_LISTING_ID"),
    buyerEmail: readEnv("E2E_BUYER_EMAIL"),
    buyerPassword: readEnv("E2E_BUYER_PASSWORD"),
  };
}

export function hasSellerAuthFixtures(): boolean {
  const fixtures = getChatRealtimeFixtures();
  return Boolean(fixtures.sellerEmail && fixtures.sellerPassword);
}

export function hasChatBuyerAuthFixtures(): boolean {
  const fixtures = getChatRealtimeFixtures();
  return Boolean(fixtures.buyerEmail && fixtures.buyerPassword);
}

export function hasSupabaseAdminFixtures(): boolean {
  return Boolean(
    readEnv("NEXT_PUBLIC_SUPABASE_URL") && readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );
}

export function hasChatRealtimeFixtures(): boolean {
  const fixtures = getChatRealtimeFixtures();
  return Boolean(
    fixtures.sellerId &&
      fixtures.listingId &&
      fixtures.sellerEmail &&
      fixtures.sellerPassword &&
      fixtures.buyerEmail &&
      fixtures.buyerPassword &&
      hasSupabaseAdminFixtures(),
  );
}

export function requireChatRealtimeFixtures(
  test: TestType<object, object>,
  reason = "Missing Global Chat E2E env (seller/buyer auth, listing, or SUPABASE_SERVICE_ROLE_KEY)",
): asserts test is TestType<object, object> {
  if (!hasChatRealtimeFixtures()) {
    test.skip(true, reason);
  }
}
