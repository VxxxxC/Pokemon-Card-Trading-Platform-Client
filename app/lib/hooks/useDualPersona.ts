"use client";

import { useEffect, useState } from "react";
import { getDualPersonaContext } from "@/app/actions/profile";
import {
  EMPTY_DUAL_PERSONA_CONTEXT,
  type DualPersonaContext,
} from "@/lib/auth/dual-persona";

export function useDualPersona(): {
  context: DualPersonaContext;
  isLoading: boolean;
} {
  const [context, setContext] = useState<DualPersonaContext>(
    EMPTY_DUAL_PERSONA_CONTEXT,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void getDualPersonaContext()
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setContext(result.data);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { context, isLoading };
}
