import { create } from "zustand";
import { INITIAL_CHATS } from "@/app/lib/mock-data/chatrooms";
import { generateDeterministicRoomId } from "@/app/lib/utils/chatUtils";

export interface SpecialTransactionData {
  cardName: string;
  cardId: string;
  offerPrice: number;
  buyerName: string;
  buyerId: string;
  sellerId: string;
  sellerName: string;
  initialStatus?: "pending" | "accepted" | "rejected" | "countered";
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
  partnerId: string;
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
  customText?: string,
): Message {
  return {
    id: "MSG-TXN-" + Date.now(),
    sender,
    text:
      customText ||
      payload.buyerName + " offer price HK$ " + payload.offerPrice + " - " + payload.cardName + " (" + payload.cardId + ")",
    timestamp: new Date().toISOString(),
    type: "special_transaction",
    specialData: payload,
  };
}

interface HkCardVaultStore {
  isChatOpen: boolean;
  activeRoomId: string;
  mobileView: "LIST" | "CHAT";
  chats: ChatRoom[];

  setIsChatOpen: (open: boolean) => void;
  setActiveRoomId: (id: string) => void;
  setMobileView: (view: "LIST" | "CHAT") => void;
  setChats: (updater: ChatRoom[] | ((prev: ChatRoom[]) => ChatRoom[])) => void;

  /**
   * Opens the global chat console and navigates to the canonical deterministic room
   * derived from buyerId + sellerId via MD5 hash. Bi-directional symmetry is guaranteed:
   * openGlobalChat(A, B) and openGlobalChat(B, A) resolve to the exact same room.
   */
  openGlobalChat: (
    buyerId: string,
    buyerName: string,
    sellerId: string,
    sellerName: string,
    currentViewerRole: "BUYER" | "SELLER",
    injectOffer?: SpecialTransactionData,
  ) => void;

  /**
   * Legacy-compatible room activator for CustomEvent-driven nav paths.
   * Activates an existing room by its raw ID, or creates a minimal stub if not found.
   * Prefer openGlobalChat for new call sites where buyer/seller IDs are known.
   */
  activateRoomById: (roomId: string, partnerName: string) => void;

  injectSpecialTransaction: (payload: {
    sellerName: string;
    sellerId: string;
    cardName: string;
    cardId: string;
    offerPrice: number;
    buyerName: string;
    buyerId: string;
    isInstantTake: boolean;
  }) => void;
}

