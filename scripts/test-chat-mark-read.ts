/**
 * Connectivity test for rpc_mark_chat_room_read + chat_room_reads cursor.
 * Run: bun run test:chat-mark-read
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.
 * Live RPC write requires an authenticated user JWT (service role has no auth.uid()).
 * Optional: CHAT_MARK_READ_TEST_ACCESS_TOKEN for live mark-read against a real room.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const accessToken = process.env.CHAT_MARK_READ_TEST_ACCESS_TOKEN?.trim();
const explicitRoomId = process.env.CHAT_MARK_READ_TEST_ROOM_ID?.trim();

if (!url || !serviceKey) {
  console.error(
    "❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const admin = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type LobbyRoom = {
  id: string;
  unread_count?: number;
};

type LobbyPayload = {
  rooms?: LobbyRoom[];
};

async function verifyRpcSignature(): Promise<boolean> {
  const fakeRoomId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const { error } = await admin.rpc("rpc_mark_chat_room_read", {
    p_room_id: fakeRoomId,
    p_read_at: new Date().toISOString(),
  });

  if (!error) {
    console.error("❌ Expected rpc_mark_chat_room_read to reject unknown room");
    return false;
  }

  if (
    error.message.includes("does not exist") ||
    error.message.includes("Could not find the function")
  ) {
    console.error("❌ rpc_mark_chat_room_read missing or wrong signature");
    return false;
  }

  console.log(
    `✅ rpc_mark_chat_room_read callable with p_read_at (${error.message})`,
  );
  return true;
}

async function verifyChatRoomReadsTable(): Promise<boolean> {
  const { error } = await admin.from("chat_room_reads").select("user_id").limit(1);

  if (error) {
    console.error("❌ chat_room_reads table not queryable:", error.message);
    return false;
  }

  console.log("✅ chat_room_reads table exists and is queryable");
  return true;
}

async function findSampleRoomWithMessages(): Promise<{
  roomId: string;
  latestMessageAt: string;
} | null> {
  const { data: message, error } = await admin
    .from("chat_messages")
    .select("room_id, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !message?.room_id || !message.created_at) {
    if (error) {
      console.error("❌ Could not sample chat_messages:", error.message);
    }
    return null;
  }

  return {
    roomId: message.room_id,
    latestMessageAt: message.created_at,
  };
}

async function maybeRunLiveMarkRead(): Promise<boolean> {
  if (!accessToken) {
    console.log(
      "ℹ️  Set CHAT_MARK_READ_TEST_ACCESS_TOKEN (+ optional CHAT_MARK_READ_TEST_ROOM_ID) for live mark-read",
    );
    return true;
  }

  const sample = await findSampleRoomWithMessages();
  const roomId = explicitRoomId ?? sample?.roomId;
  const readAt = sample?.latestMessageAt ?? new Date().toISOString();

  if (!roomId) {
    console.log("ℹ️  No chat room with messages found for live mark-read");
    return true;
  }

  const authed = createClient<Database>(url!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const {
    data: { user },
    error: userError,
  } = await authed.auth.getUser(accessToken);

  if (userError || !user) {
    console.error("❌ CHAT_MARK_READ_TEST_ACCESS_TOKEN is invalid");
    return false;
  }

  const { error: rpcError } = await authed.rpc("rpc_mark_chat_room_read", {
    p_room_id: roomId,
    p_read_at: readAt,
  });

  if (rpcError) {
    console.error("❌ Live rpc_mark_chat_room_read failed:", rpcError.message);
    return false;
  }

  const { data: afterRow, error: readError } = await admin
    .from("chat_room_reads")
    .select("last_read_at")
    .eq("user_id", user.id)
    .eq("room_id", roomId)
    .maybeSingle();

  if (readError || !afterRow?.last_read_at) {
    console.error("❌ chat_room_reads row missing after RPC");
    return false;
  }

  console.log(
    `✅ chat_room_reads updated for user=${user.id} room=${roomId} last_read_at=${afterRow.last_read_at}`,
  );

  const { data: lobbyData, error: lobbyError } = await authed.rpc(
    "get_user_chat_inbox_lobby",
  );

  if (lobbyError) {
    console.error("❌ get_user_chat_inbox_lobby failed:", lobbyError.message);
    return false;
  }

  const payload = lobbyData as LobbyPayload | null;
  const room = payload?.rooms?.find((entry) => entry.id === roomId);
  const unread = room?.unread_count ?? null;
  console.log(`ℹ️  Lobby unread_count for room=${roomId}: ${unread ?? "n/a"}`);

  return true;
}

async function main(): Promise<void> {
  console.log("--- rpc_mark_chat_room_read / chat_room_reads check ---");

  const checks = [
    await verifyRpcSignature(),
    await verifyChatRoomReadsTable(),
    await maybeRunLiveMarkRead(),
  ];

  if (!checks.every(Boolean)) {
    process.exit(1);
  }
}

void main();
