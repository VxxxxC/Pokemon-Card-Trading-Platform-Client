"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useSyncExternalStore,
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
import { useTradeStore } from "@/app/store/useTradeStore";

// 引入 Shadcn UI 頂級黑金 Select 組件群
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    buyerId: string; // 🟢 Added
    sellerId: string;
    sellerName: string; // 🟢 Added
  };
}

export interface ChatRoom {
  id: string;
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

// 常駐安全免責法律防護線
function AntiScamDisclaimer() {
  return (
    <div className="bg-[#1A1612] px-4 py-2 border-t border-[rgba(237,232,224,0.05)] text-left shrink-0 select-none">
      <p className="font-sans text-[10.5px] leading-normal text-[#8A8680] tracking-tight">
        <span className="text-brand font-black mr-1">🛡️ 安全聲明：</span>
        本平台所有交易行為均屬用戶雙方自願與同意之契約。凡涉及之任何形式資產損失，平台概不承擔任何法律責任、資金追償
        or 經濟賠償義務。
      </p>
    </div>
  );
}

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
  } = useTradeStore();

  const onClose = useCallback(() => setIsChatOpen(false), [setIsChatOpen]);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // 舉報類別與詳細內文說明狀態鎖
  const [reportCategory, setReportCategory] = useState<string>("");
  const [reportDetails, setReportDetails] = useState<string>("");

  // 帶有結構化載荷（Payload）的風控提交處理器
  const handleReportConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!reportCategory) {
      e.preventDefault(); // 攔截關閉行為
      toast.error("❌ 請選擇舉報事項類別");
      return;
    }

    toast.error("⚠️ 舉報信號已受理", {
      description: `【${reportCategory}】風控隊列已啟動，案件詳情已留存快照，合約風控官將於 15 分鐘內介入審查。`,
      className:
        "bg-[#26211C] border border-red-500/30 text-[#eae1da] font-sans shadow-2xl",
    });

    setIsReportOpen(false);
    setReportCategory("");
    setReportDetails("");
  };

  const [inputText, setInputText] = useState("");
  const desktopConsoleRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
        target.closest('[role="listbox"]') // 點擊 Select 下拉選單內部時，防止誤觸關閉聊天室邏輯
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

  // 完美進行 SSR 環境水合防線看守
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

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
      timestamp: "14:50",
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
        {/* 💻 1. 電腦端布局 (Desktop View) */}
        <motion.div
          ref={desktopConsoleRef}
          data-chat-console="true"
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.98 }}
          className="hidden lg:flex fixed bottom-6 right-6 z-[200] w-[640px] h-[460px] bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          {/* 左欄：商戶列表選單 */}
          <div className="w-[200px] border-r border-[rgba(237,232,224,0.06)] bg-[#1A1612] flex flex-col">
            <div className="p-3 border-b border-[rgba(237,232,224,0.06)] shrink-0">
              <span className="font-mono text-[9px] text-brand tracking-widest uppercase font-bold">
                Trading Station
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1 scrollbar-none">
              {chats.map((room) => (
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
                  className={`w-full p-2 rounded-xl text-left flex items-center gap-2 transition-all focus:outline-none ${room.id === activeRoomId ? "bg-[#26211C] border border-[rgba(237,232,224,0.08)] shadow-md" : "hover:bg-[#26211C]/40 border border-transparent"}`}
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

          {/* 右欄：對話歷史主戰區 */}
          <div className="flex-1 flex flex-col bg-[#17130f]">
            <div className="h-12 bg-[#26211C] border-b border-[rgba(237,232,224,0.08)] flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-2">
                {/* User online status */}
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                {/* User Avatar */}
                <div className="w-7 h-7 rounded-full bg-[#17130f] border border-brand/20 flex items-center justify-center text-[11px] font-bold text-brand shrink-0">
                  {activeRoom.partnerName[0]}
                </div>
                {/* User name */}
                <span className="font-sans font-bold text-[13px] text-text-primary cursor-default">
                  {activeRoom.partnerName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* 🟢 頂級修正 A（電腦端）：徹底砍掉 asChild 與內嵌 button！
                    把所有黑金樣式直接灌入 AlertDialogTrigger，完美回歸標準單一原生 HTML 按鈕結構 */}
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
              {activeRoom.messages.map((msg) => {
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
                return (
                  <div
                    key={msg.id}
                    className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div className="max-w-[75%]">
                      <div
                        className={`px-3 py-1.5 rounded-xl font-sans text-[12.5px] inline-block shadow-sm leading-snug ${isMe ? "bg-brand text-[#17130f] font-medium" : "bg-[#26211C] text-text-primary border border border-[rgba(237,232,224,0.04)]"}`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
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
                placeholder={`回覆給 ${activeRoom.partnerName}...`}
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

        {/* 📱 2. 手機端布局 (Mobile View) */}
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
              <div className="h-14 bg-[#26211C] border-b border-[rgba(237,232,224,0.08)] flex items-center justify-between px-4 shrink-0">
                <div>
                  <h3 className="font-sans font-bold text-[14px] text-text-primary">
                    即時交易通知中心
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-[#1A1612] flex items-center justify-center font-sans text-sm text-text-secondary focus:outline-none"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#17130f] scrollbar-none">
                {chats.map((room) => (
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
                    {/* User online status */}
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                    {/* User Avatar */}
                    <div className="w-7 h-7 rounded-full bg-[#17130f] border border-brand/20 flex items-center justify-center text-[11px] font-bold text-brand shrink-0">
                      {activeRoom.partnerName[0]}
                    </div>
                    {/* User name */}
                    <span className="font-sans font-bold text-[13px] text-text-primary cursor-default">
                      {activeRoom.partnerName}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* 🟢 頂級修正 B（手機端）：同步砍掉 asChild 與內嵌 button 結構，拒絕 nested 按鈕殘留 */}
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
                {activeRoom.messages.map((msg) => {
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
                  return (
                    <div
                      key={msg.id}
                      className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`px-4 py-2 rounded-2xl font-sans text-[13px] ${isMe ? "bg-brand text-[#17130f]" : "bg-[#26211C] text-text-primary"}`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
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
                  placeholder={`回覆 ${activeRoom.partnerName}...`}
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

      {/* 全新對焦黑金奢華風控制表對話框 */}
      <AlertDialogContent className="bg-[#26211C] text-[#eae1da] border border-white/10 ring-0 shadow-[0_12px_40px_rgba(239,68,68,0.15)] rounded-2xl max-w-sm p-6 animate-scaleUp">
        <AlertDialogHeader className="text-left place-items-start gap-1">
          <AlertDialogTitle className="text-[16px] font-black text-[#eae1da] flex items-center gap-2">
            🚩 提交交易違規舉報
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[11px] font-mono leading-normal text-[#8A8680] uppercase tracking-wider">
            Secure Risk Mediation Protocol
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* 下拉配置及詳情表單 */}
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
              舉報或投訴之詳細事實敘述
            </label>
            <textarea
              id="chat-report-details"
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="請具體提供案發事實（例如：對方提供虛假銀行轉帳截圖、使用冒犯性詞彙等），以利風控官快速調閱對話存證。"
              rows={3}
              className="w-full bg-[#17130f] border border-white/5 rounded-xl text-[12.5px] font-sans text-[#eae1da] placeholder:text-[#50453b] p-3 focus:outline-none focus:border-brand/40 transition-colors resize-none leading-relaxed"
            />
          </div>

          <p className="font-sans text-[11px] leading-normal text-[#8A8680]">
            ⚠️
            聲明：平台嚴格禁止惡意惡作劇或虛假舉報。一經查實虛報，將面臨賬戶風控扣分限制。
          </p>
        </div>

        {/* 垂直流式佈局原生 HTML <div> 容器 */}
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
