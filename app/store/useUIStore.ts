import { create } from "zustand";
import type { ExecutionSlideOverPayload } from "@/lib/marketplace/map-listing-to-execution";
import {
  clearPersistedListingPersona,
  persistActiveListingPersona,
  resolveAddAssetSellerPersona,
  type ListingSellerPersona,
} from "@/lib/listings/active-listing-persona";

export type { ListingSellerPersona } from "@/lib/listings/active-listing-persona";
export { resolveAddAssetSellerPersona } from "@/lib/listings/active-listing-persona";

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

export type OpenAddAssetModalInput = {
  mode: "hobby" | "merch";
  sellPrefill?: SellFromCollectionPrefill | null;
  sellerPersona?: ListingSellerPersona;
};

interface UIStore {
  isAddAssetOpen: boolean;
  addAssetMode: "hobby" | "merch";
  addAssetSellPrefill: SellFromCollectionPrefill | null;
  addAssetSellerPersona: ListingSellerPersona;
  activeListingPersona: ListingSellerPersona;
  userAuthRole: AuthRole;
  isIosPwaModalOpen: boolean;
  isExecutionSlideOverOpen: boolean;
  executionSlideOverPayload: ExecutionSlideOverPayload | null;
  openAddAssetModal: (input: OpenAddAssetModalInput) => void;
  closeAddAssetModal: () => void;
  setActiveListingPersona: (persona: ListingSellerPersona) => void;
  setUserAuthRole: (role: AuthRole) => void;
  openIosPwaModal: () => void;
  closeIosPwaModal: () => void;
  openExecutionSlideOver: (payload: ExecutionSlideOverPayload) => void;
  closeExecutionSlideOver: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  isAddAssetOpen: false,
  addAssetMode: "hobby",
  addAssetSellPrefill: null,
  addAssetSellerPersona: "member",
  activeListingPersona: "member",
  userAuthRole: "GUEST",
  isIosPwaModalOpen: false,
  isExecutionSlideOverOpen: false,
  executionSlideOverPayload: null,
  openAddAssetModal: (input) => {
    const sellPrefill = input.sellPrefill ?? null;
    const sellerPersona = resolveAddAssetSellerPersona({
      sellPrefill,
      sellerPersona: input.sellerPersona,
      activeListingPersona: get().activeListingPersona,
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
  setActiveListingPersona: (persona) => {
    persistActiveListingPersona(persona);
    set({ activeListingPersona: persona });
  },
  setUserAuthRole: (role) => {
    if (role === "GUEST") {
      clearPersistedListingPersona();
    }
    set({ userAuthRole: role });
  },
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
