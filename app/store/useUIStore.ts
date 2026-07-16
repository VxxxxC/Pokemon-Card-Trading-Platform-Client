import { create } from "zustand";
import type { ExecutionSlideOverPayload } from "@/lib/marketplace/map-listing-to-execution";

export type AuthRole = "GUEST" | "USER" | "MERCHANT" | "ADMIN";

export type SellFromCollectionPrefill = {
  collectionId: string;
  productId: string;
  catalog: {
    name: string;
    displayId?: string | null;
    cardNumber?: string | null;
    setCode: string;
    imageUrl?: string | null;
    rarity?: string | null;
  };
  gradingOptionId: string;
  sellingPrice: number;
};

export type ListingSellerPersona = "member" | "merchant";

export type OpenAddAssetModalInput = {
  mode: "hobby" | "merch";
  sellPrefill?: SellFromCollectionPrefill | null;
  sellerPersona?: ListingSellerPersona;
};

export function resolveAddAssetSellerPersona(input: {
  mode: "hobby" | "merch";
  sellPrefill?: SellFromCollectionPrefill | null;
  sellerPersona?: ListingSellerPersona;
  pathname?: string;
}): ListingSellerPersona {
  if (input.sellPrefill) {
    return "member";
  }
  if (input.sellerPersona) {
    return input.sellerPersona;
  }
  if (input.pathname?.startsWith("/profile/merchant")) {
    return "merchant";
  }
  return "member";
}

interface UIStore {
  isAddAssetOpen: boolean;
  addAssetMode: "hobby" | "merch";
  addAssetSellPrefill: SellFromCollectionPrefill | null;
  addAssetSellerPersona: ListingSellerPersona;
  userAuthRole: AuthRole;
  isIosPwaModalOpen: boolean;
  isExecutionSlideOverOpen: boolean;
  executionSlideOverPayload: ExecutionSlideOverPayload | null;
  openAddAssetModal: (input: OpenAddAssetModalInput) => void;
  closeAddAssetModal: () => void;
  setUserAuthRole: (role: AuthRole) => void;
  openIosPwaModal: () => void;
  closeIosPwaModal: () => void;
  openExecutionSlideOver: (payload: ExecutionSlideOverPayload) => void;
  closeExecutionSlideOver: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isAddAssetOpen: false,
  addAssetMode: "hobby",
  addAssetSellPrefill: null,
  addAssetSellerPersona: "member",
  userAuthRole: "GUEST",
  isIosPwaModalOpen: false,
  isExecutionSlideOverOpen: false,
  executionSlideOverPayload: null,
  openAddAssetModal: (input) => {
    const sellPrefill = input.sellPrefill ?? null;
    const sellerPersona = resolveAddAssetSellerPersona({
      mode: sellPrefill ? "merch" : input.mode,
      sellPrefill,
      sellerPersona: input.sellerPersona,
    });
    set({
      isAddAssetOpen: true,
      addAssetMode: sellPrefill ? "merch" : input.mode,
      addAssetSellPrefill: sellPrefill,
      addAssetSellerPersona: sellerPersona,
    });
  },
  closeAddAssetModal: () =>
    set({
      isAddAssetOpen: false,
      addAssetSellPrefill: null,
      addAssetSellerPersona: "member",
    }),
  setUserAuthRole: (role) => set({ userAuthRole: role }),
  openIosPwaModal: () => set({ isIosPwaModalOpen: true }),
  closeIosPwaModal: () => set({ isIosPwaModalOpen: false }),
  openExecutionSlideOver: (payload) =>
    set({
      isExecutionSlideOverOpen: true,
      executionSlideOverPayload: payload,
    }),
  closeExecutionSlideOver: () =>
    set({
      isExecutionSlideOverOpen: false,
      executionSlideOverPayload: null,
    }),
}));
