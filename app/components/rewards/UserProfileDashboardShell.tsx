"use client";

import type { ReactNode } from "react";
import { RewardNotificationHost } from "@/app/components/rewards/RewardNotificationHost";

export function UserProfileDashboardShell({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <RewardNotificationHost />
    </>
  );
}
