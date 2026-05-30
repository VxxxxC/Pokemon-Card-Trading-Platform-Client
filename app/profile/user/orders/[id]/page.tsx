"use client";

import { useState, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion"; // 嚴格遵循 DESIGN.md 彈簧動畫規範

// 模擬動態路由參數
interface PageProps {
  params: Promise<{ id: string }>;
}

// 嚴格對齊你原有的狀態定義與標籤
type OrderStatus = "payment" | "custody" | "shipped" | "grading" | "released";

interface OrderDetail {
  id: string;
  cardName: string;
  cardNo: string;
  rarity: string;
  attribute: string;
  stage: string;
  artist: string;
  grade: string;
  sellerName: string;
  sellerRating: string;
  sellerTier: "道館主" | "收藏家";
  amount: number;
  depositAmount: number;
  balanceAmount: number;
  shippingFee: number;
  subsidyAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  livePhotos: string[];
}

// 模擬根據不同訂單 ID 撈出嘅鋼鐵存證數據
const MOCK_ORDER_DETAILS: Record<string, OrderDetail> = {
  "ORD-20260527-001": {
    id: "ORD-20260527-001",
    cardName: "Charizard ex SAR (噴火龍)",
    cardNo: "sv2a-182/165",
    rarity: "SAR",
    attribute: "火",
    stage: "Stage 2",
    artist: "AKIRA EGAWA",
    grade: "PSA 10",
    sellerName: "渡邊道館",
    sellerRating: "4.9 (120+ 筆成交)",
    sellerTier: "道館主",
    amount: 2250,
    depositAmount: 225, // 10% 港幣定金
    balanceAmount: 2025, // 90% 尾款
    shippingFee: 30,
    subsidyAmount: 30, // 平台定額運費補貼
    status: "grading",
    createdAt: "2026年 5月27日 14:23",
    updatedAt: "2026年 5月28日 09:15",
    trackingNumber: "SF-1648839201",
    livePhotos: [
      "https://picsum.photos/id/1025/600/650", // 實物正面高清圖
      "https://picsum.photos/id/1043/600/650", // 實物背面
      "https://picsum.photos/id/1062/600/650", // 左上角刮痕存證
      "https://picsum.photos/id/1084/600/650", // 右下角卡邊
      "https://picsum.photos/id/160/600/650", // 卡角特寫
    ],
  },
};

const ESCROW_STEPS = [
  { id: "payment", label: "買家付訂" },
  { id: "custody", label: "賣家發貨" },
  { id: "shipped", label: "平台收件" },
  { id: "grading", label: "官方鑑定" },
  { id: "released", label: "放款發貨" },
];

const STATUS_INDEX: Record<OrderStatus, number> = {
  payment: 0,
  custody: 1,
  shipped: 2,
  grading: 3,
  released: 4,
};

// Framer Motion 彈簧物理參數（來自 DESIGN.md）
const SPRING_CONFIG = { stiffness: 300, damping: 25 };

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params);

  // 如果找不到 mock 數據，預設抓取第一筆 Charizard 作為展示
  const order =
    MOCK_ORDER_DETAILS[id] || MOCK_ORDER_DETAILS["ORD-20260527-001"];

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);

  const currentStepIndex = STATUS_INDEX[order.status];

  const handleApplyDispute = () => {
    const confirmDispute = window.confirm(
      "⚠️ 您是否確認針對此訂單品相提出爭議仲裁？平台將會瞬時凍結該筆 Stripe 託管資金。",
    );
    if (confirmDispute) {
      setDisputeSubmitted(true);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#17130f] px-4 py-6 md:px-8 text-[#eae1da]">
      {/* 麵包屑導航 */}
      <div className="max-w-[1200px] mx-auto mb-6 flex items-center justify-between">
        <Link
          href="/profile/user/orders"
          className="font-sans text-[13px] text-[#d4c4b7] hover:text-[#d4a574] transition-colors flex items-center gap-1.5"
        >
          ← 返回我的訂單歷史
        </Link>
        <span className="font-mono text-[11px] text-[#50453b]">
          訂單識別碼: {order.id}
        </span>
      </div>

      {/* 核心大版面：黃金不對稱雙欄佈局 (5:7) */}
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 左側欄 (5/12寬度) ：強制實物條件存證展台 */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-[4/5] w-full bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl overflow-hidden shadow-2xl group">
            {/* 品相真實存證動態標籤 */}
            <div className="absolute top-3 left-3 z-10 bg-[#17130f]/80 backdrop-blur-md border border-[rgba(237,232,224,0.15)] px-3 py-1 rounded-full">
              <p className="font-mono text-[11px] text-[#d4a574] font-semibold tracking-wider">
                【美品 {order.grade.split(" ")[1] || "S"}】官方實物品相存證
              </p>
            </div>

            {/* 主圖容器 */}
            <img
              src={order.livePhotos[activePhotoIndex]}
              alt="Pokémon Card Live Proof"
              className="w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.03]"
            />
          </div>

          {/* 4-6張實物細節縮圖列 */}
          <div className="grid grid-cols-5 gap-2.5">
            {order.livePhotos.map((photo, index) => (
              <button
                key={index}
                onClick={() => setActivePhotoIndex(index)}
                className={`aspect-square rounded-xl overflow-hidden bg-[#26211C] border-2 transition-all active:scale-[0.95] ${
                  activePhotoIndex === index
                    ? "border-[#d4a574] ring-2 ring-[#d4a574]/20"
                    : "border-[rgba(237,232,224,0.08)] hover:border-[rgba(237,232,224,0.2)]"
                }`}
              >
                <img
                  src={photo}
                  alt="thumbnail"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* 鋼鐵安全存證提示文案 */}
          <div className="p-4 bg-[#26211C] border border-[rgba(237,232,224,0.06)] rounded-xl">
            <p className="font-sans text-[12px] text-[#d4c4b7] leading-relaxed">
              💡 <strong className="text-[#eae1da]">買家信任屏障：</strong>{" "}
              以上照片均為該張實物卡進入平台日本或本地中介保管時，由專業鑑定師全方位無死角拍攝。發貨品相將與此存證
              100% 契合。
            </p>
          </div>
        </div>

        {/* 右側欄 (7/12寬度)：金融級交易終端面板 */}
        <div className="lg:col-span-7 space-y-6">
          {/* A. 認證商家與遊戲化身份模組 */}
          <div className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#39342f] border border-[#d4a574]/30 flex items-center justify-center font-sans font-bold text-[#d4a574]">
                {order.sellerName[0]}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-sans font-semibold text-[15px] text-[#eae1da]">
                    {order.sellerName}
                  </h4>
                  {/* 黃金 3D 質感認證徽章 */}
                  <span className="font-sans text-[10px] bg-gradient-to-r from-[#d4a574]/20 to-[#e8b896]/20 text-[#d4a574] border border-[#d4a574]/30 px-2 py-0.5 rounded-full flex items-center gap-0.5 font-medium shadow-sm">
                    🏅 專業{order.sellerTier}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-[#d4c4b7] mt-0.5">
                  {order.sellerRating}
                </p>
              </div>
            </div>

            <Link
              href={`/message?chat=${order.id}`}
              className="h-9 px-4 border border-[#d4a574] hover:bg-[#d4a574]/10 text-[#d4a574] font-mono text-[12px] rounded-xl flex items-center justify-center transition-all active:scale-[0.96]"
            >
              💬 進入全域安全對話
            </Link>
          </div>

          {/* B. 5步流體彈簧步進器 (按明文規範重構) */}
          <div className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-5">
            <h3 className="font-sans font-semibold text-[13px] uppercase tracking-wider text-[#d4c4b7] mb-4">
              分段式 Escrow 資金託管進度
            </h3>

            <div className="overflow-x-auto scrollbar-none pb-2">
              <div className="flex items-start min-w-max px-2">
                {ESCROW_STEPS.map((step, i) => {
                  const isDone = i < currentStepIndex;
                  const isActive = i === currentStepIndex;

                  return (
                    <div key={step.id} className="flex items-start">
                      <div className="flex flex-col items-center w-[96px]">
                        {/* 彈簧高亮脈衝環 */}
                        <motion.div
                          animate={isActive ? { scale: [1, 1.08, 1] } : {}}
                          transition={{
                            repeat: Infinity,
                            duration: 2,
                            ease: "easeInOut",
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                            isDone
                              ? "bg-[#10b981] border-[#10b981]"
                              : isActive
                                ? "bg-[rgba(140,115,85,0.15)] border-[#d4a574]"
                                : "bg-[#17130f] border-[rgba(237,232,224,0.12)]"
                          }`}
                        >
                          {isDone ? (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#fff"
                              strokeWidth="3"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-[#d4a574]" : "bg-[#39342f]"}`}
                            />
                          )}
                        </motion.div>

                        <p
                          className={`font-sans text-[11px] mt-2 text-center font-medium ${
                            isActive
                              ? "text-[#d4a574]"
                              : isDone
                                ? "text-[#eae1da]"
                                : "text-[#50453b]"
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>

                      {/* 連接線 */}
                      {i < ESCROW_STEPS.length - 1 && (
                        <div
                          className={`h-[2px] w-8 mt-4 shrink-0 transition-colors duration-300 ${
                            i < currentStepIndex
                              ? "bg-[#10b981]"
                              : "bg-[rgba(237,232,224,0.08)]"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 物流狀態快訊 */}
            {order.trackingNumber && (
              <div className="mt-4 pt-4 border-t border-[rgba(237,232,224,0.06)] flex items-center justify-between">
                <span className="font-sans text-[12px] text-[#d4c4b7]">
                  順豐速遞追蹤單號
                </span>
                <span className="font-mono text-[13px] text-[#eae1da] bg-[#17130f] px-3 py-1 rounded-md border border-[rgba(237,232,224,0.08)]">
                  {order.trackingNumber}
                </span>
              </div>
            )}
          </div>

          {/* C. 卡牌技術規格數據矩陣 (與日版數據庫交叉校驗規格) */}
          <div className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-5 space-y-3">
            <h3 className="font-sans font-semibold text-[14px] text-[#eae1da] border-b border-[rgba(237,232,224,0.06)] pb-2">
              日本官方數據庫交叉校驗資訊
            </h3>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 font-sans text-[13px]">
              <div className="flex justify-between border-b border-[rgba(237,232,224,0.04)] pb-1.5">
                <span className="text-[#d4c4b7]">卡牌名稱</span>
                <span className="text-[#eae1da] font-medium">
                  {order.cardName.split(" ")[0]}
                </span>
              </div>
              <div className="flex justify-between border-b border-[rgba(237,232,224,0.04)] pb-1.5">
                <span className="text-[#d4c4b7]">官方編號</span>
                <span className="font-mono text-[#eae1da]">{order.cardNo}</span>
              </div>
              <div className="flex justify-between border-b border-[rgba(237,232,224,0.04)] pb-1.5">
                <span className="text-[#d4c4b7]">稀有度層級</span>
                <span className="font-mono text-[#d4a574] font-bold">
                  {order.rarity}
                </span>
              </div>
              <div className="flex justify-between border-b border-[rgba(237,232,224,0.04)] pb-1.5">
                <span className="text-[#d4c4b7]">鑑定品級</span>
                <span className="font-mono text-[#10b981] font-semibold">
                  {order.grade}
                </span>
              </div>
              <div className="flex justify-between border-b border-[rgba(237,232,224,0.04)] pb-1.5">
                <span className="text-[#d4c4b7]">屬性/階段</span>
                <span className="text-[#eae1da]">
                  {order.attribute} / {order.stage}
                </span>
              </div>
              <div className="flex justify-between border-b border-[rgba(237,232,224,0.04)] pb-1.5">
                <span className="text-[#d4c4b7]">繪師 / Artist</span>
                <span className="font-mono text-[12px] text-[#eae1da]">
                  {order.artist}
                </span>
              </div>
            </div>
          </div>

          {/* D. Stripe 兩段式金流與賬目明細表 */}
          <div className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-5 space-y-4">
            <h3 className="font-sans font-semibold text-[14px] text-[#eae1da]">
              Stripe Connect 金流安全託管帳目
            </h3>

            <div className="font-mono text-[13px] space-y-2.5 bg-[#17130f] p-4 rounded-xl border border-[rgba(237,232,224,0.04)]">
              <div className="flex justify-between items-center text-[#d4c4b7]">
                <span>商品直購總價 (Subtotal)</span>
                <span>HK$ {order.amount.toLocaleString("en-HK")}</span>
              </div>
              <div className="flex justify-between items-center text-[#d4c4b7]">
                <span>中介快遞運費 (Shipping)</span>
                <span>HK$ {order.shippingFee.toLocaleString("en-HK")}</span>
              </div>
              <div className="flex justify-between items-center text-[#ef4444]">
                <span>免運費定額補貼 (Subsidy)</span>
                <span>-HK$ {order.subsidyAmount.toLocaleString("en-HK")}</span>
              </div>

              <div className="border-t border-[rgba(237,232,224,0.08)] my-2 pt-2" />

              {/* 兩段式 Escrow 強制拆分外顯 */}
              <div className="flex justify-between items-center text-[#10b981] font-semibold">
                <span>🟢 已扣押首期託管定金 (10% Deposit)</span>
                <span>HK$ {order.depositAmount.toLocaleString("en-HK")}</span>
              </div>
              <div className="flex justify-between items-center text-[#d4a574]">
                <span>⏳ 鑑定通過後需補尾款 (90% Balance)</span>
                <span>HK$ {order.balanceAmount.toLocaleString("en-HK")}</span>
              </div>
            </div>

            {/* 觸覺控制按鈕區 */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              {disputeSubmitted ? (
                <div className="w-full bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-3 text-center">
                  <p className="font-sans text-[13px] text-[#ef4444] font-semibold">
                    ❌ 爭議仲裁已受理：Stripe 金流已瞬時鎖定，平台客服將於 24
                    小時內聯絡雙方。
                  </p>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleApplyDispute}
                    className="flex-1 h-12 border border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444]/10 font-sans font-bold text-[13px] rounded-xl active:scale-[0.98] transition-transform min-h-[48px]"
                  >
                    🚨 申請品相爭議仲裁
                  </button>

                  <button
                    disabled={order.status !== "grading"}
                    className="flex-1 h-12 bg-[#10b981] hover:bg-[#10b981]/90 disabled:opacity-40 disabled:hover:bg-[#10b981] text-[#17130f] font-sans font-bold text-[13px] rounded-xl active:scale-[0.98] transition-transform min-h-[48px]"
                  >
                    ✓ 確認品相無誤釋放尾款
                  </button>
                </>
              )}
            </div>

            <p className="font-sans text-[10px] text-[#50453b] text-center">
              建立時間：{order.createdAt} · 數據流最後變更：{order.updatedAt}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
