import {
  getActivityBadgeById,
  getMainTitle,
  resolveReputationTagDisplay,
} from "@/lib/constants/titles";
import { formatSellerJoinDate, isUuid, resolveActivityBadgeEmoji } from "@/lib/marketplace/seller-profile";
import { resolveAvatarUrl } from "@/lib/profile/avatar";
import { createPublicClient } from "@/lib/supabase/public";
import type { Json, Tables } from "@/types/supabase";

export type MarketplaceSellerBadge = {
  id: string;
  label: string;
  emoji: string;
  desc: string;
};

export type MarketplaceSellerProfile = {
  id: string;
  username: string;
  handle: string;
  joinDate: string;
  avatarUrl: string;
  bio: string;
  level: string;
  verifiedBuyer: boolean;
  completedTrades: number;
  badges: MarketplaceSellerBadge[];
  role: Tables<"profiles">["role"];
  ratingScore: number;
};

type ProfileRow = Pick<
  Tables<"profiles">,
  | "id"
  | "display_name"
  | "username"
  | "short_description"
  | "created_at"
  | "completed_trades_count"
  | "rating_score"
  | "reputation_tag"
  | "role"
  | "avatar_path"
>;

type MerchantShopRow = Pick<
  Tables<"merchant_shops">,
  | "shop_name"
  | "shop_handle"
  | "shop_description"
  | "completed_trades_count"
  | "rating_score"
>;

function mapBadges(reputationTag: Json | null): MarketplaceSellerBadge[] {
  const resolved = resolveReputationTagDisplay(reputationTag);
  return resolved.activityBadges.map((badge) => ({
    id: badge.id,
    label: badge.nameZh,
    emoji: resolveActivityBadgeEmoji(badge.category),
    desc: badge.description,
  }));
}

function resolveLevelLabel(
  profile: ProfileRow,
  merchantShop: MerchantShopRow | null,
): string {
  const isMerchant = profile.role === "merchant";
  const resolved = resolveReputationTagDisplay(profile.reputation_tag);
  const titleFromTag = isMerchant
    ? resolved.merchantTitle
    : resolved.memberTitle;

  if (titleFromTag) {
    return titleFromTag.nameZh;
  }

  const completedTrades = isMerchant
    ? (merchantShop?.completed_trades_count ?? profile.completed_trades_count)
    : profile.completed_trades_count;

  const fallback = getMainTitle(completedTrades, {
    isMerchant,
    rating: isMerchant
      ? (merchantShop?.rating_score ?? profile.rating_score ?? undefined)
      : undefined,
    hasMerchantShop: isMerchant && merchantShop != null,
  });

  return fallback?.nameZh ?? (isMerchant ? "認證商戶" : "平台會員");
}

function mapProfileRow(
  profile: ProfileRow,
  merchantShop: MerchantShopRow | null,
): MarketplaceSellerProfile {
  const isMerchant = profile.role === "merchant";
  const completedTrades = isMerchant
    ? (merchantShop?.completed_trades_count ?? profile.completed_trades_count)
    : profile.completed_trades_count;

  const username = isMerchant
    ? merchantShop?.shop_name?.trim() || "認證商戶"
    : profile.display_name?.trim() || "平台用戶";

  const handleUsername = isMerchant
    ? merchantShop?.shop_handle?.trim()
    : profile.username?.trim();
  const handle = handleUsername
    ? `@${handleUsername}`
    : `@${profile.id.slice(0, 8)}`;

  const bio =
    (isMerchant ? merchantShop?.shop_description?.trim() : null) ||
    profile.short_description?.trim() ||
    "此賣家尚未填寫櫥窗簡介。";

  const ratingScore = isMerchant
    ? Number(merchantShop?.rating_score ?? profile.rating_score ?? 0)
    : Number(profile.rating_score ?? 0);

  return {
    id: profile.id,
    username,
    handle,
    joinDate: formatSellerJoinDate(profile.created_at),
    avatarUrl: resolveAvatarUrl(profile.avatar_path),
    bio,
    level: resolveLevelLabel(profile, merchantShop),
    verifiedBuyer: isMerchant,
    completedTrades,
    badges: mapBadges(profile.reputation_tag),
    role: profile.role,
    ratingScore,
  };
}

async function fetchProfileById(
  profileId: string,
): Promise<MarketplaceSellerProfile | null> {
  const supabase = createPublicClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, username, short_description, created_at, completed_trades_count, rating_score, reputation_tag, role, avatar_path",
    )
    .eq("id", profileId)
    .maybeSingle<ProfileRow>();

  if (error) {
    console.error("[loadSellerProfileById]", error.message);
    throw new Error("無法載入商戶資料");
  }

  if (!profile) {
    return null;
  }

  let merchantShop: MerchantShopRow | null = null;
  if (profile.role === "merchant") {
    const shopResult = await supabase
      .from("merchant_shops")
      .select(
        "shop_name, shop_handle, shop_description, completed_trades_count, rating_score",
      )
      .eq("merchant_id", profile.id)
      .maybeSingle<MerchantShopRow>();

    if (shopResult.error) {
      console.error("[loadSellerProfileById] merchant_shops", shopResult.error.message);
    } else {
      merchantShop = shopResult.data;
    }
  }

  return mapProfileRow(profile, merchantShop);
}

async function fetchProfileByMemberUsername(
  username: string,
): Promise<MarketplaceSellerProfile | null> {
  const supabase = createPublicClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, username, short_description, created_at, completed_trades_count, rating_score, reputation_tag, role, avatar_path",
    )
    .ilike("username", username.trim())
    .maybeSingle<ProfileRow>();

  if (error) {
    console.error("[loadSellerProfileByMemberUsername]", error.message);
    throw new Error("無法載入商戶資料");
  }

  if (!profile) {
    return null;
  }

  return fetchProfileById(profile.id);
}

async function fetchProfileByMerchantShopHandle(
  shopHandle: string,
): Promise<MarketplaceSellerProfile | null> {
  const supabase = createPublicClient();

  const { data: shop, error } = await supabase
    .from("merchant_shops")
    .select("merchant_id")
    .ilike("shop_handle", shopHandle.trim())
    .maybeSingle<Pick<Tables<"merchant_shops">, "merchant_id">>();

  if (error) {
    console.error("[loadSellerProfileByMerchantShopHandle]", error.message);
    throw new Error("無法載入商戶資料");
  }

  if (!shop?.merchant_id) {
    return null;
  }

  return fetchProfileById(shop.merchant_id);
}

export async function loadMarketplaceSellerProfile(
  sellerKey: string,
): Promise<MarketplaceSellerProfile | null> {
  const trimmed = sellerKey.trim();
  if (!trimmed) {
    return null;
  }

  if (isUuid(trimmed)) {
    return fetchProfileById(trimmed);
  }

  const byMerchantHandle = await fetchProfileByMerchantShopHandle(trimmed);
  if (byMerchantHandle) {
    return byMerchantHandle;
  }

  return fetchProfileByMemberUsername(trimmed);
}
