"use client";

import { useState } from "react";
import { toast } from "sonner";

export interface SpecialTransactionProps {
  msgId: string;
  buyerName: string;
  cardName: string;
  cardId: string;
  offerPrice: number;
  initialStatus: "pending" | "accepted" | "rejected";
  isMe: boolean; // 判斷呢條訊息係咪自己發出（用於區分買賣家視角）
}

export function SpecialTransactionMessage({
  buyerName,
  cardName,
  cardId,
  offerPrice,
  initialStatus,
  isMe,
}: SpecialTransactionProps) {
  const [status, setStatus] = useState(initialStatus);

  // 賣家點擊接受
  const handleAccept = () => {
    setStatus("accepted");
    toast.success("🤝 交易協定已達成！", {
      description: `您已成功接受此要約，該卡牌資產已變更為【已預留】狀態。`,
    });
  };

  // 賣家點擊拒絕
  const handleReject = () => {
    setStatus("rejected");
    toast.warning("❌ 已拒絕此議價", {
      description: "您已婉拒此筆議價要約，買方將會收到系統即時通知。",
    });
  };

  return (
    <div
      className={`my-2 p-4 rounded-xl border font-sans text-[12.5px] shadow-md w-full transition-all duration-300 ${
        status === "accepted"
          ? "bg-[rgba(16,185,129,0.06)] border-[#10b981]/30 text-[#eae1da]"
          : status === "rejected"
            ? "bg-error/5 border-error/20 text-text-disabled"
            : "bg-[rgba(212,165,116,0.08)] border-brand/30 text-[#eae1da]"
      }`}
    >
      {/* 頂部交易標籤 */}
      <div className="flex items-center justify-between mb-2 border-b border-white/5 pb-1.5">
        <span className="font-mono text-[10px] tracking-wider uppercase font-bold text-brand">
          ⚡ 平台專屬特殊交易要約
        </span>
        <span
          className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded ${
            status === "accepted"
              ? "text-success bg-success/10"
              : status === "rejected"
                ? "text-error bg-error/10"
                : "text-brand bg-brand/10"
          }`}
        >
          {status === "accepted"
            ? "● 已預留"
            : status === "rejected"
              ? "● 已拒絕"
              : "● 待確認"}
        </span>
      </div>

      {/* 核心需求字串範本 */}
      <p className="leading-relaxed font-sans font-medium">
        <span className="text-brand font-bold">{buyerName}</span> offer price{" "}
        <span className="font-mono text-brand font-black underline decoration-brand/40">
          HK$ {offerPrice.toLocaleString()}
        </span>{" "}
        - {cardName} (
        <span className="font-mono text-[11px] opacity-70">{cardId}</span>)
      </p>

      {/* 動態按鈕操作流 */}
      {status === "pending" && (
        <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-white/5">
          {/* 如果訊息唔係我發出嘅（意味著我是賣家），顯示接受/拒絕掣 */}
          {!isMe ? (
            <>
              <button
                type="button"
                onClick={handleAccept}
                className="h-7 px-3 bg-[#10b981] text-white font-bold text-[11px] rounded-lg hover:bg-[#0fa573] transition-colors cursor-pointer"
              >
                接受要約 (預留資產)
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="h-7 px-3 bg-transparent border border-error/40 text-error font-bold text-[11px] rounded-lg hover:bg-error/10 transition-colors cursor-pointer"
              >
                拒絕
              </button>
            </>
          ) : (
            <span className="font-mono text-[11px] text-text-disabled italic">
              ⏳ 等待賣家回應中...
            </span>
          )}

          <button
            type="button"
            onClick={() =>
              toast.info("⚙️ 提示", {
                description: "修改出價功能將在對接後端真實通道後完全開通。",
              })
            }
            className="h-7 px-3 bg-[#17130f] border border-white/10 text-[#d4c4b7] font-bold text-[11px] rounded-lg hover:text-brand transition-colors ml-auto cursor-pointer"
          >
            修改出價 ⚙️
          </button>
        </div>
      )}

      {status === "accepted" && (
        <p className="mt-2 font-mono text-[11px] text-success/80 flex items-center gap-1">
          ✓
          協定已生效。該卡牌已從公開現貨盤鎖定，請雙方前往訂單管理或面交協議跟進。
        </p>
      )}
    </div>
  );
}
