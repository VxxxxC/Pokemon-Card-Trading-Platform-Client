import { DEFAULT_AUTH_FEE_HKD } from "@/lib/platform/auth-escrow-config";

export const LISTING_AUTH_SERVICE_TOOLTIP_TITLE = "平台鑑定託管（買家可選）";

export function buildAuthServiceTooltipBody(feeHkd: number): string {
  return `開啟後，買家出價時可選擇加購平台鑑定服務。流程：買家付款（卡價 + HK$${feeHkd} 鑑定費，由買家承擔）→ 您將卡牌寄往平台 → 平台鑑定 → 平台代發貨予買家 → 放款予您。

關閉則僅支援買賣雙方面交，買家無法加購鑑定。`;
}

export function buildListingAuthServiceInlineSummary(feeHkd: number): string {
  return `僅裸卡適用。已評級卡（PSA／CGC 等）無需平台複鑑；開啟後買家可選加購（HK$${feeHkd} 由買家承擔）。`;
}

/** @deprecated Use buildAuthServiceTooltipBody(feeHkd) */
export const LISTING_AUTH_SERVICE_TOOLTIP_BODY =
  buildAuthServiceTooltipBody(DEFAULT_AUTH_FEE_HKD);

export const BUYER_AUTH_DISABLED_COPY = "此賣家不接受平台鑑定加購。";

/** Buyer slide-over / checkout: what enabling the switch does. */
export function buildBuyerAuthAddOnDescription(feeHkd: number): string {
  return `開啟後成交須另付 HK$${feeHkd} 鑑定費；賣家寄卡至平台複驗真偽與品相，通過後平台代發貨給你。`;
}

export const AUTH_OFFER_MESSAGE_PREFIX = "[AUTH_REQUEST]";

export function formatAuthOfferMessageContent(
  offerPrice: number,
  feeHkd: number = DEFAULT_AUTH_FEE_HKD,
): string {
  return `${AUTH_OFFER_MESSAGE_PREFIX} 出價 HK$ ${offerPrice.toLocaleString()} · 買家要求平台鑑定加購服務（HK$${feeHkd}），成交後需寄卡至平台鑑定`;
}

export function formatStandardOfferMessageContent(offerPrice: number): string {
  return `出價 HK$ ${offerPrice.toLocaleString()}`;
}
