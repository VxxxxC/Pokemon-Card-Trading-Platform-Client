import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { ProfileHeaderWithChat } from "./components/ProfileHeaderWithChat";

interface ProfileIdPageProps {
  params: Promise<{ id: string }>;
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
  readonly completedTrades: number; // 🟢 只保留公開嘅成交數，刪除所有資產金額
  readonly badges: ReadonlyArray<{
    readonly id: string;
    readonly label: string;
    readonly emoji: string;
    readonly desc: string;
  }>;
  readonly activeListings: ReadonlyArray<{
    // 🟢 新增：公開發售中嘅商品庫存
    readonly id: string;
    readonly name: string;
    readonly cardNo: string;
    readonly grade: string;
    readonly price: number;
    readonly image: string;
  }>;
  readonly reviews: ReadonlyArray<{
    readonly id: string;
    readonly reviewer: string;
    readonly rating: number;
    readonly comment: string;
    readonly date: string;
  }>;
}

// 模擬安全嘅公開數據
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

async function getPublicMemberById(
  id: string,
): Promise<PublicMemberData | null> {
  return MOCK_PUBLIC_MEMBERS[id] ?? null;
}

// 星星評分小組件
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

export default async function PublicProfilePage({
  params,
}: ProfileIdPageProps) {
  const { id } = await params;
  const member = await getPublicMemberById(id);

  if (!member) {
    return (
      <div className="min-h-dvh bg-[#17130f] text-[#eae1da] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">找不到此商戶</h1>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#17130f] flex flex-col text-[#eae1da]">
      <TopNav />
      <MobileHeader />

      {/* 🚀 佈局改為寬敞單欄置中，最大寬度 900px */}
      <main className="flex-1 max-w-[900px] mx-auto w-full px-4 py-6 space-y-6">
        {/* 1. 載入 Client Component (商戶名片 + 右下角懸浮 Chatbox) */}
        <ProfileHeaderWithChat member={member} />

        {/* 2. 上架中商品 (Public Inventory) */}
        <section className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans font-bold text-[16px]">
              上架中的商品 ({member.activeListings.length})
            </h2>
            <Link
              href={`/search?seller=${member.id}`}
              className="font-mono text-[12px] text-[#d4a574] hover:text-[#e8b896]"
            >
              查看全部 →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {member.activeListings.map((item) => (
              <Link
                key={item.id}
                href={`/marketplace/${item.id}`}
                className="block group"
              >
                <div className="relative aspect-[3/4] bg-[#17130f] rounded-xl mb-2 overflow-hidden border border-[rgba(237,232,224,0.04)] group-hover:border-[#d4a574]/40 transition-colors">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="font-sans text-[12px] text-[#eae1da] truncate">
                  {item.name}
                </p>
                <div className="flex justify-between items-center mt-1">
                  <span className="font-mono text-[10px] text-[#10b981]">
                    {item.grade}
                  </span>
                  <span className="font-mono font-bold text-[13px] text-[#d4a574]">
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
