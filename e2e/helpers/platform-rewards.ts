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
