"use client";

import { create } from "zustand";
import type { UnacknowledgedRewardGrant } from "@/lib/constants/rewards";

type RewardNotificationState = {
  queue: UnacknowledgedRewardGrant[];
  isOpen: boolean;
  enqueue: (grants: UnacknowledgedRewardGrant[]) => void;
  setQueue: (grants: UnacknowledgedRewardGrant[]) => void;
  open: () => void;
  close: () => void;
  clearQueue: () => void;
};

export const useRewardNotificationStore = create<RewardNotificationState>(
  (set, get) => ({
    queue: [],
    isOpen: false,
    enqueue: (grants) => {
      if (grants.length === 0) return;
      const existing = new Set(get().queue.map((g) => g.userRewardId));
      const merged = [
        ...get().queue,
        ...grants.filter((g) => !existing.has(g.userRewardId)),
      ];
      set({ queue: merged, isOpen: true });
    },
    setQueue: (grants) => {
      set({ queue: grants, isOpen: grants.length > 0 });
    },
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    clearQueue: () => set({ queue: [], isOpen: false }),
  }),
);
