"use client";

import { useSyncExternalStore, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

interface CheckoutItem {
  id: string;
  name: string;
  set: string;
  rarity: string;
  grade: string;
  price: number;
  image: string;
  seller: string;
}

const MOCK_INVENTORY_DATABASE: Record<string, CheckoutItem> = {
  "sv4a-box": {
    id: "sv4a-box",
    name: "Shiny Treasure ex Box (高級擴充包)",
    set: "High Class Pack",
    rarity: "BOX",
    grade: "【全新未拆封】附官方防偽縮膜",
    price: 3500,
    image: "https://picsum.photos/seed/sv4a/400/280",
    seller: "東京秋葉原直送店",
  },
  "sv2a-182": {
    id: "sv2a-182",
    name: "Charizard ex SAR (噴火龍 ex)",
    set: "Pokémon Card 151",
    rarity: "SAR",
    grade: "【美品 S】裸卡直送",
    price: 2150,
    image: "https://picsum.photos/seed/user-zard/400/280",
    seller: "旺角卡店 · 專業認證商戶",
  },
  "sv2a-215": {
    id: "sv2a-215",
    name: "Pikachu AR (經典肥皮卡丘)",
    set: "Pokémon Card 151",
    rarity: "AR",
    grade: "【微傷 A】卡盒割愛",
    price: 620,
    image: "https://picsum.photos/seed/user-pika/400/280",
    seller: "卡牌珍藏家阿木",
  },
};

interface SuccessPageProps {
  params: Promise<{ id: string }>;
}

export default function CheckoutSuccessPage({ params }: SuccessPageProps) {
  const resolvedParams = use(params);
  const paramsId = resolvedParams.id;

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

  const currentItem =
    MOCK_INVENTORY_DATABASE[paramsId] || MOCK_INVENTORY_DATABASE["sv2a-182"];

  // Generate a mock cryptographic transaction ledger code purely and deterministically from paramsId
  const idHash = paramsId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const stableSuffix = 1000 + (idHash % 9000);
  const mockTxnCode = `TXN-HKCV-${paramsId.toUpperCase().replace(/[^A-Z0-9]/g, "") || "99824"}-${stableSuffix}`;

  return (
    <div className="min-h-screen bg-[#17130f] text-[#eae1da] p-4 lg:p-8 flex flex-col justify-center items-center">
      <div className="max-w-[650px] w-full space-y-6 pb-24 pt-4 sm:pt-12 animate-fadeIn">
        {/* 1. Header Hero Status Card */}
        <section className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center space-y-5 shadow-xl">
          <div className="relative flex items-center justify-center">
            {/* Glowing gold check icon background */}
            <div className="absolute inset-0 bg-brand/10 rounded-full blur-xl scale-150 animate-pulse" />
            <div className="w-16 h-16 rounded-full bg-brand/15 border border-brand/30 flex items-center justify-center text-brand relative z-10">
              <ShieldCheck className="w-9 h-9 stroke-[1.5]" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-sans font-black text-[22px] sm:text-[26px] text-[#eae1da] leading-tight tracking-tight">
              🎉 交易成功設立
            </h1>
            <p className="font-sans text-[13px] text-text-secondary">
              此筆 B2C 專業商戶交易已建立
            </p>
          </div>

          {/* Cryptographic blockchain ledger code block */}
          <div className="bg-[#17130f] border border-white/5 rounded-lg px-4 py-2 flex flex-col sm:flex-row items-center gap-2 select-none w-full justify-center">
            <span className="font-mono text-[10px] text-text-primary uppercase tracking-wider text-center sm:text-left">
              交易結單號碼 (Order ID):
            </span>
            <code className="font-mono font-bold text-[11px] text-brand tracking-tight text-center sm:text-left">
              {mockTxnCode}
            </code>
          </div>
        </section>

        {/* 2. Transaction Summary Ledger Card */}
        <section className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="font-sans font-bold text-[14.5px] text-[#eae1da] border-b border-white/5 pb-2 uppercase tracking-wide flex items-center gap-1.5">
            <span>🧾 訂單資產明細收條</span>
          </h2>

          {/* Micro Card Item Row */}
          <div className="flex gap-4 items-center bg-[#17130f] p-3 rounded-xl border border-white/5">
            <div className="relative w-12 h-16 rounded overflow-hidden shrink-0 border border-white/10">
              <Image
                src={currentItem.image}
                alt={currentItem.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="font-sans font-bold text-[13.5px] text-[#eae1da] truncate">
                {currentItem.name}
              </h3>
              <p className="font-mono text-[10px] text-text-disabled uppercase">
                {currentItem.set} · {currentItem.rarity}
              </p>
              <div className="inline-flex font-mono text-[9px] text-brand bg-brand/10 border border-brand/20 px-1.5 py-0.5 rounded leading-none">
                {currentItem.grade}
              </div>
            </div>
          </div>

          {/* Ledger Table List */}
          <div className="space-y-3 pt-1 text-[13px] font-sans">
            <div className="flex justify-between items-center py-1.5 border-b border-white/[0.03]">
              <span className="text-[#d4c4b7]">商戶賣方</span>
              <span className="font-semibold text-[#eae1da]">
                {currentItem.seller}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-white/[0.03]">
              <span className="text-[#d4c4b7]">交易結算價</span>
              <span className="font-mono font-bold text-brand">
                HK$ {currentItem.price.toLocaleString("en-HK")}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-white/[0.03]">
              <span className="text-[#d4c4b7]">平台防偽鑑定</span>
              <span className="text-success font-medium">
                已啟用鑑定驗證服務
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-[#d4c4b7]">交易性質</span>
              <span className="font-medium text-[#eae1da]">B2C 專業商戶</span>
            </div>
          </div>
        </section>

        {/* 3. Action Navigation Buttons Redirect Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link
            href="/profile/user/trading"
            className="bg-brand text-[#1A1612] h-11 w-full font-bold text-[13.5px] rounded-xl flex items-center justify-center hover:bg-[#e8b896] transition-all active:scale-[0.98] cursor-pointer shadow-md focus:outline-none"
          >
            ⚡ 進入交易管理中心
          </Link>
          <Link
            href="/marketplace"
            className="bg-[#17130f] border border-white/10 text-text-secondary h-11 w-full font-bold text-[13.5px] rounded-xl flex items-center justify-center hover:border-brand/30 hover:text-brand transition-all active:scale-[0.98] cursor-pointer focus:outline-none"
          >
            🏪 返回大盤市場
          </Link>
        </div>
      </div>
    </div>
  );
}
