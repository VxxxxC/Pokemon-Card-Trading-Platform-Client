import { create } from "zustand";
import type { ExecutionSlideOverPayload } from "@/lib/marketplace/map-listing-to-execution";

export type DemoRole = "GUEST" | "USER" | "MERCHANT" | "ADMIN";

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

export type OpenAddAssetModalInput = {
  mode: "hobby" | "merch";
  sellPrefill?: SellFromCollectionPrefill | null;
};

interface UIStore {
  isAddAssetOpen: boolean;
  addAssetMode: "hobby" | "merch";
  addAssetSellPrefill: SellFromCollectionPrefill | null;
  userAuthRole: DemoRole;
  isIosPwaModalOpen: boolean;
  isExecutionSlideOverOpen: boolean;
  executionSlideOverPayload: ExecutionSlideOverPayload | null;
  openAddAssetModal: (input: OpenAddAssetModalInput) => void;
  closeAddAssetModal: () => void;
  setUserAuthRole: (role: DemoRole) => void;
  openIosPwaModal: () => void;
  closeIosPwaModal: () => void;
  openExecutionSlideOver: (payload: ExecutionSlideOverPayload) => void;
  closeExecutionSlideOver: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isAddAssetOpen: false,
  addAssetMode: "hobby",
  addAssetSellPrefill: null,
  userAuthRole: "GUEST",
  isIosPwaModalOpen: false,
  isExecutionSlideOverOpen: false,
  executionSlideOverPayload: null,
  openAddAssetModal: (input) => {
    const sellPrefill = input.sellPrefill ?? null;
    set({
      isAddAssetOpen: true,
      addAssetMode: sellPrefill ? "merch" : input.mode,
      addAssetSellPrefill: sellPrefill,
    });
  },
  closeAddAssetModal: () =>
    set({
      isAddAssetOpen: false,
      addAssetSellPrefill: null,
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
