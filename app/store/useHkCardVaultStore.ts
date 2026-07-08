import { create } from "zustand";
import { buildPendingChatRoomId } from "@/app/lib/chat/constants";
import { findRoomByPartnerId } from "@/app/lib/chat/mergeChatRooms";
import { INITIAL_CHATS } from "@/app/lib/mock-data/chatrooms";
import { generateDeterministicRoomId } from "@/app/lib/utils/chatUtils";
import type { Tables } from "@/types/supabase";

type OfferLedgerStatus = Tables<"offers">["status"];

export type OfferLedgerEntry = {
  status: OfferLedgerStatus;
  memberOrderId?: string;
  offerPrice?: number;
  modifiedCount?: number;
};

export interface SpecialTransactionData {
  cardName: string;
  cardId: string;
  offerPrice: number;
  buyerName: string;
  buyerId: string;
  sellerId: string;
  sellerName: string;
  offerId?: string;
  modifiedCount?: number;
  imageUrl?: string;
  useAuthentication?: boolean;
  initialStatus?: "pending" | "accepted" | "rejected" | "countered";
}

export interface OrderCompletedData {
  orderId: string;
}

export interface Message {
  id: string;
  sender: "me" | "them" | "system";
  text: string;
  timestamp: string;
  type?: "text" | "special_transaction" | "system_order_completed";
  specialData?: SpecialTransactionData;
  orderData?: OrderCompletedData;
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
  /** Set true after getChatRoomThread succeeds for this room */
  threadHydrated?: boolean;
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

function findRoomIdByOfferId(chats: ChatRoom[], offerId: string): string | null {
  for (const room of chats) {
    const hasOffer = room.messages.some(
      (message) =>
        message.type === "special_transaction" &&
        message.specialData?.offerId === offerId,
    );
    if (hasOffer) {
      return room.id;
    }
  }
  return null;
}

function mapInitialStatusToLedgerStatus(
  initialStatus: SpecialTransactionData["initialStatus"],
): OfferLedgerStatus {
  if (initialStatus === "accepted") return "accepted";
  if (initialStatus === "rejected") return "rejected";
  return "pending";
}

function isOfferAlreadyInStatus(
  offers: Record<string, OfferLedgerEntry>,
  chats: ChatRoom[],
  offerId: string,
  targetStatus: Extract<OfferLedgerStatus, "accepted" | "rejected">,
): boolean {
  if (offers[offerId]?.status === targetStatus) {
    return true;
  }

  for (const room of chats) {
    for (const message of room.messages) {
      if (
        message.type === "special_transaction" &&
        message.specialData?.offerId === offerId
      ) {
        if (targetStatus === "accepted" && message.specialData.initialStatus === "accepted") {
          return true;
        }
        if (targetStatus === "rejected" && message.specialData.initialStatus === "rejected") {
          return true;
        }
      }
    }
  }

  return false;
}

function buildOfferLedgerFromChats(
  chats: ChatRoom[],
): Record<string, OfferLedgerEntry> {
  const ledger: Record<string, OfferLedgerEntry> = {};

  for (const room of chats) {
    for (const message of room.messages) {
      if (
        message.type !== "special_transaction" ||
        !message.specialData?.offerId
      ) {
        continue;
      }

      const offerId = message.specialData.offerId;
      ledger[offerId] = {
        status: mapInitialStatusToLedgerStatus(
          message.specialData.initialStatus ?? "pending",
        ),
        offerPrice: message.specialData.offerPrice,
        modifiedCount: message.specialData.modifiedCount ?? 0,
      };
    }
  }

  return ledger;
}

interface HkCardVaultStore {
  isChatOpen: boolean;
  activeRoomId: string;
  mobileView: "LIST" | "CHAT";
  chats: ChatRoom[];
  offers: Record<string, OfferLedgerEntry>;

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

  /** Resolve an existing room by counterparty profile id, or open a pending stub. */
  openChatWithPartner: (partnerId: string, partnerName: string) => void;

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

  openOfferChatSession: (payload: {
    roomId: string;
    partnerId: string;
    partnerName: string;
    buyerId: string;
    buyerName: string;
    sellerId: string;
    sellerName: string;
    cardName: string;
    cardId: string;
    offerId: string;
    offerPrice: number;
    modifiedCount?: number;
    messageId: string;
    messageContent: string;
    messageCreatedAt: string;
    offerStatus: "pending" | "accepted" | "rejected" | "cancelled";
    useAuthentication?: boolean;
  }) => void;

