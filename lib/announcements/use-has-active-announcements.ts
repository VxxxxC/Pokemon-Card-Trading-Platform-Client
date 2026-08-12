"use client";

import { useEffect, useState } from "react";
import { getActiveAnnouncementsForDisplay } from "@/app/actions/admin-announcements";

export function useHasActiveAnnouncements(): boolean {
  const [hasActive, setHasActive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getActiveAnnouncementsForDisplay().then((result) => {
      if (!cancelled && result.success) {
        setHasActive(result.data.length > 0);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return hasActive;
}
