"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/app/store/useUIStore";
import { resolveActiveListingPersona } from "@/lib/listings/active-listing-persona";

export function ActiveListingPersonaSync() {
  const pathname = usePathname();
  const userAuthRole = useUIStore((state) => state.userAuthRole);
  const setActiveListingPersona = useUIStore(
    (state) => state.setActiveListingPersona,
  );

  useEffect(() => {
    // Wait for RoleProvider hydration — resolving as GUEST would persist "member"
    // and overwrite a merchant persona already stored in sessionStorage.
    if (userAuthRole === "GUEST") {
      return;
    }

    const persona = resolveActiveListingPersona({
      userAuthRole,
      pathname,
    });
    setActiveListingPersona(persona);
  }, [pathname, setActiveListingPersona, userAuthRole]);

  return null;
}
