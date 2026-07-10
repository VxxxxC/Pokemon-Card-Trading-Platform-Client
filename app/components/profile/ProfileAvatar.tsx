"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { DEFAULT_AVATAR_URL } from "@/lib/profile/avatar";
import { cn } from "@/lib/utils";

type ProfileAvatarProps = {
  avatarUrl?: string | null;
  displayName: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  alt?: string;
};

export function ProfileAvatar({
  avatarUrl,
  displayName,
  className,
  imageClassName,
  fallbackClassName,
  alt,
}: ProfileAvatarProps) {
  const resolvedAvatarUrl = avatarUrl?.trim() || DEFAULT_AVATAR_URL;
  const fallbackInitial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <Avatar className={cn("rounded-full", className)}>
      <AvatarImage
        src={resolvedAvatarUrl}
        alt={alt ?? `${displayName} 的頭像`}
        className={imageClassName}
      />
      <AvatarFallback className={fallbackClassName}>
        {fallbackInitial}
      </AvatarFallback>
    </Avatar>
  );
}
