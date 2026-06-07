import { create } from "zustand";
import { INITIAL_CHATS } from "@/app/lib/mock-data/chatrooms";

export interface SpecialTransactionData {
  cardName: string;
  cardId: string;
  offerPrice: number;
  buyerName: string;
  sellerId: string; // 綁定賣家/店鋪唯一識別碼
  initialStatus?: "pending" | "accepted" | "rejected"; // 🟢 新增：同步投餵給 SpecialTransactionMessage 的初始狀態
}

export interface Message {
  id: string;
  sender: "me" | "them" | "system";
  text: string;
  timestamp: string;
  type?: "text" | "special_transaction";
  specialData?: SpecialTransactionData;
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

function isValidSpecialTransactionData(
  payload?: Partial<SpecialTransactionData>,
): payload is SpecialTransactionData {
  return Boolean(
    payload?.cardName &&
    payload.cardId &&
    payload.buyerName &&
    payload.sellerId &&
    Number.isFinite(payload.offerPrice),
  );
}

// 🟢 升格輔助函數：支持自訂文字訊息內容
function createSpecialTransactionMessage(
  sender: Message["sender"],
  payload: SpecialTransactionData,
  customText?: string,
): Message {
  return {
    id: `MSG-TXN-${Date.now()}`,
    sender,
    text:
      customText ||
      `${payload.buyerName} offer price HK$ ${payload.offerPrice} - ${payload.cardName} (${payload.cardId})`,
    timestamp: "剛剛",
    type: "special_transaction",
    specialData: payload,
  };
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

  openGlobalChat: (
    roomId: string,
    partnerName: string,
    injectOffer?: SpecialTransactionData,
  ) => void;

  // 🟢 核心修改點 1：傳入參數追加 isInstantTake 標誌，用以切分一口價與議價流向
  injectSpecialTransaction: (payload: {
    sellerName: string;
    sellerId: string;
    cardName: string;
    cardId: string;
    offerPrice: number;
    buyerName: string;
    isInstantTake: boolean;
  }) => void;
}

export const useTradeStore = create<TradeStore>((set) => ({
  isChatOpen: false,
  activeRoomId: "RM-MOCK-SELLER-001",
  mobileView: "LIST",
  chats: INITIAL_CHATS as unknown as ChatRoom[],

  setIsChatOpen: (open) => set({ isChatOpen: open }),
  setActiveRoomId: (id) => set({ activeRoomId: id }),
  setMobileView: (view) => set({ mobileView: view }),
  setChats: (updater) =>
    set((state) => ({
      chats: typeof updater === "function" ? updater(state.chats) : updater,
    })),

  openGlobalChat: (roomId, partnerName, injectOffer) =>
    set((state) => {
      const exists = state.chats.some((c) => c.id === roomId);
      let updatedChats = [...state.chats];

      if (exists) {
        updatedChats = state.chats.map((room) => {
          if (room.id !== roomId) return room;

          let currentMessages = [...room.messages];
          let currentLastMessage = room.lastMessage;

          if (isValidSpecialTransactionData(injectOffer)) {
            const hasOfferAlready = currentMessages.some(
              (m) =>
                m.type === "special_transaction" &&
                m.specialData?.cardId === injectOffer.cardId,
            );

            if (!hasOfferAlready) {
              const specialMsg = createSpecialTransactionMessage("them", {
                ...injectOffer,
                initialStatus: injectOffer.initialStatus || "pending",
              });
              currentMessages = [...currentMessages, specialMsg];
              currentLastMessage = specialMsg.text;
            }
          }

          return {
            ...room,
            messages: currentMessages,
            lastMessage: currentLastMessage,
            unreadCount: 0,
          };
        });
      } else {
        const newSession: ChatRoom = {
          id: roomId,
          partnerName,
          partnerTier: "認證買家",
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

        if (isValidSpecialTransactionData(injectOffer)) {
          const specialMsg = createSpecialTransactionMessage("them", {
            ...injectOffer,
            initialStatus: injectOffer.initialStatus || "pending",
          });
          newSession.messages.push(specialMsg);
          newSession.lastMessage = specialMsg.text;
        }

        updatedChats = [newSession, ...state.chats];
      }

      return {
        chats: updatedChats,
        activeRoomId: roomId,
        isChatOpen: true,
        mobileView: "CHAT",
      };
    }),

  // 🟢 核心修改點 2：完全體雙軌分流與盲開房守衛實作
  injectSpecialTransaction: (payload) =>
    set((state) => {
      const targetRoomId = payload.sellerId;

      // 根據買家點擊，決定交割文字語意與特殊要約卡的初使狀態碼
      const status = payload.isInstantTake ? "accepted" : "pending";
      const msgText = payload.isInstantTake
        ? `⚡【立即購買】${payload.buyerName} 已接受一口價購入並成功預留資產！`
        : `📩【議價要約】${payload.buyerName} 向您提報了 HK$ ${payload.offerPrice.toLocaleString()} 的預期出價。`;

      const specialMsg = createSpecialTransactionMessage(
        "me",
        {
          cardName: payload.cardName,
          cardId: payload.cardId,
          offerPrice: payload.offerPrice,
          buyerName: payload.buyerName,
          sellerId: payload.sellerId,
          initialStatus: status, // 精準塞入交割狀態
        },
        msgText,
      );

      const exists = state.chats.some((c) => c.id === targetRoomId);
      let updatedChats = [...state.chats];

      if (exists) {
        // 情況 A：房間早已存在，直接塞入訊息並清理未讀數
        updatedChats = state.chats.map((room) => {
          if (room.id === targetRoomId) {
            return {
              ...room,
              lastMessage: specialMsg.text,
              messages: [...room.messages, specialMsg],
              unreadCount: 0,
            };
          }
          return room;
        });
      } else {
        // 情況 B（關鍵修復）：全新交易會話，原地生出一個帶有系統歡迎詞的 ChatRoom
        const newRoom: ChatRoom = {
          id: targetRoomId,
          partnerName: payload.sellerName,
          partnerTier: "認證賣家",
          lastMessage: specialMsg.text,
          unreadCount: 0,
          timestamp: "剛剛",
          messages: [
            {
              id: "sys-" + Date.now(),
              sender: "system",
              text: `🔒 已建立與 ${payload.sellerName} 的安全中介託管交易通道。`,
              timestamp: "剛剛",
            },
            specialMsg,
          ],
        };
        updatedChats = [newRoom, ...state.chats];
      }

      // 瞬間拉起全域 Chat 控制艙
      return {
        chats: updatedChats,
        activeRoomId: targetRoomId,
        isChatOpen: true,
        mobileView: "CHAT",
      };
    }),
}));
