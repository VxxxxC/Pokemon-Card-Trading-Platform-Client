"use client";

import { useEffect, useState } from "react";
import { getCurrentUserProfile } from "@/app/actions/profile";

export function useCurrentUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getCurrentUserProfile().then((result) => {
      if (!cancelled && result.success) {
        setUserId(result.data.id);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return userId;
}
