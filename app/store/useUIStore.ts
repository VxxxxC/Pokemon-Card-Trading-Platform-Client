import { create } from "zustand";

// 嚴格定義沙盒角色型態：GUEST 代表未登入狀態
export type DemoRole = "GUEST" | "USER" | "MERCHANT" | "ADMIN";

interface UIStore {
  isAddAssetOpen: boolean;
  addAssetMode: "hobby" | "merch";
  mockRole: DemoRole; // 🟢 Demo: 全域沙盒身份唯一的真理源
  openAddAssetModal: (mode: "hobby" | "merch") => void;
  closeAddAssetModal: () => void;
  setMockRole: (role: DemoRole) => void; // 🟢 切換身份動作
}

export const useUIStore = create<UIStore>((set) => ({
  isAddAssetOpen: false,
  addAssetMode: "hobby",
  mockRole: "USER", // Demo: 預設為已登入的一般散戶
  openAddAssetModal: (mode) =>
    set({ isAddAssetOpen: true, addAssetMode: mode }),
  closeAddAssetModal: () => set({ isAddAssetOpen: false }),
  setMockRole: (role) => set({ mockRole: role }),
}));
