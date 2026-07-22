"use client";

import { useState } from "react";

interface DisputeCase {
  id: string;
  category: "詐騙嫌疑" | "惡意棄單" | "卡牌品相不符" | "物流爭議" | "其他";
  severity: "critical" | "medium";
  reporter: string;
  accused: string;
  cardName: string;
  amount: number;
  orderId: string;
  stripeTxId: string;
  submittedAt: string;
  description: string;
  status: "pending" | "buyer_refunded" | "seller_released" | "frozen";
  chatHistory: {
    sender: "buyer" | "seller" | "system";
    senderName: string;
    text: string;
    time: string;
  }[];
}

const initialCases: DisputeCase[] = [
  {
    id: "DSP-302",
    category: "卡牌品相不符",
    severity: "critical",
    reporter: "M.佐藤 (買家)",
    accused: "KojiTCG Premium (賣家)",
    cardName: "Charizard ex SAR (PSA 10)",
    amount: 49800,
    orderId: "ORD-99214",
    stripeTxId: "ch_3NfG82H92fKy",
    submittedAt: "2025/5/21 11:24",
    description: "買家聲稱卡牌背面右上角有明顯白邊刮痕，不符合 PSA 10 的封裝標準，質疑存在掉包或二次封裝嫌疑。賣家聲稱發貨前有拍照存檔，卡盒完好無損。",
    status: "pending",
    chatHistory: [
      { sender: "system", senderName: "系統", text: "訂單已成交。買家已付款，資金已由 Stripe 保管中。", time: "2025/5/19 14:02" },
      { sender: "buyer", senderName: "M.佐藤", text: "收到貨了，但這張卡背面右上角明顯有刮白邊！PSA 10 怎麼可能有這種瑕疵？我強烈要求退款！", time: "2025/5/20 18:15" },
      { sender: "seller", senderName: "KojiTCG Premium", text: "你好，我們在出貨時進行了高畫質攝像，外殼及金卡均無任何損壞。請確認是否是您簽收時損壞，或者快遞運輸問題？", time: "2025/5/21 09:30" },
      { sender: "buyer", senderName: "M.佐藤", text: "包裹外包裝完好無損，拆箱時卡盒就是這樣了！我已經上傳拆箱錄像，請平台介入仲裁！", time: "2025/5/21 10:12" },
      { sender: "system", senderName: "仲裁機器人", text: "買家已提交申訴，並進入平台人工仲裁介入階段。目前資金已鎖定。", time: "2025/5/21 11:24" },
    ],
  },
  {
    id: "DSP-301",
    category: "惡意棄單",
    severity: "medium",
    reporter: "TokyoRareCards (賣家)",
    accused: "C.Chen (買家)",
    cardName: "Umbreon ex SAR (BGS 9)",
    amount: 38200,
    orderId: "ORD-99105",
    stripeTxId: "ch_2MeF83J29sL",
    submittedAt: "2025/5/20 09:12",
    description: "買家在拍賣得標後 48 小時內拒絕支付尾款，且無任何留言回應。賣家申請沒收其競拍保證金並重新上架。",
    status: "pending",
    chatHistory: [
      { sender: "system", senderName: "系統", text: "競拍結束，買家 @C.Chen 得標，出價 ¥38,200。", time: "2025/5/18 09:00" },
      { sender: "seller", senderName: "TokyoRareCards", text: "您好，恭喜得標！請在 48 小時內完成付款，我們將立即安排空運快遞。", time: "2025/5/18 10:30" },
      { sender: "seller", senderName: "TokyoRareCards", text: "溫馨提示：若逾期未付款，您的保證金將會被沒收。請盡快支付，謝謝！", time: "2025/5/19 14:00" },
      { sender: "system", senderName: "系統", text: "付款時限已過，買家逾期未履行付款義務。", time: "2025/5/20 09:00" },
    ],
  },
  {
    id: "DSP-299",
    category: "物流爭議",
    severity: "medium",
    reporter: "A.Yamamoto (買家)",
    accused: "NagoyaTCG (賣家)",
    cardName: "Espeon ex SAR",
    amount: 31200,
    orderId: "ORD-98842",
    stripeTxId: "ch_1KyT92K11fPs",
    submittedAt: "2025/5/18 16:40",
    description: "快遞狀態顯示已簽收，但買家表示未收到包裹。經與順豐核對，簽收地址與買家地址不符。",
    status: "buyer_refunded",
    chatHistory: [
      { sender: "buyer", senderName: "A.Yamamoto", text: "物流顯示已簽收，可是我根本沒收到，我的信箱也沒東西。是不是寄錯地址了？", time: "2025/5/18 14:20" },
      { sender: "seller", senderName: "NagoyaTCG", text: "我們是按照平台提供的地址填寫的單號，快遞單照片已發在申訴中。", time: "2025/5/18 15:00" },
    ],
  },
];

