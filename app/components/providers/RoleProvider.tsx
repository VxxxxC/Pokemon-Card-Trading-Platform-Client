"use client";

import { useEffect } from "react";
import { useUIStore, type DemoRole } from "@/app/store/useUIStore";
import { getCurrentUserRole } from "@/app/actions/profile";

export function RoleProvider({
  initialRole,
  children,
}: {
  initialRole: DemoRole;
  children: React.ReactNode;
}) {
  const setMockRole = useUIStore((state) => state.setMockRole);

  useEffect(() => {
    setMockRole(initialRole);
  }, [initialRole, setMockRole]);

  useEffect(() => {
    const refreshRole = async () => {
      const result = await getCurrentUserRole();
      if (result.success) {
        setMockRole(result.data);
      }
    };

    const handleFocus = () => {
      void refreshRole();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [setMockRole]);

  return children;
}
