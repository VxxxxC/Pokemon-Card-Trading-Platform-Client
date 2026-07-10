export function formatSellerIdentityLabel(
  displayName: string | null | undefined,
  username: string | null | undefined,
): string {
  const name = displayName?.trim() || "賣家";
  const handle = username?.trim();
  return handle ? `${name} (${handle})` : name;
}

export function resolveSellerProfilePath(input: {
  sellerId: string;
  sellerUsername?: string | null;
}): string {
  const username = input.sellerUsername?.trim();
  return `/profile/${username || input.sellerId}`;
}
