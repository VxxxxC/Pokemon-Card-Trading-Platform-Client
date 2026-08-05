import type { Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
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
  total_amount: number | null;
  buyer_total_amount: number | null;
  platform_subsidy_amount: number | null;
  coupon_user_reward_id: string | null;
  coupon_type: string | null;
  merchant_payout_amount: number | null;
  escrow_status: string | null;
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

export async function getRewardTemplateIdByTitle(
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
      "id, total_amount, buyer_total_amount, platform_subsidy_amount, coupon_user_reward_id, coupon_type, merchant_payout_amount, escrow_status",
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
  await page.waitForTimeout(2500);

  const fillInFrames = async (): Promise<boolean> => {
    for (const frame of page.frames()) {
      const number = frame.locator(
        'input[name="number"], input[autocomplete="cc-number"]',
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
  const admin = createE2eAdminClient();
  const { data, error } = await admin
    .from("reward_templates")
    .select("id")
    .eq("type", "discount_coupon")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`[findActiveDiscountCouponTemplateId] ${error.message}`);
  }

  return data?.id ?? null;
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

  const buyButton = page.getByRole("button", { name: /立即購買/ });
  await buyButton.click();

  const dialog = page.getByRole("alertdialog", { name: "確認立即購買" });
  await dialog.getByRole("switch").click();
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
  return orderId;
}

function toDatetimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
  const now = new Date();
  const startsAt = new Date(now.getTime() - 60 * 60 * 1000);
  const endsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return {
    campaignName: params?.campaignName ?? `E2E Flash ${Date.now()}`,
    startsAt: toDatetimeLocalValue(startsAt),
    endsAt: toDatetimeLocalValue(endsAt),
    maxClaims: params?.maxClaims ?? 2,
    maxClaimsPerUser: params?.maxClaimsPerUser ?? 1,
  };
}

export async function getFlashCampaignIdByName(
  campaignName: string,
): Promise<string | null> {
  const admin = createE2eAdminClient();
  const { data, error } = await admin
    .from("reward_campaigns")
    .select("id")
    .eq("name", campaignName)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`[getFlashCampaignIdByName] ${error.message}`);
  }

  return data?.id ?? null;
}

export async function countRewardCampaignClaims(
  campaignId: string,
): Promise<number> {
  const admin = createE2eAdminClient();
  const { count, error } = await admin
    .from("reward_campaign_claims")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId);

  if (error) {
    throw new Error(`[countRewardCampaignClaims] ${error.message}`);
  }

  return count ?? 0;
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

export async function claimFlashCampaignViaUI(
  page: Page,
  campaignName?: string,
): Promise<void> {
  await page.goto("/profile/user/rewards", { waitUntil: "domcontentloaded" });

  const section = page.locator("section").filter({ hasText: "限時搶券" });
  await section.waitFor({ state: "visible", timeout: 20_000 });

  const card = campaignName
    ? section.locator("div.rounded-2xl").filter({ hasText: campaignName })
    : section.locator("div.rounded-2xl").first();

  await card.getByRole("button", { name: "立即搶券" }).click();
}
