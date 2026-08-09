import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { parseRewardCouponCenter } from "@/lib/rewards/mapUserRewardCoupon";
import type { Database } from "@/types/supabase";

function createE2eAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing Supabase env for E2E admin client");
  }
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type MerchantOrderCouponSnapshot = {
  id: string;
  item_subtotal: number | null;
  auth_fee: number | null;
  shipping_fee: number | null;
  inbound_shipping_fee: number | null;
  outbound_shipping_fee: number | null;
  total_amount: number | null;
  buyer_total_amount: number | null;
  platform_subsidy_amount: number | null;
  coupon_user_reward_id: string | null;
  coupon_type: string | null;
  merchant_payout_amount: number | null;
  escrow_status: string | null;
  escrow_capture_model: string | null;
};

type RewardTemplateAuditSnapshot = {
  title?: string;
  type?: string;
  status?: string;
};

async function listRecentTemplateAudits(limit = 50) {
  const admin = createE2eAdminClient();
  const { data, error } = await admin
    .from("reward_template_audits")
    .select("template_id, snapshot, created_at, action")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`[listRecentTemplateAudits] ${error.message}`);
  }
  return data ?? [];
}

export async function findPendingMerchantOrderForListing(
  listingId: string,
): Promise<string | null> {
  const admin = createE2eAdminClient();
  const { data, error } = await admin
    .from("merchant_orders")
    .select("id")
    .eq("listing_id", listingId)
    .eq("escrow_status", "pending_payment")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`[findPendingMerchantOrderForListing] ${error.message}`);
  }

  return data?.id ?? null;
}

export async function reactivateListingForE2e(listingId: string): Promise<void> {
  const admin = createE2eAdminClient();
  const { error } = await admin
    .from("listings")
    .update({ status: "active" })
    .eq("id", listingId);
  if (error) {
    throw new Error(`[reactivateListingForE2e] ${error.message}`);
  }
}

export async function setListingAuthenticationForE2e(
  listingId: string,
  useAuthentication: boolean,
): Promise<void> {
  const admin = createE2eAdminClient();
  const { error } = await admin
    .from("listings")
    .update({ use_authentication: useAuthentication })
    .eq("id", listingId);
  if (error) {
    throw new Error(`[setListingAuthenticationForE2e] ${error.message}`);
  }
}

export async function findActiveFreeShippingTemplateId(): Promise<string | null> {
  const seen = new Set<string>();
  for (const row of await listRecentTemplateAudits()) {
    if (seen.has(row.template_id)) {
      continue;
    }
    seen.add(row.template_id);
    const snapshot = row.snapshot as RewardTemplateAuditSnapshot;
    if (
      snapshot?.type === "free_shipping" &&
      snapshot?.status === "active"
    ) {
      return row.template_id;
    }
  }
  return null;
}

async function lookupRewardTemplateIdByTitle(
  title: string,
): Promise<string | null> {
  for (const row of await listRecentTemplateAudits(100)) {
    const snapshot = row.snapshot as RewardTemplateAuditSnapshot;
    if (snapshot?.title === title) {
      return row.template_id;
    }
  }
  return null;
}

export async function getRewardTemplateIdByTitle(
  title: string,
): Promise<string | null> {
  let templateId: string | null = null;
  await expect
    .poll(
      async () => {
        templateId = await lookupRewardTemplateIdByTitle(title);
        return templateId;
      },
      { timeout: 15_000 },
    )
    .not.toBeNull();
  return templateId;
}

export async function grantUserRewardForE2e(params: {
  userId: string;
  templateId: string;
}): Promise<string> {
  const admin = createE2eAdminClient();
  const dedupKey = `e2e-phase2-${crypto.randomUUID()}`;
  const { data, error } = await admin
    .from("user_rewards")
    .insert({
      user_id: params.userId,
      template_id: params.templateId,
      grant_dedup_key: dedupKey,
      is_used: false,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`[grantUserRewardForE2e] ${error.message}`);
  }
  return data.id;
}

export async function getMerchantOrderCouponSnapshot(
  orderId: string,
): Promise<MerchantOrderCouponSnapshot | null> {
  const admin = createE2eAdminClient();
  const { data, error } = await admin
    .from("merchant_orders")
    .select(
      "id, item_subtotal, auth_fee, shipping_fee, inbound_shipping_fee, outbound_shipping_fee, total_amount, buyer_total_amount, platform_subsidy_amount, coupon_user_reward_id, coupon_type, merchant_payout_amount, escrow_status, escrow_capture_model",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error(`[getMerchantOrderCouponSnapshot] ${error.message}`);
  }
  return data;
}

