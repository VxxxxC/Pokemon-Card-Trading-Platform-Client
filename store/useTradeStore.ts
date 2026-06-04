import { create } from "zustand";

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
    sellerId: string; // 🟢 全新加碼：綁定賣家/店鋪唯一識別碼
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

interface TradeStore {
  isChatOpen: boolean;
  activeRoomId: string;
  mobileView: "LIST" | "CHAT";
  chats: ChatRoom[];

  setIsChatOpen: (open: boolean) => void;
  setActiveRoomId: (id: string) => void;
  setMobileView: (view: "LIST" | "CHAT") => void;
  setChats: (updater: ChatRoom[] | ((prev: ChatRoom[]) => ChatRoom[])) => void;
  openGlobalChat: (roomId: string, partnerName: string) => void;
  injectSpecialTransaction: (payload: {
    sellerName: string;
    sellerId: string; // 🟢 傳入賣家 ID
    cardName: string;
    cardId: string;
    offerPrice: number;
    buyerName: string;
  }) => void;
}

export const useTradeStore = create<TradeStore>((set) => ({
  isChatOpen: false,
  activeRoomId: "RM-MOCK-SELLER-001",
  mobileView: "LIST",
  chats: [
    {
      id: "RM-MOCK-SELLER-001",
      partnerName: "旺角卡店 · 專業認證商戶",
      partnerTier: "專業認證商戶",
      lastMessage: "你好！請問對哪張現貨有興趣？",
      unreadCount: 0,
      timestamp: "10:30",
      messages: [
        {
          id: "m1",
          sender: "them",
          text: "你好！請問對哪張現貨有興趣？",
          timestamp: "10:30",
        },
      ],
    },
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
          id: "3",
          sender: "them",
          text: "師兄放心，卡牌已經交咗畀平台。剛才收到通知，鑑定進行中。",
          timestamp: "14:30",
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
              text: `🔒 已建立與 ${partnerName} 的安全中介託管議價通道。`,
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
        mobileView: "CHAT",
      };
    }),

  injectSpecialTransaction: (payload) =>
    set((state) => {
      const targetRoomId = payload.sellerId;

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
          sellerId: payload.sellerId, // 🟢 注入全域
        },
      };

      const updatedChats = state.chats.map((room) => {
        if (room.id === targetRoomId) {
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
        activeRoomId: targetRoomId,
        isChatOpen: true,
        mobileView: "CHAT",
      };
    }),
}));
