import type { Tables } from "@/types/supabase";

export type PlatformAnnouncement = {
  id: string;
  title: string;
  imageUrl: string;
  content: string;
  linkUrl?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  priority: number;
  imageObjectKey?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlatformAnnouncementInput = {
  title: string;
  content: string;
  imageUrl: string;
  imageObjectKey?: string | null;
  linkUrl?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  priority?: number;
};

type AnnouncementRow = Tables<"platform_announcements">;

export function mapAnnouncementRow(row: AnnouncementRow): PlatformAnnouncement {
  return {
    id: row.id,
    title: row.title,
    imageUrl: row.image_url,
    content: row.content,
    linkUrl: row.link_url ?? undefined,
    startDate: row.start_date,
    endDate: row.end_date,
    isActive: row.is_active,
    priority: row.priority,
    imageObjectKey: row.image_object_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAnnouncementToDbRow(
  input: PlatformAnnouncementInput,
  createdBy?: string | null,
): Omit<AnnouncementRow, "id" | "created_at" | "updated_at"> & {
  created_by?: string | null;
} {
  return {
    title: input.title,
    content: input.content,
    image_url: input.imageUrl,
    image_object_key: input.imageObjectKey ?? null,
    link_url: input.linkUrl?.trim() || null,
    start_date: input.startDate,
    end_date: input.endDate,
    is_active: input.isActive,
    priority: input.priority ?? 0,
    created_by: createdBy ?? null,
  };
}