export const useHkCardVaultStore = create<HkCardVaultStore>((set) => ({
  isChatOpen: false,
  activeRoomId: "RM-MOCK-A-BUYER-MERCHANT",
  mobileView: "LIST",
  chats: INITIAL_CHATS as unknown as ChatRoom[],

  setIsChatOpen: (open) => set({ isChatOpen: open }),
  setActiveRoomId: (id) => set({ activeRoomId: id }),
  setMobileView: (view) => set({ mobileView: view }),
  setChats: (updater) =>
    set((state) => ({
      chats: typeof updater === "function" ? updater(state.chats) : updater,
    })),

  activateRoomById: (roomId, partnerName) =>
    set((state) => {
      const exists = state.chats.some((c) => c.id === roomId);
      if (exists) {
        return {
          activeRoomId: roomId,
          isChatOpen: true,
          mobileView: "CHAT" as const,
          chats: state.chats.map((c) =>
            c.id === roomId ? { ...c, unreadCount: 0 } : c,
          ),
        };
      }
      const stub: ChatRoom = {
        id: roomId,
        partnerId: roomId,
        partnerName,
        partnerTier: "認證用戶",
        lastMessage: "已開啟對話",
        unreadCount: 0,
        timestamp: new Date().toISOString(),
        messages: [
          {
            id: "sys-" + Date.now(),
            sender: "system",
            text: "🔒 已建立與 " + partnerName + " 的安全對話通道。",
            timestamp: new Date().toISOString(),
          },
        ],
      };
      return {
        chats: [stub, ...state.chats],
        activeRoomId: roomId,
        isChatOpen: true,
        mobileView: "CHAT" as const,
      };
    }),

  openGlobalChat: (buyerId, buyerName, sellerId, sellerName, currentViewerRole, injectOffer) =>
    set((state) => {
      // Deterministic canonical room ID — alphabetically sorted for bi-directional symmetry
      const canonicalRoomId = generateDeterministicRoomId(buyerId, sellerId);
      const exists = state.chats.some((c) => c.id === canonicalRoomId);
      let updatedChats = [...state.chats];

      // Determine who is the partner based on who is viewing the chat
      const partnerId = currentViewerRole === "SELLER" ? buyerId : sellerId;
      const partnerName = currentViewerRole === "SELLER" ? buyerName : sellerName;
      const partnerTier = currentViewerRole === "SELLER" ? "認證買家" : "專業認證商戶";

      if (exists) {
        updatedChats = state.chats.map((room) => {
          if (room.id !== canonicalRoomId) return room;

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
            partnerId,      // Dynamically pivot the partnerId for current viewer
            partnerName,    // Dynamically pivot the partnerName for current viewer
            partnerTier,    // Dynamically pivot the partnerTier for current viewer
            messages: currentMessages,
            lastMessage: currentLastMessage,
            unreadCount: 0,
          };
        });
      } else {
        const newSession: ChatRoom = {
          id: canonicalRoomId,
          partnerId,
          partnerName,
          partnerTier,
          lastMessage: "已開啟即時議價對話",
          unreadCount: 0,
          timestamp: new Date().toISOString(),
          messages: [
            {
              id: "sys-" + Date.now(),
              sender: "system",
              text: "🔒 已建立與 " + partnerName + " 的安全交易對話通道。",
              timestamp: new Date().toISOString(),
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
        activeRoomId: canonicalRoomId,
        isChatOpen: true,
        mobileView: "CHAT",
      };
    }),

  injectSpecialTransaction: (payload) =>
    set((state) => {
      // Use deterministic canonical room ID for injectSpecialTransaction as well
      const canonicalRoomId = generateDeterministicRoomId(payload.buyerId, payload.sellerId);

      const status = payload.isInstantTake ? "accepted" : "pending";
      const msgText = payload.isInstantTake
        ? "⚡【立即購買】" + payload.buyerName + " 已接受一口價購入並成功預留資產！"
        : "📩【議價要約】" + payload.buyerName + " 向您提報了 HK$ " + payload.offerPrice.toLocaleString() + " 的預期出價。";

      const specialMsg = createSpecialTransactionMessage(
        "me",
        {
          cardName: payload.cardName,
          cardId: payload.cardId,
          offerPrice: payload.offerPrice,
          buyerName: payload.buyerName,
          buyerId: payload.buyerId,
          sellerId: payload.sellerId,
          sellerName: payload.sellerName,
          initialStatus: status,
        },
        msgText,
      );

      const exists = state.chats.some((c) => c.id === canonicalRoomId);
      let updatedChats = [...state.chats];

      if (exists) {
        updatedChats = state.chats.map((room) => {
          if (room.id === canonicalRoomId) {
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
        const newRoom: ChatRoom = {
          id: canonicalRoomId,
          partnerId: payload.sellerId,
          partnerName: payload.sellerName,
          partnerTier: "認證賣家",
          lastMessage: specialMsg.text,
          unreadCount: 0,
          timestamp: new Date().toISOString(),
          messages: [
            {
              id: "sys-" + Date.now(),
              sender: "system",
              text: "🔒 已建立與 " + payload.sellerName + " 的安全中介蒗管交易通道。",
              timestamp: new Date().toISOString(),
            },
            specialMsg,
          ],
        };
        updatedChats = [newRoom, ...state.chats];
      }

      return {
        chats: updatedChats,
        activeRoomId: canonicalRoomId,
        isChatOpen: true,
        mobileView: "CHAT",
      };
    }),
}));
