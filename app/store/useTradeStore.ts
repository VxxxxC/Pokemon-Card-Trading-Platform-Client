import { create } from "zustand";
import { INITIAL_CHATS } from "@/app/lib/mock-data/chatrooms";

export interface SpecialTransactionData {
  cardName: string;
  cardId: string;
  offerPrice: number;
  buyerName: string;
  sellerId: string; // 🟢 全新加碼：綁定賣家/店鋪唯一識別碼
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

function createSpecialTransactionMessage(
  sender: Message["sender"],
  payload: SpecialTransactionData,
): Message {
  return {
    id: `MSG-TXN-${Date.now()}`,
    sender,
    text: `${payload.buyerName} offer price HK$ ${payload.offerPrice} - ${payload.cardName} (${payload.cardId})`,
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

  // 🟢 核心升格：允許傳入選填的第三參數 injectOffer，達成一鍵開房、切換視窗、動態防重注入
  openGlobalChat: (
    roomId: string,
    partnerName: string,
    injectOffer?: SpecialTransactionData,
  ) => void;

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
        // 情況 A：會話房間早已存在
        updatedChats = state.chats.map((room) => {
          if (room.id !== roomId) return room;

          let currentMessages = [...room.messages];
          let currentLastMessage = room.lastMessage;

          // 如果帶有出價上下文，啟動智能動態去重注入
          if (isValidSpecialTransactionData(injectOffer)) {
            const hasOfferAlready = currentMessages.some(
              (m) =>
                m.type === "special_transaction" &&
                m.specialData?.cardId === injectOffer.cardId,
            );

            // 只有不存在同張卡的議價卡時，才執行啪一聲原地塞入
            if (!hasOfferAlready) {
              const specialMsg = createSpecialTransactionMessage(
                "them", // 🟢 強制立為 "them" (代表買家發出)，確保賣家視角看得到「接受/拒絕」按鈕
                injectOffer,
              );
              currentMessages = [...currentMessages, specialMsg];
              currentLastMessage = specialMsg.text;
            }
          }

          return {
            ...room,
            messages: currentMessages,
            lastMessage: currentLastMessage,
            unreadCount: 0, // 點擊時強制消除紅點未讀
          };
        });
      } else {
        // 情況 B：該出價買家是全新用戶，尚未建立過對話會話，原地構造一個乾淨的安全通道
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

        // 新建房間若有出價上下文，直接作爲首發訊息打包進去
        if (isValidSpecialTransactionData(injectOffer)) {
          const specialMsg = createSpecialTransactionMessage(
            "them",
            injectOffer,
          );
          newSession.messages.push(specialMsg);
          newSession.lastMessage = specialMsg.text;
        }

        updatedChats = [newSession, ...state.chats];
      }

      return {
        chats: updatedChats,
        activeRoomId: roomId,
        isChatOpen: true, // 瞬間拉起對話彈窗
        mobileView: "CHAT", // 移動端直穿對話戰場
      };
    }),

  injectSpecialTransaction: (payload) =>
    set((state) => {
      const targetRoomId = payload.sellerId;

      const specialMsg = createSpecialTransactionMessage("me", {
        cardName: payload.cardName,
        cardId: payload.cardId,
        offerPrice: payload.offerPrice,
        buyerName: payload.buyerName,
        sellerId: payload.sellerId,
      });

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
