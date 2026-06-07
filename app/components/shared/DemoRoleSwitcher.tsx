"use client";

import { useUIStore, type DemoRole } from "@/app/store/useUIStore";
import { useRouter, usePathname } from "next/navigation";

export function DemoRoleSwitcher() {
  const mockRole = useUIStore((state) => state.mockRole);
  const setMockRole = useUIStore((state) => state.setMockRole);
  const router = useRouter();
  const pathname = usePathname();

  const handleRoleChange = (role: DemoRole) => {
    setMockRole(role);

    // 智能輔助路由導流：點擊對應角色時，若果不在該路由域內，自動定向至該後台首頁
    if (role === "USER" && !pathname.startsWith("/profile/user")) {
      router.push("/profile/user");
    } else if (
      role === "MERCHANT" &&
      !pathname.startsWith("/profile/merchant")
    ) {
      router.push("/profile/merchant");
    } else if (role === "ADMIN" && !pathname.startsWith("/admin")) {
      router.push("/admin");
    }
  };

  const roleLabelMap: Record<DemoRole, string> = {
    GUEST: "访客未登入 (GUEST / OUT)",
    USER: "一般會員 (USER)",
    MERCHANT: "特約商戶 (MERCHANT)",
    ADMIN: "平台管理員 (ADMIN)",
  };

  return (
    /* 🟢 頂級排版校準：sticky 置頂定位，精準咬合在 Navbar 下方，外加大盤黑金微弱光暈 shadow */
    <div className="sticky z-[190] w-full bg-[rgba(26,22,18,0.94)] backdrop-blur-md border-b border-[rgba(212,165,116,0.15)] px-4 py-2 flex items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.3)] animate-fadeIn">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${mockRole === "GUEST" ? "bg-error" : "bg-brand"}`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${mockRole === "GUEST" ? "bg-error" : "bg-[#d4a574]"}`}
          ></span>
        </span>
        <p className="font-mono text-[11px] text-[#d4c4b7] uppercase tracking-wider hidden sm:block">
          Sandbox Auth:{" "}
          <span
            className={
              mockRole === "GUEST"
                ? "text-error font-bold"
                : "text-brand font-bold"
            }
          >
            {roleLabelMap[mockRole]}
          </span>
        </p>
      </div>

      {/* 4重身份矩陣切換卡爪 */}
      <div className="flex gap-1 bg-[#17130f] p-0.5 rounded-lg border border-white/5">
        {(
          [
            { role: "GUEST", label: "未登入" },
            { role: "USER", label: "會員" },
            { role: "MERCHANT", label: "商戶" },
            { role: "ADMIN", label: "管理" },
          ] as const
        ).map((item) => {
          const isActive = mockRole === item.role;
          return (
            <button
              key={item.role}
              type="button"
              onClick={() => handleRoleChange(item.role)}
              className={`font-mono text-[10px] px-2.5 py-1 rounded-md transition-all active:scale-[0.95] cursor-pointer focus:outline-none ${
                isActive
                  ? item.role === "GUEST"
                    ? "bg-error text-white font-bold shadow-md"
                    : "bg-[#d4a574] text-[#1A1612] font-bold shadow-md"
                  : "text-[#8A8680] hover:text-[#eae1da]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
