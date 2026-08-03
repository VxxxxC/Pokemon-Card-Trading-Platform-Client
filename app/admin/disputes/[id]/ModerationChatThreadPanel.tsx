"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminModerationChatThread } from "@/app/actions/admin-moderation";
import { formatModerationDateTime } from "@/lib/moderation/admin-case-presenters";
import { highlightSensitiveKeywords } from "@/lib/moderation/highlight-chat-keywords";
import type { AdminModerationChatMessage } from "@/lib/moderation/types";
import { Button } from "@/components/ui/button";

interface ModerationChatThreadPanelProps {
  caseId: string;
  roomId: string;
  subjectUserId: string;
}

export default function ModerationChatThreadPanel({
  caseId,
  roomId,
  subjectUserId,
}: ModerationChatThreadPanelProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<AdminModerationChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadThread = useCallback(
    async (before?: string, append = false) => {
      if (append) {
        setLoadingOlder(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const result = await getAdminModerationChatThread({
        caseId,
        roomId,
        before,
      });

      if (append) {
        setLoadingOlder(false);
      } else {
        setLoading(false);
      }

      if (!result.success) {
        setError(result.error);
        return;
      }

      setMessages((current) =>
        append ? [...result.data.messages, ...current] : result.data.messages,
      );
      setHasMore(result.data.hasMore);
      setNextBefore(result.data.nextBefore);

      if (!append) {
        router.refresh();
      }
    },
    [caseId, roomId, router],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);

      const result = await getAdminModerationChatThread({
        caseId,
        roomId,
      });

      if (cancelled) {
        return;
      }

      setLoading(false);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setMessages(result.data.messages);
      setHasMore(result.data.hasMore);
      setNextBefore(result.data.nextBefore);
      router.refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [caseId, roomId, router]);

  if (loading) {
    return (
      <p className="font-sans text-[13px] text-[#8A8680]">載入聊天紀錄中…</p>
    );
  }

  if (error) {
    return (
      <p className="font-sans text-[13px] text-[#ef4444]">{error}</p>
    );
  }

  if (messages.length === 0) {
    return (
      <p className="font-sans text-[13px] text-[#8A8680]">
        此聊天室尚無訊息紀錄。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {hasMore ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loadingOlder || !nextBefore}
          onClick={() => {
            if (nextBefore) {
              void loadThread(nextBefore, true);
            }
          }}
          className="h-8 border-white/10 bg-[#17130f] text-[#d4c4b7] hover:bg-[#2e2925]"
        >
          {loadingOlder ? "載入中…" : "載入更早訊息"}
        </Button>
      ) : null}

      <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {messages.map((message) => {
          const isSubject = message.senderId === subjectUserId;
          const isSystem = message.isSystemWarning;

          return (
            <div
              key={message.id}
              className={`rounded-xl border px-3 py-2 ${
                isSystem
                  ? "border-[#d4a574]/20 bg-[#d4a574]/10"
                  : isSubject
                    ? "border-white/[0.06] bg-[#17130f]"
                    : "border-white/[0.04] bg-[#1f1b17]"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-sans text-[12px] font-medium text-[#eae1da]">
                  {message.senderDisplayName ?? "未知用戶"}
                </span>
                <span className="font-sans text-[11px] text-[#8A8680]">
                  {formatModerationDateTime(message.createdAt)}
                </span>
                {isSystem ? (
                  <span className="font-sans text-[10px] text-[#d4a574]">
                    系統
                  </span>
                ) : null}
              </div>
              <p className="mt-1 font-sans text-[13px] leading-relaxed text-[#d4c4b7]">
                {highlightSensitiveKeywords(message.content)}
              </p>
              {message.offerId || message.memberOrderId || message.merchantOrderId ? (
                <p className="mt-1 font-mono text-[10px] text-[#8A8680]">
                  {message.offerId ? `offer: ${message.offerId}` : null}
                  {message.memberOrderId
                    ? `order: ${message.memberOrderId}`
                    : null}
                  {message.merchantOrderId
                    ? `merchant_order: ${message.merchantOrderId}`
                    : null}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
