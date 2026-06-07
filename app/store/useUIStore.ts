import { create } from "zustand";

export type DemoRole = "GUEST" | "USER" | "MERCHANT" | "ADMIN";

interface UIStore {
    isAddAssetOpen: boolean;
    addAssetMode: "hobby" | "merch";
    mockRole: DemoRole;
    isIosPwaModalOpen: boolean; // 🟢 新增：iOS PWA 引導窗開關狀態
    openAddAssetModal: (mode: "hobby" | "merch") => void;
    closeAddAssetModal: () => void;
    setMockRole: (role: DemoRole) => void;
    openIosPwaModal: () => void; // 🟢 新增：打開引導 Action
    closeIosPwaModal: () => void; // 🟢 新增：關閉引導 Action
}

export const useUIStore = create<UIStore>((set) => ({
    isAddAssetOpen: false,
    addAssetMode: "hobby",
    mockRole: "USER",
    isIosPwaModalOpen: false, // 預設關閉
    openAddAssetModal: (mode) =>
        set({ isAddAssetOpen: true, addAssetMode: mode }),
    closeAddAssetModal: () => set({ isAddAssetOpen: false }),
    setMockRole: (role) => set({ mockRole: role }),
    openIosPwaModal: () => set({ isIosPwaModalOpen: true }), // 活化 Action
    closeIosPwaModal: () => set({ isIosPwaModalOpen: false }), // 活化 Action
}));