export async function getUserRewardRow(rewardId: string) {
  const admin = createE2eAdminClient();
  const { data, error } = await admin
    .from("user_rewards")
    .select("id, is_used, used_at, reserved_merchant_order_id")
    .eq("id", rewardId)
    .maybeSingle();

  if (error) {
    throw new Error(`[getUserRewardRow] ${error.message}`);
  }
  return data;
}

export async function findActiveMerchantListingForE2e(params?: {
  excludeSellerId?: string;
}): Promise<{ listingId: string; sellerId: string; price: number }> {
  const envListingId = process.env.E2E_LISTING_ID?.trim();
  const envSellerId = process.env.E2E_SELLER_ID?.trim();

  if (envListingId && envSellerId) {
    if (!params?.excludeSellerId || envSellerId !== params.excludeSellerId) {
      try {
        await reactivateListingForE2e(envListingId);
        const listing = await assertListingIsActiveMerchant(envListingId);
        return {
          listingId: envListingId,
          sellerId: envSellerId,
          price: listing.price,
        };
      } catch {
        // Fall through to dynamic merchant listing discovery.
      }
    }
  }

  const admin = createE2eAdminClient();

  const { data: kycRows, error: kycError } = await admin
    .from("kyc_records")
    .select(
      "merchant_id, kyc_status, stripe_charges_enabled, stripe_payouts_enabled",
    )
    .eq("kyc_status", "verified")
    .eq("stripe_charges_enabled", true)
    .eq("stripe_payouts_enabled", true);

  if (kycError) {
    throw new Error(`[findActiveMerchantListingForE2e] ${kycError.message}`);
  }

  const payoutReadySellerIds = new Set(
    (kycRows ?? [])
      .map((row) => row.merchant_id)
      .filter((sellerId): sellerId is string => Boolean(sellerId)),
  );

  const { data, error } = await admin
    .from("listings")
    .select("id, seller_id, price, status, seller_persona")
    .eq("seller_persona", "merchant")
    .in("status", ["active", "inactive"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`[findActiveMerchantListingForE2e] ${error.message}`);
  }

  const row = await (async () => {
    for (const entry of data ?? []) {
      if (
        !entry.seller_id ||
        !payoutReadySellerIds.has(entry.seller_id) ||
        (params?.excludeSellerId && entry.seller_id === params.excludeSellerId)
      ) {
        continue;
      }

      const { count, error: pendingError } = await admin
        .from("merchant_orders")
        .select("id", { count: "exact", head: true })
        .eq("listing_id", entry.id)
        .eq("escrow_status", "pending_payment");

      if (pendingError) {
        throw new Error(`[findActiveMerchantListingForE2e] ${pendingError.message}`);
      }

      if ((count ?? 0) === 0) {
        return entry;
      }
    }
    return null;
  })();

  if (!row) {
    const { data: fallbackRows, error: fallbackError } = await admin
      .from("listings")
      .select("id, seller_id, price, status, seller_persona")
      .eq("seller_persona", "merchant")
      .in("status", ["active", "inactive"])
      .order("created_at", { ascending: false })
      .limit(50);

    if (fallbackError) {
      throw new Error(`[findActiveMerchantListingForE2e] ${fallbackError.message}`);
    }

    for (const entry of fallbackRows ?? []) {
      if (
        !entry.seller_id ||
        (params?.excludeSellerId && entry.seller_id === params.excludeSellerId)
      ) {
        continue;
      }

      if (entry.status !== "active") {
        await reactivateListingForE2e(entry.id);
      }

      return {
        listingId: entry.id,
        sellerId: entry.seller_id,
        price: Number(entry.price),
      };
    }
  }

  if (!row) {
    throw new Error(
      "No active merchant listing with payout-ready seller found for E2E checkout",
    );
  }

  return {
    listingId: row.id,
    sellerId: row.seller_id,
    price: Number(row.price),
  };
}