  applyOfferModification: (payload: {
    roomId: string;
    offerId: string;
    newPrice: number;
    modifiedCount: number;
    messageId: string;
    messageContent: string;
    messageCreatedAt?: string;
  }) => void;

  applyOfferAccepted: (offerId: string, memberOrderId?: string) => void;

  applyOfferRejected: (offerId: string) => void;

  applyOfferPriceSync: (payload: {
    offerId: string;
    offerPrice: number;
    modifiedCount: number;
  }) => void;

  appendRoomMessage: (roomId: string, message: Message) => void;

  markRoomRead: (roomId: string) => void;

  finalizeOptimisticMessage: (
    roomId: string,
    optimisticId: string,
    confirmed: Message,
  ) => void;

  rollbackOptimisticMessage: (roomId: string, optimisticId: string) => void;

  reconcileOfferLedger: () => void;
}

export const useHkCardVaultStore = create<HkCardVaultStore>((set) => ({
  isChatOpen: false,
  activeRoomId: "RM-MOCK-A-BUYER-MERCHANT",
  mobileView: "LIST",
  chats: INITIAL_CHATS as unknown as ChatRoom[],
  offers: {},

  setIsChatOpen: (open) =>
    set((state) => {
      if (!open) {
        return { isChatOpen: false };
      }

      const hasActiveRoom = state.chats.some(
        (room) => room.id === state.activeRoomId,
      );

      return {
        isChatOpen: true,
        mobileView: hasActiveRoom ? state.mobileView : "LIST",
      };
    }),
  setActiveRoomId: (id) => set({ activeRoomId: id }),
  setMobileView: (view) => set({ mobileView: view }),
  setChats: (updater) =>
    set((state) => {
      const chats =
        typeof updater === "function" ? updater(state.chats) : updater;
      return {
        chats,
        offers: buildOfferLedgerFromChats(chats),
      };
    }),

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

  openChatWithPartner: (partnerId, partnerName) =>
    set((state) => {
      const existing = findRoomByPartnerId(state.chats, partnerId);
      if (existing) {
        return {
          activeRoomId: existing.id,
          isChatOpen: true,
          mobileView: "CHAT" as const,
          chats: state.chats.map((c) =>
            c.id === existing.id ? { ...c, unreadCount: 0 } : c,
          ),
        };
      }

      const roomId = buildPendingChatRoomId(partnerId);
      const stub: ChatRoom = {
        id: roomId,
        partnerId,
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

  openOfferChatSession: (payload) =>
    set((state) => {
      const modifiedCount = payload.modifiedCount ?? 0;
      const initialStatus: SpecialTransactionData["initialStatus"] =
        modifiedCount >= 1
          ? "countered"
          : payload.offerStatus === "accepted"
            ? "accepted"
            : payload.offerStatus === "rejected"
              ? "rejected"
              : "pending";

      const specialMsg: Message = {
        id: payload.messageId,
        sender: "me",
        text: payload.messageContent,
        timestamp: payload.messageCreatedAt,
        type: "special_transaction",
        specialData: {
          cardName: payload.cardName,
          cardId: payload.cardId,
          offerPrice: payload.offerPrice,
          buyerName: payload.buyerName,
          buyerId: payload.buyerId,
          sellerId: payload.sellerId,
          sellerName: payload.sellerName,
          offerId: payload.offerId,
          modifiedCount,
          initialStatus,
          useAuthentication: payload.useAuthentication ?? false,
        },
      };

      const exists = state.chats.some((c) => c.id === payload.roomId);
      let updatedChats = [...state.chats];

      if (exists) {
        updatedChats = state.chats.map((room) => {
          if (room.id !== payload.roomId) return room;

          const hasOfferMsg = room.messages.some((m) => m.id === payload.messageId);

          return {
            ...room,
            partnerId: payload.partnerId,
            partnerName: payload.partnerName,
            lastMessage: specialMsg.text,
            unreadCount: 0,
            messages: hasOfferMsg ? room.messages : [...room.messages, specialMsg],
          };
        });
      } else {
        const newRoom: ChatRoom = {
          id: payload.roomId,
          partnerId: payload.partnerId,
          partnerName: payload.partnerName,
          partnerTier: "認證賣家",
          lastMessage: specialMsg.text,
          unreadCount: 0,
          timestamp: payload.messageCreatedAt,
          messages: [
            {
              id: "sys-" + payload.messageId,
              sender: "system",
              text: "🔒 已建立與 " + payload.partnerName + " 的安全交易對話通道。",
              timestamp: payload.messageCreatedAt,
            },
            specialMsg,
          ],
        };
        updatedChats = [newRoom, ...state.chats];
      }

      return {
        chats: updatedChats,
        activeRoomId: payload.roomId,
        isChatOpen: true,
        mobileView: "CHAT",
      };
    }),

  applyOfferModification: (payload) =>
    set((state) => {
      const roomId = payload.roomId;
      const nextOffers: Record<string, OfferLedgerEntry> = {
        ...state.offers,
        [payload.offerId]: {
          status: "pending",
          offerPrice: payload.newPrice,
          modifiedCount: payload.modifiedCount,
        },
      };

      return {
        offers: nextOffers,
        chats: state.chats.map((room) => {
          if (room.id !== roomId) return room;

          const hasNewMsg = room.messages.some(
            (message) => message.id === payload.messageId,
          );

          const updatedMessages = room.messages.map((message) => {
            if (
              message.type === "special_transaction" &&
              message.specialData?.offerId === payload.offerId
            ) {
              return {
                ...message,
                specialData: {
                  ...message.specialData,
                  offerPrice: payload.newPrice,
                  modifiedCount: payload.modifiedCount,
                  initialStatus: "countered" as const,
                },
              };
            }
            return message;
          });

          const modificationNotice: Message = {
            id: payload.messageId,
            sender: "me",
            text: payload.messageContent,
            timestamp: payload.messageCreatedAt ?? new Date().toISOString(),
            type: "text",
          };

          return {
            ...room,
            lastMessage: payload.messageContent,
            messages: hasNewMsg
              ? updatedMessages
              : [...updatedMessages, modificationNotice],
          };
        }),
      };
    }),

  applyOfferAccepted: (offerId, memberOrderId) =>
    set((state) => {
      if (isOfferAlreadyInStatus(state.offers, state.chats, offerId, "accepted")) {
        return state;
      }

      const roomId = findRoomIdByOfferId(state.chats, offerId);
      const nextOffers: Record<string, OfferLedgerEntry> = {
        ...state.offers,
        [offerId]: {
          ...state.offers[offerId],
          status: "accepted",
          memberOrderId,
        },
      };

      if (!roomId) {
        return { offers: nextOffers };
      }

      return {
        offers: nextOffers,
        chats: state.chats.map((room) => {
          if (room.id !== roomId) return room;

          const updatedMessages = room.messages.map((message) => {
            if (
              message.type === "special_transaction" &&
              message.specialData?.offerId === offerId
            ) {
              return {
                ...message,
                specialData: {
                  ...message.specialData,
                  initialStatus: "accepted" as const,
                },
              };
            }
            return message;
          });

          return {
            ...room,
            lastMessage: "✅ 賣家已接受出價，商品已成功鎖定（Hold 貨）",
            messages: updatedMessages,
          };
        }),
      };
    }),

  applyOfferRejected: (offerId) =>
    set((state) => {
      if (isOfferAlreadyInStatus(state.offers, state.chats, offerId, "rejected")) {
        return state;
      }

      const roomId = findRoomIdByOfferId(state.chats, offerId);
      const nextOffers: Record<string, OfferLedgerEntry> = {
        ...state.offers,
        [offerId]: {
          ...state.offers[offerId],
          status: "rejected",
        },
      };

      if (!roomId) {
        return { offers: nextOffers };
      }

      return {
        offers: nextOffers,
        chats: state.chats.map((room) => {
          if (room.id !== roomId) return room;

          const updatedMessages = room.messages.map((message) => {
            if (
              message.type === "special_transaction" &&
              message.specialData?.offerId === offerId
            ) {
              return {
                ...message,
                specialData: {
                  ...message.specialData,
                  initialStatus: "rejected" as const,
                },
              };
            }
            return message;
          });

          return {
            ...room,
            lastMessage: "❌ 賣家已拒絕此出價",
            messages: updatedMessages,
          };
        }),
      };
    }),

  applyOfferPriceSync: (payload) =>
    set((state) => {
      const roomId = findRoomIdByOfferId(state.chats, payload.offerId);
      const nextOffers: Record<string, OfferLedgerEntry> = {
        ...state.offers,
        [payload.offerId]: {
          ...state.offers[payload.offerId],
          status: state.offers[payload.offerId]?.status ?? "pending",
          offerPrice: payload.offerPrice,
          modifiedCount: payload.modifiedCount,
        },
      };

      if (!roomId) {
        return { offers: nextOffers };
      }

      return {
        offers: nextOffers,
        chats: state.chats.map((room) => {
          if (room.id !== roomId) return room;

          return {
            ...room,
            messages: room.messages.map((message) => {
              if (
                message.type === "special_transaction" &&
                message.specialData?.offerId === payload.offerId
              ) {
                return {
                  ...message,
                  specialData: {
                    ...message.specialData,
                    offerPrice: payload.offerPrice,
                    modifiedCount: payload.modifiedCount,
                    initialStatus: "countered" as const,
                  },
                };
              }
              return message;
            }),
          };
        }),
      };
    }),

  appendRoomMessage: (roomId, message) =>
    set((state) => {
      const isIncoming =
        message.sender === "them" || message.sender === "system";
      const shouldIncrementUnread =
        isIncoming &&
        (state.activeRoomId !== roomId || !state.isChatOpen);

      const chats = state.chats.map((room) => {
        if (room.id !== roomId) return room;

        const existingIndex = room.messages.findIndex(
          (existing) => existing.id === message.id,
        );
        if (existingIndex !== -1) {
          const messages = [...room.messages];
          messages[existingIndex] = message;
          return {
            ...room,
            messages,
            lastMessage: message.text,
            timestamp: message.timestamp,
          };
        }

        const lastMessage = room.messages.at(-1);
        const messageTime = new Date(message.timestamp).getTime();
        const lastTime = lastMessage
          ? new Date(lastMessage.timestamp).getTime()
          : 0;
        const messages =
          !lastMessage || messageTime >= lastTime
            ? [...room.messages, message]
            : [...room.messages, message].sort(
                (a, b) =>
                  new Date(a.timestamp).getTime() -
                  new Date(b.timestamp).getTime(),
              );

        return {
          ...room,
          messages,
          lastMessage: message.text,
          timestamp: message.timestamp,
          unreadCount: shouldIncrementUnread
            ? room.unreadCount + 1
            : room.unreadCount,
        };
      });

      return {
        chats,
        offers: buildOfferLedgerFromChats(chats),
      };
    }),

  markRoomRead: (roomId) =>
    set((state) => ({
      chats: state.chats.map((room) =>
        room.id === roomId ? { ...room, unreadCount: 0 } : room,
      ),
    })),

  finalizeOptimisticMessage: (roomId, optimisticId, confirmed) =>
    set((state) => ({
      chats: state.chats.map((room) => {
        if (room.id !== roomId) return room;

        const withoutOptimistic = room.messages.filter(
          (message) => message.id !== optimisticId,
        );
        const existingIndex = withoutOptimistic.findIndex(
          (message) => message.id === confirmed.id,
        );
        const messages =
          existingIndex === -1
            ? [...withoutOptimistic, confirmed].sort(
                (a, b) =>
                  new Date(a.timestamp).getTime() -
                  new Date(b.timestamp).getTime(),
              )
            : withoutOptimistic.map((message, index) =>
                index === existingIndex ? confirmed : message,
              );

        return {
          ...room,
          messages,
          lastMessage: confirmed.text,
          timestamp: confirmed.timestamp,
        };
      }),
    })),

  rollbackOptimisticMessage: (roomId, optimisticId) =>
    set((state) => ({
      chats: state.chats.map((room) => {
        if (room.id !== roomId) return room;

        const messages = room.messages.filter(
          (message) => message.id !== optimisticId,
        );
        const lastMessage = messages.at(-1)?.text ?? room.lastMessage ?? "";

        return {
          ...room,
          messages,
          lastMessage,
        };
      }),
    })),

  reconcileOfferLedger: () =>
    set((state) => ({
      offers: buildOfferLedgerFromChats(state.chats),
    })),
}));
