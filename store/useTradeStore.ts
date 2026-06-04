import { create } from "zustand";
import {
  type Message,
  type ChatRoom,
} from "@/app/components/chat/GlobalChatConsole";

interface TradeStore {
  // UI 狀態
  isChatOpen: boolean;
  activeRoomId: string;
  mobileView: "LIST" | "CHAT";
  chats: ChatRoom[];

  // 基礎變更器 Actions
  setIsChatOpen: (open: boolean) => void;
  setActiveRoomId: (id: string) => void;
  setMobileView: (view: "LIST" | "CHAT") => void;
  setChats: (updater: ChatRoom[] | ((prev: ChatRoom[]) => ChatRoom[])) => void;

  // 🟢 頻道 1：大盤/普通商戶喚醒對話流 (相容舊有 open-global-chat 機制)
  openGlobalChat: (roomId: string, partnerName: string) => void;

  // 🟢 頻道 2：C2C 特殊交易要約極速注入 (相容新版 ExecutionSlideOver 議價機制)
  injectSpecialTransaction: (payload: {
    sellerName: string;
    cardName: string;
    cardId: string;
    offerPrice: number;
    buyerName: string;
  }) => void;
}

export const useTradeStore = create<TradeStore>((set) => ({
  // 1. 合流初始化數據 (完整保留你原有的 渡邊道館 與 大阪收藏家 歷史紀錄)
  isChatOpen: false,
  activeRoomId: "PKT-8839-44A",
  mobileView: "LIST",
  chats: [
    {
      id: "PKT-8839-44A",
      partnerName: "渡邊道館",
      partnerTier: "道館主",
      lastMessage: "✨ 平台鑑定師已確認卡角完好，稍後會上傳官方報告。",
      unreadCount: 2,
      timestamp: "14:32",
      messages: [
        {
          id: "1",
          sender: "me",
          text: "你好，請問呢張噴火龍幾時可以送到平台鑑定？",
          timestamp: "10:15",
        },
        {
          id: "2",
          sender: "system",
          text: "✈ 交易提醒：賣家已發貨，實物已抵達中介中心。",
          timestamp: "11:30",
        },
        {
          id: "3",
          sender: "them",
          text: "師兄放心，卡牌已經交咗畀平台。剛才收到通知，鑑定進行中。",
          timestamp: "14:30",
        },
      ],
    },
    {
      id: "ROOM-MOCK-002",
      partnerName: "大阪收藏家",
      partnerTier: "收藏家",
      lastMessage: "唔好意思啊師兄，不如我哋私下用 PayMe 轉賬？",
      unreadCount: 0,
      timestamp: "昨日",
      messages: [
        {
          id: "1",
          sender: "them",
          text: "唔好意思啊師兄，不如我哋私下用 PayMe 轉賬？",
          timestamp: "昨日",
        },
      ],
    },
  ],

  setIsChatOpen: (open) => set({ isChatOpen: open }),
  setActiveRoomId: (id) => set({ activeRoomId: id }),
  setMobileView: (view) => set({ mobileView: view }),
  setChats: (updater) =>
    set((state) => ({
      chats: typeof updater === "function" ? updater(state.chats) : updater,
    })),

  // 🟢 處理商戶一般通訊流 (自動防重疊)
  openGlobalChat: (roomId, partnerName) =>
    set((state) => {
      const exists = state.chats.some((c) => c.id === roomId);
      let updatedChats = [...state.chats];

      if (exists) {
        updatedChats = state.chats.map((c) =>
          c.id === roomId ? { ...c, unreadCount: 0 } : c,
        );
      } else {
        const newSession: ChatRoom = {
          id: roomId,
          partnerName,
          partnerTier: "認證賣家",
          lastMessage: "已開啟即時議價對話",
          unreadCount: 0,
          timestamp: "剛剛",
          messages: [
            {
              id: "sys-" + Date.now(),
              sender: "system",
              text: `🔒 平台已成功為您建立與 ${partnerName} 的安全中介託管議價通道。`,
              timestamp: "剛剛",
            },
          ],
        };
        updatedChats = [newSession, ...state.chats];
      }

      return {
        chats: updatedChats,
        activeRoomId: roomId,
        isChatOpen: true,
        mobileView: "CHAT", // 手機端直接擊穿進入聊天視窗
      };
    }),

  // 🟢 處理 C2C 特殊議價組件就地空降
  injectSpecialTransaction: (payload) =>
    set((state) => {
      const mockRoomId = "PKT-8839-44A"; // 自動與目前活躍的交易對象合流

      const specialMsg: Message = {
        id: `MSG-TXN-${Date.now()}`,
        sender: "me",
        text: `${payload.buyerName} offer price HK$ ${payload.offerPrice} - ${payload.cardName} (${payload.cardId})`,
        timestamp: "剛剛",
        type: "special_transaction",
        specialData: {
          cardName: payload.cardName,
          cardId: payload.cardId,
          offerPrice: payload.offerPrice,
          buyerName: payload.buyerName,
        },
      };

      const updatedChats = state.chats.map((room) => {
        if (room.id === mockRoomId || room.partnerName === payload.sellerName) {
          return {
            ...room,
            lastMessage: specialMsg.text,
            messages: [...room.messages, specialMsg],
          };
        }
        return room;
      });

      return {
        chats: updatedChats,
        activeRoomId: mockRoomId,
        isChatOpen: true,
        mobileView: "CHAT",
      };
    }),
}));
