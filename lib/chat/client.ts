import { getAdminClient } from "@/lib/supabase/admin";
import { ensureProfileIdentity, getCanonicalPair } from "@/lib/friends/client";
import { PublicProfile } from "@/lib/friends/types";
import { WorldMessage, DirectMessage, DirectConversationSummary } from "./types";

/**
 * Fetches recent world live chat messages chronologically.
 */
export async function getWorldMessages(
  limit = 60,
  afterTimestamp?: string
): Promise<WorldMessage[]> {
  const admin = getAdminClient();
  let query = admin
    .from("auramind_world_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (afterTimestamp) {
    query = query.gt("created_at", afterTimestamp);
  }

  const { data: rows, error } = await query;
  if (error || !rows) {
    console.warn("[chat/client] Error fetching world messages:", error);
    return [];
  }

  // Reverse to display ascending chronologically
  const chronological = [...rows].reverse();
  const userIds = Array.from(new Set(chronological.map((m) => m.user_id)));

  // Batch fetch profiles
  const profileMap = new Map<string, PublicProfile>();
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("*")
      .in("id", userIds);

    if (profiles) {
      for (const p of profiles) {
        profileMap.set(p.id, await ensureProfileIdentity(p));
      }
    }
  }

  return chronological.map((row) => {
    const profile = profileMap.get(row.user_id) || {
      id: row.user_id,
      fullName: "AuraMind Pioneer",
      username: `pioneer_${row.user_id.slice(0, 4)}`,
      auramindId: `AM-${row.user_id.slice(0, 6).toUpperCase()}`,
      avatarUrl: null,
      bio: null,
      privacyDiscoverable: true,
      privacyShareGoals: false,
      privacyShareStats: true,
      privacyAllowRequests: "everyone",
      createdAt: row.created_at,
    };

    return {
      id: row.id,
      userId: row.user_id,
      message: row.message,
      reactions: row.reactions || {},
      createdAt: row.created_at,
      user: profile,
    };
  });
}

/**
 * Posts a message to the public World Live Chat.
 */
