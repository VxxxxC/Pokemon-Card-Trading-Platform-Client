import type { AdminDashboardSystemService } from "@/lib/admin-dashboard/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlatformStripeBalance } from "@/lib/stripe/platform-balance";
import { isStripeConfigured } from "@/lib/stripe/env";

function measureLatency<T>(fn: () => Promise<T>): Promise<{ result: T; latency: number }> {
  const start = performance.now();
  return fn().then((result) => ({
    result,
    latency: Math.round(performance.now() - start),
  }));
}

async function probeSupabase(): Promise<AdminDashboardSystemService> {
  const base: Omit<AdminDashboardSystemService, "status" | "latency"> = {
    id: "supabase",
    name: "後台服務器",
    subName: "Database & Auth Engine",
  };

  try {
    const { latency, result } = await measureLatency(async () => {
      const admin = createAdminClient();
      return admin
        .from("profiles")
        .select("id", { count: "exact", head: true });
    });

    if (result.error) {
      return { ...base, status: "offline", latency };
    }

    return { ...base, status: "online", latency };
  } catch {
    return { ...base, status: "offline", latency: 0 };
  }
}

async function probeStripe(): Promise<AdminDashboardSystemService> {
  const base: Omit<AdminDashboardSystemService, "status" | "latency"> = {
    id: "stripe",
    name: "Stripe API",
    subName: "Escrow & Payout Gateway",
  };

  if (!isStripeConfigured()) {
    return { ...base, status: "degraded", latency: 0 };
  }

  try {
    const { latency, result } = await measureLatency(() =>
      getPlatformStripeBalance(),
    );

    if (result.ok) {
      return { ...base, status: "online", latency };
    }

    return { ...base, status: "offline", latency };
  } catch {
    return { ...base, status: "offline", latency: 0 };
  }
}

function probeCrawler(): AdminDashboardSystemService {
  return {
    id: "crawler",
    name: "爬蟲引擎",
    subName: "Market Real-time Aggregator",
    status: "degraded",
    latency: 0,
  };
}

export async function runAdminDashboardHealthProbes(): Promise<
  AdminDashboardSystemService[]
> {
  const [supabase, stripe] = await Promise.all([
    probeSupabase(),
    probeStripe(),
  ]);

  return [supabase, probeCrawler(), stripe];
}
