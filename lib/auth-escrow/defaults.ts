/** Mirrors `platform_settings.auth_escrow_config` defaults (Phase A). */
import { DEFAULT_AUTH_FEE_HKD } from "@/lib/platform/auth-escrow-config";

export const AUTH_ESCROW_SF_LEG_FEE_HKD = 30;
export const AUTH_ESCROW_AUTH_FEE_HKD = DEFAULT_AUTH_FEE_HKD;

export function estimateAuthEscrowCheckoutTotal(
  itemSubtotal: number,
  authFeeHkd: number = DEFAULT_AUTH_FEE_HKD,
  sfLegFeeHkd: number = AUTH_ESCROW_SF_LEG_FEE_HKD,
): number {
  return itemSubtotal + authFeeHkd + sfLegFeeHkd * 2;
}
