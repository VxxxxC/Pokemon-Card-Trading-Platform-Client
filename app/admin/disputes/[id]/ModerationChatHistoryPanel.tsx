"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ModerationChatThreadPanel from "./ModerationChatThreadPanel";
import {
  SELECT_CONTENT_CLASS,
  SELECT_ITEM_CLASS,
  SELECT_TRIGGER_CLASS,
} from "./moderation-detail-ui";

type ModerationChatHistoryPanelProps = {
  caseId: string;
  subjectUserId: string;
  chatRoomIds: string[];
};

export default function ModerationChatHistoryPanel({
  caseId,
  subjectUserId,
  chatRoomIds,
}: ModerationChatHistoryPanelProps) {
  const [open, setOpen] = useState(false);
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(
    chatRoomIds[0] ?? null,
  );

  const hasRooms = chatRoomIds.length > 0;
  const roomSummary = hasRooms
    ? chatRoomIds.length === 1
      ? chatRoomIds[0].slice(0, 8)
      : `${chatRoomIds.length} 個聊天室`
    : null;

  return (
    <section className="space-y-3 border-b border-white/[0.08] pb-5 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-sans text-[15px] font-bold text-text-primary">
          唯讀聊天室歷史
        </h2>
        {hasRooms ? (
          <div className="flex items-center gap-3">
            {roomSummary ? (
              <span className="font-mono text-[12px] text-text-disabled">
                {roomSummary}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="font-sans text-[12px] text-brand hover:text-text-primary"
            >
              {open ? "收合" : "展開"}
            </button>
          </div>
        ) : null}
      </div>

      {!hasRooms ? (
        <p className="font-sans text-[13px] leading-relaxed text-text-secondary">
          此案件尚未綁定可調閱的聊天室紀錄。
        </p>
      ) : open ? (
        <div className="space-y-3">
          {chatRoomIds.length > 1 ? (
            <Select
              value={selectedChatRoomId ?? ""}
              onValueChange={(value) => setSelectedChatRoomId(value || null)}
            >
              <SelectTrigger className={SELECT_TRIGGER_CLASS}>
                <SelectValue placeholder="選擇聊天室" />
              </SelectTrigger>
              <SelectContent className={SELECT_CONTENT_CLASS}>
                {chatRoomIds.map((roomId) => (
                  <SelectItem
                    key={roomId}
                    value={roomId}
                    className={SELECT_ITEM_CLASS}
                  >
                    聊天室 {roomId.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {selectedChatRoomId ? (
            <ModerationChatThreadPanel
              caseId={caseId}
              roomId={selectedChatRoomId}
              subjectUserId={subjectUserId}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
