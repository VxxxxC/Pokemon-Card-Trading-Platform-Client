import type { MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";

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
  readonly label: string;
}

export interface PublicMemberListing {
  readonly id: string;
  readonly name: string;
  readonly cardNo: string;
  readonly set: string;
  readonly rarity: "SAR" | "UR" | "SR" | "AR";
  readonly grade: PublicMemberListingGrade;
  readonly conditionLabel: "美品 S" | "微傷 A" | "傷 B";
  readonly price: number;
  readonly delta: number;
  readonly deltaDirection: "up" | "down";
  readonly image: string;
}

export interface PublicMemberData {
  readonly id: string;
  readonly username: string;
  readonly handle: string;
  readonly joinDate: string;
  readonly avatarSeed: string;
  readonly level: string;
  readonly levelTier: number;
  readonly bio: string;
  readonly verifiedBuyer: boolean;
  readonly rating: number;
  readonly reviewCount: number;
  readonly completedTrades: number;
  readonly badges: ReadonlyArray<PublicMemberBadge>;
  readonly activeListings: ReadonlyArray<PublicMemberListing>;
  readonly reviews: ReadonlyArray<PublicMemberReview>;
}

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
        id: "LST-001",
        name: "Charizard ex SAR (噴火龍)",
        cardNo: "sv2a-182",
        set: "Pokémon 151",
        rarity: "SAR",
        grade: { authority: "PSA", score: "10", label: "PSA 10" },
        conditionLabel: "美品 S",
        price: 44800,
        delta: 1200,
        deltaDirection: "up",
        image: "https://picsum.photos/seed/char1/400/280",
      },
      {
        id: "LST-002",
        name: "Umbreon VMAX SA (月亮伊布)",
        cardNo: "s6a-095",
        set: "Eevee Heroes",
        rarity: "SAR",
        grade: { authority: "BGS", score: "9.5", label: "BGS 9.5" },
        conditionLabel: "美品 S",
        price: 52000,
        delta: 2400,
        deltaDirection: "down",
        image: "https://picsum.photos/seed/umb1/400/280",
      },
      {
        id: "LST-003",
        name: "Pikachu AR (皮卡丘)",
        cardNo: "sv2a-215",
        set: "Pokémon 151",
        rarity: "AR",
        grade: { authority: "Raw Card", score: "NM", label: "裸卡 (美品S)" },
        conditionLabel: "美品 S",
        price: 1200,
        delta: 90,
        deltaDirection: "up",
        image: "https://picsum.photos/seed/pika1/400/280",
      },
      {
        id: "LST-004",
        name: "Lillie SR (莉莉艾)",
        cardNo: "sm4plus-119",
        set: "GX Battle Boost",
        rarity: "SR",
        grade: { authority: "PSA", score: "9", label: "PSA 9" },
        conditionLabel: "微傷 A",
        price: 185000,
        delta: 6800,
        deltaDirection: "up",
        image: "https://picsum.photos/seed/lillie/400/280",
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
  return MOCK_PUBLIC_MEMBERS[id];
}

export function getStorefrontListingsByMember(
  member: PublicMemberData,
): MarketplaceListing[] {
  return member.activeListings.map((listing) => ({
    id: listing.id,
    cardNo: listing.cardNo,
    name: listing.name,
    set: listing.set,
    rarity: listing.rarity,
    grade: {
      authority: listing.grade.authority,
      score: listing.grade.score,
    },
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
