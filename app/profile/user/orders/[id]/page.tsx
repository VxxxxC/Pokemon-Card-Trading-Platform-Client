"use client";

import { useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { OrderLifecycleStepper } from "../_components/OrderLifecycleStepper";

interface LocalOrder {
  id: string;
  cardName: string;
  cardNo: string;
  grade: string;
  cardImage: string;
  seller: string; // 當 side 為 "sell" 時，此處語意代表交易對手（買家）
  sellerId: string;
  amount: number;
  depositAmount: number;
  tradeType: "c2c" | "b2c";
  flowType: "meetup" | "delivery" | "escrow_auth" | "escrow_no_auth";
  status: string;
  statusLabel: string;
  createdAt: string;
  side: "buy" | "sell"; // 🟢 修正：與列表頁 100% 對齊的買賣方向
  certNo?: string;
  centeringGrade?: string;
  cornersGrade?: string;
  edgesGrade?: string;
  surfaceGrade?: string;
  securityHash?: string;
}

// TODO: [server/api/database]
const MOCK_ORDERS_DB: Record<string, LocalOrder> = {
  // ⏳ 進行中
  "ORD-C2C-MEETUP-001": {
    id: "ORD-C2C-MEETUP-001",
    cardName: "Charizard ex SAR (基底閃卡噴火龍)",
    cardNo: "sv2a-182",
    grade: "PSA 10 完美鑑定",
    cardImage: "https://picsum.photos/seed/charizard/400/560",
    seller: "星光收藏家 (C2C 散戶)",
    sellerId: "ROOM-MOCK-C2C-01",
    amount: 2250,
    depositAmount: 0,
    tradeType: "c2c",
    flowType: "meetup",
    status: "reserved",
    statusLabel: "已預留 (等待雙方約定時間面交)",
    createdAt: "2026年 5月27日",
    side: "buy", // 🟢 買入方向
  },
  "ORD-C2C-DELIVERY-002": {
    id: "ORD-C2C-DELIVERY-002",
    cardName: "Umbreon ex SAR (古神特繪月亮伊布)",
    cardNo: "sv6a-109",
    grade: "Raw 完美裸卡",
    cardImage: "https://picsum.photos/seed/umbreon/400/560",
    seller: "信和執雞王 (買家散戶)",
    sellerId: "ROOM-MOCK-C2C-02",
    amount: 1900,
    depositAmount: 0,
    tradeType: "c2c",
    flowType: "delivery",
    status: "shipped",
    statusLabel: "您已寄出順豐速遞 (實時物流流轉中)",
    createdAt: "2026年 5月26日",
    side: "sell", // 🟢 賣出方向
  },
  "ORD-B2C-AUTH-003": {
    id: "ORD-B2C-AUTH-003",
    cardName: "Marnie (高人氣女角瑪俐) SR 198/190",
    cardNo: "s5a-070",
    grade: "PSA 10 頂級判定",
    cardImage: "https://picsum.photos/seed/marnie/400/560",
    seller: "渡邊道館 (官方認證金牌商戶)",
    sellerId: "PKT-8839-44A",
    amount: 4200,
    depositAmount: 420,
    tradeType: "b2c",
    flowType: "escrow_auth",
    status: "grading",
    statusLabel: "中介鑑定中心微觀光學鑑定中",
    createdAt: "2026年 5月25日",
    side: "buy",
  },
  "ORD-B2C-NOAUTH-004": {
    id: "ORD-B2C-NOAUTH-004",
    cardName: "Pikachu AR (經典肥皮卡丘)",
    cardNo: "sv2a-215",
    grade: "CGC 9 高分卡",
    cardImage: "https://picsum.photos/seed/pikachu/400/560",
    seller: "東京TCG市場 (海外認證商戶)",
    sellerId: "ROOM-MOCK-B2C-02",
    amount: 425,
    depositAmount: 0,
    tradeType: "b2c",
    flowType: "escrow_no_auth",
    status: "paid",
    statusLabel: "買家全額已付款 (等待商戶直送出貨)",
    createdAt: "2026年 5月24日",
    side: "buy",
  },

  // 🏅 歷史已完成交易
  "ORD-C2C-DONE-101": {
    id: "ORD-C2C-DONE-101",
    cardName: "Lillie (神級萌王莉莉艾) SR 119/114",
    cardNo: "sm4+119",
    grade: "BGS 9.5 鑽石金標",
    cardImage: "https://picsum.photos/seed/lillie/400/560",
    seller: "尖沙咀卡神 (C2C 散戶大戶)",
    sellerId: "ROOM-MOCK-C2C-99",
    amount: 18500,
    depositAmount: 0,
    tradeType: "c2c",
    flowType: "meetup",
    status: "completed_meetup",
    statusLabel: "交易完結 (買賣雙方已當面完成資產核對交收)",
    createdAt: "2026年 5月10日",
    side: "buy",
    securityHash: "HASH-SHA256-PKT-C2C-9981237",
  },
  "ORD-C2C-DONE-102": {
    id: "ORD-C2C-DONE-102",
    cardName: "Gengar VMAX (魔王耿鬼) SA 020/019",
    cardNo: "sGG-020",
    grade: "PSA 10 完美閃卡",
    cardImage: "https://picsum.photos/seed/gengar/400/560",
    seller: "元朗李生 (買家散戶)",
    sellerId: "ROOM-MOCK-C2C-98",
    amount: 3400,
    depositAmount: 0,
    tradeType: "c2c",
    flowType: "delivery",
    status: "received",
    statusLabel: "交易完結 (順豐自提點智能櫃買家已簽收)",
    createdAt: "2026年 5月08日",
    side: "sell",
    securityHash: "HASH-SHA256-PKT-C2C-8874109",
  },
  "ORD-B2C-DONE-103": {
    id: "ORD-B2C-DONE-103",
    cardName: "Rayquaza VMAX (烈空坐天烈特繪) SA 083/067",
    cardNo: "s7R-083",
    grade: "PSA 10 終極滿分",
    cardImage: "https://picsum.photos/seed/rayquaza/400/560",
    seller: "木戶卡牌旗艦店 (認證頂級商戶)",
    sellerId: "ROOM-MOCK-B2C-97",
    amount: 4800,
    depositAmount: 480,
    tradeType: "b2c",
    flowType: "escrow_auth",
    status: "received",
    statusLabel: "交易完結 (平台實物鑑定 100% 合格，買家已提貨)",
    createdAt: "2026年 5月05日",
    side: "buy",
    certNo: "PSA-CERT-9982410",
    centeringGrade: "10 / 10",
    cornersGrade: "9.5 / 10",
    edgesGrade: "10 / 10",
    surfaceGrade: "10 / 10",
    securityHash: "HASH-SHA256-ESCROW-AUTH-20260505",
  },
};

const FLOW_STEPS_MATRIX = {
  meetup: [
    { id: "reserved", label: "已預留" },
    { id: "completed_meetup", label: "面交結單" },
  ],
  delivery: [
    { id: "reserved", label: "已預留" },
    { id: "paid", label: "已付款" },
    { id: "shipped", label: "已發貨" },
    { id: "received", label: "買家簽收" },
  ],
  escrow_auth: [
    { id: "paid", label: "已付款" },
    { id: "custody", label: "中心保管" },
    { id: "grading", label: "官方鑑定" },
    { id: "released", label: "資金釋放" },
    { id: "shipped", label: "快遞發貨" },
    { id: "received", label: "買家簽收" },
  ],
  escrow_no_auth: [
    { id: "paid", label: "已付款" },
    { id: "shipped", label: "已發貨" },
    { id: "received", label: "買家簽收" },
  ],
};

function GrandEscrowStepper({
  order,
  isFinished,
}: {
  order: LocalOrder;
  isFinished: boolean;
}) {
  let stepperTitle = "🔒 第三方 Escrow 交易資金託管實時進度 (Stripe 擔保)";
  if (order.flowType === "meetup")
    stepperTitle = "🤝 C2C 散戶當面交收與驗卡進度 (本土線下流)";
  if (order.flowType === "delivery")
    stepperTitle = "📦 C2C 私人快遞直送生命週期狀態 (電子支付流)";
  if (order.flowType === "escrow_no_auth")
    stepperTitle = "⚡ 認證商戶直送履約進度 (一般網付流)";

  return (
    <OrderLifecycleStepper
      steps={FLOW_STEPS_MATRIX[order.flowType] || []}
      status={order.status}
      isFinished={isFinished}
      title={isFinished ? "🏅 歷史交易安全軌跡回溯存証" : stepperTitle}
      eyebrow={`Flow Type: ${order.flowType.toUpperCase()} SECURE TRAIL`}
      statusLabel={order.statusLabel}
      variant="grand"
    />
  );
}

function ActiveOrderDetail({ order }: { order: LocalOrder }) {
  const isBuy = order.side === "buy";

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <Link
          href="/profile/user/orders"
          className="font-sans text-[14px] font-semibold text-[#d4c4b7] hover:text-brand flex items-center gap-1 transition-colors"
        >
          ← 返回買家訂單資產大盤
        </Link>
        <button
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("open-global-chat", {
                detail: { roomId: order.sellerId, partnerName: order.seller },
              }),
            )
          }
          className="h-11 px-6 bg-[#26211C] border border-brand/30 hover:border-brand text-brand font-sans text-[13px] font-bold rounded-xl active:scale-95 transition-all shadow-md"
        >
          💬 呼叫全域加密對講機
        </button>
      </div>

      <GrandEscrowStepper order={order} isFinished={false} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start shadow-md">
            <div className="relative w-44 h-60 md:w-56 md:h-76 rounded-2xl overflow-hidden bg-[#17130f] border-2 border-[rgba(237,232,224,0.12)] shrink-0 shadow-[0_8px_24px_rgba(0,0,0,0.5)] group">
              <Image
                src={order.cardImage}
                alt={order.cardName}
                fill
                sizes="(max-w-768px) 176px, 224px"
                className="object-cover transform hover:scale-102 transition-transform duration-300"
                unoptimized
              />
            </div>

            <div className="flex-1 space-y-4 w-full">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`font-mono text-[10px] px-2.5 py-0.5 rounded border font-bold uppercase tracking-wider ${
                    order.tradeType === "b2c"
                      ? "bg-brand/10 text-brand border-brand/20"
                      : "bg-[#50453b]/40 text-[#d4c4b7] border-[rgba(237,232,224,0.1)]"
                  }`}
                >
                  {order.tradeType === "b2c" ? "認證商戶交易" : "C2C 散戶交易"}
                </span>

                {/* 🟢 修正：刪除舊 orderType 與顏色，精準對齊「綠色背景為買、紅色背景為賣」的高亮發光徽章 */}
                <span
                  className={`flex items-center gap-1 font-sans text-[10px] px-2.5 py-0.5 rounded border font-extrabold tracking-wide uppercase ${
                    isBuy
                      ? "bg-success/20 text-success border-success/30"
                      : "bg-error/20 text-error border-error/30"
                  }`}
                >
                  {isBuy ? "📥 買" : "📤 賣"}
                </span>
              </div>

              <div>
                <h2 className="font-sans font-black text-[20px] md:text-[26px] text-[#eae1da] mt-2 leading-tight tracking-tight">
                  {order.cardName}
                </h2>
                <p className="font-mono text-[13px] text-text-secondary mt-1.5">
                  卡片編號:{" "}
                  <span className="text-[#eae1da] font-bold">
                    {order.cardNo}
                  </span>{" "}
                  · 規格:{" "}
                  <span className="text-brand font-bold">{order.grade}</span>
                </p>
              </div>

              <div className="pt-4 text-[14px] text-text-secondary space-y-2 border-t border-[rgba(237,232,224,0.06)] font-sans">
                <div className="flex justify-between md:justify-start md:gap-8">
                  <span>📅 創建時間:</span>
                  <span className="text-text-primary font-mono">
                    {order.createdAt}
                  </span>
                </div>
                <div className="flex justify-between md:justify-start md:gap-8">
                  {/* 🟢 依據買賣方向動態轉化交易對手文案 */}
                  <span>{isBuy ? "🏪 賣家對手:" : "👤 買家對手:"}</span>
                  <span className="text-text-primary font-medium">
                    {order.seller}
                  </span>
                </div>
                <div className="flex justify-between md:justify-start md:gap-8">
                  <span>🔑 訂單流水:</span>
                  <span className="text-text-disabled font-mono text-[12px]">
                    {order.id}
                  </span>
                </div>
              </div>

              {order.flowType === "escrow_auth" ? (
                <div className="p-3.5 bg-[#17130f] rounded-xl border border-brand/10 flex justify-between items-center font-mono text-[13px] animate-fadeIn">
                  <span className="text-[#10b981] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                    Stripe 10% 鑑定定金成功託管 (安全帳戶)
                  </span>
                  <span className="text-brand font-bold">
                    HK$ {order.depositAmount.toLocaleString()}
                  </span>
                </div>
              ) : order.flowType === "meetup" ? (
                <div className="p-3.5 bg-[#17130f] rounded-xl border border-[rgba(237,232,224,0.06)] flex justify-between items-center font-mono text-[13px] animate-fadeIn">
                  <span className="text-[#d4c4b7] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#50453b]" />
                    本地線下面交 (不經平台任何線上代扣)
                  </span>
                  <span className="text-brand font-bold text-[12px]">
                    現場支持 現金 / 轉數快 / PayMe
                  </span>
                </div>
              ) : (
                <div className="p-3.5 bg-[#17130f] rounded-xl border border-[rgba(237,232,224,0.06)] flex justify-between items-center font-mono text-[13px] animate-fadeIn">
                  <span className="text-[#10b981] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                    已透過一般電子支付 (PayMe / FPS / 支付寶) 完成 100% 全額結算
                  </span>
                  <span className="text-brand font-bold">
                    HK$ {order.amount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4 w-full">
          <div className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-6 shadow-md space-y-4">
            <h3 className="font-sans font-bold text-[14px] text-[#eae1da] border-b border-[rgba(237,232,224,0.06)] pb-2.5">
              💡 當前流向官方行動指南
            </h3>

            <div className="text-[13.5px] text-text-secondary leading-relaxed font-sans space-y-3">
              {order.flowType === "meetup" && (
                <p>
                  🤝 C2C
                  散戶當面面交流向：目前此卡已成功預留。請利用上方對講機約定香港市區面交。
                  {isBuy
                    ? "當場肉眼核對卡相無誤後，請使用現金/轉數快/PayMe過數給賣家，並於平台點擊「確認完成收貨」結單。"
                    : "當面交收與驗卡完畢、並收到買家過數後，請督促買家於平台點擊確認結單，或由客服協助結束。"}
                </p>
              )}
              {order.flowType === "delivery" && (
                <p>
                  📦 散戶快遞直送流向：
                  {isBuy
                    ? "已完成 100% 線上全額付清。賣家已上傳順豐速遞單號，請於收到順豐網點 SMS 提取碼後前往簽收提貨。"
                    : "買家已完成全額電子過數備案。請您於 24 小時內前往順豐網點寄出，並於上方對講機或訂單管理上傳快遞單號。"}
                </p>
              )}
              {order.flowType === "escrow_auth" && (
                <p>
                  🛡 官方頂級鑑定流向：
                  <span className="text-brand font-semibold">
                    此流程專屬 Stripe Connect 10-20% 資金託管
                  </span>
                  。卡牌已安全抵達中介鑑定櫃。鑑定師正在做微觀掃描，品相報告完成並自動扣除尾款後將安排出貨。
                </p>
              )}
              {order.flowType === "escrow_no_auth" && (
                <p>
                  ⚡ 商戶直發免檢流向：已透過一般電子支付完成 100%
                  全額結算。商品將跳過中介由商戶直接寄出，預計 2-3
                  個工作天內抵達指定自提點。
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompletedOrderDetail({ order }: { order: LocalOrder }) {
  const isBuy = order.side === "buy";

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <Link
          href="/profile/user/orders"
          className="font-sans text-[14px] font-semibold text-[#d4c4b7] hover:text-brand"
        >
          ← 返回買家訂單資產大盤
        </Link>
        <span className="font-mono text-[12px] bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 px-4 py-1 rounded-full uppercase font-bold tracking-wider shadow-sm">
          ✓ 平台官方存證已完結
        </span>
      </div>

      <GrandEscrowStepper order={order} isFinished={true} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 shadow-md">
          <div className="relative w-44 h-60 md:w-56 md:h-76 rounded-2xl overflow-hidden bg-[#17130f] border border-[rgba(237,232,224,0.08)] shrink-0 shadow-lg opacity-85">
            <Image
              src={order.cardImage}
              alt={order.cardName}
              fill
              sizes="(max-w-768px) 176px, 224px"
              className="object-cover filter grayscale-[10%]"
              unoptimized
            />
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-sans font-black text-[16px] md:text-[18px] text-[#eae1da]">
                🧾 交易資產最終交收電子收據清冊
              </h3>
              {/* 🟢 修正：歷史完結單同步改用新高亮紅綠標籤 */}
              <span
                className={`flex items-center gap-0.5 font-sans text-[10px] px-2 py-0.5 rounded border font-extrabold tracking-wide uppercase ${
                  isBuy
                    ? "bg-success/20 text-success border-success/30"
                    : "bg-error/20 text-error border-error/30"
                }`}
              >
                {isBuy ? "📥 買" : "📤 賣"}
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="font-sans font-extrabold text-[16px] text-[#eae1da]">
                {order.cardName}
              </h4>
              <p className="font-mono text-[12px] text-text-secondary">
                序號: {order.cardNo} · 等級: {order.grade} ·{" "}
                {isBuy ? "賣家:" : "買家:"} {order.seller}
              </p>
            </div>
            <div className="border-t border-[rgba(237,232,224,0.06)] pt-4 font-mono text-[13.5px] space-y-3 text-text-secondary">
              <div className="flex justify-between">
                <span>商品最終成交價 (Subtotal)</span>
                <span className="text-text-primary">
                  HK$ {order.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>順豐速遞本港運費 (Shipping)</span>
                <span className="text-text-primary">HK$ 30</span>
              </div>
              <div className="flex justify-between text-[#ef4444]">
                <span>平台免郵定額補貼 (Subsidy)</span>
                <span>-HK$ 30</span>
              </div>
              <div className="border-t border-[rgba(237,232,224,0.08)] pt-4 flex justify-between items-center text-[#eae1da] font-black text-[16px] md:text-[22px]">
                <span>{isBuy ? "最終扣款總額" : "最終實收總額"}</span>
                <span className="text-brand font-mono text-[22px] md:text-[32px]">
                  HK$ {order.amount.toLocaleString()}
                </span>
              </div>
            </div>
            {order.flowType === "escrow_auth" && (
              <button
                onClick={() =>
                  alert("📥 官方四維微觀光學存證鑑定報告 PDF 已成功匯出！")
                }
                className="w-full h-11 bg-[#39342f] border border-[rgba(237,232,224,0.12)] hover:border-brand text-text-primary text-[13px] font-bold rounded-xl transition-all mt-4 shadow-md flex items-center justify-center gap-2"
              >
                📥 下載官方實物高精細度鑑定存證報告 (PDF)
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4 w-full font-mono">
          {order.flowType === "escrow_auth" && order.centeringGrade && (
            <div className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-5 shadow-md space-y-3.5">
              <h4 className="font-sans font-bold text-[13.5px] text-brand border-b border-[rgba(237,232,224,0.06)] pb-2">
                🔬 官方中介微觀物理品相評級
              </h4>
              <div className="text-[12.5px] space-y-2 text-text-secondary">
                <div className="flex justify-between">
                  <span>官方證書序號:</span>
                  <span className="text-text-primary font-bold">
                    {order.certNo}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[rgba(237,232,224,0.04)] pt-2">
                  <span>對中比例 (Centering):</span>
                  <span className="text-[#10b981] font-bold">
                    {order.centeringGrade}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>邊角完好 (Corners):</span>
                  <span className="text-[#10b981] font-bold">
                    {order.cornersGrade}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>邊緣對齊 (Edges):</span>
                  <span className="text-[#10b981] font-bold">
                    {order.edgesGrade}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>表面微刮 (Surface):</span>
                  <span className="text-[#10b981] font-bold">
                    {order.surfaceGrade}
                  </span>
                </div>
              </div>
            </div>
          )}
          {order.securityHash && (
            <div className="bg-[#26211C]/40 border border-[rgba(237,232,224,0.04)] rounded-2xl p-4 space-y-1.5 text-[11px] text-text-disabled">
              <p className="font-sans font-semibold text-[10px] text-text-secondary uppercase tracking-widest">
                🔒 安全防偽區塊鏈驗證碼
              </p>
              <p className="truncate font-mono select-all bg-[#17130f] p-2 rounded-lg border border-[rgba(237,232,224,0.06)] text-brand/80 mt-2">
                {order.securityHash}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UserOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  // Safe SSR environment isolation via useSyncExternalStore
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#17130f] flex items-center justify-center">
        <div className="w-9 h-9 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  const order = MOCK_ORDERS_DB[orderId] || MOCK_ORDERS_DB["ORD-C2C-MEETUP-001"];
  const isCompleted =
    order.status === "completed_meetup" || order.status === "received";

  return (
    <div className="min-h-screen bg-[#17130f] text-[#eae1da] font-sans p-4 lg:p-8">
      <div className="max-w-[1240px] mx-auto">
        {isCompleted ? (
          <CompletedOrderDetail order={order} />
        ) : (
          <ActiveOrderDetail order={order} />
        )}
      </div>
    </div>
  );
}
