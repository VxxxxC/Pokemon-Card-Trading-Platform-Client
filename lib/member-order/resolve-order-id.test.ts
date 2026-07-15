import { describe, expect, test } from "bun:test";
import type { createClient } from "@/lib/supabase/server";
import {
  INVALID_MEMBER_ORDER_ID_ERROR,
  resolveMemberOrderIdForUser,
} from "./resolve-order-id";

const USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORDER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const LISTING_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

type MockConfig = {
  orderById?: { id: string } | null;
  ordersByListingId?: Array<{ id: string; status?: string }>;
  orderByNumber?: { id: string } | null;
  ordersByDisplayId?: Array<{ id: string; status?: string }>;
};

type QueryState = {
  table: string;
  filters: Record<string, string | string[]>;
};

function resolveQuery(
  state: QueryState,
  config: MockConfig,
  mode: "single" | "array",
): { data: unknown; error: null } {
  if (state.table === "member_orders" && state.filters.id) {
    return { data: config.orderById ?? null, error: null };
  }
  if (state.table === "member_orders" && state.filters.order_number) {
    return { data: config.orderByNumber ?? null, error: null };
  }
  if (state.table === "member_orders" && state.filters.listing_id) {
    return { data: config.ordersByListingId ?? [], error: null };
  }
  if (
    state.table === "member_orders" &&
    state.filters["listings.product_catalog.display_id"]
  ) {
    return { data: config.ordersByDisplayId ?? [], error: null };
  }

  return { data: mode === "single" ? null : [], error: null };
}

function createMockSupabase(config: MockConfig) {
  const state: QueryState = { table: "", filters: {} };

  const builder = {
    select: () => builder,
    eq: (column: string, value: string) => {
      state.filters[column] = value;
      return builder;
    },
    or: () => builder,
    order: () => Promise.resolve(resolveQuery(state, config, "array")),
    in: (column: string, values: string[]) => {
      state.filters[column] = values;
      return builder;
    },
    maybeSingle: () => Promise.resolve(resolveQuery(state, config, "single")),
    then: (
      onFulfilled: (value: { data: unknown; error: null }) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) =>
      Promise.resolve(resolveQuery(state, config, "array")).then(
        onFulfilled,
        onRejected,
      ),
  };

  return {
    from: (table: string) => {
      state.table = table;
      state.filters = {};
      return builder;
    },
  } as unknown as Awaited<ReturnType<typeof createClient>>;
}

describe("resolveMemberOrderIdForUser", () => {
  test("resolves member_orders.id UUID for participant", async () => {
    const supabase = createMockSupabase({
      orderById: { id: ORDER_ID },
    });

    const result = await resolveMemberOrderIdForUser(
      supabase,
      ORDER_ID,
      USER_ID,
    );

    expect(result).toEqual({ ok: true, id: ORDER_ID });
  });

  test("falls back from listing UUID to pending member order", async () => {
    const supabase = createMockSupabase({
      orderById: null,
      ordersByListingId: [
        { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", status: "completed" },
        { id: ORDER_ID, status: "pending" },
      ],
    });

    const result = await resolveMemberOrderIdForUser(
      supabase,
      LISTING_ID,
      USER_ID,
    );

    expect(result).toEqual({ ok: true, id: ORDER_ID });
  });

  test("resolves ORD-* order number (case-insensitive)", async () => {
    const supabase = createMockSupabase({
      orderByNumber: { id: ORDER_ID },
    });

    const result = await resolveMemberOrderIdForUser(
      supabase,
      "ord-2026-abc123",
      USER_ID,
    );

    expect(result).toEqual({ ok: true, id: ORDER_ID });
  });

  test("resolves product display_id such as OFFICIAL-44940", async () => {
    const supabase = createMockSupabase({
      ordersByDisplayId: [{ id: ORDER_ID, status: "pending" }],
    });

    const result = await resolveMemberOrderIdForUser(
      supabase,
      "OFFICIAL-44940",
      USER_ID,
    );

    expect(result).toEqual({ ok: true, id: ORDER_ID });
  });

  test("returns unified error for unknown identifiers", async () => {
    const supabase = createMockSupabase({
      orderById: null,
      ordersByListingId: [],
      ordersByDisplayId: [],
    });

    const result = await resolveMemberOrderIdForUser(
      supabase,
      "not-a-real-order-key",
      USER_ID,
    );

    expect(result).toEqual({
      ok: false,
      error: INVALID_MEMBER_ORDER_ID_ERROR,
    });
  });

  test("returns not-found for ORD-* with no matching order", async () => {
    const supabase = createMockSupabase({
      orderByNumber: null,
    });

    const result = await resolveMemberOrderIdForUser(
      supabase,
      "ORD-2026-ZZZZZZ",
      USER_ID,
    );

    expect(result).toEqual({
      ok: false,
      error: "找不到指定的交易訂單記錄",
    });
  });

  test("prefers pending order when multiple listings match display_id", async () => {
    const supabase = createMockSupabase({
      ordersByDisplayId: [
        { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", status: "completed" },
        { id: ORDER_ID, status: "pending" },
      ],
    });

    const result = await resolveMemberOrderIdForUser(
      supabase,
      "OFFICIAL-44940",
      USER_ID,
    );

    expect(result).toEqual({ ok: true, id: ORDER_ID });
  });
});
