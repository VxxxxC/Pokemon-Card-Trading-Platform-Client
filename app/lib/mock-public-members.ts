// app/lib/mock-public-members.ts
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
  readonly label: string;
}

// 🟢 完美融合：大一統強型態定義，徹底消滅前台與後台的欄位對抗
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
  // 📥 以下為後台交易管理控制艙所需的延伸維度
  readonly status: ListingStatus;
  readonly paymentMethods: string[];
  readonly shippingMethods: string[];
  readonly createdAt: string;
  readonly views: number;
  readonly watchers: number;
  readonly linkedOrderId?: string;
  readonly hasPriceOffer?: boolean;
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
    // 🟢 擴充矩陣：一口氣寫足 6 張卡牌，精準演繹卡牌資產的前世今生
    activeListings: [
      {
        id: "LST-C2C-001",
        name: "Charizard ex SAR (噴火龍 ex)",
        cardNo: "sv2a-182",
        set: "Pokémon 151",
        rarity: "SAR",
        grade: { authority: "PSA", score: "10", label: "PSA 10 完美鑑定" },
        conditionLabel: "美品 S",
        price: 2150,
        delta: 1200,
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
        price: 620,
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
        hasPriceOffer: true, // ⚡ 自帶買家高亮 Price Offer 的指標資產
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
        status: "sold", // 🔒 歷史已完結單
        paymentMethods: ["PayMe"],
        shippingMethods: ["順豐速遞"],
        createdAt: "2026/05/10",
        views: 310,
        watchers: 24,
        linkedOrderId: "ORD-C2C-DONE-101",
      },
      {
        id: "LST-C2C-004",
        name: "Ting-Lu ex SR (古鼎鹿)",
        cardNo: "sv3-155",
        set: "Clay Burst",
        rarity: "SR",
        grade: { authority: "Raw Card", score: "LP", label: "打牌實用打法卡" },
        conditionLabel: "傷 B",
        price: 180,
        delta: 10,
        deltaDirection: "down",
        image: "https://picsum.photos/seed/user-tinglu/200/280",
        status: "unlisted", // ⏸️ 暫時下架卡
        paymentMethods: ["現金面交"],
        shippingMethods: ["市區面交"],
        createdAt: "2026/05/01",
        views: 45,
        watchers: 1,
      },
      {
        id: "LST-C2C-005",
        name: "Umbreon ex SAR (月亮伊布)",
        cardNo: "sv6a-109",
        set: "Night Wanderer",
        rarity: "SAR",
        grade: { authority: "BGS", score: "9.5", label: "Raw 完美裸卡" },
        conditionLabel: "美品 S",
        price: 1900,
        delta: 240,
        deltaDirection: "up",
        image: "https://picsum.photos/seed/umbreon/200/280",
        status: "pending_trade", // 📦 正在交割履約中
        paymentMethods: ["轉數快 (FPS)"],
        shippingMethods: ["順豐速遞"],
        createdAt: "2026/05/26",
        views: 238,
        watchers: 31,
        linkedOrderId: "ORD-C2C-DELIVERY-002",
      },
      {
        id: "LST-C2C-006",
        name: "Marnie SR (高人氣女角瑪俐)",
        cardNo: "s5a-070",
        set: "Shiny Star V",
        rarity: "SR",
        grade: { authority: "PSA", score: "10", label: "PSA 10 頂級判定" },
        conditionLabel: "美品 S",
        price: 4200,
        delta: 350,
        deltaDirection: "up",
        image: "https://picsum.photos/seed/marnie/400/280",
        status: "pending_trade",
        paymentMethods: ["轉數快 (FPS)", "信用額代扣"],
        shippingMethods: ["平台託管鑑定發貨"],
        createdAt: "2026/05/25",
        views: 1142,
        watchers: 188,
        linkedOrderId: "ORD-B2C-AUTH-003",
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

// 🟢 前台大盤自動過濾引流：只向普通用家展示處於 active 出售狀態的精選現貨
export function getStorefrontListingsByMember(
  member: PublicMemberData,
): MarketplaceListing[] {
  return member.activeListings
    .filter((listing) => listing.status === "active")
    .map((listing) => ({
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
