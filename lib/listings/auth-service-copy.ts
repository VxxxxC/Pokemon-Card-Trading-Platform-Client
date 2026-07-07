import { MEMBER_AUTH_SERVICE_FEE } from "@/app/lib/member-order/p2p";

export const LISTING_AUTH_SERVICE_TOOLTIP_TITLE = "平台鑑定託管（買家可選）";

export const LISTING_AUTH_SERVICE_TOOLTIP_BODY = `開啟後，買家出價時可選擇加購平台鑑定服務。流程：買家付款（卡價 + HK$${MEMBER_AUTH_SERVICE_FEE} 鑑定費，由買家承擔）→ 您將卡牌寄往平台 → 平台鑑定 → 平台代發貨予買家 → 放款予您。

關閉則僅支援買賣雙方面交，買家無法加購鑑定。`;

export const BUYER_AUTH_DISABLED_COPY =
  "此賣家不接受平台鑑定加購，僅支援面交議價。";

export const AUTH_OFFER_MESSAGE_PREFIX = "[AUTH_REQUEST]";

export function formatAuthOfferMessageContent(offerPrice: number): string {
  return `${AUTH_OFFER_MESSAGE_PREFIX} 出價 HK$ ${offerPrice.toLocaleString()} · 買家要求平台鑑定加購服務（HK$${MEMBER_AUTH_SERVICE_FEE}），成交後需寄卡至平台鑑定`;
}

export function formatStandardOfferMessageContent(offerPrice: number): string {
  return `出價 HK$ ${offerPrice.toLocaleString()}`;
}
