/** Mirrors `platform_settings.auth_escrow_config` defaults (Phase A). */
export const AUTH_ESCROW_SF_LEG_FEE_HKD = 30;
export const AUTH_ESCROW_AUTH_FEE_HKD = 150;

export function estimateAuthEscrowCheckoutTotal(itemSubtotal: number): number {
  return (
    itemSubtotal +
    AUTH_ESCROW_AUTH_FEE_HKD +
    AUTH_ESCROW_SF_LEG_FEE_HKD * 2
  );
}
