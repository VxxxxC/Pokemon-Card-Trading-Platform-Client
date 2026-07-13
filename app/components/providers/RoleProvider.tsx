"use client";

import { useEffect } from "react";
import { useUIStore, type AuthRole } from "@/app/store/useUIStore";
import { getCurrentUserRole } from "@/app/actions/profile";

export function RoleProvider({
  initialRole,
  children,
}: {
  initialRole: AuthRole;
  children: React.ReactNode;
}) {
  const setUserAuthRole = useUIStore((state) => state.setUserAuthRole);

  useEffect(() => {
    setUserAuthRole(initialRole);
  }, [initialRole, setUserAuthRole]);

  useEffect(() => {
    const refreshRole = async () => {
      const result = await getCurrentUserRole();
      if (result.success) {
        setUserAuthRole(result.data);
      }
    };

    void refreshRole();

    const handleFocus = () => {
      void refreshRole();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [setUserAuthRole]);

  return children;
}
