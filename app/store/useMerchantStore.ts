"use client";

import { create } from "zustand";
import { SaleOrder, OrderStatus } from "@/app/lib/types/trading";

interface MerchantState {
  orders: SaleOrder[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrderTracking: (orderId: string, trackingNo: string) => void;
  confirmOrderAndSetCustody: (orderId: string) => void;
  sendOrderToGrading: (orderId: string) => void;
  releaseOrderEscrow: (orderId: string) => void;
}

const initialSaleOrders: SaleOrder[] = [
  { id: "ORD-20250519-041", buyerId: "USR-BUY-001", buyerName: "M.佐藤", sellerId: "MRC-PKT-JP-001", sellerName: "PokéTrade JP", cardName: "Charizard ex SAR", cardNo: "sv2a-182", grade: "PSA 10", amount: 49800,  status: "custody",  createdAt: "2025/5/19", orderType: "B2C", userContext: "SELLER", productListingId: "LST-2025-M991", hasAuthenticationToggle: false },
  { id: "ORD-20250519-039", buyerId: "USR-BUY-002", buyerName: "K.田中", sellerId: "MRC-PKT-JP-001", sellerName: "PokéTrade JP", cardName: "Umbreon ex SAR",   cardNo: "sv6a-109", grade: "BGS 9",  amount: 38200,  status: "payment",  createdAt: "2025/5/19", orderType: "B2C", userContext: "SELLER", productListingId: "LST-2025-K332", hasAuthenticationToggle: true },
  { id: "ORD-20250517-035", buyerId: "USR-BUY-003", buyerName: "C.Chen", sellerId: "MRC-PKT-JP-001", sellerName: "PokéTrade JP", cardName: "Pikachu ex SAR",   cardNo: "sv3a-062", grade: "PSA 10", amount: 32500, status: "grading",  createdAt: "2025/5/17", trackingNo: "SF1234567890JP", orderType: "B2C", userContext: "SELLER", productListingId: "LST-2025-P415", hasAuthenticationToggle: true },
  { id: "ORD-20250515-030", buyerId: "USR-BUY-004", buyerName: "A.Yamamoto", sellerId: "MRC-PKT-JP-001", sellerName: "PokéTrade JP", cardName: "Gardevoir ex SAR", cardNo: "sv4a-237", grade: "PSA 9",  amount: 28000,  status: "shipped",  createdAt: "2025/5/15", trackingNo: "YM9876543210JP", orderType: "B2C", userContext: "SELLER", productListingId: "LST-2025-G442", hasAuthenticationToggle: true },
  { id: "ORD-20250510-025", buyerId: "USR-BUY-005", buyerName: "R.Suzuki", sellerId: "MRC-PKT-JP-001", sellerName: "PokéTrade JP", cardName: "Sylveon ex SAR",   cardNo: "s6a-210",  grade: "BGS 9.5",amount: 22800, status: "released", createdAt: "2025/5/10", orderType: "B2C", userContext: "SELLER", productListingId: "LST-2025-S210", hasAuthenticationToggle: true },
  { id: "ORD-20250508-012", buyerId: "USR-BUY-006", buyerName: "H.渡邊", sellerId: "MRC-PKT-JP-001", sellerName: "PokéTrade JP", cardName: "Mewtwo ex SAR",    cardNo: "sv4a-222", grade: "PSA 10", amount: 19500,  status: "released", createdAt: "2025/5/08", orderType: "B2C", userContext: "SELLER", productListingId: "LST-2025-M222", hasAuthenticationToggle: false },
  { id: "ORD-20250505-009", buyerId: "USR-BUY-007", buyerName: "T.高橋", sellerId: "MRC-PKT-JP-001", sellerName: "PokéTrade JP", cardName: "Lugia V SA",       cardNo: "s12a-110", grade: "BGS 9.5",amount: 62000, status: "released", createdAt: "2025/5/05", orderType: "B2C", userContext: "SELLER", productListingId: "LST-2025-L110", hasAuthenticationToggle: true },
  { id: "ORD-20250430-004", buyerId: "USR-BUY-008", buyerName: "J.Lin", sellerId: "MRC-PKT-JP-001", sellerName: "PokéTrade JP", cardName: "Rayquaza VMAX SA", cardNo: "s7r-083",  grade: "PSA 10", amount: 88000, status: "payment",  createdAt: "2025/4/30", orderType: "B2C", userContext: "SELLER", productListingId: "LST-2025-R083", hasAuthenticationToggle: true },
  { id: "ORD-20250428-002", buyerId: "USR-BUY-009", buyerName: "W.王", sellerId: "MRC-PKT-JP-001", sellerName: "PokéTrade JP", cardName: "Gengar VMAX SA",   cardNo: "s8b-020",  grade: "PSA 9",  amount: 41000,  status: "custody",  createdAt: "2025/4/28", orderType: "B2C", userContext: "SELLER", productListingId: "LST-2025-G020", hasAuthenticationToggle: false },
  { id: "ORD-20250425-001", buyerId: "USR-BUY-010", buyerName: "K.中村", sellerId: "MRC-PKT-JP-001", sellerName: "PokéTrade JP", cardName: "Eeeve ex SAR",     cardNo: "sv5a-088", grade: "RAW NM", amount: 12500,  status: "released", createdAt: "2025/4/25", orderType: "B2C", userContext: "SELLER", productListingId: "LST-2025-E088", hasAuthenticationToggle: false },
];

export const useMerchantStore = create<MerchantState>((set) => ({
  orders: initialSaleOrders,

  updateOrderStatus: (orderId, status) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
    })),

  updateOrderTracking: (orderId, trackingNo) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, trackingNo, status: o.status === "custody" ? "shipped" : o.status } : o
      ),
    })),

  confirmOrderAndSetCustody: (orderId) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status: "custody" } : o
      ),
    })),

  sendOrderToGrading: (orderId) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status: "grading" } : o
      ),
    })),

  releaseOrderEscrow: (orderId) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status: "released" } : o
      ),
    })),
}));
