"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type TitleBadgeIconSize = "sm" | "md" | "lg";

const SIZE_MAP: Record<TitleBadgeIconSize, number> = {
  sm: 16,
  md: 20,
  lg: 28,
};

type TitleBadgeIconProps = {
  src: string;
  alt: string;
  size?: TitleBadgeIconSize;
  className?: string;
  fallbackText?: string;
};

export function TitleBadgeIcon({
  src,
  alt,
  size = "sm",
  className,
  fallbackText,
}: TitleBadgeIconProps) {
  const [hasError, setHasError] = useState(false);
  const dimension = SIZE_MAP[size];
  const fallback = (fallbackText ?? alt).trim().charAt(0) || "?";

  if (hasError || !src) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-bg-elevated font-mono font-bold text-text-secondary",
          className,
        )}
        style={{ width: dimension, height: dimension, fontSize: dimension * 0.45 }}
        aria-hidden={!alt}
      >
        {fallback}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={dimension}
      height={dimension}
      className={cn("object-contain shrink-0", className)}
      onError={() => setHasError(true)}
    />
  );
}
