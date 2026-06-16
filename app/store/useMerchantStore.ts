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
  { id: "ORD-20250519-041", buyerName: "M.佐藤", sellerName: "PokéTrade JP", cardName: "Charizard ex SAR", cardNo: "sv2a-182", grade: "PSA 10", amount: 49800, depositPaid: 9960,  status: "custody",  createdAt: "2025/5/19", orderType: "B2C", userContext: "SELLER" },
  { id: "ORD-20250519-039", buyerName: "K.田中", sellerName: "PokéTrade JP", cardName: "Umbreon ex SAR",   cardNo: "sv6a-109", grade: "BGS 9",  amount: 38200, depositPaid: 7640,  status: "payment",  createdAt: "2025/5/19", orderType: "B2C", userContext: "SELLER" },
  { id: "ORD-20250517-035", buyerName: "C.Chen", sellerName: "PokéTrade JP", cardName: "Pikachu ex SAR",   cardNo: "sv3a-062", grade: "PSA 10", amount: 32500, depositPaid: 32500, status: "grading",  createdAt: "2025/5/17", trackingNo: "SF1234567890JP", orderType: "B2C", userContext: "SELLER" },
  { id: "ORD-20250515-030", buyerName: "A.Yamamoto", sellerName: "PokéTrade JP", cardName: "Gardevoir ex SAR", cardNo: "sv4a-237", grade: "PSA 9",  amount: 28000, depositPaid: 5600,  status: "shipped",  createdAt: "2025/5/15", trackingNo: "YM9876543210JP", orderType: "B2C", userContext: "SELLER" },
  { id: "ORD-20250510-025", buyerName: "R.Suzuki", sellerName: "PokéTrade JP", cardName: "Sylveon ex SAR",   cardNo: "s6a-210",  grade: "BGS 9.5",amount: 22800, depositPaid: 22800, status: "released", createdAt: "2025/5/10", orderType: "B2C", userContext: "SELLER" },
  { id: "ORD-20250508-012", buyerName: "H.渡邊", sellerName: "PokéTrade JP", cardName: "Mewtwo ex SAR",    cardNo: "sv4a-222", grade: "PSA 10", amount: 19500, depositPaid: 3900,  status: "released", createdAt: "2025/5/08", orderType: "B2C", userContext: "SELLER" },
  { id: "ORD-20250505-009", buyerName: "T.高橋", sellerName: "PokéTrade JP", cardName: "Lugia V SA",       cardNo: "s12a-110", grade: "BGS 9.5",amount: 62000, depositPaid: 62000, status: "released", createdAt: "2025/5/05", orderType: "B2C", userContext: "SELLER" },
  { id: "ORD-20250430-004", buyerName: "J.Lin", sellerName: "PokéTrade JP", cardName: "Rayquaza VMAX SA", cardNo: "s7r-083",  grade: "PSA 10", amount: 88000, depositPaid: 17600, status: "payment",  createdAt: "2025/4/30", orderType: "B2C", userContext: "SELLER" },
  { id: "ORD-20250428-002", buyerName: "W.王", sellerName: "PokéTrade JP", cardName: "Gengar VMAX SA",   cardNo: "s8b-020",  grade: "PSA 9",  amount: 41000, depositPaid: 8200,  status: "custody",  createdAt: "2025/4/28", orderType: "B2C", userContext: "SELLER" },
  { id: "ORD-20250425-001", buyerName: "K.中村", sellerName: "PokéTrade JP", cardName: "Eeeve ex SAR",     cardNo: "sv5a-088", grade: "RAW NM", amount: 12500, depositPaid: 2500,  status: "released", createdAt: "2025/4/25", orderType: "B2C", userContext: "SELLER" },
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
