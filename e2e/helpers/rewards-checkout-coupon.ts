import { expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import {
  findActiveDiscountCouponTemplateId,
  findActiveFreeShippingTemplateId,
} from "./platform-rewards";

export type CheckoutSummaryAmounts = {
  itemSubtotal: number;
  shippingFee: number;
  platformSubsidy: number;
  totalAmount: number;
};

type RewardTemplateAuditSnapshot = {
  type?: string;
  status?: string;
  reward_value?: {
    min_spend_hkd?: number;
    amount_hkd?: number;
    max_subsidy_hkd?: number;
  };
};

function createE2eAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function listRecentTemplateAudits(limit = 200) {
  const admin = createE2eAdminClient();
  const { data, error } = await admin
    .from("reward_template_audits")
    .select("template_id, snapshot")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`[listRecentTemplateAudits] ${error.message}`);
  }

  return data ?? [];
}

export async function findActiveDiscountTemplateByMinSpend(
  minSpend: number,
): Promise<string | null> {
  const latestByTemplate = new Map<string, RewardTemplateAuditSnapshot>();

  for (const row of await listRecentTemplateAudits()) {
    if (!latestByTemplate.has(row.template_id)) {
      latestByTemplate.set(
        row.template_id,
        row.snapshot as RewardTemplateAuditSnapshot,
      );
    }
  }

  for (const [templateId, snapshot] of latestByTemplate) {
    if (
      snapshot?.type !== "discount_coupon" ||
      snapshot?.status !== "active"
    ) {
      continue;
    }

    const templateMinSpend = Number(snapshot.reward_value?.min_spend_hkd ?? 0);
    if (templateMinSpend === minSpend) {
      return templateId;
    }
  }

  return null;
}

export async function findActiveFreeShippingTemplateFromAudits(): Promise<string | null> {
  const latestByTemplate = new Map<string, RewardTemplateAuditSnapshot>();

  for (const row of await listRecentTemplateAudits()) {
    if (!latestByTemplate.has(row.template_id)) {
      latestByTemplate.set(
        row.template_id,
        row.snapshot as RewardTemplateAuditSnapshot,
      );
    }
  }

  for (const [templateId, snapshot] of latestByTemplate) {
    if (
      snapshot?.type === "free_shipping" &&
      snapshot?.status === "active"
    ) {
      return templateId;
    }
  }

  return null;
}

export async function resolveCheckoutCouponTemplateIds(): Promise<{
  highMinSpendTemplateId: string;
  lowMinSpendTemplateId: string;
  freeShippingTemplateId: string | null;
}> {
  const highMinSpendTemplateId =
    (await findActiveDiscountTemplateByMinSpend(500)) ??
    (await findActiveDiscountTemplateByMinSpend(5000));
  const lowMinSpendTemplateId =
    (await findActiveDiscountTemplateByMinSpend(50)) ??
    (await findActiveDiscountTemplateByMinSpend(0)) ??
    (await findActiveDiscountCouponTemplateId());
  const freeShippingTemplateId =
    (await findActiveFreeShippingTemplateFromAudits()) ??
    (await findActiveFreeShippingTemplateId());

  if (!highMinSpendTemplateId || !lowMinSpendTemplateId) {
    throw new Error(
      `Missing discount coupon templates (high=${highMinSpendTemplateId ?? "none"}, low=${lowMinSpendTemplateId ?? "none"}). Run platform-rewards-phase2 E2E once or publish templates via admin.`,
    );
  }

  return {
    highMinSpendTemplateId,
    lowMinSpendTemplateId,
    freeShippingTemplateId,
  };
}

function parseHkdAmount(text: string | null | undefined): number {
  if (!text) {
    return 0;
  }

  const normalized = text.replace(/,/g, "");
  const match = normalized.match(/-?\s*HK\$\s*([\d.]+)/);
  return match ? Number(match[1]) : 0;
}

async function readSummaryRowAmount(
  page: Page,
  label: string | RegExp,
): Promise<number> {
  const summary = page
    .locator("div")
    .filter({ hasText: "訂單財務明細總結" })
    .first();
  const labelMatcher =
    typeof label === "string"
      ? page.getByText(label, { exact: true })
      : page.getByText(label);
  const row = summary.locator("div.flex.justify-between").filter({
    has: labelMatcher,
  });
  const valueText = await row.locator("span").last().textContent();
  return parseHkdAmount(valueText);
}

