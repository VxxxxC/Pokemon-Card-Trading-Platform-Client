"use client";

import { use, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { ProfileHeaderWithChat } from "./components/ProfileHeaderWithChat";

interface ProfileIdPageProps {
  params: Promise<{ id: string }>;
}

interface VendorListing {
  readonly id: string;
  readonly name: string;
  readonly cardNo: string;
  readonly grade: string;
  readonly price: number;
  readonly image: string;
}

interface PublicMemberData {
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
  readonly badges: ReadonlyArray<{
    readonly id: string;
    readonly label: string;
    readonly emoji: string;
    readonly desc: string;
  }>;
  readonly activeListings: ReadonlyArray<VendorListing>;
  readonly reviews: ReadonlyArray<{
    readonly id: string;
    readonly reviewer: string;
    readonly rating: number;
    readonly comment: string;
    readonly date: string;
  }>;
}

// 🟢 數據源與市集櫥窗獨立前台（app/marketplace/[id]）達成 100% 同步
const MOCK_PUBLIC_MEMBERS: Record<string, PublicMemberData> = {
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
        name: "Charizard ex SAR",
        cardNo: "sv2a-182",
        grade: "PSA 10",
        price: 44800,
        image: "https://picsum.photos/seed/char1/200/280",
      },
      {
        id: "LST-002",
        name: "Umbreon VMAX SA",
        cardNo: "s6a-095",
        grade: "BGS 9.5",
        price: 52000,
        image: "https://picsum.photos/seed/umb1/200/280",
      },
      {
        id: "LST-003",
        name: "Pikachu AR",
        cardNo: "sv2a-215",
        grade: "裸卡 (美品S)",
        price: 1200,
        image: "https://picsum.photos/seed/pika1/200/280",
      },
      {
        id: "LST-004",
        name: "Lillie SR",
        cardNo: "sm4plus-119",
        grade: "PSA 9",
        price: 185000,
        image: "https://picsum.photos/seed/lillie/200/280",
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

function StarRating({ score, size = 14 }: { score: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i <= Math.round(score) ? "#d4a574" : "none"}
          stroke="#d4a574"
          strokeWidth="1.5"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

export default function PublicProfilePage({ params }: ProfileIdPageProps) {
  // 🟢 為了在 Client 組件內完美兼容 Next.js 16 異步參數協議，使用 React.use() 進行解包
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const member = MOCK_PUBLIC_MEMBERS[id];

  // 統一採用說明書工程標準：原生 useSyncExternalStore 客戶端鎖，徹底封鎖水合 Layout Shift
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#17130f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-dvh bg-[#17130f] text-[#eae1da] flex flex-col items-center justify-center">
        <h1 className="text-xl font-sans font-bold text-text-disabled">
          找不到此商戶個人檔案
        </h1>
        <Link
          href="/marketplace"
          className="text-brand text-sm mt-2 hover:underline"
        >
          ← 返回交易所大盤
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#17130f] flex flex-col text-[#eae1da]">
      <TopNav />
      <MobileHeader />

      <main className="flex-1 max-w-[900px] mx-auto w-full px-4 py-6 space-y-6 animate-fadeIn">
        {/* 1. 商戶名片 + 右下角懸浮 Chatbox */}
        <ProfileHeaderWithChat member={member} />

        {/* 2. 上架中商品 (Public Inventory) */}
        <section className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans font-bold text-[16px]">
              上架中的商品 ({member.activeListings.length})
            </h2>
            {/* 🟢 核心修正 1：將查看全部跳轉精準駁通至該商戶的專屬市集獨立櫥窗 */}
            <Link
              href={`/marketplace/${member.id}`}
              className="font-mono text-[12px] text-brand hover:text-[#e8b896] font-bold transition-colors"
            >
              查看全部 →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {member.activeListings.map((item) => (
              /* 🟢 核心修正 2：將商品卡片跳轉路徑，精準導向私域專屬商品詳情頁，消滅 404 地雷 */
              <Link
                key={item.id}
                href={`/marketplace/${member.id}/product/${item.id}`}
                className="block group bg-[#17130f]/40 p-2.5 rounded-xl border border-transparent hover:border-brand/20 transition-all duration-300"
              >
                <div className="relative aspect-[3/4] bg-[#17130f] rounded-lg mb-2 overflow-hidden border border-[rgba(237,232,224,0.04)] group-hover:border-brand/40 transition-colors">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                </div>
                <h3 className="font-sans text-[12.5px] text-[#eae1da] truncate group-hover:text-brand transition-colors">
                  {item.name}
                </h3>
                <div className="flex justify-between items-center mt-1.5 pt-1 border-t border-white/5">
                  <span className="font-mono text-[10px] text-[#10b981] font-bold">
                    {item.grade}
                  </span>
                  <span className="font-mono font-black text-[13px] text-brand">
                    HK${item.price.toLocaleString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. 買家評價 */}
        <section className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans font-bold text-[16px]">買家評價</h2>
            <div className="flex items-center gap-1.5">
              <StarRating score={member.rating} size={15} />
              <span className="font-mono text-[14px] font-bold">
                {member.rating}
              </span>
              <span className="font-mono text-[12px] text-[#50453b]">
                ({member.reviewCount})
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {member.reviews.map((review) => (
              <div
                key={review.id}
                className="bg-[#17130f] rounded-xl p-4 border border-[rgba(237,232,224,0.04)]"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-sans text-[13px] font-medium">
                    {review.reviewer}
                  </span>
                  <span className="font-mono text-[10px] text-[#50453b]">
                    {review.date}
                  </span>
                </div>
                <p className="font-sans text-[13px] text-[#d4c4b7] leading-relaxed">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
