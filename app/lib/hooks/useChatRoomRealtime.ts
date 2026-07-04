"use client";

import { useEffect, useRef } from "react";
import { getOfferCardContext } from "@/app/actions/offers";
import { isDbChatRoomId } from "@/app/lib/chat/constants";
import {
  decodeOfferRealtimeEvent,
  getLastPersistedMessageTimestamp,
  mapChatMessageRowToStoreMessage,
  parseModifyOfferPriceFromContent,
  type RealtimeChatMessageRow,
} from "@/app/lib/chat/realtimeChatMessages";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/client";
import { useHkCardVaultStore } from "@/app/store/useHkCardVaultStore";

type UseChatRoomRealtimeOptions = {
  enabled: boolean;
};

function isRealtimeDbRoom(roomId: string): boolean {
  return isDbChatRoomId(roomId);
}

async function removeChatInboxChannels(
  supabase: ReturnType<typeof createClient>,
) {
  const staleChannels = supabase
    .getChannels()
    .filter((activeChannel) => activeChannel.topic.startsWith("realtime:chat-inbox"));

  await Promise.all(
    staleChannels.map((activeChannel) => supabase.removeChannel(activeChannel)),
  );
}

export function useChatRoomRealtime({ enabled }: UseChatRoomRealtimeOptions) {
  const processingRef = useRef(false);
  const subscribingRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!isSupabaseConfigured()) {
      return;
    }

    let cancelled = false;
    const supabase = createClient();
    const currentUserIdRef = { current: null as string | null };
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const syncRealtimeAuth = async (): Promise<string | null> => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }

      return session?.user?.id ?? null;
    };

    const processRow = async (row: RealtimeChatMessageRow) => {
      const currentUserId = currentUserIdRef.current;
      if (cancelled || !currentUserId || !isRealtimeDbRoom(row.room_id)) {
        return;
      }

      const {
        appendRoomMessage,
        applyOfferAccepted,
        applyOfferRejected,
        applyOfferPriceSync,
      } = useHkCardVaultStore.getState();

      const message = mapChatMessageRowToStoreMessage(row, currentUserId);
      appendRoomMessage(row.room_id, message);

      const event = decodeOfferRealtimeEvent(row);
      if (!event) {
        return;
      }

      if (event.type === "accepted") {
        applyOfferAccepted(event.offerId, event.memberOrderId);
        return;
      }

      if (event.type === "rejected") {
        applyOfferRejected(event.offerId);
        return;
      }

      const parsedPrice = parseModifyOfferPriceFromContent(row.content);
      if (parsedPrice != null) {
        const ledgerEntry = useHkCardVaultStore.getState().offers[event.offerId];
        applyOfferPriceSync({
          offerId: event.offerId,
          offerPrice: parsedPrice,
          modifiedCount: (ledgerEntry?.modifiedCount ?? 0) + 1,
        });
        return;
      }

      const result = await getOfferCardContext(event.offerId);
      if (!result.success || cancelled) {
        return;
      }

      applyOfferPriceSync({
        offerId: event.offerId,
        offerPrice: result.data.offer.offer_price,
        modifiedCount: result.data.offer.modified_count,
      });
    };

    const reconcileRoom = async (roomId: string): Promise<void> => {
      const activeRoom = useHkCardVaultStore
        .getState()
        .chats.find((room) => room.id === roomId);
      const since = activeRoom
        ? getLastPersistedMessageTimestamp(activeRoom.messages)
        : null;

      let query = supabase
        .from("chat_messages")
        .select(
          "id, room_id, content, created_at, sender_id, offer_id, member_order_id, is_system_warning",
        )
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (since) {
        query = query.gt("created_at", since);
      }

      const { data, error } = await query;

      if (cancelled || error || !data) {
        if (error) {
          console.error(
            "[useChatRoomRealtime] reconcile",
            roomId,
            error.message,
          );
        }
        return;
      }

      for (const row of data as RealtimeChatMessageRow[]) {
        if (cancelled) {
          return;
        }
        await processRow(row);
      }
    };

    const reconcileMissedMessages = async () => {
      if (processingRef.current || cancelled || !currentUserIdRef.current) {
        return;
      }

      processingRef.current = true;

      try {
        const dbRooms = useHkCardVaultStore
          .getState()
          .chats.filter((room) => isDbChatRoomId(room.id));

        for (const room of dbRooms) {
          if (cancelled) {
            return;
          }
          await reconcileRoom(room.id);
        }
      } finally {
        processingRef.current = false;
      }
    };

    const teardownChannel = async () => {
      if (channel) {
        const activeChannel = channel;
        channel = null;
        await supabase.removeChannel(activeChannel);
      }

      await removeChatInboxChannels(supabase);
    };

    const subscribe = async () => {
      if (subscribingRef.current || cancelled) {
        return;
      }

      subscribingRef.current = true;

      try {
        const userId = await syncRealtimeAuth();
        if (cancelled || !userId) {
          return;
        }

        currentUserIdRef.current = userId;
        await teardownChannel();

        if (cancelled) {
          return;
        }

        const channelName = `chat-inbox:${userId}`;
        channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "chat_messages",
            },
            (payload) => {
              void processRow(payload.new as RealtimeChatMessageRow);
            },
          )
          .subscribe((status, err) => {
            if (status === "SUBSCRIBED") {
              void reconcileMissedMessages();
              return;
            }

            if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              console.error(
                "[useChatRoomRealtime] channel",
                status,
                err?.message ?? "",
              );
            }
          });
      } finally {
        subscribingRef.current = false;
      }
    };

    void subscribe();

    let prevDbRoomIds = useHkCardVaultStore
      .getState()
      .chats.filter((room) => isDbChatRoomId(room.id))
      .map((room) => room.id)
      .sort()
      .join(",");

    const unsubscribeStore = useHkCardVaultStore.subscribe((state) => {
      if (cancelled || !currentUserIdRef.current) {
        return;
      }

      const nextDbRoomIds = state.chats
        .filter((room) => isDbChatRoomId(room.id))
        .map((room) => room.id)
        .sort()
        .join(",");

      if (prevDbRoomIds === nextDbRoomIds) {
        return;
      }

      prevDbRoomIds = nextDbRoomIds;
      void reconcileMissedMessages();
    });

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) {
        return;
      }

      if (session?.access_token) {
        void supabase.realtime.setAuth(session.access_token);
      }

      const nextUserId = session?.user?.id ?? null;
      if (!nextUserId) {
        currentUserIdRef.current = null;
        return;
      }

      if (nextUserId !== currentUserIdRef.current) {
        currentUserIdRef.current = nextUserId;
        void subscribe();
      }
    });

    return () => {
      cancelled = true;
      unsubscribeStore();
      authSubscription.unsubscribe();
      void teardownChannel();
    };
  }, [enabled]);
}
