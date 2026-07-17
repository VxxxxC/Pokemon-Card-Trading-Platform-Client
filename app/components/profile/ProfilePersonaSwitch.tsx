"use client";

import { useRouter } from "next/navigation";
import type { DualPersonaContext } from "@/lib/auth/dual-persona";
import { useUIStore } from "@/app/store/useUIStore";

type ProfilePersonaSwitchProps = {
  activeContext: "member" | "merchant";
  context: DualPersonaContext;
  className?: string;
};

function resolveTargetLabel(
  activeContext: "member" | "merchant",
  context: DualPersonaContext,
): string {
  if (activeContext === "member") {
    return context.shopName ?? context.shopHandle ?? "商戶身份";
  }

  return (
    context.memberDisplayName ??
    context.memberUsername ??
    "會員身份"
  );
}

export function ProfilePersonaSwitch({
  activeContext,
  context,
  className = "",
}: ProfilePersonaSwitchProps) {
  const router = useRouter();
  const setActiveListingPersona = useUIStore(
    (state) => state.setActiveListingPersona,
  );

  if (!context.hasDualPersona) {
    return null;
  }

  const targetHref =
    activeContext === "member" ? "/profile/merchant" : "/profile/user";
  const targetPersona = activeContext === "member" ? "merchant" : "member";
  const actionLabel =
    activeContext === "member" ? "切換至商戶身份" : "切換至會員身份";
  const targetLabel = resolveTargetLabel(activeContext, context);

  return (
    <button
      type="button"
      onClick={() => {
        setActiveListingPersona(targetPersona);
        router.push(targetHref);
      }}
      className={
        "inline-flex flex-col items-start gap-0.5 rounded-xl border border-brand/25 bg-[rgba(212,165,116,0.06)] px-3 py-2 text-left transition-colors hover:border-brand/40 hover:bg-[rgba(212,165,116,0.1)] focus:outline-none " +
        className
      }
      title={actionLabel}
    >
      <span className="font-mono text-[10px] font-bold text-brand tracking-wide">
        {actionLabel}
      </span>
      <span className="font-sans text-[11px] text-text-secondary truncate max-w-[180px]">
        {targetLabel}
      </span>
    </button>
  );
}
