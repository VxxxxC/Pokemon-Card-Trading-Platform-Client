// Centralized mock transactions / orders bank
export interface Order {
  id: string;
  cardName: string;
  cardNo: string;
  grade: string;
  cardImage: string;
  seller: string;
  sellerId: string;
  amount: number;
  tradeType: "c2c" | "b2c";
  flowType: "meetup" | "delivery" | "escrow_auth" | "escrow_no_auth";
  side: "buy" | "sell";
  status: string;
  statusLabel: string;
  createdAt: string;
  isHighValue: boolean;
}

export const INITIAL_ORDERS: Order[] = [
  {
    id: "ORD-C2C-MEETUP-001",
    cardName: "Charizard ex SAR (噴火龍)",
    cardNo: "sv2a-182",
    grade: "PSA 10",
    cardImage: "https://picsum.photos/seed/charizard/200/280",
    seller: "星光收藏家 (C2C 散戶)",
    sellerId: "ROOM-MOCK-C2C-01",
    amount: 2250,
    tradeType: "c2c",
    flowType: "meetup",
    side: "buy",
    status: "reserved",
    statusLabel: "已預留 (等待面交)",
    createdAt: "2026年 5月27日",
    isHighValue: true,
  },
  {
    id: "ORD-C2C-DELIVERY-002",
    cardName: "Umbreon ex SAR (月亮伊布)",
    cardNo: "sv6a-109",
    grade: "Raw 裸卡",
    cardImage: "https://picsum.photos/seed/umbreon/200/280",
    seller: "港島執雞王 (C2C 散戶)",
    sellerId: "ROOM-MOCK-C2C-02",
    amount: 1900,
    tradeType: "c2c",
    flowType: "delivery",
    side: "sell",
    status: "shipped",
    statusLabel: "賣家已發貨 (物流中)",
    createdAt: "2026年 5月26日",
    isHighValue: true,
  },
  {
    id: "ORD-B2C-NOAUTH-004",
    cardName: "Pikachu AR (皮卡丘)",
    cardNo: "sv2a-215",
    grade: "CGC 9",
    cardImage: "https://picsum.photos/seed/pikachu/200/280",
    seller: "東京TCG市場 (認證商戶)",
    sellerId: "ROOM-MOCK-B2C-02",
    amount: 425,
    tradeType: "b2c",
    flowType: "escrow_no_auth",
    side: "buy",
    status: "reserved",
    statusLabel: "買家 Price Offer 待確認",
    createdAt: "2026年 5月24日",
    isHighValue: false,
  },
];

export const MOCK_ORDERS_DB = INITIAL_ORDERS;

export default INITIAL_ORDERS;