export async function readCheckoutSummaryAmounts(
  page: Page,
): Promise<CheckoutSummaryAmounts> {
  const itemSubtotal = await readSummaryRowAmount(page, "卡牌商品總額");
  const shippingFee = await readSummaryRowAmount(page, /運費/);
  const totalAmount = await readSummaryRowAmount(page, "託管安全支付總額");

  const subsidyVisible = await page
    .getByText("平台優惠", { exact: true })
    .isVisible()
    .catch(() => false);
  const platformSubsidy = subsidyVisible
    ? await readSummaryRowAmount(page, "平台優惠")
    : 0;

  return {
    itemSubtotal,
    shippingFee,
    platformSubsidy,
    totalAmount,
  };
}

export async function expireUserRewardForE2e(userRewardId: string): Promise<void> {
  const admin = createE2eAdminClient();
  const { error } = await admin
    .from("user_rewards")
    .update({
      calculated_expiry: new Date(Date.now() - 60_000).toISOString(),
    })
    .eq("id", userRewardId);

  if (error) {
    throw new Error(`[expireUserRewardForE2e] ${error.message}`);
  }
}

export async function fillMerchantDirectFulfillmentForm(
  page: Page,
): Promise<void> {
  await page.locator("#p-tel").fill("91234567");
  await page.locator("#p-addr").fill("E2E 九龍塘順豐智能櫃");
}

export async function ensureCourierShippingSelected(page: Page): Promise<void> {
  await page.getByRole("button", { name: "快遞寄貨" }).click();
  await page.waitForTimeout(1500);
}

export async function waitForMerchantDirectCheckoutReady(
  page: Page,
): Promise<void> {
  const summary = page.getByText("訂單財務明細總結");
  const couponSection = page.getByText("平台優惠券");
  await expect(summary.or(couponSection).first()).toBeVisible({
    timeout: 30_000,
  });
}

type CheckoutCouponPickerPollState =
  | "ready"
  | "loading"
  | "empty"
  | "error"
  | "pending";

async function pollCheckoutCouponPickerState(
  page: Page,
): Promise<CheckoutCouponPickerPollState> {
  if (await page.locator("#checkout-coupon").isVisible().catch(() => false)) {
    return "ready";
  }

  const emptyVisible = await page
    .getByText("暫無可用優惠券")
    .isVisible()
    .catch(() => false);
  if (emptyVisible) {
    return "empty";
  }

  const loadErrorVisible = await page
    .getByText("無法載入優惠券")
    .isVisible()
    .catch(() => false);
  if (loadErrorVisible) {
    return "error";
  }

  const loadingVisible = await page
    .getByText("載入優惠券中…")
    .isVisible()
    .catch(() => false);
  if (loadingVisible) {
    return "loading";
  }

  return "pending";
}

export async function waitForCheckoutCouponPicker(
  page: Page,
  options?: { rewardId?: string; timeout?: number },
): Promise<void> {
  const timeout = options?.timeout ?? 30_000;

  await expect
    .poll(
      async () => {
        const outcome = await pollCheckoutCouponPickerState(page);
        if (outcome === "empty") {
          throw new Error("Checkout coupon picker is empty (暫無可用優惠券)");
        }
        if (outcome === "error") {
          const message =
            (await page
              .getByText(/無法載入優惠券/)
              .first()
              .textContent()) ?? "無法載入優惠券";
          throw new Error(
            `Checkout coupon picker failed to load: ${message.trim()}`,
          );
        }
        return outcome;
      },
      { timeout },
    )
    .toBe("ready");

  if (options?.rewardId) {
    await waitForCheckoutCouponOptionEnabled(page, options.rewardId);
  }
}

export async function waitForCheckoutCouponClearedAfterAuthToggle(
  page: Page,
): Promise<void> {
  await expect(page.getByText("載入優惠券中…")).toBeHidden({
    timeout: 30_000,
  });
  await waitForCheckoutCouponPicker(page, { timeout: 30_000 });
  await expect(page.locator("#checkout-coupon")).toHaveValue("");
}

export async function waitForCheckoutCouponOptionEnabled(
  page: Page,
  rewardId: string,
): Promise<void> {
  const option = page.locator(`#checkout-coupon option[value="${rewardId}"]`);
  await expect(option).toBeEnabled({ timeout: 30_000 });
}

export async function expectPlatformSubsidyVisible(
  page: Page,
  visible: boolean,
): Promise<void> {
  const subsidy = page.getByText("平台優惠", { exact: true });
  if (visible) {
    await expect(subsidy).toBeVisible();
  } else {
    await expect(subsidy).toBeHidden();
  }
}
