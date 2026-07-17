"use client";

import { ProfileTabNav } from "@/app/components/profile/ProfileTabNav";
import type { TabItem } from "@/app/components/profile/ProfileTabNav";
import { useIsMemberPersonaActive } from "@/app/lib/hooks/useIsMemberPersonaActive";

type UserProfileTabNavProps = {
  tabs: TabItem[];
};

export function UserProfileTabNav({ tabs }: UserProfileTabNavProps) {
  const isMemberPersonaActive = useIsMemberPersonaActive();
  const visibleTabs = isMemberPersonaActive
    ? tabs
    : tabs.filter((tab) => tab.href !== "/profile/user/collection");

  return <ProfileTabNav tabs={visibleTabs} />;
}
