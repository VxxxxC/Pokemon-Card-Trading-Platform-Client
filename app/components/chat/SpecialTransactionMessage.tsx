"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface SpecialTransactionProps {
  msgId: string;
  buyerName: string;
  buyerId: string; // buyer session identity
  sellerId: string;
  sellerName: string; // seller display name
  cardName: string;
  cardId: string;
  offerPrice: number;
  initialStatus: "pending" | "accepted" | "rejected" | "countered"; // Expanded
  isMe: boolean; // true = CurrentUser is Buyer, false = CurrentUser is Seller
}

export function SpecialTransactionMessage({
  buyerName,
  cardName,
  cardId,
  offerPrice,
  initialStatus,
  isMe,
}: SpecialTransactionProps) {
  const router = useRouter();
  const [status, setStatus] = useState<
    "pending" | "accepted" | "rejected" | "countered"
  >(initialStatus);
  const [currentPrice, setCurrentPrice] = useState(offerPrice);
  const [counterInput, setCounterInput] = useState(offerPrice);

  // ── Seller handlers ──────────────────────────────────────────────────────
  const handleAccept = () => {
    setStatus("accepted");
    toast.success("🤝 交易協定已達成！", {
      description: "您已成功接受此要約，該商品狀態已變更為【已預留】。",
    });
  };

  const handleReject = () => {
    setStatus("rejected");
    toast.warning("❌ 已拒絕此議價", {
      description: "您已婉拒此筆議價要約。",
    });
  };

  // ── Buyer handler ─────────────────────────────────────────────────────────
  const handleCounterOffer = () => {
    setCurrentPrice(counterInput);
    setStatus("countered");
    toast.info("🛠️ 出價已修改", {
      description: `已修改報價為 HK$ ${counterInput.toLocaleString()}。`,
    });
  };

  // ── Derived display values ────────────────────────────────────────────────
  // 🟢 核心優化：將 countered 狀態徽章全面換裝為高飽和度「亮橙黃色」矩陣，加裝微距外襯邊框
  const statusBadge = {
    accepted: {
      label: "● 已預留",
      cls: "text-success bg-success/10 border border-success/20",
    },
    rejected: {
      label: "● 已拒絕",
      cls: "text-error bg-error/10 border border-error/20",
    },
    countered: {
      label: "● 出價已修改",
      cls: "text-orange-400 bg-orange-500/20 font-black border border-orange-500/30 shadow-[0_0_8px_rgba(249,115,22,0.1)]",
    },
    pending: {
      label: "● 待確認",
      cls: "text-brand bg-brand/10 border border-brand/20",
    },
  }[status];

  // 🟢 核心優化：重塑狀態變更物理外框，亮橙黃色（Vibrant Orange-Yellow）全量注入，外敷發光粒子特效
  const cardBg =
    status === "accepted"
      ? "bg-[rgba(16,185,129,0.06)] border-[#10b981]/40 text-[#eae1da]"
      : status === "rejected"
        ? "bg-error/5 border-error/20 text-text-disabled"
        : status === "countered"
          ? "bg-[rgba(249,115,22,0.09)] border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)] text-[#eae1da]"
          : "bg-[rgba(212,165,116,0.08)] border-brand/30 text-[#eae1da]";

  const showControls = status === "pending" || status === "countered";

  return (
    <div
      className={`my-2 p-4 rounded-xl border font-sans text-[12.5px] shadow-md w-full transition-all duration-300 ${cardBg}`}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-2 border-b border-white/5 pb-1.5">
        <span className="font-mono text-[10px] tracking-wider uppercase font-bold text-brand">
          ⚡ 平台專屬特殊交易要約
        </span>
        <span
          className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded ${statusBadge.cls}`}
        >
          {statusBadge.label}
        </span>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <p className="leading-relaxed font-sans font-medium">
        <span className="text-brand font-bold">{buyerName}</span> offer price{" "}
        <span className="font-mono text-brand font-black underline decoration-brand/40">
          HK$ {currentPrice.toLocaleString()}
        </span>{" "}
        -{" "}
        {/* PWA-safe navigation: router.push() instead of window.location.href */}
        <button
          type="button"
          onClick={() => router.push(`/marketplace/product/${cardId}`)}
          className="font-sans font-black text-brand underline underline-offset-2 decoration-brand/60 hover:text-[#e8b896] transition-colors cursor-pointer bg-transparent border-none p-0 inline text-left focus:outline-none"
        >
          {cardName}
        </button>
      </p>

      {/* ── Action Controls ───────────────────────────────────────────────── */}
      {showControls && (
        <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-white/5">
          {!isMe ? (
            /* ════════════════════════════════════════════════════════════
               SELLER BRANCH  (isMe === false)
               Shows: [🤝 接受要約] and [❌ 拒絕] with guarded AlertDialogs
               ════════════════════════════════════════════════════════════ */
            <>
              {/* ── Accept AlertDialog (emerald accent) ────────────────── */}
              <AlertDialog>
                <AlertDialogTrigger className="h-7 px-3 bg-[#10b981] text-white font-bold text-[11px] rounded-lg hover:bg-[#0fa573] cursor-pointer focus:outline-none">
                  🤝 接受要約
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#26211C] border border-[#10b981]/30 text-[#eae1da] rounded-2xl max-w-sm p-6 shadow-[0_12px_40px_rgba(16,185,129,0.12)]">
                  <AlertDialogHeader className="text-left place-items-start gap-1">
                    <AlertDialogTitle className="text-[15px] font-black text-[#eae1da] flex items-center gap-2">
                      🤝 確認接受要約
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[11px] font-mono text-[#8A8680] uppercase tracking-wider">
                      Accept Offer Confirmation
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <p className="font-sans text-[12.5px] text-[#d4c4b7] leading-relaxed py-3">
                    您即將以{" "}
                    <span className="font-mono font-black text-[#10b981]">
                      HK$ {currentPrice.toLocaleString()}
                    </span>{" "}
                    接受來自{" "}
                    <span className="font-bold text-brand">{buyerName}</span>{" "}
                    的要約。確認後，該商品將立即進入【已預留】狀態並鎖定交割流程。
                  </p>
                  <div className="flex flex-col gap-2 pt-1 w-full">
                    <AlertDialogAction
                      onClick={handleAccept}
                      className="w-full h-11 bg-[#10b981] hover:bg-[#0fa573] text-white font-sans font-black text-[13px] rounded-xl cursor-pointer shadow-[0_4px_20px_rgba(16,185,129,0.18)] active:scale-[0.97] transition-all focus:outline-none"
                    >
                      ✅ 確認接受
                    </AlertDialogAction>
                    <AlertDialogCancel className="w-full h-10 bg-[#120F0C] hover:bg-[#1A1612] border border-white/[0.03] text-[#736c65] hover:text-[#eae1da] font-sans font-bold text-[12px] rounded-xl cursor-pointer transition-colors focus:outline-none">
                      返回
                    </AlertDialogCancel>
                  </div>
                </AlertDialogContent>
              </AlertDialog>

              {/* ── Reject AlertDialog (crimson accent) ────────────────── */}
              <AlertDialog>
                <AlertDialogTrigger className="h-7 px-3 bg-transparent border border-error/40 text-error font-bold text-[11px] rounded-lg hover:bg-error/10 cursor-pointer focus:outline-none">
                  ❌ 拒絕
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#26211C] border border-[#ef4444]/30 text-[#eae1da] rounded-2xl max-w-sm p-6 shadow-[0_12px_40px_rgba(239,68,68,0.12)]">
                  <AlertDialogHeader className="text-left place-items-start gap-1">
                    <AlertDialogTitle className="text-[15px] font-black text-[#eae1da] flex items-center gap-2">
                      ❌ 確認拒絕要約
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[11px] font-mono text-[#8A8680] uppercase tracking-wider">
                      Reject Offer Confirmation
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <p className="font-sans text-[12.5px] text-[#d4c4b7] leading-relaxed py-3">
                    您即將婉拒來自{" "}
                    <span className="font-bold text-brand">{buyerName}</span> 的{" "}
                    <span className="font-mono font-black text-error">
                      HK$ {currentPrice.toLocaleString()}
                    </span>{" "}
                    要約。此動作不可逆，買家將收到拒絕通知。
                  </p>
                  <div className="flex flex-col gap-2 pt-1 w-full">
                    <AlertDialogAction
                      onClick={handleReject}
                      className="w-full h-11 bg-[#ef4444] hover:bg-[#dc2626] text-white font-sans font-black text-[13px] rounded-xl cursor-pointer shadow-[0_4px_20px_rgba(239,68,68,0.18)] active:scale-[0.97] transition-all focus:outline-none"
                    >
                      確認拒絕
                    </AlertDialogAction>
                    <AlertDialogCancel className="w-full h-10 bg-[#120F0C] hover:bg-[#1A1612] border border-white/[0.03] text-[#736c65] hover:text-[#eae1da] font-sans font-bold text-[12px] rounded-xl cursor-pointer transition-colors focus:outline-none">
                      返回
                    </AlertDialogCancel>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            /* ════════════════════════════════════════════════════════════
               BUYER BRANCH  (isMe === true)
               Shows: waiting label + [🛠️ 修改出價] (one-time, amber)
               ════════════════════════════════════════════════════════════ */
            <>
              <span className="font-mono text-[11px] text-text-disabled italic">
                ⏳ 等待賣家回應中...
              </span>

              {/* Counter-offer button only available while still "pending" */}
              {status === "pending" && (
                <AlertDialog>
                  <AlertDialogTrigger className="h-7 px-3 bg-[#17130f] border border-orange-500/40 text-orange-400 font-bold text-[11px] rounded-lg hover:bg-orange-500/10 cursor-pointer focus:outline-none ml-auto">
                    🛠️ 修改出價
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#26211C] border border-orange-500/40 text-[#eae1da] rounded-2xl max-w-sm p-6 shadow-[0_12px_40px_rgba(249,115,22,0.15)]">
                    <AlertDialogHeader className="text-left place-items-start gap-1">
                      <AlertDialogTitle className="text-[15px] font-black text-[#eae1da] flex items-center gap-2">
                        🛠️ 修改出價
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-[11px] font-mono text-[#8A8680] uppercase tracking-wider">
                        Counter-Offer Modification
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="py-3 space-y-4">
                      {/* One-time privilege warning */}
                      <Alert className="bg-orange-500/10 border-orange-500/30 text-orange-400">
                        <AlertDescription className="text-[11.5px] font-sans leading-relaxed text-orange-400">
                          ⚠️
                          注意：出價修改屬於一次性特權行為。提交全新要約後，原價格要約將被自動廢除並重新進入賣家複核隊列。
                        </AlertDescription>
                      </Alert>

                      {/* Numerical price input */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="counter-offer-input"
                          className="block font-mono text-[10px] text-[#d4c4b7] uppercase tracking-wide"
                        >
                          輸入新出價金額 (HK$)
                        </label>
                        <input
                          id="counter-offer-input"
                          type="number"
                          value={counterInput}
                          onChange={(e) =>
                            setCounterInput(Number(e.target.value))
                          }
                          className="w-full h-10 bg-[#17130f] border border-orange-500/20 rounded-xl px-3 text-[13px] font-mono text-[#eae1da] focus:outline-none focus:border-orange-500/40 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-1 w-full">
                      <AlertDialogAction
                        onClick={handleCounterOffer}
                        className="w-full h-11 bg-orange-500 hover:bg-orange-400 text-[#17130f] font-sans font-black text-[13px] rounded-xl cursor-pointer shadow-[0_4px_20px_rgba(249,115,22,0.18)] active:scale-[0.97] transition-all focus:outline-none"
                      >
                        確認送出出價
                      </AlertDialogAction>
                      <AlertDialogCancel
                        onClick={() => setCounterInput(currentPrice)}
                        className="w-full h-10 bg-[#120F0C] hover:bg-[#1A1612] border border-white/[0.03] text-[#736c65] hover:text-[#eae1da] font-sans font-bold text-[12px] rounded-xl cursor-pointer transition-colors focus:outline-none"
                      >
                        取消
                      </AlertDialogCancel>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
