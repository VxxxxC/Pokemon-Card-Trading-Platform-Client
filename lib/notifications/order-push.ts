import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/notifications/push-delivery";
import type { Tables } from "@/types/supabase";

type ListingPushContext = {
  cardName: string;
  sellerPersona: "merchant" | "member";
};

type ProfileNameRow = Pick<Tables<"profiles">, "display_name" | "username">;
type MerchantShopNameRow = Pick<Tables<"merchant_shops">, "shop_name" | "shop_handle">;

type MerchantOrderPaymentRow = Pick<
  Tables<"merchant_orders">,
  | "id"
  | "buyer_id"
  | "merchant_id"
  | "listing_id"
  | "buyer_total_amount"
  | "total_amount"
  | "final_price"
>;

type MemberOrderPaymentRow = Pick<
  Tables<"member_orders">,
  | "id"
  | "buyer_id"
  | "seller_id"
  | "listing_id"
  | "buyer_total_amount"
  | "total_amount"
  | "final_price"
>;

export function formatOrderPushAmount(amount: number): string {
  return `HK$${amount.toLocaleString("en-HK", { maximumFractionDigits: 0 })}`;
}

function resolveOrderAmount(amounts: {
  buyer_total_amount: number | null;
  total_amount: number | null;
  final_price: number;
}): number {
  return Number(
    amounts.buyer_total_amount ?? amounts.total_amount ?? amounts.final_price,
  );
}

async function fetchListingPushContext(
  listingId: string,
): Promise<ListingPushContext | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("listings")
    .select(
      `
        seller_persona,
        product_catalog (
          name_zh,
          name_ja
        )
      `,
    )
    .eq("id", listingId)
    .maybeSingle<{
      seller_persona: Tables<"listings">["seller_persona"] | null;
      product_catalog: {
        name_zh: string | null;
        name_ja: string;
      } | null;
    }>();

  if (error || !data) {
    console.warn("[order-push] listing lookup", listingId, error?.message);
    return null;
  }

  const catalog = data.product_catalog;
  const cardName =
    catalog?.name_zh?.trim() || catalog?.name_ja?.trim() || "商品";

  return {
    cardName,
    sellerPersona: data.seller_persona === "merchant" ? "merchant" : "member",
  };
}

async function resolveMemberDisplayName(userId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("display_name, username")
    .eq("id", userId)
    .maybeSingle<ProfileNameRow>();

  return data?.display_name?.trim() || data?.username?.trim() || "買家";
}

async function resolveSellerDisplayName(
  sellerId: string,
  sellerPersona: "merchant" | "member",
): Promise<string> {
  if (sellerPersona === "merchant") {
    const admin = createAdminClient();
    const { data } = await admin
      .from("merchant_shops")
      .select("shop_name, shop_handle")
      .eq("merchant_id", sellerId)
      .maybeSingle<MerchantShopNameRow>();

    return data?.shop_name?.trim() || data?.shop_handle?.trim() || "賣家";
  }

  return resolveMemberDisplayName(sellerId);
}

function sellerOrderDetailPath(
  orderId: string,
  sellerPersona: "merchant" | "member",
): string {
  return sellerPersona === "merchant"
    ? `/profile/merchant/orderDetail/${orderId}`
    : `/profile/user/orderDetail/${orderId}`;
}

export function buildOrderPaymentConfirmedSellerPushCopy(input: {
  cardName: string;
  buyerName: string;
  amountLabel: string;
}): { heading: string; body: string } {
  return {
    heading: `買家已付款：${input.cardName}`,
    body: `${input.buyerName} 已付款 ${input.amountLabel}，請盡快處理訂單`,
  };
}

export function buildOrderShippedBuyerPushCopy(input: {
  cardName: string;
  sellerName: string;
  trackingNo?: string;
  courierName?: string;
}): { heading: string; body: string } {
  const tracking =
    input.trackingNo && input.courierName
      ? `（${input.courierName} ${input.trackingNo}）`
      : input.trackingNo
        ? `（${input.trackingNo}）`
        : "";

  return {
    heading: `賣家已發貨：${input.cardName}`,
    body: `${input.sellerName} 已發貨${tracking}`,
  };
}

export function buildOrderPaymentExpiredBuyerPushCopy(input: {
  cardName: string;
  amountLabel: string;
}): { heading: string; body: string } {
  return {
    heading: `訂單已取消：${input.cardName}`,
    body: `訂單 ${input.amountLabel} 因逾期未付款已自動取消`,
  };
}