export async function sendWorldMessage(
  userId: string,
  message: string
): Promise<WorldMessage> {
  const admin = getAdminClient();
  const trimmed = message.trim();

  if (!trimmed || trimmed.length === 0) {
    throw new Error("Message cannot be empty.");
  }
  if (trimmed.length > 2000) {
    throw new Error("Message exceeds 2000 characters.");
  }

  // Get user profile
  const { data: rawProfile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  const userProfile = rawProfile ? await ensureProfileIdentity(rawProfile) : {
    id: userId,
    fullName: "AuraMind Pioneer",
    username: `pioneer_${userId.slice(0, 4)}`,
    auramindId: `AM-${userId.slice(0, 6).toUpperCase()}`,
    avatarUrl: null,
    bio: null,
    privacyDiscoverable: true,
    privacyShareGoals: false,
    privacyShareStats: true,
    privacyAllowRequests: "everyone",
    createdAt: new Date().toISOString(),
  };

  const { data, error } = await admin
    .from("auramind_world_messages")
    .insert({
      user_id: userId,
      message: trimmed,
      reactions: {},
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[chat/client] Error posting world message:", error);
    throw new Error("Failed to send message to World Chat.");
  }

  return {
    id: data.id,
    userId: data.user_id,
    message: data.message,
    reactions: data.reactions || {},
    createdAt: data.created_at,
    user: userProfile,
  };
}

/**
 * Adds or toggles an emoji reaction on a World Live Chat message.
 */
export async function addWorldReaction(
  userId: string,
  messageId: string,
  emoji: string
): Promise<Record<string, string[]>> {
  const admin = getAdminClient();
  const safeEmoji = emoji.trim().slice(0, 4);

  const { data: row, error } = await admin
    .from("auramind_world_messages")
    .select("reactions")
    .eq("id", messageId)
    .maybeSingle();

  if (error || !row) {
    throw new Error("Message not found.");
  }

  const currentReactions: Record<string, string[]> = row.reactions || {};
  const userList = currentReactions[safeEmoji] || [];

  let nextList: string[];
  if (userList.includes(userId)) {
    // Remove user reaction
    nextList = userList.filter((uid) => uid !== userId);
  } else {
    // Add user reaction
    nextList = [...userList, userId];
  }

  const updatedReactions = {
    ...currentReactions,
    [safeEmoji]: nextList,
  };

  if (nextList.length === 0) {
    delete updatedReactions[safeEmoji];
  }

  await admin
    .from("auramind_world_messages")
    .update({ reactions: updatedReactions })
    .eq("id", messageId);

  return updatedReactions;
}

/**
 * Fetches private direct chat messages between current user and an accepted friend.
 */
export async function getDirectMessages(
  userId: string,
  friendId: string,
  limit = 80,
  afterTimestamp?: string
): Promise<DirectMessage[]> {
  const admin = getAdminClient();

  // Validate friendship
  const { userId: uA, friendId: uB } = getCanonicalPair(userId, friendId);
  const { data: friendship } = await admin
    .from("friendships")
    .select("*")
    .eq("user_id", uA)
    .eq("friend_id", uB)
    .maybeSingle();

  if (!friendship || friendship.status !== "accepted") {
    throw new Error("You can only direct message accepted friends.");
  }

  let query = admin
    .from("auramind_direct_messages")
    .select("*")
    .or(
      `and(sender_id.eq.${userId},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${userId})`
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (afterTimestamp) {
    query = query.gt("created_at", afterTimestamp);
  }

  const { data: rows, error } = await query;
  if (error || !rows) {
    console.warn("[chat/client] Direct messages fetch warning:", error);
    return [];
  }

  // Mark unread messages sent by friend to current user as read in background
  const unreadIncomingIds = rows
    .filter((r) => r.sender_id === friendId && r.recipient_id === userId && !r.is_read)
    .map((r) => r.id);

  if (unreadIncomingIds.length > 0) {
    admin
      .from("auramind_direct_messages")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in("id", unreadIncomingIds)
      .then(
        () => {},
        (err) => console.warn("[chat/client] mark as read error:", err)
      );
  }

  // Reverse to chronological order
  const chronological = [...rows].reverse();

  return chronological.map((r) => ({
    id: r.id,
    senderId: r.sender_id,
    recipientId: r.recipient_id,
    message: r.message,
    isRead: r.is_read,
    readAt: r.read_at,
    createdAt: r.created_at,
  }));
}

/**
 * Sends a private direct message to an accepted friend.
 */
export async function sendDirectMessage(
  senderId: string,
  recipientId: string,
  message: string
): Promise<DirectMessage> {
  const admin = getAdminClient();
  const trimmed = message.trim();

  if (!trimmed || trimmed.length === 0) {
    throw new Error("Message cannot be empty.");
  }
  if (trimmed.length > 2000) {
    throw new Error("Message exceeds 2000 characters.");
  }

  // 1. Verify mutual friendship
  const { userId: uA, friendId: uB } = getCanonicalPair(senderId, recipientId);
  const { data: friendship } = await admin
    .from("friendships")
    .select("*")
    .eq("user_id", uA)
    .eq("friend_id", uB)
    .maybeSingle();

  if (!friendship || friendship.status !== "accepted") {
    throw new Error("You can only exchange direct messages with accepted accountability partners.");
  }

  const { data, error } = await admin
    .from("auramind_direct_messages")
    .insert({
      sender_id: senderId,
      recipient_id: recipientId,
      message: trimmed,
      is_read: false,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[chat/client] Error inserting direct message:", error);
    throw new Error("Failed to send direct message.");
  }

  return {
    id: data.id,
    senderId: data.sender_id,
    recipientId: data.recipient_id,
    message: data.message,
    isRead: data.is_read,
    readAt: data.read_at,
    createdAt: data.created_at,
  };
}

/**
 * Lists all active private conversations with friends.
 */
export async function getDirectConversations(
  userId: string
): Promise<DirectConversationSummary[]> {
  const admin = getAdminClient();

  // 1. Fetch all accepted friends
  const { data: friendships } = await admin
    .from("friendships")
    .select("*")
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq("status", "accepted");

  if (!friendships || friendships.length === 0) {
    return [];
  }

  const friendIds = friendships.map((f) => (f.user_id === userId ? f.friend_id : f.user_id));

  // 2. Fetch profiles for all friends
  const { data: profiles } = await admin.from("profiles").select("*").in("id", friendIds);
  const profileMap = new Map<string, PublicProfile>();
  if (profiles) {
    for (const p of profiles) {
      profileMap.set(p.id, await ensureProfileIdentity(p));
    }
  }

  // 3. For each friend, fetch the latest message & unread count
  const conversations: DirectConversationSummary[] = [];

  for (const friendId of friendIds) {
    const friendProfile = profileMap.get(friendId);
    if (!friendProfile) continue;

    // Fetch latest message
    const { data: latestRows } = await admin
      .from("auramind_direct_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${userId})`
      )
      .order("created_at", { ascending: false })
      .limit(1);

    // Fetch unread count
    const { count: unreadCount } = await admin
      .from("auramind_direct_messages")
      .select("*", { count: "exact", head: true })
      .eq("sender_id", friendId)
      .eq("recipient_id", userId)
      .eq("is_read", false);

    const latest = latestRows && latestRows.length > 0 ? latestRows[0] : null;

    conversations.push({
      friend: friendProfile,
      lastMessage: latest
        ? {
            id: latest.id,
            senderId: latest.sender_id,
            recipientId: latest.recipient_id,
            message: latest.message,
            isRead: latest.is_read,
            readAt: latest.read_at,
            createdAt: latest.created_at,
          }
        : null,
      unreadCount: unreadCount || 0,
    });
  }

  // Sort by latest message date (most recent first)
  conversations.sort((a, b) => {
    const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  return conversations;
}
