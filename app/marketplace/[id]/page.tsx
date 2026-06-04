"use client";

import { use, useSyncExternalStore } from "react";
import Image from "next/image";
import { useTradeStore } from "@/store/useTradeStore";

interface VendorProduct {
  id: string;
  vendorId: string;
  name: string;
  cardNo: string;
  rarity: string;
  grade: string;
  price: number;
  image: string;
}

// 模擬全域上架庫存總庫（實際開發將與 Supabase 進行 .eq('vendorId', id) 過濾）
const MOCK_GLOBAL_PRODUCTS: VendorProduct[] = [
  {
    id: "sv2a-182",
    vendorId: "RM-MOCK-SELLER-001",
    name: "Charizard ex SAR (噴火龍 ex)",
    cardNo: "sv2a-182",
    rarity: "SAR",
    grade: "PSA 10 完美認證",
    price: 2150,
    image: "https://picsum.photos/seed/zard/300/420",
  },
  {
    id: "sv2a-215",
    vendorId: "RM-MOCK-SELLER-001",
    name: "Pikachu AR (肥皮卡丘)",
    cardNo: "sv2a-215",
    rarity: "AR",
    grade: "【美品 S】裸卡直送",
    price: 620,
    image: "https://picsum.photos/seed/pika/300/420",
  },
  {
    id: "sv4a-box",
    vendorId: "PKT-8839-44A",
    name: "Shiny Treasure ex Box (高級擴充包)",
    cardNo: "sv4a-box",
    rarity: "BOX",
    grade: "全新未拆防偽縮膜",
    price: 3500,
    image: "https://picsum.photos/seed/box/300/420",
  },
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function IndependentMarketplacePage({ params }: PageProps) {
  // 符合 Next.js 16 規格之 async params 解包
  const resolvedParams = use(params);
  const vendorId = resolvedParams.id;

  // SSR 安全水合防爆
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // 訂閱 Zustand 彈出交割抽屜 Action
  const { setChats, setIsChatOpen } = useTradeStore();

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#17130f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  // 🟢 核心過濾：只篩選出屬於當前網址 id 標記嘅用戶或商戶產品
  const vendorProducts = MOCK_GLOBAL_PRODUCTS.filter(
    (p) => p.vendorId === vendorId,
  );

  // 獲取店舖名稱快報
  const storeName =
    vendorId === "RM-MOCK-SELLER-001"
      ? "旺角卡店 · 專業認證商戶"
      : vendorId === "PKT-8839-44A"
        ? "渡邊道館 · 密室私人珍藏"
        : `用戶 ${vendorId.slice(0, 8)} 嘅二手市集`;

  return (
    <div className="min-h-screen bg-[#17130f] text-[#eae1da] p-6 md:p-10">
      <div className="max-w-[1200px] mx-auto space-y-8">
        {/* 店舖大頂欄看板 */}
        <div className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="font-mono text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded font-bold border border-brand/20 uppercase tracking-widest">
              INDEPENDENT SHOWCASE
            </span>
            <h1 className="font-sans font-black text-[22px] text-[#eae1da] tracking-tight">
              {storeName}
            </h1>
            <p className="font-mono text-[11px] text-text-secondary">
              VENDOR CRYPTO IDENTIFIER:{" "}
              <span className="text-[#eae1da]">{vendorId}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              // 模擬極速開通與商戶嘅對話
              setIsChatOpen(true);
            }}
            className="h-10 px-5 bg-transparent border border-brand/40 text-brand font-sans font-bold text-[13px] rounded-xl hover:bg-brand/10 transition-colors cursor-pointer"
          >
            💬 聯絡賣家 / 發起議價
          </button>
        </div>

        {/* 專屬上架網格陣列 */}
        <div className="space-y-4">
          <h2 className="font-sans font-bold text-[16px] text-[#eae1da] border-b border-white/5 pb-2">
            📦 該用戶目前掛牌上架現貨 ({vendorProducts.length})
          </h2>

          {vendorProducts.length === 0 ? (
            <div className="py-20 text-center bg-[#26211C]/30 border border-dashed border-white/5 rounded-2xl">
              <p className="font-sans text-[13.5px] text-text-disabled">
                該賣家目前暫無公開掛盤之卡牌資產。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {vendorProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-xl p-3 flex flex-col justify-between hover:border-brand/40 transition-colors group"
                >
                  <div className="space-y-2">
                    <div className="relative aspect-[3/4] w-full bg-[#17130f] rounded-lg overflow-hidden border border-white/5">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        unoptimized
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] text-brand bg-brand/5 px-1 rounded block w-fit font-bold">
                        {product.grade}
                      </span>
                      <h3 className="font-sans font-bold text-[13px] text-[#eae1da] line-clamp-2 min-h-[36px]">
                        {product.name}
                      </h3>
                      <p className="font-mono text-[10px] text-text-disabled uppercase">
                        {product.cardNo}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="font-mono font-bold text-[14px] text-brand">
                      HK$ {product.price.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        (window.location.href = `/marketplace/${product.vendorId}/product/${product.id}`)
                      }
                      className="font-sans text-[11px] text-brand hover:underline font-bold bg-transparent border-none p-0 cursor-pointer"
                    >
                      詳情 →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
