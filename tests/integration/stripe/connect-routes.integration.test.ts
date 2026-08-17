import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.hoisted(() => vi.fn());
const profileMaybeSingle = vi.hoisted(() => vi.fn());
const kycMaybeSingle = vi.hoisted(() => vi.fn());
const kycApplicationMaybeSingle = vi.hoisted(() => vi.fn());
const kycUpdate = vi.hoisted(() => vi.fn());
const accountLinksCreate = vi.hoisted(() => vi.fn());
const createExpressAccount = vi.hoisted(() => vi.fn());
const createLoginLink = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/site-url", () => ({
  getSiteUrl: async () => "http://localhost:3000",
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser },
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: profileMaybeSingle,
            }),
          }),
        };
      }
      return {};
    },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "kyc_records") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: kycMaybeSingle,
            }),
          }),
          update: () => ({
            eq: kycUpdate,
          }),
        };
      }
      if (table === "kyc_applications") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: kycApplicationMaybeSingle,
              }),
            }),
          }),
        };
      }
      return {};
    },
  }),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    accountLinks: {
      create: accountLinksCreate,
    },
  },
}));

vi.mock("@/lib/stripe/connect-kyc", () => ({
  createExpressAccountForKycApplication: createExpressAccount,
}));

vi.mock("@/lib/stripe/connect-dashboard", () => ({
  createMerchantExpressLoginLink: createLoginLink,
}));

vi.mock("@/lib/stripe/payout-ready", () => ({
  isMerchantPayoutReady: vi.fn(() => true),
}));

vi.mock("@/lib/stripe/sync-kyc-connect-flags", () => ({
  isStripeConnectAccountId: (value: string | null | undefined) =>
    typeof value === "string" && value.startsWith("acct_"),
}));

import { GET as getConnectOnboard } from "@/app/api/stripe/connect/onboard/route";
import { GET as getConnectDashboard } from "@/app/api/stripe/connect/dashboard/route";

describe("Stripe Connect HTTP routes (TC-M10)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: null } });
    profileMaybeSingle.mockResolvedValue({ data: { role: "merchant" } });
    kycMaybeSingle.mockResolvedValue({
      data: {
        kyc_status: "verified",
        stripe_account_id: "acct_test_connect",
        stripe_charges_enabled: true,
        stripe_payouts_enabled: true,
      },
    });
    kycApplicationMaybeSingle.mockResolvedValue({ data: null });
    kycUpdate.mockResolvedValue({ error: null });
    accountLinksCreate.mockResolvedValue({ url: "https://connect.stripe.com/onboard" });
    createExpressAccount.mockResolvedValue({ id: "acct_created_retry" });
    createLoginLink.mockResolvedValue({ url: "https://connect.stripe.com/express/login" });
  });

  it("onboard redirects guests to /auth", async () => {
    const response = await getConnectOnboard();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/auth");
  });

  it("onboard redirects non-merchant users to /profile/user", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "00000000-0000-4000-8000-000000000001" } },
    });
    profileMaybeSingle.mockResolvedValue({ data: { role: "member" } });

    const response = await getConnectOnboard();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/profile/user",
    );
  });

  it("onboard redirects merchant without approved KYC to finance fallback", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "00000000-0000-4000-8000-000000000002" } },
    });
    kycMaybeSingle.mockResolvedValue({ data: { stripe_account_id: null } });
    kycApplicationMaybeSingle.mockResolvedValue({ data: null });

    const response = await getConnectOnboard();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/profile/merchant?stripe=no-kyc",
    );
  });

  it("onboard creates account link for payout-ready merchant", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "00000000-0000-4000-8000-000000000003" } },
    });

    const response = await getConnectOnboard();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://connect.stripe.com/onboard",
    );
    expect(accountLinksCreate).toHaveBeenCalled();
  });

  it("dashboard redirects payout-ready merchant to Express login link", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "00000000-0000-4000-8000-000000000004" } },
    });

    const response = await getConnectDashboard();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://connect.stripe.com/express/login",
    );
    expect(createLoginLink).toHaveBeenCalledWith("acct_test_connect");
  });
});
