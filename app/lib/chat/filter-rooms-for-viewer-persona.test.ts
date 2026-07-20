import { describe, expect, test } from "bun:test";
import type { ChatRoom } from "@/app/store/useHkCardVaultStore";
import {
  filterChatRoomsForViewerPersona,
  roomMatchesViewerPersona,
} from "@/app/lib/chat/filter-rooms-for-viewer-persona";

const PARTNER_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

function makeRoom(overrides: Partial<ChatRoom> & Pick<ChatRoom, "id">): ChatRoom {
  return {
    id: overrides.id,
    partnerId: overrides.partnerId ?? PARTNER_ID,
    partnerPersona: overrides.partnerPersona ?? "member",
    viewerPersona: overrides.viewerPersona,
    partnerName: overrides.partnerName ?? "Test Partner",
    partnerAvatarUrl: overrides.partnerAvatarUrl ?? "/asset/default-avator.webp",
    partnerTier: overrides.partnerTier ?? "認證用戶",
    lastMessage: overrides.lastMessage ?? "hello",
    unreadCount: overrides.unreadCount ?? 0,
    timestamp: overrides.timestamp ?? "2026-07-18T10:00:00.000Z",
    messages: overrides.messages ?? [],
  };
}

describe("filterChatRoomsForViewerPersona", () => {
  test("keeps only rooms for the active viewer persona", () => {
    const memberRoom = makeRoom({
      id: "11111111-1111-4111-8111-111111111111",
      viewerPersona: "member",
    });
    const merchantRoom = makeRoom({
      id: "22222222-2222-4222-8222-222222222222",
      viewerPersona: "merchant",
    });

    expect(
      filterChatRoomsForViewerPersona(
        [memberRoom, merchantRoom],
        "merchant",
      ).map((room) => room.id),
    ).toEqual([merchantRoom.id]);
  });

  test("defaults missing viewerPersona to member", () => {
    const legacyRoom = makeRoom({
      id: "11111111-1111-4111-8111-111111111111",
    });

    expect(roomMatchesViewerPersona(legacyRoom, "member")).toBe(true);
    expect(roomMatchesViewerPersona(legacyRoom, "merchant")).toBe(false);
  });
});