const SEVERITY_CONFIG = {
  critical: "text-warning bg-[rgba(239,68,68,0.12)] border-warning/30",
  medium: "text-brand bg-[rgba(212,165,116,0.12)] border-brand/20",
};

export default function AdminDisputesPage() {
  const [cases, setCases] = useState<DisputeCase[]>(initialCases);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("DSP-302");
  const [notif, setNotif] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 4000);
  };

  const handleArbitration = (caseId: string, decision: "buyer_refunded" | "seller_released" | "frozen") => {
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, status: decision } : c))
    );
    const decisionLabel =
      decision === "buyer_refunded"
        ? "判決買家勝訴：已觸發 Stripe 全額退款"
        : decision === "seller_released"
        ? "判決賣家勝訴：資金已手動放撥至賣家賬戶"
        : "仲裁已升級凍結：將由法務小組進一步查核";
    showNotification(`案件 ${caseId} 仲裁完成 — ${decisionLabel}`);
  };

  const selectedCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="font-sans font-bold text-[24px] text-text-primary">舉報與爭議仲裁</h1>
          <p className="font-sans text-[13px] text-text-secondary mt-0.5">
            全平台舉報、糾紛投訴、Stripe 支付爭議 (Chargebacks) 聯合仲裁管控面板
          </p>
        </div>
      </div>

      {/* ── Notification Toast ────────────────────────────────────────── */}
      {notif && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#2e2925] border-l-4 border-warning px-4 py-3 rounded shadow-xl animate-fade-in">
          <span className="text-warning font-sans text-sm">⚖️</span>
          <span className="font-sans text-xs text-text-primary">{notif}</span>
        </div>
      )}

      {/* ── Layout Split View ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 items-start">
        {/* ── Left Column: 檢舉案件分類列表 ─────────────────────────── */}
        <section aria-labelledby="cases-list-heading" className="space-y-3">
          <h2 id="cases-list-heading" className="font-sans font-bold text-[15px] text-text-secondary">
            糾紛案件列表
          </h2>
          <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
            {cases.map((c) => {
              const isSelected = c.id === selectedCaseId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCaseId(c.id)}
                  className={`w-full text-left p-4 border-b border-[rgba(237,232,224,0.06)] last:border-b-0 transition-colors flex flex-col gap-2 ${
                    isSelected ? "bg-bg-hover" : "hover:bg-bg-elevated"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] text-text-disabled">#{c.id}</span>
                      <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${SEVERITY_CONFIG[c.severity]}`}>
                        {c.severity === "critical" ? "緊急" : "一般"}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-text-disabled">{c.submittedAt}</span>
                  </div>

                  <div className="min-w-0">
                    <p className="font-sans font-semibold text-[13px] text-text-primary truncate">
                      {c.cardName}
                    </p>
                    <p className="font-sans text-[11px] text-text-secondary mt-0.5">
                      分類：<span className="text-brand">{c.category}</span>
                    </p>
                    <p className="font-sans text-[11px] text-text-disabled truncate mt-1">
                      {c.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-1 w-full border-t border-[rgba(237,232,224,0.04)] pt-2">
                    <span className="font-mono text-[11px] text-text-secondary">
                      HK$ {c.amount.toLocaleString("zh-TW")}
                    </span>
                    <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded ${
                      c.status === "pending"
                        ? "text-warning bg-[rgba(239,68,68,0.10)]"
                        : c.status === "buyer_refunded"
                        ? "text-success bg-[rgba(16,185,129,0.12)]"
                        : c.status === "seller_released"
                        ? "text-brand bg-[rgba(212,165,116,0.12)]"
                        : "text-text-disabled bg-bg-elevated"
                    }`}>
                      {c.status === "pending"
                        ? "待仲裁"
                        : c.status === "buyer_refunded"
                        ? "買家勝訴(已退款)"
                        : c.status === "seller_released"
                        ? "賣家勝訴(已放款)"
                        : "查核凍結"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Right Column: 聯合詳情面板 + 聊天記錄 + 仲裁動作 ───────── */}
        <section aria-labelledby="details-heading" className="space-y-4">
          <h2 id="details-heading" className="font-sans font-bold text-[15px] text-text-secondary">
            糾紛聯合仲裁面板
          </h2>

          <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-6 space-y-5">
            {/* Case Overview & Transaction Info */}
            <div className="border-b border-[rgba(237,232,224,0.08)] pb-5">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <h3 className="font-sans font-bold text-[18px] text-text-primary">
                  {selectedCase.cardName}
                </h3>
                <span className="font-mono text-[12px] text-brand bg-[rgba(212,165,116,0.12)] px-2.5 py-1 rounded-xl">
                  {selectedCase.category}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-[11px] text-text-secondary">
                <div>
                  <span className="text-text-disabled block uppercase">申訴案件</span>
                  <span className="text-text-primary font-bold">#{selectedCase.id}</span>
                </div>
                <div>
                  <span className="text-text-disabled block uppercase">關聯訂單</span>
                  <span className="text-brand font-bold underline cursor-pointer" onClick={() => showNotification(`正在加載訂單 ${selectedCase.orderId} 詳情...`)}>
                    {selectedCase.orderId}
                  </span>
                </div>
                <div>
                  <span className="text-text-disabled block uppercase">Stripe 流水</span>
                  <span className="text-text-primary truncate block" title={selectedCase.stripeTxId}>
                    {selectedCase.stripeTxId}
                  </span>
                </div>
                <div>
                  <span className="text-text-disabled block uppercase">爭議金額</span>
                  <span className="text-warning font-bold">HK$ {selectedCase.amount.toLocaleString("zh-TW")}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-bg-page rounded-xl border border-[rgba(237,232,224,0.06)]">
                <span className="font-sans font-semibold text-[11px] text-text-disabled block mb-1">
                  糾紛案情自述 (雙方陳述)
                </span>
                <p className="font-sans text-[12px] text-text-secondary leading-relaxed">
                  {selectedCase.description}
                </p>
                <div className="flex gap-4 mt-2 font-mono text-[10px] text-text-disabled">
                  <span>舉報方：{selectedCase.reporter}</span>
                  <span>被控方：{selectedCase.accused}</span>
                </div>
              </div>
            </div>

            {/* Read-only Chat History */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-sans font-bold text-[12px] text-text-secondary">
                  💬 涉案雙方聊天對話軌跡 (唯讀)
                </span>
                <span className="font-mono text-[9px] text-text-disabled">不含平台回覆</span>
              </div>

              <div className="bg-bg-page border border-[rgba(237,232,224,0.06)] rounded-xl p-4 space-y-3 max-h-64 overflow-y-auto">
                {selectedCase.chatHistory.map((chat, i) => {
                  if (chat.sender === "system") {
                    return (
                      <div key={i} className="text-center py-1">
                        <span className="font-sans text-[10px] text-text-disabled bg-bg-card px-2.5 py-0.5 rounded-full border border-[rgba(237,232,224,0.04)]">
                          {chat.text} · {chat.time}
                        </span>
                      </div>
                    );
                  }

                  const isBuyer = chat.sender === "buyer";
                  return (
                    <div
                      key={i}
                      className={`flex flex-col max-w-[85%] ${
                        isBuyer ? "mr-auto items-start" : "ml-auto items-end"
                      }`}
                    >
                      <span className="font-mono text-[10px] text-text-disabled mb-0.5 px-1">
                        {chat.senderName} ({isBuyer ? "買方" : "賣方"}) · {chat.time}
                      </span>
                      <div
                        className={`rounded-xl px-3.5 py-2.5 font-sans text-[12px] leading-relaxed ${
                          isBuyer
                            ? "bg-[#2e2925] text-text-primary rounded-tl-none border border-[rgba(237,232,224,0.08)]"
                            : "bg-[rgba(212,165,116,0.15)] text-text-primary rounded-tr-none border border-[rgba(212,165,116,0.10)]"
                        }`}
                      >
                        {chat.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Arbitration Decision Action Buttons */}
            {selectedCase.status === "pending" ? (
              <div className="border-t border-[rgba(237,232,224,0.08)] pt-4 space-y-3">
                <span className="font-sans font-bold text-[12px] text-text-secondary block">
                  🛡️ 平台管理員最終仲裁判定
                </span>
                <p className="font-sans text-[11px] text-text-disabled">
                  一旦做出仲裁，款項將會被 Stripe 釋放或全額返還，本操作無法撤銷。
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleArbitration(selectedCase.id, "buyer_refunded")}
                    className="h-10 bg-success text-[#111] font-sans font-bold text-[12px] rounded-xl hover:bg-success/90 active:scale-[0.98] transition-all"
                  >
                    買家勝訴（退款）
                  </button>
                  <button
                    onClick={() => handleArbitration(selectedCase.id, "seller_released")}
                    className="h-10 bg-brand text-[#111] font-sans font-bold text-[12px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all"
                  >
                    賣家勝訴（放款）
                  </button>
                  <button
                    onClick={() => handleArbitration(selectedCase.id, "frozen")}
                    className="h-10 bg-[rgba(239,68,68,0.10)] text-warning font-sans font-semibold text-[12px] rounded-xl border border-warning/20 hover:bg-[rgba(239,68,68,0.18)] active:scale-[0.98] transition-all"
                  >
                    暫時凍結 / 專案升級
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-[rgba(237,232,224,0.08)] pt-4 text-center">
                <p className="font-sans font-bold text-[13px] text-success">
                  ✓ 本案已仲裁結案。判決狀態：
                  {selectedCase.status === "buyer_refunded"
                    ? "買家勝訴（已執行退款）"
                    : selectedCase.status === "seller_released"
                    ? "賣家勝訴（已撥款給商戶）"
                    : "查核凍結中"}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
