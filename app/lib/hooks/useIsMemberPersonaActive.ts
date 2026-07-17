"use client";

import { useUIStore } from "@/app/store/useUIStore";
import { isMemberPersona } from "@/lib/auth/member-persona-features";

export function useIsMemberPersonaActive(): boolean {
  const activeListingPersona = useUIStore((state) => state.activeListingPersona);
  return isMemberPersona(activeListingPersona);
}
