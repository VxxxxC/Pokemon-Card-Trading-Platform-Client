// Centralized mock members / merchants bank
import type { MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";

export type ListingStatus = "active" | "sold" | "unlisted" | "pending_trade";

export interface PublicMemberBadge {
  readonly id: string;
  readonly label: string;
  readonly emoji: string;
  readonly desc: string;
}

export interface PublicMemberReview {
  readonly id: string;
  readonly reviewer: string;
  readonly rating: number;
  readonly comment: string;
  readonly date: string;
}

export interface PublicMemberListingGrade {
  readonly authority: string;
  readonly score: string;
  readonly label?: string;
}

export interface PublicMemberPriceOfferContext {
  readonly roomId: string;
  readonly partnerName: string;
  readonly buyerName: string;
  readonly offerPrice: number;
  readonly sellerId: string;
}

export interface PublicMemberListing {
  readonly id: string; // merchant-specific listing id (LST-...)
  readonly name: string;
  readonly cardNo?: string; // aggregated product id (e.g. sv2a-182)
  readonly set: string;
  readonly rarity: "SAR" | "UR" | "SR" | "AR";
  readonly grade: PublicMemberListingGrade;
  readonly conditionLabel?: "美品 S" | "微傷 A" | "傷 B";
  readonly price: number;
  readonly delta: number;
  readonly deltaDirection: "up" | "down";
  readonly image: string;
  readonly status: ListingStatus;
  readonly paymentMethods?: string[];
  readonly shippingMethods?: string[];
  readonly createdAt?: string;
  readonly views?: number;
  readonly watchers?: number;
  readonly linkedOrderId?: string;
  readonly hasPriceOffer?: boolean;
  readonly priceOfferContext?: PublicMemberPriceOfferContext;
}

export interface PublicMemberData {
  readonly id: string;
  readonly username: string;
  readonly handle: string;
  readonly joinDate: string;
  readonly avatarSeed: string;
  readonly level: string;
  readonly levelTier?: number;
  readonly bio: string;
  readonly verifiedBuyer?: boolean;
  readonly rating: number;
  readonly reviewCount: number;
  readonly completedTrades: number;
  readonly badges: ReadonlyArray<PublicMemberBadge>;
  readonly activeListings: ReadonlyArray<PublicMemberListing>;
  readonly reviews: ReadonlyArray<PublicMemberReview>;
}

// Core merchant dataset (seed)
export const MOCK_PUBLIC_MEMBERS: Record<string, PublicMemberData> = {
  "PKT-8839-44A": {
    id: "PKT-8839-44A",
    username: "渡邊道館",
    handle: "@watanabe_gym",
    joinDate: "2024年 8月加入",
    avatarSeed: "watanabe-gym-tcg",
    level: "專業道館主",
    levelTier: 4,
    bio: "專注於第一世代 PSA 10 鑑定卡與稀有未開封補充包。保證 24 小時內發貨，所有高價卡均走平台 Escrow 鑑定託管。",
    verifiedBuyer: true,
    rating: 4.9,
    reviewCount: 124,
    completedTrades: 1204,
    badges: [
      {
        id: "top-rated",
        label: "高評分賣家",
        emoji: "⭐",
        desc: "評分維持 4.8+ 滿 30 天",
      },
      {
        id: "1000trades",
        label: "千筆交易",
        emoji: "🏆",
        desc: "累計完成 1000 筆交易",
      },
      {
        id: "fast-shipper",
        label: "閃電發貨",
        emoji: "⚡",
        desc: "平均發貨時間小於 12 小時",
      },
    ],
    activeListings: [
      {
        id: "LST-C2C-001",
        name: "Charizard ex SAR (噴火龍 ex)",
        cardNo: "sv2a-182",
        set: "Pokémon 151",
        rarity: "SAR",
        grade: { authority: "PSA", score: "10", label: "PSA 10 完美鑑定" },
        conditionLabel: "美品 S",
        price: 2250,
        delta: 120,
        deltaDirection: "up",
        image: "https://picsum.photos/seed/user-zard/200/280",
        status: "active",
        paymentMethods: ["PayMe", "轉數快 (FPS)", "現金面交"],
        shippingMethods: ["順豐到付", "市區面交"],
        createdAt: "2026/05/28",
        views: 142,
        watchers: 18,
      },
      {
        id: "LST-C2C-002",
        name: "Pikachu AR (經典肥皮卡丘)",
        cardNo: "sv2a-215",
        set: "Pokémon 151",
        rarity: "AR",
        grade: { authority: "Raw Card", score: "NM", label: "裸卡 (美品S)" },
        conditionLabel: "美品 S",
        price: 425,
        delta: 90,
        deltaDirection: "up",
        image: "https://picsum.photos/seed/user-pika/200/280",
        status: "active",
        paymentMethods: ["轉數快 (FPS)", "現金面交"],
        shippingMethods: ["市區面交"],
        createdAt: "2026/05/25",
        views: 89,
        watchers: 5,
        linkedOrderId: "ORD-B2C-NOAUTH-004",
        hasPriceOffer: true,
        priceOfferContext: {
          roomId: "ROOM-BUYER-KOWLOON-001",
          partnerName: "九龍灣卡王",
          buyerName: "九龍灣卡王",
          offerPrice: 425,
          sellerId: "PKT-8839-44A",
        },
      },
      {
        id: "LST-C2C-003",
        name: "Mew ex SAR (復刻夢幻)",
        cardNo: "sv2a-205",
        set: "Pokémon 151",
        rarity: "SAR",
        grade: { authority: "PSA", score: "10", label: "PSA 10" },
        conditionLabel: "美品 S",
        price: 900,
        delta: 150,
        deltaDirection: "up",
        image: "https://picsum.photos/seed/user-mew/200/280",
        status: "sold",
        paymentMethods: ["PayMe"],
        shippingMethods: ["順豐速遞"],
        createdAt: "2026/05/10",
        views: 310,
        watchers: 24,
        linkedOrderId: "ORD-C2C-DONE-101",
      },
    ],
    reviews: [
      {
        id: "rev-001",
        reviewer: "K.田中",
        rating: 5,
        comment: "包裝非常謹慎，卡況與描述完全一致，快速發貨，強力推薦！",
        date: "2026年 5月",
      },
      {
        id: "rev-002",
        reviewer: "C.Lin",
        rating: 5,
        comment: "專業賣家，溝通回應快，第三次購買同一位賣家，值得信賴。",
        date: "2026年 4月",
      },
    ],
  },
};

export function getPublicMemberById(id: string) {
  return MOCK_PUBLIC_MEMBERS[id] ?? null;
}

// Convert internal merchant listing into storefront listing used by merchant storefront UI
export function getStorefrontListingsByMember(
  member: PublicMemberData,
): MarketplaceListing[] {
  return member.activeListings
    .filter((l) => l.status === "active")
    .map((listing) => ({
      id: listing.id, // merchant-specific listing id (preserve LST-... id for private storefront routes)
      cardNo: listing.cardNo,
      name: listing.name,
      set: listing.set,
      rarity: listing.rarity,
      grade: { authority: listing.grade.authority, score: listing.grade.score },
      conditionLabel: listing.conditionLabel,
      price: listing.price,
      delta: listing.delta,
      deltaDirection: listing.deltaDirection,
      image: listing.image,
      seller: member.username,
      sellerId: member.id,
      detailHref: `/marketplace/${member.id}/product/${listing.id}`,
    }));
}

export default MOCK_PUBLIC_MEMBERS;
