"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/client";

function readSupabaseUserIdFromStorage(): string | null {
  if (typeof window === "undefined" || !isSupabaseConfigured()) {
    return null;
  }

  for (const key of Object.keys(localStorage)) {
    if (!key.endsWith("-auth-token")) {
      continue;
    }

    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        continue;
      }

      const parsed = JSON.parse(raw) as {
        user?: { id?: string };
      };

      return parsed.user?.id ?? null;
    } catch {
      continue;
    }
  }

  return null;
}

export function useCurrentUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(() =>
    readSupabaseUserIdFromStorage(),
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    let cancelled = false;
    const supabase = createClient();

    const syncUserId = (nextId: string | null) => {
      if (!cancelled) {
        setUserId(nextId);
      }
    };

    void supabase.auth.getSession().then(({ data }) => {
      syncUserId(data.session?.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUserId(session?.user?.id ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return userId;
}
