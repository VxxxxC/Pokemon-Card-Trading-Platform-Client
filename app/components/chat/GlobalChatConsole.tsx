"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useSyncExternalStore,
  useMemo,
} from "react";
import { motion } from "framer-motion";
import { IoChevronBack } from "react-icons/io5";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SpecialTransactionMessage } from "./SpecialTransactionMessage";
import { useHkCardVaultStore } from "@/app/store/useHkCardVaultStore";
import {
  formatMessageTime,
  getDateSeparatorLabel,
} from "@/app/lib/utils/chatUtils";
import { IoMdCheckboxOutline } from "react-icons/io";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

export interface Message {
  id: string;
  sender: "me" | "them" | "system";
  text: string;
  timestamp: string;
  type?: "text" | "special_transaction";
  specialData?: {
    cardName: string;
    cardId: string;
    offerPrice: number;
    buyerName: string;
    buyerId: string;
    sellerId: string;
    sellerName: string;
  };
}

export interface ChatRoom {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerTier: string;
  lastMessage: string;
  unreadCount: number;
  timestamp: string;
  messages: Message[];
}

function hasRenderableSpecialData(
  specialData: Message["specialData"],
): specialData is NonNullable<Message["specialData"]> {
  return Boolean(
    specialData?.cardName &&
    specialData.cardId &&
    specialData.buyerName &&
    specialData.buyerId &&
    specialData.sellerId &&
    specialData.sellerName &&
    Number.isFinite(specialData.offerPrice),
  );
}

// Day-separator HUD pill chip
function DateSeparatorChip({ label }: { label: string }) {
  return (
    <div className="flex justify-center my-3">
      <span className="mx-auto px-2.5 py-0.5 rounded-full bg-[#26211C] border border-white/5 font-mono text-[10px] text-text-disabled tracking-wider select-none uppercase inline-block text-center">
        {label}
      </span>
    </div>
  );
}

// Inline micro-timestamp adjacent to a message bubble
function MicroTimestamp({
  timestamp,
  isMe,
}: {
  timestamp: string;
  isMe: boolean;
}) {
  const label = formatMessageTime(timestamp);
  return (
    <span
      className={
        "font-mono text-[9.5px] text-text-disabled/60 self-end px-1.5 pb-0.5 select-none" +
        (isMe ? " order-first" : " order-last")
      }
    >
      {label}
    </span>
  );
}

function AntiScamDisclaimer() {
  return (
    <div className="bg-[#1A1612] px-4 py-2 border-t border-[rgba(237,232,224,0.05)] text-left shrink-0 select-none">
      <p className="font-sans text-[10.5px] leading-normal text-[#8A8680] tracking-tight">
        <span className="text-brand font-black mr-1">🛡️ 安全聲明：</span>
        本平台所有交易行為均屬用戶雙方自愿與同意之契約。凡涉及之任何形式資產損失，平台概不承擔任何法律責任、資金追償
        or 經濟賠償義務。
      </p>
    </div>
  );
}

/**
 * Builds a list of render items interleaved with date separator nodes.
 * A separator is only injected when the calendar date of a message differs
 * from the previous message in the thread.
 */
function buildMessageRenderList(messages: Message[]) {
  const items: Array<
    { type: "separator"; label: string } | { type: "message"; msg: Message }
  > = [];
  let lastDateKey = "";

  for (const msg of messages) {
    try {
      const d = new Date(msg.timestamp);
      if (!isNaN(d.getTime())) {
        const dateKey =
          d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
        if (dateKey !== lastDateKey) {
          lastDateKey = dateKey;
          items.push({
            type: "separator",
            label: getDateSeparatorLabel(msg.timestamp),
          });
        }
      }
    } catch {
      // malformed timestamp: skip separator
    }
    items.push({ type: "message", msg });
  }
  return items;
}

type RenderItem = ReturnType<typeof buildMessageRenderList>[number];