export async function sendMerchantOrderPaymentConfirmedSellerPush(
  orderId: string,
): Promise<void> {
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("merchant_orders")
    .select(
      "id, buyer_id, merchant_id, listing_id, buyer_total_amount, total_amount, final_price",
    )
    .eq("id", orderId)
    .maybeSingle<MerchantOrderPaymentRow>();

  if (error || !order) {
    console.warn("[order-push] merchant order lookup", orderId, error?.message);
    return;
  }

  const listing = await fetchListingPushContext(order.listing_id);
  if (!listing) return;

  const buyerName = await resolveMemberDisplayName(order.buyer_id);
  const copy = buildOrderPaymentConfirmedSellerPushCopy({
    cardName: listing.cardName,
    buyerName,
    amountLabel: formatOrderPushAmount(resolveOrderAmount(order)),
  });

  await sendPushToUser({
    eventId: "P-ORD-01",
    userId: order.merchant_id,
    heading: copy.heading,
    body: copy.body,
    path: sellerOrderDetailPath(order.id, "merchant"),
  });
}

export async function sendMemberOrderPaymentConfirmedSellerPush(
  orderId: string,
): Promise<void> {
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("member_orders")
    .select(
      "id, buyer_id, seller_id, listing_id, buyer_total_amount, total_amount, final_price",
    )
    .eq("id", orderId)
    .maybeSingle<MemberOrderPaymentRow>();

  if (error || !order) {
    console.warn("[order-push] member order lookup", orderId, error?.message);
    return;
  }

  const listing = await fetchListingPushContext(order.listing_id);
  if (!listing) return;

  const buyerName = await resolveMemberDisplayName(order.buyer_id);
  const copy = buildOrderPaymentConfirmedSellerPushCopy({
    cardName: listing.cardName,
    buyerName,
    amountLabel: formatOrderPushAmount(resolveOrderAmount(order)),
  });

  await sendPushToUser({
    eventId: "P-ORD-01",
    userId: order.seller_id,
    heading: copy.heading,
    body: copy.body,
    path: sellerOrderDetailPath(order.id, listing.sellerPersona),
  });
}

export async function sendMerchantOrderShippedBuyerPush(
  orderId: string,
  options?: { trackingNo?: string | null; courierName?: string | null },
): Promise<void> {
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("merchant_orders")
    .select(
      "id, buyer_id, merchant_id, listing_id, outbound_tracking_no, outbound_courier_name",
    )
    .eq("id", orderId)
    .maybeSingle<
      Pick<
        MerchantOrderPaymentRow,
        "id" | "buyer_id" | "merchant_id" | "listing_id"
      > & {
        outbound_tracking_no: string | null;
        outbound_courier_name: string | null;
      }
    >();

  if (error || !order) {
    console.warn(
      "[order-push] merchant order lookup (shipped)",
      orderId,
      error?.message,
    );
    return;
  }

  const listing = await fetchListingPushContext(order.listing_id);
  if (!listing) return;

  const sellerName = await resolveSellerDisplayName(
    order.merchant_id,
    listing.sellerPersona,
  );
  const trackingNo =
    options?.trackingNo?.trim() ||
    order.outbound_tracking_no?.trim() ||
    undefined;
  const courierName =
    options?.courierName?.trim() ||
    order.outbound_courier_name?.trim() ||
    undefined;

  const copy = buildOrderShippedBuyerPushCopy({
    cardName: listing.cardName,
    sellerName,
    trackingNo,
    courierName,
  });

  await sendPushToUser({
    eventId: "P-ORD-02",
    userId: order.buyer_id,
    heading: copy.heading,
    body: copy.body,
    path: `/profile/user/orderDetail/${order.id}`,
  });
}

export async function sendMerchantOrderPaymentExpiredBuyerPush(
  orderId: string,
): Promise<void> {
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("merchant_orders")
    .select(
      "id, buyer_id, listing_id, buyer_total_amount, total_amount, final_price",
    )
    .eq("id", orderId)
    .maybeSingle<
      Pick<
        MerchantOrderPaymentRow,
        | "id"
        | "buyer_id"
        | "listing_id"
        | "buyer_total_amount"
        | "total_amount"
        | "final_price"
      >
    >();

  if (error || !order) {
    console.warn(
      "[order-push] merchant order lookup (expired)",
      orderId,
      error?.message,
    );
    return;
  }

  const listing = await fetchListingPushContext(order.listing_id);
  if (!listing) return;

  const copy = buildOrderPaymentExpiredBuyerPushCopy({
    cardName: listing.cardName,
    amountLabel: formatOrderPushAmount(resolveOrderAmount(order)),
  });

  await sendPushToUser({
    eventId: "P-ORD-03",
    userId: order.buyer_id,
    heading: copy.heading,
    body: copy.body,
    path: "/profile/user/trading",
  });
}
