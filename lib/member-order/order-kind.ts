export type MemberOrderKind = "member" | "merchant";

export const DEFAULT_MEMBER_ORDER_KIND: MemberOrderKind = "member";

export type BuyerCompleteOrderInput = {
  orderKind: MemberOrderKind;
  orderId: string;
};