// Desktop message thread — compact bubbles (12.5px, 75% max-width)
function MessageThread({ renderList }: { renderList: RenderItem[] }) {
  return (
    <>
      {renderList.map((item, idx) => {
        if (item.type === "separator") {
          return <DateSeparatorChip key={"sep-" + idx} label={item.label} />;
        }

        const msg = item.msg;

        if (
          msg.type === "special_transaction" &&
          hasRenderableSpecialData(msg.specialData)
        ) {
          return (
            <div
              key={msg.id}
              className="w-full flex justify-start max-w-[90%] animate-fadeIn"
            >
              <SpecialTransactionMessage
                msgId={msg.id}
                buyerName={msg.specialData.buyerName}
                buyerId={msg.specialData.buyerId}
                sellerId={msg.specialData.sellerId}
                sellerName={msg.specialData.sellerName}
                cardName={msg.specialData.cardName}
                cardId={msg.specialData.cardId}
                offerPrice={msg.specialData.offerPrice}
                initialStatus="pending"
                isMe={msg.sender === "me"}
              />
            </div>
          );
        }

        const isMe = msg.sender === "me";

        if (msg.sender === "system") {
          return (
            <div key={msg.id} className="flex justify-center my-1">
              <span className="font-mono text-[10px] text-text-disabled/70 bg-[#26211C]/60 px-3 py-1 rounded-full border border-white/[0.04] select-none text-center">
                {msg.text}
              </span>
            </div>
          );
        }

        return (
          <div
            key={msg.id}
            className={
              "flex w-full items-end gap-1 " +
              (isMe ? "justify-end" : "justify-start")
            }
          >
            {isMe && <MicroTimestamp timestamp={msg.timestamp} isMe={true} />}
            <div className="max-w-[75%]">
              <div
                className={
                  "px-3 py-1.5 rounded-xl font-sans text-[12.5px] inline-block shadow-sm leading-snug " +
                  (isMe
                    ? "bg-brand text-[#17130f] font-medium"
                    : "bg-[#26211C] text-text-primary border border-[rgba(237,232,224,0.04)]")
                }
              >
                {msg.text}
              </div>
            </div>
            {!isMe && <MicroTimestamp timestamp={msg.timestamp} isMe={false} />}
          </div>
        );
      })}
    </>
  );
}

// Mobile message thread — larger bubbles (13px, rounded-2xl)
function MobileMessageThread({ renderList }: { renderList: RenderItem[] }) {
  return (
    <>
      {renderList.map((item, idx) => {
        if (item.type === "separator") {
          return <DateSeparatorChip key={"sep-m-" + idx} label={item.label} />;
        }

        const msg = item.msg;

        if (
          msg.type === "special_transaction" &&
          hasRenderableSpecialData(msg.specialData)
        ) {
          return (
            <div
              key={msg.id}
              className="w-full flex justify-start max-w-[95%] animate-fadeIn"
            >
              <SpecialTransactionMessage
                msgId={msg.id}
                buyerName={msg.specialData.buyerName}
                buyerId={msg.specialData.buyerId}
                sellerId={msg.specialData.sellerId}
                sellerName={msg.specialData.sellerName}
                cardName={msg.specialData.cardName}
                cardId={msg.specialData.cardId}
                offerPrice={msg.specialData.offerPrice}
                initialStatus="pending"
                isMe={msg.sender === "me"}
              />
            </div>
          );
        }

        const isMe = msg.sender === "me";

        if (msg.sender === "system") {
          return (
            <div key={msg.id} className="flex justify-center my-1">
              <span className="font-mono text-[10px] text-text-disabled/70 bg-[#26211C]/60 px-3 py-1 rounded-full border border-white/[0.04] select-none text-center">
                {msg.text}
              </span>
            </div>
          );
        }

        return (
          <div
            key={msg.id}
            className={
              "flex w-full items-end gap-1 " +
              (isMe ? "justify-end" : "justify-start")
            }
          >
            {isMe && <MicroTimestamp timestamp={msg.timestamp} isMe={true} />}
            <div
              className={
                "px-4 py-2 rounded-2xl font-sans text-[13px] " +
                (isMe
                  ? "bg-brand text-[#17130f]"
                  : "bg-[#26211C] text-text-primary")
              }
            >
              {msg.text}
            </div>
            {!isMe && <MicroTimestamp timestamp={msg.timestamp} isMe={false} />}
          </div>
        );
      })}
    </>
  );
}

