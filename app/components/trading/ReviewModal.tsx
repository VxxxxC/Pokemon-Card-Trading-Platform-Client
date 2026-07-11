"use client";

import React, { useCallback, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { submitTransactionReview } from "@/app/actions/reviews";
import { cn } from "@/lib/utils";

const MAX_COMMENT_LENGTH = 200;

const QUICK_TAGS = [
  "爽快好買家！",
  "非常準時，交易愉快！",
  "溝通良好，誠信交易！",
  "卡況極佳，完美包裝！",
] as const;

export type ReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  revieweeId: string;
  onSubmitted?: (orderId: string) => void;
};

export function ReviewModal({
  isOpen,
  onClose,
  orderId,
  revieweeId,
  onSubmitted,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = useCallback(() => {
    setRating(0);
    setHoverRating(0);
    setComment("");
    setIsLoading(false);
  }, []);

  const handleClose = useCallback(() => {
    if (isLoading) {
      return;
    }
    resetForm();
    onClose();
  }, [isLoading, onClose, resetForm]);

  const appendQuickTag = useCallback((tag: string) => {
    if (isLoading) {
      return;
    }

    setComment((current) => {
      if (!current.trim()) {
        return tag;
      }

      if (current.includes(tag)) {
        return current;
      }

      const next = `${current.trimEnd()} ${tag}`;
      return next.slice(0, MAX_COMMENT_LENGTH);
    });
  }, [isLoading]);

  const handleSubmit = useCallback(async () => {
    if (isLoading) {
      return;
    }

    if (rating < 1) {
      toast.error("請先選擇星級評分");
      return;
    }

    setIsLoading(true);

    try {
      const result = await submitTransactionReview({
        orderId,
        revieweeId,
        rating,
        comment: comment.trim() || undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      toast.success(
        result.revealed
          ? "雙方評價已公開，感謝您的回饋！"
          : "評價已提交，待對方評價後將互相公開",
      );
      onSubmitted?.(orderId);
      resetForm();
      onClose();
    } catch {
      toast.error("提交評價時發生錯誤");
      setIsLoading(false);
    }
  }, [comment, isLoading, onClose, onSubmitted, orderId, rating, resetForm, revieweeId]);

  if (!isOpen) {
    return null;
  }

  const displayRating = hoverRating || rating;

  return (
    <div
      className="fixed inset-0 z-600 flex items-center justify-center bg-[rgba(0,0,0,0.72)] backdrop-blur-sm p-4"
      onClick={isLoading ? undefined : handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div
        className="bg-[#12100d] border border-[rgba(237,232,224,0.10)] rounded-2xl p-6 max-w-md w-full shadow-[0_20px_60px_rgba(0,0,0,0.85)] animate-fadeIn"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand/80 mb-1">
              Transaction Review
            </p>
            <h2
              id="review-modal-title"
              className="font-sans font-semibold text-[18px] text-text-primary"
            >
              交易評價
            </h2>
            <p className="font-sans text-[12px] text-text-secondary mt-1 leading-relaxed">
              為本次交易對象留下誠信評分，幫助社群建立信任。
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="shrink-0 w-8 h-8 rounded-lg border border-white/10 text-text-disabled hover:text-text-primary hover:border-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="關閉"
          >
            ×
          </button>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-white/8 bg-[#17130f] px-4 py-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-text-disabled mb-3">
              星級評分
            </p>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 5 }, (_, index) => {
                const starValue = index + 1;
                const isActive = starValue <= displayRating;

                return (
                  <button
                    key={starValue}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 rounded-md transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`${starValue} 星`}
                  >
                    <Star
                      className={cn(
                        "w-7 h-7 transition-colors",
                        isActive
                          ? "fill-brand text-brand drop-shadow-[0_0_10px_rgba(212,165,116,0.45)]"
                          : "text-white/15",
                      )}
                    />
                  </button>
                );
              })}
              <span className="ml-2 font-mono text-[12px] text-brand">
                {rating > 0 ? `${rating} / 5` : "尚未評分"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-wider text-text-disabled">
                速食標籤
              </p>
              <span className="font-mono text-[10px] text-text-disabled">
                點擊自動填入留言
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  disabled={isLoading}
                  onClick={() => appendQuickTag(tag)}
                  className="font-sans text-[11px] px-3 py-1.5 rounded-full border border-brand/20 bg-brand/5 text-brand hover:bg-brand/12 hover:border-brand/35 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="review-comment"
                className="font-mono text-[10px] uppercase tracking-wider text-text-disabled"
              >
                留言（選填）
              </label>
              <span className="font-mono text-[10px] text-text-disabled">
                {comment.length}/{MAX_COMMENT_LENGTH}
              </span>
            </div>
            <textarea
              id="review-comment"
              value={comment}
              disabled={isLoading}
              maxLength={MAX_COMMENT_LENGTH}
              onChange={(event) => setComment(event.target.value)}
              placeholder="分享您的交易體驗…"
              rows={4}
              className="w-full resize-none rounded-xl border border-white/8 bg-[#17130f] px-4 py-3 font-sans text-[13px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 h-11 font-sans text-[14px] font-medium text-text-secondary border border-[rgba(237,232,224,0.12)] rounded-xl hover:bg-bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            稍後再說
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 h-11 font-sans text-[14px] font-semibold text-[#12100d] bg-brand border border-brand/40 rounded-xl hover:bg-brand/90 shadow-[0_0_20px_rgba(212,165,116,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "提交中…" : "提交評價"}
          </button>
        </div>
      </div>
    </div>
  );
}
