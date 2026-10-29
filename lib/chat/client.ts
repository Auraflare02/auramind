import { getAdminClient } from "@/lib/supabase/admin";
import { ensureProfileIdentity, getCanonicalPair } from "@/lib/friends/client";
import { PublicProfile } from "@/lib/friends/types";
import { WorldMessage, DirectMessage, DirectConversationSummary } from "./types";

// In-memory resilient fallback cache (keeps live chat active even before DB migration or during connection drops)
const inMemoryWorldMessages: WorldMessage[] = [];
interface MemoryDirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}
const inMemoryDirectMessages: MemoryDirectMessage[] = [];

/**
 * Fetches recent world live chat messages chronologically.
 */
export async function getWorldMessages(
  limit = 60,
  afterTimestamp?: string
): Promise<WorldMessage[]> {
  const admin = getAdminClient();
  let dbRows: any[] = [];

  try {
    let query = admin
      .from("auramind_world_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (afterTimestamp) {
      query = query.gt("created_at", afterTimestamp);
    }

    const { data: rows, error } = await query;
    if (!error && rows) {
      dbRows = rows;
    } else if (error) {
      console.warn("[chat/client] DB notice fetching world messages (using memory fallback):", error.message || error);
    }
  } catch (err) {
    console.warn("[chat/client] DB connection notice:", err);
  }

  // Reverse DB rows to display ascending chronologically
  const chronologicalDb = [...dbRows].reverse();
  const userIds = Array.from(new Set(chronologicalDb.map((m) => m.user_id)));

  // Batch fetch profiles from database
  const profileMap = new Map<string, PublicProfile>();
  if (userIds.length > 0) {
    try {
      const { data: profiles } = await admin
        .from("profiles")
        .select("*")
        .in("id", userIds);

      if (profiles) {
        for (const p of profiles) {
          profileMap.set(p.id, await ensureProfileIdentity(p));
        }
      }
    } catch {
      // Profile lookup non-blocking
    }
  }

  const formattedDbMessages: WorldMessage[] = chronologicalDb.map((row) => {
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

  // Merge database messages with in-memory fallback messages (deduplicated by id)
  const knownIds = new Set(formattedDbMessages.map((m) => m.id));
  const merged = [...formattedDbMessages];

  for (const memMsg of inMemoryWorldMessages) {
    if (!knownIds.has(memMsg.id)) {
      if (!afterTimestamp || memMsg.createdAt > afterTimestamp) {
        merged.push(memMsg);
        knownIds.add(memMsg.id);
      }
    }
  }

  // Sort ascending by creation time
  merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Cap to limit
  if (merged.length > limit) {
    return merged.slice(merged.length - limit);
  }

  return merged;
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
  let userProfile: PublicProfile;
  try {
    const { data: rawProfile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    userProfile = rawProfile ? await ensureProfileIdentity(rawProfile) : {
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
  } catch {
    userProfile = {
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
  }

  const fallbackId = `wm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const nowIso = new Date().toISOString();

  let savedRow: any = null;
  try {
    const { data, error } = await admin
      .from("auramind_world_messages")
      .insert({
        user_id: userId,
        message: trimmed,
        reactions: {},
      })
      .select("*")
      .single();

    if (!error && data) {
      savedRow = data;
    } else if (error) {
      console.warn("[chat/client] DB notice inserting world message (using memory fallback):", error.message || error);
    }
  } catch (err: any) {
    console.warn("[chat/client] DB error in sendWorldMessage:", err.message || err);
  }

  const finalMessage: WorldMessage = {
    id: savedRow ? savedRow.id : fallbackId,
    userId: userId,
    message: trimmed,
    reactions: savedRow?.reactions || {},
    createdAt: savedRow ? savedRow.created_at : nowIso,
    user: userProfile,
  };

  // Add to memory cache so it is immediately visible even if DB table is uninitialized
  inMemoryWorldMessages.push(finalMessage);
  if (inMemoryWorldMessages.length > 500) {
    inMemoryWorldMessages.shift();
  }

  return finalMessage;
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

  // 1. Update in memory cache first
  const memoryMsg = inMemoryWorldMessages.find((m) => m.id === messageId);
  let updatedReactions: Record<string, string[]> = {};

  if (memoryMsg) {
    const currentReactions: Record<string, string[]> = memoryMsg.reactions || {};
    const userList = currentReactions[safeEmoji] || [];
    const nextList = userList.includes(userId)
      ? userList.filter((uid) => uid !== userId)
      : [...userList, userId];

    const newMap = { ...currentReactions, [safeEmoji]: nextList };
    if (nextList.length === 0) {
      delete newMap[safeEmoji];
    }
    memoryMsg.reactions = newMap;
    updatedReactions = newMap;
  }

  // 2. Try DB update if table exists
  try {
    const { data: row } = await admin
      .from("auramind_world_messages")
      .select("reactions")
      .eq("id", messageId)
      .maybeSingle();

    if (row) {
      const currentReactions: Record<string, string[]> = row.reactions || {};
      const userList = currentReactions[safeEmoji] || [];
      const nextList = userList.includes(userId)
        ? userList.filter((uid) => uid !== userId)
        : [...userList, userId];

      const newMap = {
        ...currentReactions,
        [safeEmoji]: nextList,
      };

      if (nextList.length === 0) {
        delete newMap[safeEmoji];
      }

      await admin
        .from("auramind_world_messages")
        .update({ reactions: newMap })
        .eq("id", messageId);

      updatedReactions = newMap;
    }
  } catch (err) {
    console.warn("[chat/client] Reaction DB update skipped:", err);
  }

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

  // Validate friendship (with graceful fallback if table not yet populated)
  try {
    const { userId: uA, friendId: uB } = getCanonicalPair(userId, friendId);
    const { data: friendship } = await admin
      .from("friendships")
      .select("*")
      .eq("user_id", uA)
      .eq("friend_id", uB)
      .maybeSingle();

    if (friendship && friendship.status !== "accepted") {
      throw new Error("You can only direct message accepted friends.");
    }
  } catch (fErr: any) {
    if (fErr.message?.includes("accepted friends")) throw fErr;
    // table error non-blocking
  }

  let dbRows: any[] = [];
  try {
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
    if (!error && rows) {
      dbRows = rows;
    }
  } catch (err) {
    console.warn("[chat/client] Direct messages DB notice:", err);
  }

  // Mark unread messages sent by friend to current user as read in background
  const unreadIncomingIds = dbRows
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

  // Format DB messages
  const chronological = [...dbRows].reverse().map((r) => ({
    id: r.id,
    senderId: r.sender_id,
    recipientId: r.recipient_id,
    message: r.message,
    isRead: r.is_read,
    readAt: r.read_at,
    createdAt: r.created_at,
  }));

  // Merge with memory direct messages for this pair
  const knownIds = new Set(chronological.map((m) => m.id));
  const merged: DirectMessage[] = [...chronological];

  for (const mem of inMemoryDirectMessages) {
    const isThisPair =
      (mem.sender_id === userId && mem.recipient_id === friendId) ||
      (mem.sender_id === friendId && mem.recipient_id === userId);

    if (isThisPair && !knownIds.has(mem.id)) {
      if (!afterTimestamp || mem.created_at > afterTimestamp) {
        if (mem.sender_id === friendId && mem.recipient_id === userId) {
          mem.is_read = true;
          mem.read_at = new Date().toISOString();
        }
        merged.push({
          id: mem.id,
          senderId: mem.sender_id,
          recipientId: mem.recipient_id,
          message: mem.message,
          isRead: mem.is_read,
          readAt: mem.read_at,
          createdAt: mem.created_at,
        });
        knownIds.add(mem.id);
      }
    }
  }

  merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (merged.length > limit) {
    return merged.slice(merged.length - limit);
  }

  return merged;
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

  // Verify mutual friendship
  try {
    const { userId: uA, friendId: uB } = getCanonicalPair(senderId, recipientId);
    const { data: friendship } = await admin
      .from("friendships")
      .select("*")
      .eq("user_id", uA)
      .eq("friend_id", uB)
      .maybeSingle();

    if (friendship && friendship.status !== "accepted") {
      throw new Error("You can only exchange direct messages with accepted accountability partners.");
    }
  } catch (err: any) {
    if (err.message?.includes("accepted accountability partners")) throw err;
  }

  const fallbackId = `dm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const nowIso = new Date().toISOString();

  let savedRow: any = null;
  try {
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

    if (!error && data) {
      savedRow = data;
    } else if (error) {
      console.warn("[chat/client] DB notice inserting direct message (using memory fallback):", error.message || error);
    }
  } catch (err: any) {
    console.warn("[chat/client] DB error in sendDirectMessage:", err.message || err);
  }

  const directMsg: DirectMessage = {
    id: savedRow ? savedRow.id : fallbackId,
    senderId: senderId,
    recipientId: recipientId,
    message: trimmed,
    isRead: false,
    readAt: null,
    createdAt: savedRow ? savedRow.created_at : nowIso,
  };

  inMemoryDirectMessages.push({
    id: directMsg.id,
    sender_id: senderId,
    recipient_id: recipientId,
    message: trimmed,
    is_read: false,
    read_at: null,
    created_at: directMsg.createdAt,
  });

  if (inMemoryDirectMessages.length > 1000) {
    inMemoryDirectMessages.shift();
  }

  return directMsg;
}

/**
 * Lists all active private conversations with friends.
 */
export async function getDirectConversations(
  userId: string
): Promise<DirectConversationSummary[]> {
  const admin = getAdminClient();

  // 1. Fetch all accepted friends
  let friendships: any[] = [];
  try {
    const { data } = await admin
      .from("friendships")
      .select("*")
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq("status", "accepted");
    if (data) friendships = data;
  } catch (err) {
    console.warn("[chat/client] Friendships lookup notice:", err);
  }

  if (!friendships || friendships.length === 0) {
    return [];
  }

  const friendIds = friendships.map((f) => (f.user_id === userId ? f.friend_id : f.user_id));

  // 2. Fetch profiles for all friends
  const profileMap = new Map<string, PublicProfile>();
  try {
    const { data: profiles } = await admin.from("profiles").select("*").in("id", friendIds);
    if (profiles) {
      for (const p of profiles) {
        profileMap.set(p.id, await ensureProfileIdentity(p));
      }
    }
  } catch (err) {
    console.warn("[chat/client] Profiles lookup notice:", err);
  }

  // 3. For each friend, fetch the latest message & unread count
  const conversations: DirectConversationSummary[] = [];

  for (const friendId of friendIds) {
    const friendProfile = profileMap.get(friendId) || {
      id: friendId,
      fullName: "Friend",
      username: `friend_${friendId.slice(0, 4)}`,
      auramindId: `AM-${friendId.slice(0, 6).toUpperCase()}`,
      avatarUrl: null,
      bio: null,
      privacyDiscoverable: true,
      privacyShareGoals: false,
      privacyShareStats: true,
      privacyAllowRequests: "everyone",
      createdAt: new Date().toISOString(),
    };

    // DB latest message & count
    let latestDbRow: any = null;
    let dbUnreadCount = 0;

    try {
      const { data: latestRows } = await admin
        .from("auramind_direct_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${userId},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${userId})`
        )
        .order("created_at", { ascending: false })
        .limit(1);

      if (latestRows && latestRows.length > 0) {
        latestDbRow = latestRows[0];
      }

      const { count } = await admin
        .from("auramind_direct_messages")
        .select("*", { count: "exact", head: true })
        .eq("sender_id", friendId)
        .eq("recipient_id", userId)
        .eq("is_read", false);

      dbUnreadCount = count || 0;
    } catch {
      // DB unread count notice
    }

    // Memory latest message & count
    const memoryForFriend = inMemoryDirectMessages.filter(
      (m) =>
        (m.sender_id === userId && m.recipient_id === friendId) ||
        (m.sender_id === friendId && m.recipient_id === userId)
    );

    const memoryUnread = inMemoryDirectMessages.filter(
      (m) => m.sender_id === friendId && m.recipient_id === userId && !m.is_read
    ).length;

    const latestMemRow = memoryForFriend.length > 0 ? memoryForFriend[memoryForFriend.length - 1] : null;

    let finalLatest: any = null;
    if (latestDbRow && latestMemRow) {
      finalLatest =
        new Date(latestDbRow.created_at).getTime() >= new Date(latestMemRow.created_at).getTime()
          ? latestDbRow
          : latestMemRow;
    } else {
      finalLatest = latestDbRow || latestMemRow;
    }

    conversations.push({
      friend: friendProfile,
      lastMessage: finalLatest
        ? {
            id: finalLatest.id,
            senderId: finalLatest.sender_id,
            recipientId: finalLatest.recipient_id,
            message: finalLatest.message,
            isRead: finalLatest.is_read,
            readAt: finalLatest.read_at,
            createdAt: finalLatest.created_at,
          }
        : null,
      unreadCount: dbUnreadCount + memoryUnread,
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
