import type { ChatRoom } from "@/app/store/useHkCardVaultStore";

export type ChatPartnerPersona = "member" | "merchant";

const PROFILE_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeChatPartnerPersona(
  persona: ChatPartnerPersona | null | undefined,
): ChatPartnerPersona {
  return persona === "merchant" ? "merchant" : "member";
}

export function isProfileUuid(value: string): boolean {
  return PROFILE_UUID_RE.test(value.trim());
}

export function buildPartnerRoomKey(
  partnerId: string,
  persona: ChatPartnerPersona,
): string {
  return `${partnerId.trim().toLowerCase()}:${persona}`;
}

export function inferPartnerPersona(room: Pick<ChatRoom, "partnerPersona" | "partnerTier">): ChatPartnerPersona {
  if (room.partnerPersona === "merchant" || room.partnerPersona === "member") {
    return room.partnerPersona;
  }

  return room.partnerTier === "專業認證商戶" ? "merchant" : "member";
}

export function partnerTierForPersona(persona: ChatPartnerPersona): string {
  return persona === "merchant" ? "專業認證商戶" : "認證用戶";
}
