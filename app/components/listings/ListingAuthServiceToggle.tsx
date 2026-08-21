"use client";

import { CircleHelp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LISTING_AUTH_SERVICE_TOOLTIP_TITLE,
  buildAuthServiceTooltipBody,
} from "@/lib/listings/auth-service-copy";
import { usePlatformAuthFee } from "@/lib/platform/use-platform-auth-fee";

type ListingAuthServiceToggleProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function ListingAuthServiceToggle({
  checked,
  onCheckedChange,
}: ListingAuthServiceToggleProps) {
  const authServiceFeeHkd = usePlatformAuthFee();

  return (
    <div className="bg-[#17130f] border border-brand/20 rounded-xl p-4 space-y-2 animate-fadeIn">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-sans font-bold text-[#d4c4b7] text-[12.5px]">
            接受買家加購平台鑑定
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                type="button"
                className="shrink-0 text-[#8A8680] hover:text-brand"
                aria-label="平台鑑定託管說明"
              >
                <CircleHelp className="size-4" />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-xs whitespace-pre-line text-left leading-relaxed"
              >
                <span className="font-bold block mb-1">
                  {LISTING_AUTH_SERVICE_TOOLTIP_TITLE}
                </span>
                {buildAuthServiceTooltipBody(authServiceFeeHkd)}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="data-checked:bg-brand data-unchecked:bg-[#39342f] shrink-0"
        />
      </div>
      <p className="text-[11px] text-text-secondary leading-relaxed">
        僅裸卡適用。已評級卡（PSA／CGC 等）無需平台複鑑；開啟後買家可選加購（HK$
        {authServiceFeeHkd} 由買家承擔）。
      </p>
    </div>
  );
}
