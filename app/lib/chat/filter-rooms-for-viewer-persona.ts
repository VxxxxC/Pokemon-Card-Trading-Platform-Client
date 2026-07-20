import type { ChatRoom } from "@/app/store/useHkCardVaultStore";
import type { ListingSellerPersona } from "@/lib/listings/active-listing-persona";

export function resolveRoomViewerPersona(
  room: Pick<ChatRoom, "viewerPersona">,
): ListingSellerPersona {
  return room.viewerPersona ?? "member";
}

export function roomMatchesViewerPersona(
  room: Pick<ChatRoom, "viewerPersona">,
  viewerPersona: ListingSellerPersona,
): boolean {
  return resolveRoomViewerPersona(room) === viewerPersona;
}

export function filterChatRoomsForViewerPersona(
  rooms: ChatRoom[],
  viewerPersona: ListingSellerPersona,
): ChatRoom[] {
  return rooms.filter((room) => roomMatchesViewerPersona(room, viewerPersona));
}
