"use client";

import { use, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTradeStore } from "@/store/useTradeStore";

interface VendorListing {
  readonly id: string;
  readonly name: string;
  readonly cardNo: string;
  readonly grade: string;
  readonly price: number;
  readonly image: string;
}

interface PublicVendorData {
  readonly id: string;
  readonly username: string;
  readonly handle: string;
  readonly level: string;
  readonly bio: string;
  readonly rating: number;
  readonly completedTrades: number;
  readonly activeListings: ReadonlyArray<VendorListing>;
}

// 🟢 完美同步 profile/[id]/page.tsx 的核心公開數據源，確保 Demo 絕不穿幫
const VENDOR_MIRROR_DATABASE: Record<string, PublicVendorData> = {
  "PKT-8839-44A": {
    id: "PKT-8839-44A",
    username: "渡邊道館",
    handle: "@watanabe_gym",
    level: "專業道館主",
    bio: "專注於第一世代 PSA 10 鑑定卡與稀有未開封補充包。保證 24 小時內發貨，所有高價卡均走平台 Escrow 鑑定託管。",
    rating: 4.9,
    completedTrades: 1204,
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
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MerchantStorefrontPage({ params }: PageProps) {
  const { id } = use(params);
  const vendor = VENDOR_MIRROR_DATABASE[id];

  // 強制執行說明書第 3 條：使用原生 useSyncExternalStore 快照防線，封死異步渲染 Layout Shift
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const setIsChatOpen = useTradeStore((state) => state.setIsChatOpen);
  const setActiveRoomId = useTradeStore((state) => state.setActiveRoomId);

  if (!isMounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#17130f]">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#17130f] py-20">
        <h1 className="text-xl font-sans font-bold text-text-disabled">
          未找到該商戶的市集櫥窗
        </h1>
        <Link
          href="/marketplace"
          className="text-brand text-sm mt-3 hover:underline"
        >
          ← 返回全網大盤
        </Link>
      </div>
    );
  }

  return (
    <main className="flex-1 max-w-[900px] mx-auto w-full px-4 py-6 space-y-6 animate-fadeIn">
      {/* 門面看板大牌 */}
      <div className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-sans font-black text-[22px] text-[#eae1da] tracking-tight">
              {vendor.username}
            </h1>
            <span className="font-sans text-[11px] font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-md">
              🏅 {vendor.level}
            </span>
          </div>
          <p className="font-mono text-[12px] text-text-secondary">
            {vendor.handle} · 已累計完成 {vendor.completedTrades} 筆託管交割
          </p>
          <p className="font-sans text-[13px] text-text-secondary max-w-[580px] pt-1.5 leading-relaxed">
            {vendor.bio}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setActiveRoomId(vendor.id);
            setIsChatOpen(true);
          }}
          className="h-10 px-5 bg-brand text-[#17130f] font-sans font-bold text-[12.5px] rounded-xl hover:bg-[#e8b896] transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          💬 發起私域議價
        </button>
      </div>

      {/* 商戶個人上架網格 */}
      <section className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] p-6 space-y-4">
        <h2 className="font-sans font-bold text-[15px] text-[#eae1da] border-b border-white/5 pb-2">
          📦 店主公開出售中商品 ({vendor.activeListings.length})
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {vendor.activeListings.map((item) => (
            <Link
              key={item.id}
              href={`/marketplace/${vendor.id}/product/${item.id}`}
              className="block group bg-[#17130f] p-3 rounded-xl border border-transparent hover:border-brand/30 transition-all duration-300"
            >
              <div className="relative aspect-[3/4] w-full bg-[#26211C] rounded-lg overflow-hidden border border-white/5 mb-2.5">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  unoptimized
                />
              </div>
              <h3 className="font-sans font-bold text-[13px] text-[#eae1da] truncate group-hover:text-brand transition-colors">
                {item.name}
              </h3>
              <p className="font-mono text-[10px] text-text-disabled mt-0.5">
                {item.cardNo}
              </p>

              <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-white/5">
                <span className="font-mono text-[10.5px] text-[#10b981] font-bold">
                  {item.grade}
                </span>
                <span className="font-mono font-black text-[13.5px] text-brand">
                  HK${item.price.toLocaleString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
