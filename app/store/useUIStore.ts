import { create } from "zustand";

interface UIStore {
  isAddAssetOpen: boolean;
  addAssetMode: "hobby" | "merch";
  openAddAssetModal: (mode: "hobby" | "merch") => void;
  closeAddAssetModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isAddAssetOpen: false,
  addAssetMode: "hobby",
  // 🟢 全域 Action：一鍵開窗並鎖定預設 Toggle 模式
  openAddAssetModal: (mode) =>
    set({ isAddAssetOpen: true, addAssetMode: mode }),
  closeAddAssetModal: () => set({ isAddAssetOpen: false }),
}));
