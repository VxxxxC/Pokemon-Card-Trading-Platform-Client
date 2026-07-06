import { create } from "zustand";

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
  mockRole: DemoRole;
  isIosPwaModalOpen: boolean;
  openAddAssetModal: (input: OpenAddAssetModalInput) => void;
  closeAddAssetModal: () => void;
  setMockRole: (role: DemoRole) => void;
  openIosPwaModal: () => void;
  closeIosPwaModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isAddAssetOpen: false,
  addAssetMode: "hobby",
  addAssetSellPrefill: null,
  mockRole: "GUEST",
  isIosPwaModalOpen: false,
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
  setMockRole: (role) => set({ mockRole: role }),
  openIosPwaModal: () => set({ isIosPwaModalOpen: true }),
  closeIosPwaModal: () => set({ isIosPwaModalOpen: false }),
}));