const KNOWN_PARTNERS = [
  "旺角卡店 · 專業認證商戶",
  "渡邉道館",
  "九龍灣卡王",
  "秋葉原海外直送店",
  "旺角天線卡王",
  "深水埗精品角落",
  "信和執雞大師",
  "Satoshi_K",
  "Yugi_Collector",
  "Pika_Rich",
  "Tomy_Trading",
  "PSA_10_Hunter",
  "Marnie_Simp",
];

export function GlobalChatConsole() {
  const {
    isChatOpen,
    setIsChatOpen,
    chats,
    setChats,
    activeRoomId,
    setActiveRoomId,
    mobileView,
    setMobileView,
    activateRoomById,
  } = useHkCardVaultStore();

  const onClose = useCallback(() => setIsChatOpen(false), [setIsChatOpen]);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState<string>("");
  const [reportDetails, setReportDetails] = useState<string>("");

  const handleReportConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!reportCategory) {
      e.preventDefault();
      toast.error("❌ 請選擇舉報事項類別");
      return;
    }

    toast.error("⚠️ 舉報信號已受理", {
      description:
        "【" +
        reportCategory +
        "】風控隊列已啟動，案件詳情已留存快照，合約風控官將於 15 分鐘內介入審查。",
      className:
        "bg-[#26211C] border border-red-500/30 text-[#eae1da] font-sans shadow-2xl",
    });

    setIsReportOpen(false);
    setReportCategory("");
    setReportDetails("");
  };

  const [inputText, setInputText] = useState("");
  const [lobbySearchQuery, setLobbySearchQuery] = useState("");
  const [isNewChatComboOpen, setIsNewChatComboOpen] = useState(false);
  const [targetUsername, setTargetUsername] = useState("");
  const desktopConsoleRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSpawnChat = useCallback(() => {
    if (!targetUsername.trim()) return;

    const trimmedUsername = targetUsername.trim();
    const existingRoom = chats.find(
      (r) => r.partnerName.toLowerCase() === trimmedUsername.toLowerCase(),
    );

    if (existingRoom) {
      setActiveRoomId(existingRoom.id);
      setIsNewChatComboOpen(false);
      setTargetUsername("");
      setMobileView("CHAT");
      toast.success(`已切換至與 ${existingRoom.partnerName} 的對話`);
    } else {
      const newRoomId = "room_" + Math.random().toString(36).substring(2, 9);
      activateRoomById(newRoomId, trimmedUsername);
      setIsNewChatComboOpen(false);
      setTargetUsername("");
      setMobileView("CHAT");
      toast.success(`成功與 ${trimmedUsername} 建立新對話通道`);
    }
  }, [targetUsername, chats, setActiveRoomId, activateRoomById, setMobileView]);

  const reportButtonClass =
    "flex items-center gap-1 rounded-md border border-red-500/20 bg-red-500/5 px-2 py-1 text-[12px] font-medium text-red-400/90 transition-colors font-sans lg:border-transparent lg:bg-transparent lg:px-2 lg:py-1 lg:text-[11px] lg:font-medium lg:text-text-disabled/70 lg:hover:text-red-500 lg:hover:bg-red-500/10 cursor-pointer select-none";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as HTMLElement;
      if (!target || !document.body.contains(target)) return;
      if (target.closest('[data-chat-console="true"]')) return;

      if (
        target.closest('[role="alertdialog"]') ||
        target.closest("[data-radix-portal]") ||
        target.closest('[role="listbox"]')
      ) {
        return;
      }

      if (
        window.innerWidth >= 1024 &&
        desktopConsoleRef.current &&
        !desktopConsoleRef.current.contains(target)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isChatOpen, onClose]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chats, activeRoomId, isChatOpen]);

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const filteredLobbyRooms = useMemo(() => {
    return chats.filter((room) =>
      room.partnerName.toLowerCase().includes(lobbySearchQuery.toLowerCase()),
    );
  }, [chats, lobbySearchQuery]);

  if (!isMounted) return null;
  if (!isChatOpen) return null;
  const activeRoom = chats.find((r) => r.id === activeRoomId) || chats[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: "me",
      text: inputText,
      timestamp: new Date().toISOString(),
      type: "text",
    };
    setChats((prev) =>
      prev.map((room) =>
        room.id === activeRoomId
          ? {
              ...room,
              lastMessage: inputText,
              messages: [...room.messages, newMsg],
            }
          : room,
      ),
    );
    setInputText("");
  };

  // Build interleaved message + separator render list for the active room
  const renderList = buildMessageRenderList(activeRoom.messages);

  return (
    <AlertDialog
      open={isReportOpen}
      onOpenChange={(open) => {
        setIsReportOpen(open);
        if (!open) {
          setReportCategory("");
          setReportDetails("");
        }
      }}
    >
      <>
        {/* 1. Desktop View */}
        <motion.div
          ref={desktopConsoleRef}
          data-chat-console="true"
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.98 }}
          className="hidden lg:flex fixed bottom-6 right-6 z-[200] w-[640px] h-[460px] bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          {/* Left column: room list */}
          <div className="w-[200px] border-r border-[rgba(237,232,224,0.06)] bg-[#1A1612] flex flex-col">
            <div className="p-3 border-b border-[rgba(237,232,224,0.06)] shrink-0 flex items-center justify-between gap-1.5 h-12">
              <div className="flex-1 flex items-center gap-1 overflow-hidden">
                {!isNewChatComboOpen ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsNewChatComboOpen((prev) => !prev)}
                      className="flex flex-row gap-1 p-1 hover:bg-[#26211C] rounded transition-colors text-brand flex items-center justify-center shrink-0 focus:outline-none"
                      title="新建對話"
                    >
                      <svg
                        className="w-4 h-4 text-brand"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span className="font-mono text-sm text-brand">
                        新增聊天
                      </span>
                    </button>
                  </>
                ) : (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex items-center gap-1 flex-1 min-w-0"
                  >
                    <input
                      type="text"
                      list="desktop-partners-list"
                      value={targetUsername}
                      onChange={(e) => setTargetUsername(e.target.value)}
                      placeholder="搜尋/輸入用戶..."
                      className="w-full bg-[#17130f] border border-white/10 rounded px-1.5 py-0.5 font-sans text-[10.5px] text-text-primary placeholder:text-[#50453b] focus:outline-none focus:border-brand/40"
                    />
                    <datalist id="desktop-partners-list">
                      {KNOWN_PARTNERS.map((p) => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                  </motion.div>
                )}
              </div>

              {isNewChatComboOpen && (
                <button
                  type="button"
                  onClick={handleSpawnChat}
                  disabled={!targetUsername.trim()}
                  className={`p-1 flex items-center justify-center shrink-0 transition-all focus:outline-none ${
                    !targetUsername.trim()
                      ? "opacity-30 grayscale cursor-not-allowed text-text-disabled"
                      : "text-brand opacity-100 hover:text-brand-hover active:scale-95 cursor-pointer"
                  }`}
                  title="確認新建對話"
                >
                  <IoMdCheckboxOutline className="w-4.5 h-4.5" />
                </button>
              )}
            </div>

            {/* 🎯 Target Injected Real-Time Lobby Filtering Search Bar Chassis */}
            <div className="px-3 py-2 border-b border-white/[0.04] bg-[#1A1612] shrink-0">
              <div className="flex items-center h-8 bg-[#17130f] border border-white/5 rounded-lg px-2.5 focus-within:border-brand/40 transition-colors">
                <span className="text-[11px] opacity-40 mr-1.5 select-none">
                  🔍
                </span>
                <input
                  type="text"
                  value={lobbySearchQuery}
                  onChange={(e) => setLobbySearchQuery(e.target.value)}
                  placeholder="搜尋已存在對話用戶..."
                  className="w-full bg-transparent font-sans text-[11.5px] text-text-primary placeholder:text-[#50453b] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-1.5 space-y-1 scrollbar-none">
              {filteredLobbyRooms.map((room: ChatRoom) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => {
                    setActiveRoomId(room.id);
                    setChats((prev) =>
                      prev.map((c) =>
                        c.id === room.id ? { ...c, unreadCount: 0 } : c,
                      ),
                    );
                  }}
                  className={
                    "w-full p-2 rounded-xl text-left flex items-center gap-2 transition-all focus:outline-none " +
                    (room.id === activeRoomId
                      ? "bg-[#26211C] border border-[rgba(237,232,224,0.08)] shadow-md"
                      : "hover:bg-[#26211C]/40 border border-transparent")
                  }
                >
                  <div className="w-7 h-7 rounded-full bg-[#17130f] border border-brand/20 flex items-center justify-center text-[11px] font-bold text-brand shrink-0">
                    {room.partnerName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-sans font-medium text-[12px] text-text-primary truncate">
                      {room.partnerName}
                    </div>
                    <div className="font-mono text-[9px] text-text-disabled truncate">
                      {room.id.slice(0, 8)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right column: message thread */}
          <div className="flex-1 flex flex-col bg-[#17130f]">
            <div className="h-12 bg-[#26211C] border-b border-[rgba(237,232,224,0.08)] flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                <Link
                  href={"/profile/" + activeRoom.partnerId}
                  onClick={onClose}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="w-7 h-7 rounded-full bg-[#17130f] border border-brand/20 flex items-center justify-center text-[11px] font-bold text-brand shrink-0">
                    {activeRoom.partnerName[0]}
                  </div>
                  <span className="font-sans font-bold text-[13px] text-text-primary">
                    {activeRoom.partnerName}
                  </span>
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <AlertDialogTrigger className={reportButtonClass}>
                  舉報
                </AlertDialogTrigger>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-6 h-6 rounded-md bg-[#1A1612] hover:bg-[#39342f] text-text-secondary hover:text-[#eae1da] flex items-center justify-center font-sans text-[11px] focus:outline-none"
                >
                  ✕
                </button>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#17130f] scrollbar-none flex flex-col"
            >
              <MessageThread renderList={renderList} />
            </div>

            <AntiScamDisclaimer />

            <form
              onSubmit={handleSendMessage}
              className="p-2.5 bg-[#26211C] border-t border-[rgba(237,232,224,0.08)] shrink-0 flex gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={"回覆給 " + activeRoom.partnerName + "..."}
                className="flex-1 h-9 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-lg px-3 text-[12px] text-text-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="h-9 px-4 bg-brand text-[#17130f] font-sans font-bold text-[12px] rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none"
              >
                發送 ⚡
              </button>
            </form>
          </div>
        </motion.div>

        {/* 2. Mobile View */}
        <motion.div
          data-chat-console="true"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="lg:hidden fixed inset-0 z-[150] bg-[#17130f] flex flex-col"
        >
          {mobileView === "LIST" ? (
            <div className="flex flex-col h-full">
              <div className="h-14 bg-[#26211C] border-b border-[rgba(237,232,224,0.08)] flex items-center justify-between px-4 shrink-0 gap-2">
                {/*
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div className="flex-1 flex items-center gap-1.5 overflow-hidden">
                    {!isNewChatComboOpen ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsNewChatComboOpen((prev) => !prev)}
                          className="gap-1 p-1.5 hover:bg-[#1A1612] rounded-full transition-colors text-brand flex items-center justify-center shrink-0 focus:outline-none"
                          title="新建對話"
                        >
                          <svg
                            className="w-5 h-5 text-brand"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>

                          <h3 className="font-mono text-sm text-brand">
                            新增聊天
                          </h3>
                        </button>
                      </>
                    ) : (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "auto", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        className="flex items-center gap-1.5 flex-1 min-w-0"
                      >
                        <input
                          type="text"
                          list="mobile-partners-list"
                          value={targetUsername}
                          onChange={(e) => setTargetUsername(e.target.value)}
                          placeholder="搜尋/輸入用戶..."
                          className="w-full bg-[#17130f] border border-white/10 rounded-lg px-2.5 py-1 font-sans text-[12px] text-text-primary placeholder:text-[#50453b] focus:outline-none focus:border-brand/40"
                        />
                        <datalist id="mobile-partners-list">
                          {KNOWN_PARTNERS.map((p) => (
                            <option key={p} value={p} />
                          ))}
                        </datalist>
                      </motion.div>
                    )}
                  </div>

                  {isNewChatComboOpen && (
                    <button
                      type="button"
                      onClick={handleSpawnChat}
                      disabled={!targetUsername.trim()}
                      className={`p-1.5 flex items-center justify-center shrink-0 transition-all focus:outline-none ${
                        !targetUsername.trim()
                          ? "opacity-30 grayscale cursor-not-allowed text-text-disabled"
                          : "text-brand opacity-100 hover:text-brand-hover active:scale-95 cursor-pointer"
                      }`}
                      title="確認新建對話"
                    >
                      <IoMdCheckboxOutline className="w-5.5 h-5.5" />
                    </button>
                  )}
                </div>
                  */}
                <p className="font-mono font-bold text-sm text-brand">聊天室</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-[#1A1612] flex items-center justify-center font-sans text-sm text-text-secondary focus:outline-none shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* 🎯 Target Injected Real-Time Lobby Filtering Search Bar Chassis */}
              <div className="px-3 py-2 border-b border-white/[0.04] bg-[#1A1612] shrink-0">
                <div className="flex items-center h-9 bg-[#17130f] border border-white/5 rounded-lg px-2.5 focus-within:border-brand/40 transition-colors">
                  <span className="text-[12px] opacity-40 mr-1.5 select-none">
                    🔍
                  </span>
                  <input
                    type="text"
                    value={lobbySearchQuery}
                    onChange={(e) => setLobbySearchQuery(e.target.value)}
                    placeholder="搜尋已存在對話用戶..."
                    className="w-full bg-transparent font-sans text-[12px] text-text-primary placeholder:text-[#50453b] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#17130f] scrollbar-none">
                {filteredLobbyRooms.map((room: ChatRoom) => (
                  <button
                    key={room.id}
                    onClick={() => {
                      setActiveRoomId(room.id);
                      setMobileView("CHAT");
                    }}
                    className="w-full text-left p-3.5 rounded-2xl bg-[#26211C] border border-[rgba(237,232,224,0.04)] flex items-start gap-3.5 relative focus:outline-none"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#17130f] border border-brand/20 flex items-center justify-center font-bold text-brand text-[13px] shrink-0">
                      {room.partnerName[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-sans font-semibold text-[13px] text-text-primary">
                        {room.partnerName}
                      </span>
                      <p className="font-sans text-[12px] text-text-secondary truncate mt-1">
                        {room.lastMessage}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="h-14 bg-[#26211C] border-b border-[rgba(237,232,224,0.08)] flex items-center justify-between px-3 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileView("LIST")}
                    className="h-8 px-2.5 rounded-lg bg-[#1A1612] font-sans text-[12px] font-medium text-brand focus:outline-none"
                  >
                    <IoChevronBack />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                    <Link
                      href={"/profile/" + activeRoom.partnerId}
                      onClick={onClose}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#17130f] border border-brand/20 flex items-center justify-center text-[11px] font-bold text-brand shrink-0">
                        {activeRoom.partnerName[0]}
                      </div>
                      <span className="font-sans font-bold text-[13px] text-text-primary">
                        {activeRoom.partnerName}
                      </span>
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertDialogTrigger className={reportButtonClass}>
                    舉報
                  </AlertDialogTrigger>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-[#1A1612] flex items-center justify-center font-sans text-sm text-text-secondary focus:outline-none"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#17130f] scrollbar-none flex flex-col"
              >
                <MobileMessageThread renderList={renderList} />
              </div>

              <AntiScamDisclaimer />

              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-[#26211C] border-t border-[rgba(237,232,224,0.08)] shrink-0 flex gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={"回覆 " + activeRoom.partnerName + "..."}
                  className="flex-1 h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl px-4 text-[13px] text-text-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="h-11 px-5 bg-brand text-[#17130f] font-sans font-bold text-[13px] rounded-xl cursor-pointer focus:outline-none"
                >
                  發送
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </>

      {/* Report dialog */}
      <AlertDialogContent className="bg-[#26211C] text-[#eae1da] border border-white/10 ring-0 shadow-[0_12px_40px_rgba(239,68,68,0.15)] rounded-2xl max-w-sm p-6 animate-scaleUp">
        <AlertDialogHeader className="text-left place-items-start gap-1">
          <AlertDialogTitle className="text-[16px] font-black text-[#eae1da] flex items-center gap-2">
            🚩 提交交易違規舉報
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[11px] font-mono leading-normal text-[#8A8680] uppercase tracking-wider">
            Secure Risk Mediation Protocol
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-3 font-sans text-[13px] w-full">
          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] text-[#d4c4b7] uppercase tracking-wide">
              選擇舉報事項類別
            </label>
            <Select
              value={reportCategory}
              onValueChange={(value) => setReportCategory(value ?? "")}
            >
              <SelectTrigger className="w-full h-10 bg-[#17130f] border border-white/5 rounded-xl text-[#eae1da] font-sans text-[12px] hover:bg-[#2c2722] transition-colors focus:ring-0 focus:border-brand/40">
                <SelectValue placeholder="點擊展開合約違規類別" />
              </SelectTrigger>
              <SelectContent className="bg-[#26211C] border border-white/10 rounded-xl text-[#eae1da] font-sans text-[12.5px] shadow-2xl">
                <SelectItem
                  value="惡意欺詐 / 虛假交易"
                  className="focus:bg-[#322a24] focus:text-brand cursor-pointer transition-colors"
                >
                  🛑 惡意欺詐 / 虛假交易 (FRAUD)
                </SelectItem>
                <SelectItem
                  value="言語辱罵 / 不當言論"
                  className="focus:bg-[#322a24] focus:text-brand cursor-pointer transition-colors"
                >
                  💬 言語辱罵 / 不當言論 (HARASS)
                </SelectItem>
                <SelectItem
                  value="誘導私下交易"
                  className="focus:bg-[#322a24] focus:text-brand cursor-pointer transition-colors"
                >
                  🔒 誘導私下交易 / 逃避中介 (OFFLINE)
                </SelectItem>
                <SelectItem
                  value="其他違規行為"
                  className="focus:bg-[#322a24] focus:text-brand cursor-pointer transition-colors"
                >
                  ⚙️ 其他違規行為 (OTHER)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="chat-report-details"
              className="block font-mono text-[11px] text-[#d4c4b7] uppercase tracking-wide"
            >
              舉報或投訴之詳細事實敍述
            </label>
            <textarea
              id="chat-report-details"
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="請具體提供案發事實（例如：對方提供虛假銀行轉帳截圖、使用冀辱性詞彙等），以利風控官快速調閱對話存證。"
              rows={3}
              className="w-full bg-[#17130f] border border-white/5 rounded-xl text-[12.5px] font-sans text-[#eae1da] placeholder:text-[#50453b] p-3 focus:outline-none focus:border-brand/40 transition-colors resize-none leading-relaxed"
            />
          </div>

          <p className="font-sans text-[11px] leading-normal text-[#8A8680]">
            ⚠️
            聲明：平台嚴格禁止惡意惡作劇或虛假舉報。一經查實虛報，將面臨账戶風控扣分限制。
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-1 w-full">
          <AlertDialogAction
            type="button"
            onClick={handleReportConfirm}
            className="w-full h-11 bg-[#ef4444] hover:bg-[#dc2626] text-white font-sans font-black text-[13px] rounded-xl cursor-pointer shadow-[0_4px_20px_rgba(239,68,68,0.18)] active:scale-[0.97] transition-all focus:outline-none"
          >
            🚀 確認提交安全審查
          </AlertDialogAction>
          <AlertDialogCancel
            onClick={() => {
              setReportCategory("");
              setReportDetails("");
            }}
            className="w-full h-10 bg-[#120F0C] hover:bg-[#1A1612] border border-white/[0.03] text-[#736c65] hover:text-[#eae1da] font-sans font-bold text-[12px] rounded-xl cursor-pointer transition-colors focus:outline-none"
          >
            取消返回
          </AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
