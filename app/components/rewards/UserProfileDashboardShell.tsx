"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";

const RewardNotificationHost = dynamic(
  () =>
    import("@/app/components/rewards/RewardNotificationHost").then((module) => ({
      default: module.RewardNotificationHost,
    })),
  { ssr: false },
);

export function UserProfileDashboardShell({ children }: { children: ReactNode }) {
  const [showRewards, setShowRewards] = useState(false);

  useEffect(() => {
    const schedule = () => setShowRewards(true);

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(schedule, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }

    const timer = setTimeout(schedule, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {children}
      {showRewards ? <RewardNotificationHost /> : null}
    </>
  );
}