export async function assertListingIsActiveMerchant(
  listingId: string,
): Promise<{ sellerId: string; price: number }> {
  const admin = createE2eAdminClient();
  const { data, error } = await admin
    .from("listings")
    .select("id, seller_id, price, status, seller_persona")
    .eq("id", listingId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Listing ${listingId} not found`);
  }
  if (data.status !== "active") {
    throw new Error(`Listing ${listingId} is not active (${data.status})`);
  }
  if (data.seller_persona !== "merchant") {
    throw new Error(
      `Listing ${listingId} seller_persona=${data.seller_persona} (expected merchant)`,
    );
  }
  return { sellerId: data.seller_id, price: Number(data.price) };
}

export async function fillStripePaymentElement(page: Page): Promise<void> {
  await expect
    .poll(
      async () => {
        for (const frame of page.frames()) {
          const number = frame.locator(
            'input[name="number"], input[autocomplete="cc-number"], input[placeholder*="1234"]',
          );
          if ((await number.count()) > 0) {
            return true;
          }
        }
        return false;
      },
      { timeout: 60_000 },
    )
    .toBe(true);

  await page.waitForTimeout(1500);

  const fillInFrames = async (): Promise<boolean> => {
    for (const frame of page.frames()) {
      const number = frame.locator(
        'input[name="number"], input[autocomplete="cc-number"], input[placeholder*="1234"]',
      );
      if ((await number.count()) === 0) {
        continue;
      }
      await number.first().fill("4242424242424242");

      const expiry = frame.locator(
        'input[name="expiry"], input[autocomplete="cc-exp"]',
      );
      if ((await expiry.count()) > 0) {
        await expiry.first().fill("1234");
      }

      const cvc = frame.locator('input[name="cvc"], input[autocomplete="cc-csc"]');
      if ((await cvc.count()) > 0) {
        await cvc.first().fill("123");
      }
      return true;
    }
    return false;
  };

  const filled = await fillInFrames();
  if (!filled) {
    throw new Error("Could not locate Stripe card fields in iframes");
  }
}

export async function findActiveDiscountCouponTemplateId(): Promise<string | null> {
  const seen = new Set<string>();
  for (const row of await listRecentTemplateAudits()) {
    if (seen.has(row.template_id)) {
      continue;
    }
    seen.add(row.template_id);
    const snapshot = row.snapshot as RewardTemplateAuditSnapshot;
    if (
      snapshot?.type === "discount_coupon" &&
      snapshot?.status === "active"
    ) {
      return row.template_id;
    }
  }
  return null;
}

async function createE2eAdminAuthedClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const email = process.env.E2E_ADMIN_EMAIL?.trim();
  const password = process.env.E2E_ADMIN_PASSWORD?.trim();

  if (!url || !anonKey || !email || !password) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, E2E_ADMIN_EMAIL, or E2E_ADMIN_PASSWORD",
    );
  }

  const client = createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`[createE2eAdminAuthedClient] ${error.message}`);
  }

  return client;
}

type AdminCampaignListRow = {
  id?: string;
  name?: string;
  claimed_count?: number;
};

export async function listActiveFlashCampaignRowsForE2e(): Promise<
  AdminCampaignListRow[]
> {
  const client = await createE2eAdminAuthedClient();
  const { data, error } = await client.rpc("rpc_list_active_flash_campaigns");

  if (error) {
    throw new Error(`[listActiveFlashCampaignRowsForE2e] ${error.message}`);
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data as AdminCampaignListRow[];
}

export async function listActiveFlashCampaignRowsForUser(params: {
  email: string;
  password: string;
}): Promise<AdminCampaignListRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing Supabase public env for flash list RPC");
  }

  const client = createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: signInError } = await client.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });
  if (signInError) {
    throw new Error(`[listActiveFlashCampaignRowsForUser] ${signInError.message}`);
  }

  const { data, error } = await client.rpc("rpc_list_active_flash_campaigns");
  if (error) {
    throw new Error(`[listActiveFlashCampaignRowsForUser] ${error.message}`);
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data as AdminCampaignListRow[];
}

export async function waitForFlashCampaignSectionReady(page: Page): Promise<void> {
  const section = page.locator("section").filter({ hasText: "⚡ 限時搶券" });
  const hasFlashSection = await section
    .isVisible({ timeout: 5_000 })
    .catch(() => false);

  if (!hasFlashSection) {
    return;
  }

  await expect(page.getByText(/載入限時搶券/)).toBeHidden({
    timeout: 20_000,
  });
}

export async function completeMerchantAuthCheckout(
  page: Page,
  options?: { couponRewardId?: string | null },
): Promise<void> {
  if (options?.couponRewardId) {
    await page.locator("#checkout-coupon").selectOption(options.couponRewardId);
    await page.waitForTimeout(1500);
  }

  await page.getByRole("button", { name: /繼續付款/ }).click();
  await page.getByRole("button", { name: /確認支付 HK\$/ }).waitFor({
    state: "visible",
    timeout: 60_000,
  });

  await fillStripePaymentElement(page);
  await page.getByRole("button", { name: /確認支付 HK\$/ }).click();

  await page.waitForURL(/\/checkout\/[^/]+\/success/, { timeout: 120_000 });
}

export async function completeMerchantDirectCheckout(
  page: Page,
  options?: { couponRewardId?: string | null },
): Promise<void> {
  await page.locator("#p-tel").fill("91234567");
  await page.locator("#p-addr").fill("E2E 九龍塘順豐智能櫃");

  if (options?.couponRewardId) {
    await page.locator("#checkout-coupon").selectOption(options.couponRewardId);
    await page.waitForTimeout(1500);
  }

  await page.getByRole("button", { name: /繼續付款/ }).click();
  await page.getByRole("button", { name: /確認支付 HK\$/ }).waitFor({
    state: "visible",
    timeout: 60_000,
  });

  await fillStripePaymentElement(page);
  await page.getByRole("button", { name: /確認支付 HK\$/ }).click();

  await page.waitForURL(/\/checkout\/[^/]+\/success/, { timeout: 120_000 });
}

export async function buyMerchantListingWithAuthAndReachCheckout(
  page: Page,
  sellerId: string,
  listingId: string,
): Promise<string> {
  await page.goto(
    `/marketplace/${sellerId}/product/${listingId}`,
    { waitUntil: "domcontentloaded" },
  );
  await dismissBlockingOverlays(page);
  await expect(page.locator("main h1")).toBeVisible({ timeout: 15_000 });

  const buyButton = page.getByRole("button", { name: /立即購買/ });
  await expect(buyButton).toBeEnabled({ timeout: 15_000 });
  await buyButton.click();

  const dialog = page.getByRole("alertdialog", { name: "確認立即購買" });
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  const authSwitch = dialog.getByRole("switch");
  await expect(authSwitch).toBeVisible({ timeout: 15_000 });
  await authSwitch.click();
  await dialog.getByRole("button", { name: "確認立即購買" }).click();

  const navigatedToCheckout = await page
    .waitForURL(/\/checkout\//, { timeout: 20_000 })
    .then(() => true)
    .catch(() => false);

  if (!navigatedToCheckout) {
    let pendingOrderId: string | null = null;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      pendingOrderId = await findPendingMerchantOrderForListing(listingId);
      if (pendingOrderId) {
        break;
      }
      await page.waitForTimeout(500);
    }
    if (!pendingOrderId) {
      throw new Error(
        "Auth buy now did not navigate to checkout and no pending order was created",
      );
    }
    await page.goto(`/checkout/${pendingOrderId}`, {
      waitUntil: "domcontentloaded",
    });
  }

  await page.waitForURL(/\/checkout\//, { timeout: 15_000 });
  const orderId =
    page.url().match(/\/checkout\/([^/?#]+)/)?.[1]?.trim() ?? "";
  if (orderId.length === 0) {
    throw new Error("Could not resolve checkout order id after auth buy now");
  }
  await waitForMerchantDirectCheckoutReady(page);
  return orderId;
}

export async function gotoAdminRewardActivityForm(page: Page): Promise<void> {
  await page.goto("/admin/campaigns/new", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "新增獎勵活動" })).toBeVisible({
    timeout: 20_000,
  });
}

/** @deprecated Use gotoAdminRewardActivityForm */
export async function openRewardTemplateWizard(page: Page) {
  await gotoAdminRewardActivityForm(page);
  return page.locator("main");
}

function toDatetimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export async function dismissBlockingOverlays(page: Page): Promise<void> {
  const pwaClose = page.getByRole("button", { name: "✕" }).first();
  if (await pwaClose.isVisible().catch(() => false)) {
    await pwaClose.click();
  }
}

export async function gotoMemberRewardsPage(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.goto("/profile/user/rewards", { waitUntil: "domcontentloaded" });
    await dismissBlockingOverlays(page);

    const crashed = page.getByText("This page couldn't load");
    if (await crashed.isVisible().catch(() => false)) {
      const reloadButton = page.getByRole("button", { name: "Reload" });
      if (await reloadButton.isVisible().catch(() => false)) {
        await reloadButton.click();
        await page.waitForTimeout(2000);
      }
      continue;
    }

    const heading = page.getByRole("heading", { name: "會員獎勵與任務中心" });
    if (await heading.isVisible({ timeout: 30_000 }).catch(() => false)) {
      return;
    }
  }

  await expect(
    page.getByRole("heading", { name: "會員獎勵與任務中心" }),
  ).toBeVisible({ timeout: 30_000 });
}

export function buildFlashCampaignScheduleForE2e(params?: {
  campaignName?: string;
  maxClaims?: number;
  maxClaimsPerUser?: number;
}): {
  campaignName: string;
  startsAt: string;
  endsAt: string;
  maxClaims: number;
  maxClaimsPerUser: number;
} {
  const now = Date.now();
  const startsAt = new Date(now - 2 * 60 * 60 * 1000);
  const endsAt = new Date(now + 48 * 60 * 60 * 1000);

  // datetime-local + `new Date(value)` in the admin wizard use the browser's local
  // timezone — not HKT — so format with local wall-clock values for the same instants.
  return {
    campaignName: params?.campaignName ?? `E2E Flash ${Date.now()}`,
    startsAt: toDatetimeLocalValue(startsAt),
    endsAt: toDatetimeLocalValue(endsAt),
    maxClaims: params?.maxClaims ?? 2,
    maxClaimsPerUser: params?.maxClaimsPerUser ?? 1,
  };
}

export function buildFutureFlashCampaignScheduleForE2e(params?: {
  campaignName?: string;
  hoursAhead?: number;
  maxClaims?: number;
  maxClaimsPerUser?: number;
}): {
  campaignName: string;
  startsAt: string;
  endsAt: string;
  maxClaims: number;
  maxClaimsPerUser: number;
} {
  const now = Date.now();
  const hoursAhead = params?.hoursAhead ?? 2;
  const startsAt = new Date(now + hoursAhead * 60 * 60 * 1000);
  const endsAt = new Date(now + 48 * 60 * 60 * 1000);

  return {
    campaignName: params?.campaignName ?? `E2E Future Flash ${Date.now()}`,
    startsAt: toDatetimeLocalValue(startsAt),
    endsAt: toDatetimeLocalValue(endsAt),
    maxClaims: params?.maxClaims ?? 10,
    maxClaimsPerUser: params?.maxClaimsPerUser ?? 1,
  };
}

export async function getFlashCampaignIdByName(
  campaignName: string,
): Promise<string | null> {
  const rows = await listActiveFlashCampaignRowsForE2e();
  const row = rows.find((entry) => entry.name === campaignName);
  return row?.id ?? null;
}

export async function countRewardCampaignClaims(
  campaignId: string,
): Promise<number> {
  const rows = await listActiveFlashCampaignRowsForE2e();
  const row = rows.find((entry) => entry.id === campaignId);
  return Number(row?.claimed_count ?? 0);
}

export async function ensureE2eFlashBuyer(params: {
  suffix: string;
}): Promise<{ email: string; password: string; userId: string }> {
  const admin = createE2eAdminClient();
  const email = `e2e-flash-${params.suffix}-${Date.now()}@hkcardvault.test`;
  const password = `E2eFlash!${params.suffix}${Date.now()}`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user?.id) {
    throw new Error(
      `[ensureE2eFlashBuyer] ${error?.message ?? "createUser returned no user"}`,
    );
  }

  return {
    email,
    password,
    userId: data.user.id,
  };
}

export async function claimFlashCampaignForUser(params: {
  email: string;
  password: string;
  campaignId: string;
}): Promise<{ userRewardId: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing Supabase public env for flash claim RPC");
  }

  const client = createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: signInError } = await client.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });
  if (signInError) {
    throw new Error(`[claimFlashCampaignForUser] sign-in failed: ${signInError.message}`);
  }

  const { data, error } = await client.rpc("rpc_claim_flash_reward", {
    p_campaign_id: params.campaignId,
  });

  if (error) {
    throw new Error(`[claimFlashCampaignForUser] ${error.message}`);
  }

  const payload = data as Record<string, unknown> | null;
  const userRewardId =
    typeof payload?.user_reward_id === "string" ? payload.user_reward_id : null;

  if (!userRewardId) {
    throw new Error("[claimFlashCampaignForUser] missing user_reward_id in RPC response");
  }

  return { userRewardId };
}

export async function findLatestUserRewardForTemplate(params: {
  userId: string;
  templateId: string;
}): Promise<string | null> {
  const admin = createE2eAdminClient();
  const { data, error } = await admin
    .from("user_rewards")
    .select("id")
    .eq("user_id", params.userId)
    .eq("template_id", params.templateId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`[findLatestUserRewardForTemplate] ${error.message}`);
  }

  return data?.id ?? null;
}

async function selectRewardDistributionMode(
  page: Page,
  mode: "auto_grant" | "flash_only",
): Promise<void> {
  const section = page.locator("section").filter({
    has: page.getByRole("heading", { name: "發放方式" }),
  });
  await section.getByRole("combobox").click();
  const label =
    mode === "flash_only"
      ? "限時搶領（先到先得）"
      : "條件達成自動發放";
  await page.getByRole("option", { name: label }).click();
}

const ADMIN_REWARD_PUBLISH_SUCCESS_TOAST = "已發布獎勵活動";

async function submitAdminRewardActivityPublish(page: Page): Promise<void> {
  await page.getByRole("button", { name: "發布" }).click();

  let outcome = "pending";
  await expect
    .poll(
      async () => {
        const successVisible = await page
          .locator("[data-sonner-toast]")
          .filter({ hasText: ADMIN_REWARD_PUBLISH_SUCCESS_TOAST })
          .first()
          .isVisible()
          .catch(() => false);
        if (successVisible) {
          outcome = "success";
          return "success";
        }

        const errorToast = page
          .locator('[data-sonner-toast][data-type="error"]')
          .last();
        if (await errorToast.isVisible().catch(() => false)) {
          const text =
            (await errorToast.textContent())?.trim() ?? "unknown error";
          outcome = `error:${text}`;
          return outcome;
        }

        return "pending";
      },
      { timeout: 30_000 },
    )
    .not.toBe("pending");

  if (outcome.startsWith("error:")) {
    throw new Error(
      `Admin reward publish failed: ${outcome.slice("error:".length)}`,
    );
  }

  await page.waitForURL((url) => url.pathname === "/admin/campaigns", {
    timeout: 30_000,
  });
}

async function selectTriggerKind(
  page: Page,
  kind: "trade_count" | "event_once",
): Promise<void> {
  const section = page.locator("section").filter({
    has: page.getByRole("heading", { name: "觸發條件" }),
  });
  await section.getByRole("combobox").first().click();
  await page
    .getByRole("option", { name: kind === "trade_count" ? "成交筆數" : "一次性事件" })
    .click();
}

export type PublishRewardActivityParams = {
  title: string;
  type: "discount_coupon" | "free_shipping" | "points";
  distributionMode?: "auto_grant" | "flash_only";
  trigger?:
    | { kind: "trade_count"; role: "buyer" | "merchant"; count: number }
    | { kind: "event_once"; event: string };
  amount?: number;
  minSpend?: number;
  maxSubsidy?: number;
  points?: number;
  flashSchedule?: ReturnType<typeof buildFlashCampaignScheduleForE2e>;
  activityWindow?: { startsAt: string; endsAt: string };
};

const REWARD_TYPE_OPTION_LABEL: Record<
  PublishRewardActivityParams["type"],
  string
> = {
  discount_coupon: "折扣券",
  free_shipping: "免運券",
  points: "積分",
};

export async function publishRewardActivityViaAdmin(
  page: Page,
  params: PublishRewardActivityParams,
): Promise<void> {
  await gotoAdminRewardActivityForm(page);

  await page.locator("#template-title").fill(params.title);

  const rewardSection = page.locator("section").filter({
    has: page.getByRole("heading", { name: "獎勵內容" }),
  });
  await rewardSection.getByRole("combobox").click();
  await page
    .getByRole("option", { name: REWARD_TYPE_OPTION_LABEL[params.type] })
    .click();

  if (params.type === "discount_coupon") {
    await page.locator("#reward-amount").fill(String(params.amount ?? 10));
    await page
      .locator("#reward-min-spend")
      .fill(String(params.minSpend ?? 0));
  }

  if (params.type === "free_shipping") {
    await page
      .locator("#reward-max-subsidy")
      .fill(String(params.maxSubsidy ?? 30));
    if (params.minSpend != null) {
      await page
        .locator("#reward-shipping-min")
        .fill(String(params.minSpend));
    }
  }

  if (params.type === "points") {
    await page.locator("#reward-points").fill(String(params.points ?? 50));
  }

  const distributionMode = params.distributionMode ?? "auto_grant";
  if (distributionMode === "flash_only") {
    await selectRewardDistributionMode(page, "flash_only");

    const schedule =
      params.flashSchedule ?? buildFlashCampaignScheduleForE2e();
    await page.locator("#campaign-starts").fill(schedule.startsAt);
    await page.locator("#campaign-ends").fill(schedule.endsAt);
    await page.locator("#campaign-stock").fill(String(schedule.maxClaims));
    await page
      .locator("#campaign-per-user")
      .fill(String(schedule.maxClaimsPerUser));
  }

  if (distributionMode === "auto_grant" && params.trigger) {
    if (params.trigger.kind === "trade_count") {
      await selectTriggerKind(page, "trade_count");
      const triggerSection = page.locator("section").filter({
        has: page.getByRole("heading", { name: "觸發條件" }),
      });
      const roleCombobox = triggerSection.getByRole("combobox").nth(1);
      const roleLabel = await roleCombobox.textContent();
      const wantsMerchant = params.trigger.role === "merchant";
      const alreadyMerchant = roleLabel?.includes("商戶") ?? false;
      const alreadyBuyer = roleLabel?.includes("買家") ?? false;
      if (
        (wantsMerchant && !alreadyMerchant) ||
        (!wantsMerchant && !alreadyBuyer)
      ) {
        await roleCombobox.click();
        await page
          .getByRole("option", {
            name: wantsMerchant ? "商戶" : "買家",
          })
          .click();
      }
      await page.locator("#trade-count").fill(String(params.trigger.count));
    } else {
      await selectTriggerKind(page, "event_once");
      const eventLabels: Record<string, string> = {
        profile_complete: "完善個人資料",
        first_listing: "首次上架",
        first_chat: "首次聊天",
        account_registered: "註冊完成",
      };
      const eventLabel =
        eventLabels[params.trigger.event] ?? "完善個人資料";
      const triggerSection = page.locator("section").filter({
        has: page.getByRole("heading", { name: "觸發條件" }),
      });
      await triggerSection.getByRole("combobox").nth(1).click();
      await page.getByRole("option", { name: eventLabel }).click();
    }

    if (params.activityWindow) {
      await page
        .locator("#auto-grant-starts")
        .fill(params.activityWindow.startsAt);
      await page.locator("#auto-grant-ends").fill(params.activityWindow.endsAt);
    }
  }

  await submitAdminRewardActivityPublish(page);
  await openAdminCampaignsActivitiesTab(page);
}

export async function openAdminCheckInTab(page: Page): Promise<void> {
  await page.goto("/admin/campaigns?tab=check-in", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("heading", { name: "簽到計劃" })).toBeVisible({
    timeout: 20_000,
  });
}

export async function invokeAutoGrantForUser(userId: string): Promise<void> {
  const admin = createE2eAdminClient();
  const { error } = await admin.rpc("fn_try_auto_grant_rewards", {
    p_user_id: userId,
  });
  if (error) {
    throw new Error(`[invokeAutoGrantForUser] ${error.message}`);
  }
}

export async function setProfileCompletedTradesCount(
  userId: string,
  count: number,
): Promise<void> {
  const admin = createE2eAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ completed_trades_count: count })
    .eq("id", userId);
  if (error) {
    throw new Error(`[setProfileCompletedTradesCount] ${error.message}`);
  }
}

export async function getPointLedgerGrantForTemplate(params: {
  userId: string;
  templateId: string;
}): Promise<number | null> {
  const admin = createE2eAdminClient();
  const { data, error } = await admin
    .from("point_ledger")
    .select("amount")
    .eq("user_id", params.userId)
    .eq("source_type", "reward_template")
    .eq("source_ref", params.templateId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`[getPointLedgerGrantForTemplate] ${error.message}`);
  }

  return data?.amount == null ? null : Number(data.amount);
}

export async function getRewardCouponCenterForUserId(userId: string) {
  throw new Error(
    "[getRewardCouponCenterForUserId] Post R-02 requires an authenticated user session; use getRewardCouponCenterForUser({ email, password }) instead.",
  );
}

export async function getRewardCouponCenterForUser(params: {
  email: string;
  password: string;
}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing Supabase public env for coupon center RPC");
  }

  const client = createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: signInData, error: signInError } =
    await client.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });
  if (signInError) {
    throw new Error(`[getRewardCouponCenterForUser] ${signInError.message}`);
  }

  const userId = signInData.user?.id;
  if (!userId) {
    throw new Error("[getRewardCouponCenterForUser] sign-in returned no user");
  }

  const { data, error } = await client.rpc("get_reward_coupon_center", {
    p_user_id: userId,
  });
  if (error) {
    throw new Error(`[getRewardCouponCenterForUser] ${error.message}`);
  }

  return parseRewardCouponCenter(data);
}

export async function publishDiscountCouponTemplate(
  page: Page,
  params: {
    title: string;
    amount?: number;
    minSpend?: number;
  },
): Promise<void> {
  await gotoAdminRewardActivityForm(page);

  await page.locator("#template-title").fill(params.title);

  const rewardSection = page.locator("section").filter({
    has: page.getByRole("heading", { name: "獎勵內容" }),
  });
  await rewardSection.getByRole("combobox").click();
  await page.getByRole("option", { name: "折扣券" }).click();
  await page.locator("#reward-amount").fill(String(params.amount ?? 10));
  await page
    .locator("#reward-min-spend")
    .fill(String(params.minSpend ?? 100));

  await submitAdminRewardActivityPublish(page);
  await openAdminCampaignsActivitiesTab(page);
}

export async function openAdminCampaignsActivitiesTab(page: Page): Promise<void> {
  await page.goto("/admin/campaigns", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "新增活動" })).toBeVisible({
    timeout: 20_000,
  });
}

export async function setFlashActivityStatusForE2e(
  templateId: string,
  status: "paused" | "active",
): Promise<void> {
  const client = await createE2eAdminAuthedClient();
  const { error } = await client.rpc("rpc_admin_set_reward_activity_status", {
    p_template_id: templateId,
    p_status: status,
  });
  if (error) {
    throw new Error(`[setFlashActivityStatusForE2e] ${error.message}`);
  }
}

export async function setFlashCampaignStatusViaAdmin(
  page: Page,
  templateTitle: string,
  status: "paused" | "active",
): Promise<void> {
  await openAdminCampaignsActivitiesTab(page);

  const card = page
    .locator("div")
    .filter({ has: page.getByRole("heading", { name: templateTitle, exact: true }) })
    .first();
  const cardVisible = await card.isVisible({ timeout: 10_000 }).catch(() => false);

  if (cardVisible) {
    const toggle = card.getByRole("switch");
    const toggleVisible = await toggle
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (toggleVisible) {
      const isActive = await toggle.isChecked();
      const shouldBeActive = status === "active";
      if (isActive !== shouldBeActive) {
        await toggle.click();
        await expect(toggle).toBeChecked({ checked: shouldBeActive, timeout: 20_000 });
      }
      return;
    }
  }

  const templateId = await getRewardTemplateIdByTitle(templateTitle);
  if (!templateId) {
    throw new Error(`Flash activity template not found for title: ${templateTitle}`);
  }
  await setFlashActivityStatusForE2e(templateId, status);
}

export async function buyMerchantListingAndReachCheckout(
  page: Page,
  sellerId: string,
  listingId: string,
): Promise<string> {
  await page.goto(`/marketplace/${sellerId}/product/${listingId}`, {
    waitUntil: "domcontentloaded",
  });
  await dismissBlockingOverlays(page);
  await expect(page.locator("main h1")).toBeVisible({ timeout: 15_000 });

  const buyButton = page.getByRole("button", { name: /立即購買/ });
  await expect(buyButton).toBeEnabled({ timeout: 15_000 });
  await buyButton.click();

  const navigatedImmediately = await page
    .waitForURL(/\/checkout\//, { timeout: 8_000 })
    .then(() => true)
    .catch(() => false);

  if (!navigatedImmediately) {
    const dialog = page.getByRole("alertdialog", { name: "確認立即購買" });
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await dialog.getByRole("button", { name: "確認立即購買" }).click();
  }

  const navigatedToCheckout = await page
    .waitForURL(/\/checkout\//, { timeout: 20_000 })
    .then(() => true)
    .catch(() => false);

  if (!navigatedToCheckout) {
    let pendingOrderId: string | null = null;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      pendingOrderId = await findPendingMerchantOrderForListing(listingId);
      if (pendingOrderId) {
        break;
      }
      await page.waitForTimeout(500);
    }
    if (!pendingOrderId) {
      throw new Error(
        "Buy now did not navigate to checkout and no pending order was created",
      );
    }
    await page.goto(`/checkout/${pendingOrderId}`, {
      waitUntil: "domcontentloaded",
    });
  }

  await page.waitForURL(/\/checkout\//, { timeout: 15_000 });
  const orderId =
    page.url().match(/\/checkout\/([^/?#]+)/)?.[1]?.trim() ?? "";
  if (orderId.length === 0) {
    throw new Error("Could not resolve checkout order id after buy now");
  }
  await waitForMerchantDirectCheckoutReady(page);
  return orderId;
}

async function waitForMerchantDirectCheckoutReady(page: Page): Promise<void> {
  const { waitForMerchantDirectCheckoutReady: waitReady } = await import(
    "./rewards-checkout-coupon"
  );
  await waitReady(page);
}

export async function tryClaimFlashCampaignViaUI(
  page: Page,
  campaignName?: string,
): Promise<boolean> {
  try {
    await gotoMemberRewardsPage(page);
    await page.waitForTimeout(2000);

    const section = page.locator("section").filter({ hasText: "⚡ 限時搶券" });
    const loaded = await section.isVisible({ timeout: 15_000 }).catch(() => false);
    if (!loaded) {
      return false;
    }

    const card = campaignName
      ? section.locator("div.rounded-2xl").filter({ hasText: campaignName })
      : section.locator("div.rounded-2xl").first();

    if (!(await card.isVisible({ timeout: 10_000 }).catch(() => false))) {
      return false;
    }

    const claimButton = card.getByRole("button", { name: "立即搶券" });
    if (!(await claimButton.isEnabled({ timeout: 10_000 }).catch(() => false))) {
      return false;
    }

    await claimButton.click();
    await expect(page.getByText("搶券成功")).toBeVisible({ timeout: 15_000 });
    return true;
  } catch {
    return false;
  }
}

export async function claimFlashCampaignViaUI(
  page: Page,
  campaignName?: string,
): Promise<void> {
  const claimed = await tryClaimFlashCampaignViaUI(page, campaignName);
  if (!claimed) {
    throw new Error("Flash campaign UI claim failed");
  }
}
