// Centralized mock chatrooms / messages bank
// All timestamps are ISO 8601 strings to support the Temporal HUD engine
export const INITIAL_CHATS = [
  {
    id: "RM-MOCK-SELLER-001",
    partnerId: "RM-MOCK-SELLER-001",
    partnerName: "旺角卡店 · 專業認證商戶",
    partnerTier: "專業認證商戶",
    lastMessage: "你好！請問對哪張現貨有興趣？",
    unreadCount: 0,
    timestamp: "2026-06-16T10:30:00.000Z",
    messages: [
      {
        id: "m1",
        sender: "them",
        text: "你好！請問對哪張現貨有興趣？",
        timestamp: "2026-06-16T10:30:00.000Z",
      },
    ],
  },
  {
    id: "PKT-8839-44A",
    partnerId: "PKT-8839-44A",
    partnerName: "渡邉道館",
    partnerTier: "道館主",
    lastMessage: "✨ 平台鑑定師已確認卡角完好，稍後會上傳官方報告。",
    unreadCount: 2,
    timestamp: "2026-06-15T14:32:00.000Z",
    messages: [
      {
        id: "1",
        sender: "me",
        text: "你好，請問呢張噴火龍幾時可以送到平台鑑定？",
        timestamp: "2026-06-15T10:15:00.000Z",
      },
      {
        id: "3",
        sender: "them",
        text: "師兄放心，卡牌已經交咋番平台。剛才收到通知，鑑定進行中。",
        timestamp: "2026-06-15T14:30:00.000Z",
      },
      {
        id: "txn-001",
        sender: "them",
        text: "· 九龍灣卡王 向您提報了 HK$ 2250 的預期出價。",
        timestamp: "2026-06-15T14:32:00.000Z",
        type: "special_transaction",
        specialData: {
          cardName: "Charizard ex SAR (噴火龍)",
          cardId: "sv2a-182",
          offerPrice: 2250,
          buyerName: "九龍灣卡王",
          buyerId: "USR-BUYER-MOCK-001",
          sellerId: "PKT-8839-44A",
          sellerName: "渡邉道館",
        },
      },
    ],
  },
];

export default INITIAL_CHATS;
