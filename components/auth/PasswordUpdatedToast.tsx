"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function PasswordUpdatedToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get("passwordUpdated") !== "1") return;

    toast.success("密碼已更新");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("passwordUpdated");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [searchParams, router, pathname]);

  return null;
}
