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
  buildListingAuthServiceInlineSummary,
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
    <div className="bg-[#17130f] border border-brand/20 rounded-lg px-3 py-2 animate-fadeIn">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-sans font-bold text-[#d4c4b7] text-[12px]">
            接受買家加購平台鑑定
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                type="button"
                className="shrink-0 text-[#8A8680] hover:text-brand focus:outline-none"
                aria-label="平台鑑定託管說明"
              >
                <CircleHelp className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-xs whitespace-pre-line text-left leading-relaxed"
              >
                <span className="font-bold block mb-1">
                  {LISTING_AUTH_SERVICE_TOOLTIP_TITLE}
                </span>
                <span className="block mb-2 text-text-secondary text-[11px]">
                  {buildListingAuthServiceInlineSummary(authServiceFeeHkd)}
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
    </div>
  );
}
