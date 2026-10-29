import { getAdminClient } from "@/lib/supabase/admin";
import {
  FriendshipStatus,
  PublicProfile,
  FriendSummary,
  FriendRequest,
  FriendActivity,
  SharedGoal,
  FriendProfileDetails,
  FriendsDashboardData,
} from "./types";

/**
 * Returns canonical user ordering: (minId, maxId)
 * Guarantees exactly one unique row per user pair.
 */
export function getCanonicalPair(userA: string, userB: string): { userId: string; friendId: string } {
  if (userA === userB) {
    throw new Error("Cannot form friendship pair with self.");
  }
  return userA < userB
    ? { userId: userA, friendId: userB }
    : { userId: userB, friendId: userA };
}

/**
 * Ensures a profile record has a valid public username and AuraMind ID.
 */
export async function ensureProfileIdentity(profile: any): Promise<PublicProfile> {
  const admin = getAdminClient();
  let username = profile.username;
  let auramindId = profile.auramind_id;
  let needsUpdate = false;

  if (!auramindId) {
    auramindId = `AM-${profile.id.replace(/-/g, "").substring(0, 6).toUpperCase()}`;
    needsUpdate = true;
  }

  if (!username) {
    const base = (profile.full_name || "user")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .substring(0, 15);
    const suffix = profile.id.replace(/-/g, "").substring(0, 4).toLowerCase();
    username = `${base}_${suffix}`;
    needsUpdate = true;
  }

  if (needsUpdate) {
    try {
      await admin
        .from("profiles")
        .update({
          username,
          auramind_id: auramindId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
    } catch {
      // Non-fatal if concurrent write occurs
    }
  }

  return {
    id: profile.id,
    fullName: profile.full_name || "AuraMind Pioneer",
    username: username || `user_${profile.id.slice(0, 6)}`,
    auramindId: auramindId || `AM-${profile.id.slice(0, 6).toUpperCase()}`,
    avatarUrl: profile.avatar_url || null,
    bio: profile.bio || null,
    privacyDiscoverable: profile.privacy_discoverable !== false,
    privacyShareGoals: Boolean(profile.privacy_share_goals),
    privacyShareStats: profile.privacy_share_stats !== false,
    privacyAllowRequests: profile.privacy_allow_requests || "everyone",
    createdAt: profile.created_at || new Date().toISOString(),
  };
}

/**
 * Searches for users by public username, full name, email, or unique AuraMind ID.
 * Excludes private/non-discoverable profiles and blocked relationships.
 */
export async function searchUsers(
  currentUserId: string,
  query: string
): Promise<Array<{ profile: PublicProfile; status: FriendshipStatus }>> {
  const admin = getAdminClient();
  const rawQuery = query.trim();
  const cleaned = rawQuery.replace(/^@/, "").toLowerCase();

  if (!cleaned || cleaned.length < 2) {
    return [];
  }

  // 1. Fetch potential matches from profiles across username, full_name, email, auramind_id
  const pattern = `%${cleaned}%`;
  const isAmPattern = cleaned.toUpperCase().startsWith("AM-")
    ? cleaned.toUpperCase()
    : `AM-${cleaned.toUpperCase()}`;

  const orClauses = [
    `username.ilike.${pattern}`,
    `full_name.ilike.${pattern}`,
    `email.ilike.${pattern}`,
    `auramind_id.ilike.${pattern}`,
    `auramind_id.eq.${isAmPattern}`,
  ];

  let { data: rawProfiles, error: searchErr } = await admin
    .from("profiles")
    .select("*")
    .neq("id", currentUserId)
    .or(orClauses.join(","))
    .limit(25);

  let candidates: any[] = rawProfiles || [];

  // Fallback 1: If no profile match found, check if auth.users has an account with this email/name
  if (candidates.length === 0) {
    try {
      const { data: authData } = await admin.auth.admin.listUsers({ perPage: 50 });
      if (authData?.users) {
        for (const u of authData.users) {
          if (u.id === currentUserId) continue;
          const uEmail = (u.email || "").toLowerCase();
          const uName = (u.user_metadata?.full_name || u.user_metadata?.name || "").toLowerCase();
          if (uEmail.includes(cleaned) || uName.includes(cleaned)) {
            // Check if profile exists
            const { data: existingP } = await admin.from("profiles").select("*").eq("id", u.id).maybeSingle();
            if (existingP) {
              candidates.push(existingP);
            } else {
              const newP = {
                id: u.id,
                full_name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "Pioneer",
                email: u.email || "",
                avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
                created_at: u.created_at || new Date().toISOString(),
              };
              await admin.from("profiles").upsert(newP, { onConflict: "id" });
              candidates.push(newP);
            }
          }
        }
      }
    } catch (err) {
      console.warn("[searchUsers] auth.admin check error:", err);
    }
  }

  if (candidates.length === 0) {
    return [];
  }

  // 2. Fetch existing relationships between current user and candidate users
  const candidateIds = candidates.map((p) => p.id);
  const { data: relationships } = await admin
    .from("friendships")
    .select("*")
    .or(
      `and(user_id.eq.${currentUserId},friend_id.in.(${candidateIds.join(",")})),and(friend_id.eq.${currentUserId},user_id.in.(${candidateIds.join(",")}))`
    );

  const relMap = new Map<string, any>();
  if (relationships) {
    for (const r of relationships) {
      const otherId = r.user_id === currentUserId ? r.friend_id : r.user_id;
      relMap.set(otherId, r);
    }
  }

  const results: Array<{ profile: PublicProfile; status: FriendshipStatus }> = [];

  for (const raw of candidates) {
    // Check discoverability: must be discoverable or already have a relationship
    const rel = relMap.get(raw.id);
    if (!rel && raw.privacy_discoverable === false) {
      continue;
    }

    let status: FriendshipStatus = "none";
    if (rel) {
      if (rel.status === "accepted") {
        status = "accepted";
      } else if (rel.status === "pending") {
        status = rel.action_user_id === currentUserId ? "pending_sent" : "pending_received";
      } else if (rel.status === "blocked") {
        status = rel.action_user_id === currentUserId ? "blocked" : "blocked_by";
      } else if (rel.status === "rejected") {
        status = "rejected";
      }
    }

    // Hide users who blocked current user
    if (status === "blocked_by") {
      continue;
    }

    const publicProfile = await ensureProfileIdentity(raw);
    results.push({ profile: publicProfile, status });
  }

  return results;
}

/**
 * Loads all data needed for the /friends dashboard:
 * - Accepted friends list with telemetry
 * - Incoming pending requests
 * - Outgoing pending requests
 * - Recent friendship activity
 */
export async function getDashboardFriendsData(currentUserId: string): Promise<FriendsDashboardData> {
  const admin = getAdminClient();

  // 1. Fetch all friendships involving current user
  const { data: friendships, error: friendErr } = await admin
    .from("friendships")
    .select("*")
    .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
    .order("updated_at", { ascending: false });

  if (friendErr) {
    console.error("[friends] Error fetching friendships:", friendErr);
  }

  const acceptedList: FriendSummary[] = [];
  const incomingList: FriendRequest[] = [];
  const outgoingList: FriendRequest[] = [];
  const blockedList: PublicProfile[] = [];

  const otherUserIds: string[] = [];
  const friendshipRecords = friendships || [];

  for (const f of friendshipRecords) {
    const otherId = f.user_id === currentUserId ? f.friend_id : f.user_id;
    otherUserIds.push(otherId);
  }

  // 2. Batch fetch profiles for all related users
  const profileMap = new Map<string, PublicProfile>();
  if (otherUserIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("*")
      .in("id", otherUserIds);

    if (profiles) {
      for (const p of profiles) {
        profileMap.set(p.id, await ensureProfileIdentity(p));
      }
    }
  }

  // 3. Batch fetch focus session and goal counts for accepted friends
  const acceptedFriendIds = friendshipRecords
    .filter((f) => f.status === "accepted")
    .map((f) => (f.user_id === currentUserId ? f.friend_id : f.user_id));

  const statsMap = new Map<string, { totalFocusMin: number; totalXp: number; activeGoals: number }>();
  const sharedGoalsCountMap = new Map<string, number>();

  if (acceptedFriendIds.length > 0) {
    try {
      // Shared goals count
      const { data: goals } = await admin
        .from("requests")
        .select("id, user_id, status, is_shared_with_friends")
        .in("user_id", acceptedFriendIds);

      if (goals) {
        for (const g of goals) {
          const prev = statsMap.get(g.user_id) || { totalFocusMin: 0, totalXp: 50, activeGoals: 0 };
          if (g.status !== "completed" && g.status !== "archived") {
            prev.activeGoals += 1;
          }
          statsMap.set(g.user_id, prev);

          if (g.is_shared_with_friends) {
            sharedGoalsCountMap.set(g.user_id, (sharedGoalsCountMap.get(g.user_id) || 0) + 1);
          }
        }
      }

      // Focus sessions
      const { data: sessions } = await admin
        .from("auramind_focus_sessions")
        .select("user_id, duration_min, xp_awarded")
        .in("user_id", acceptedFriendIds);

      if (sessions) {
        for (const s of sessions) {
          const prev = statsMap.get(s.user_id) || { totalFocusMin: 0, totalXp: 50, activeGoals: 0 };
          prev.totalFocusMin += s.duration_min || 0;
          prev.totalXp += s.xp_awarded || 0;
          statsMap.set(s.user_id, prev);
        }
      }
    } catch (statErr) {
      console.warn("[friends] Error aggregating stats:", statErr);
    }
  }

  // 4. Organize into Accepted, Incoming, and Outgoing lists
  for (const f of friendshipRecords) {
    const otherId = f.user_id === currentUserId ? f.friend_id : f.user_id;
    const profile = profileMap.get(otherId);
    if (!profile) continue;

    if (f.status === "accepted") {
      const stats = profile.privacyShareStats !== false ? statsMap.get(otherId) : undefined;
      acceptedList.push({
        id: profile.id,
        fullName: profile.fullName,
        username: profile.username,
        auramindId: profile.auramindId,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        friendshipId: f.id,
        friendsSince: f.updated_at || f.created_at,
        stats,
        sharedGoalsCount: sharedGoalsCountMap.get(otherId) || 0,
      });
    } else if (f.status === "pending") {
      const isSender = f.action_user_id === currentUserId;
      if (isSender) {
        outgoingList.push({
          id: f.id,
          targetUserId: otherId,
          user: profile,
          createdAt: f.created_at,
          direction: "outgoing",
        });
      } else {
        incomingList.push({
          id: f.id,
          targetUserId: otherId,
          user: profile,
          createdAt: f.created_at,
          direction: "incoming",
        });
      }
    } else if (f.status === "blocked") {
      if (f.action_user_id === currentUserId) {
        blockedList.push(profile);
      }
    }
  }

  // 5. Fetch friendship activities
  let activities: FriendActivity[] = [];
  try {
    const { data: actRows } = await admin
      .from("friendship_activities")
      .select("*, actor:actor_id(id, full_name, username, avatar_url)")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (actRows) {
      activities = actRows.map((a: any) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        message: a.message,
        actor: {
          id: a.actor?.id || a.actor_id,
          fullName: a.actor?.full_name || "AuraMind Friend",
          username: a.actor?.username || "friend",
          avatarUrl: a.actor?.avatar_url || null,
        },
        isRead: Boolean(a.is_read),
        createdAt: a.created_at,
        metadata: a.metadata,
      }));
    }
  } catch {
    // Non-blocking if table is empty
  }

  return {
    friends: acceptedList,
    incomingRequests: incomingList,
    outgoingRequests: outgoingList,
    blockedUsers: blockedList,
    activities,
    stats: {
      totalFriends: acceptedList.length,
      pendingIncomingCount: incomingList.length,
      pendingOutgoingCount: outgoingList.length,
      unreadActivitiesCount: activities.filter((a) => !a.isRead).length,
      blockedCount: blockedList.length,
    },
  };
}

/**
 * Sends a friend request to a target user.
 */
export async function sendFriendRequest(
  currentUserId: string,
  targetUserIdOrUsername: string
): Promise<{ success: boolean; message: string; status: FriendshipStatus }> {
  const admin = getAdminClient();

  // 1. Resolve target user
  let targetProfile: any = null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserIdOrUsername.trim());

  if (isUuid) {
    const { data } = await admin.from("profiles").select("*").eq("id", targetUserIdOrUsername.trim()).maybeSingle();
    targetProfile = data;
  }

  if (!targetProfile) {
    const cleaned = targetUserIdOrUsername.trim().replace(/^@/, "").toLowerCase();
    const formattedAmId = cleaned.toUpperCase().startsWith("AM-")
      ? cleaned.toUpperCase()
      : `AM-${cleaned.toUpperCase()}`;

    // 1. Try AuraMind ID exact
    const { data: byId } = await admin.from("profiles").select("*").eq("auramind_id", formattedAmId).maybeSingle();
    targetProfile = byId;

    // 2. Try username exact
    if (!targetProfile) {
      const { data: byUser } = await admin.from("profiles").select("*").ilike("username", cleaned).maybeSingle();
      targetProfile = byUser;
    }

    // 3. Try email exact or ilike
    if (!targetProfile) {
      const { data: byEmail } = await admin.from("profiles").select("*").ilike("email", cleaned).maybeSingle();
      targetProfile = byEmail;
    }

    // 4. Try full_name substring
    if (!targetProfile) {
      const { data: byName } = await admin.from("profiles").select("*").ilike("full_name", `%${cleaned}%`).limit(1).maybeSingle();
      targetProfile = byName;
    }

    // 5. Try auth.users directly
    if (!targetProfile) {
      try {
        const { data: authData } = await admin.auth.admin.listUsers({ perPage: 50 });
        if (authData?.users) {
          const match = authData.users.find(
            (u) =>
              (u.email && u.email.toLowerCase() === cleaned) ||
              (u.user_metadata?.full_name && u.user_metadata.full_name.toLowerCase().includes(cleaned))
          );
          if (match) {
            const newP = {
              id: match.id,
              full_name: match.user_metadata?.full_name || match.email?.split("@")[0] || "Pioneer",
              email: match.email || "",
              avatar_url: match.user_metadata?.avatar_url || null,
              created_at: match.created_at || new Date().toISOString(),
            };
            await admin.from("profiles").upsert(newP, { onConflict: "id" });
            targetProfile = newP;
          }
        }
      } catch (err) {
        console.warn("[sendFriendRequest] auth fallback:", err);
      }
    }
  }

  if (!targetProfile) {
    throw new Error("User not found. Please verify the username, email, or AuraMind ID.");
  }

  if (targetProfile.id === currentUserId) {
    throw new Error("You cannot send a friend request to yourself.");
  }

  if (targetProfile.privacy_allow_requests === "none") {
    throw new Error("This user has disabled incoming friend requests.");
  }

  const { userId, friendId } = getCanonicalPair(currentUserId, targetProfile.id);

  // 2. Check existing relationship
  const { data: existing } = await admin
    .from("friendships")
    .select("*")
    .eq("user_id", userId)
    .eq("friend_id", friendId)
    .maybeSingle();

  if (existing) {
    if (existing.status === "accepted") {
      return { success: true, message: "You are already friends.", status: "accepted" };
    }
    if (existing.status === "blocked") {
      if (existing.action_user_id === currentUserId) {
        throw new Error("You have blocked this user. Unblock them first to connect.");
      } else {
        throw new Error("Unable to send friend request to this user.");
      }
    }
    if (existing.status === "pending") {
      if (existing.action_user_id === currentUserId) {
        return { success: true, message: "Friend request is already pending.", status: "pending_sent" };
      } else {
        // The other user already sent a request to current user! Auto-accept into mutual friendship
        await acceptFriendRequest(currentUserId, targetProfile.id);
        return { success: true, message: "You both connected! Friendship accepted.", status: "accepted" };
      }
    }
  }

  // 3. Insert or update to pending
  const now = new Date().toISOString();
  const { error: upsertErr } = await admin.from("friendships").upsert(
    {
      user_id: userId,
      friend_id: friendId,
      status: "pending",
      action_user_id: currentUserId,
      created_at: existing?.created_at || now,
      updated_at: now,
    },
    { onConflict: "user_id,friend_id" }
  );

  if (upsertErr) {
    console.error("[friends] sendFriendRequest error:", upsertErr);
    throw new Error("Failed to send friend request. Please try again.");
  }

  // 4. Create notification activity for recipient
  try {
    const { data: senderProfile } = await admin
      .from("profiles")
      .select("full_name, username")
      .eq("id", currentUserId)
      .maybeSingle();

    const senderName = senderProfile?.full_name || `@${senderProfile?.username || "Someone"}`;

    await admin.from("friendship_activities").insert({
      user_id: targetProfile.id,
      actor_id: currentUserId,
      type: "request_received",
      title: "New Friend Request",
      message: `${senderName} sent you a friend request on AuraMind.`,
      is_read: false,
    });
  } catch (actErr) {
    console.warn("[friends] Failed to record activity:", actErr);
  }

  return { success: true, message: "Friend request sent successfully.", status: "pending_sent" };
}

/**
 * Accepts an incoming friend request.
 */
export async function acceptFriendRequest(
  currentUserId: string,
  senderUserId: string
): Promise<{ success: boolean; message: string }> {
  const admin = getAdminClient();
  const { userId, friendId } = getCanonicalPair(currentUserId, senderUserId);

  const { data: existing } = await admin
    .from("friendships")
    .select("*")
    .eq("user_id", userId)
    .eq("friend_id", friendId)
    .maybeSingle();

  if (!existing || existing.status !== "pending") {
    throw new Error("No pending friend request found to accept.");
  }

  if (existing.action_user_id === currentUserId) {
    throw new Error("You cannot accept your own outgoing request.");
  }

  const now = new Date().toISOString();
  const { error } = await admin
    .from("friendships")
    .update({
      status: "accepted",
      action_user_id: currentUserId,
      updated_at: now,
    })
    .eq("id", existing.id);

  if (error) {
    console.error("[friends] acceptFriendRequest error:", error);
    throw new Error("Failed to accept friend request.");
  }

  // Notify the sender that request was accepted
  try {
    const { data: acceptorProfile } = await admin
      .from("profiles")
      .select("full_name, username")
      .eq("id", currentUserId)
      .maybeSingle();

    const acceptorName = acceptorProfile?.full_name || `@${acceptorProfile?.username || "AuraMind User"}`;

    await admin.from("friendship_activities").insert({
      user_id: senderUserId,
      actor_id: currentUserId,
      type: "request_accepted",
      title: "Friend Request Accepted",
      message: `${acceptorName} accepted your friend request. You are now accountability partners!`,
      is_read: false,
    });
  } catch (actErr) {
    console.warn("[friends] Failed to record accept activity:", actErr);
  }

  return { success: true, message: "Friend request accepted." };
}

/**
 * Rejects an incoming friend request.
 */
export async function rejectFriendRequest(
  currentUserId: string,
  senderUserId: string
): Promise<{ success: boolean; message: string }> {
  const admin = getAdminClient();
  const { userId, friendId } = getCanonicalPair(currentUserId, senderUserId);

  const { data: existing } = await admin
    .from("friendships")
    .select("*")
    .eq("user_id", userId)
    .eq("friend_id", friendId)
    .maybeSingle();

  if (!existing || existing.status !== "pending") {
    throw new Error("No pending friend request found.");
  }

  if (existing.action_user_id === currentUserId) {
    throw new Error("Use cancel to cancel your own outgoing request.");
  }

  // Deleting the record cleanly clears the request and permits future requests
  const { error } = await admin.from("friendships").delete().eq("id", existing.id);
  if (error) {
    console.error("[friends] rejectFriendRequest error:", error);
    throw new Error("Failed to decline friend request.");
  }

  return { success: true, message: "Friend request declined." };
}

/**
 * Cancels an outgoing pending friend request.
 */
export async function cancelFriendRequest(
  currentUserId: string,
  recipientUserId: string
): Promise<{ success: boolean; message: string }> {
  const admin = getAdminClient();
  const { userId, friendId } = getCanonicalPair(currentUserId, recipientUserId);

  const { data: existing } = await admin
    .from("friendships")
    .select("*")
    .eq("user_id", userId)
    .eq("friend_id", friendId)
    .maybeSingle();

  if (!existing || existing.status !== "pending") {
    throw new Error("No pending friend request found to cancel.");
  }

  if (existing.action_user_id !== currentUserId) {
    throw new Error("You can only cancel requests you sent.");
  }

  const { error } = await admin.from("friendships").delete().eq("id", existing.id);
  if (error) {
    console.error("[friends] cancelFriendRequest error:", error);
    throw new Error("Failed to cancel friend request.");
  }

  return { success: true, message: "Friend request cancelled." };
}

/**
 * Removes an existing accepted friend.
 */
export async function removeFriend(
  currentUserId: string,
  friendUserId: string
): Promise<{ success: boolean; message: string }> {
  const admin = getAdminClient();
  const { userId, friendId } = getCanonicalPair(currentUserId, friendUserId);

  const { data: existing } = await admin
    .from("friendships")
    .select("*")
    .eq("user_id", userId)
    .eq("friend_id", friendId)
    .maybeSingle();

  if (!existing || existing.status !== "accepted") {
    throw new Error("Friendship not found.");
  }

  const { error } = await admin.from("friendships").delete().eq("id", existing.id);
  if (error) {
    console.error("[friends] removeFriend error:", error);
    throw new Error("Failed to remove friend.");
  }

  return { success: true, message: "Friend removed." };
}

/**
 * Blocks another user.
 */
export async function blockUser(
  currentUserId: string,
  targetUserId: string
): Promise<{ success: boolean; message: string }> {
  const admin = getAdminClient();
  const { userId, friendId } = getCanonicalPair(currentUserId, targetUserId);
  const now = new Date().toISOString();

  const { error } = await admin.from("friendships").upsert(
    {
      user_id: userId,
      friend_id: friendId,
      status: "blocked",
      action_user_id: currentUserId,
      updated_at: now,
    },
    { onConflict: "user_id,friend_id" }
  );

  if (error) {
    console.error("[friends] blockUser error:", error);
    throw new Error("Failed to block user.");
  }

  return { success: true, message: "User blocked successfully." };
}

/**
 * Unblocks a previously blocked user.
 */
export async function unblockUser(
  currentUserId: string,
  targetUserId: string
): Promise<{ success: boolean; message: string }> {
  const admin = getAdminClient();
  const { userId, friendId } = getCanonicalPair(currentUserId, targetUserId);

  const { data: existing } = await admin
    .from("friendships")
    .select("*")
    .eq("user_id", userId)
    .eq("friend_id", friendId)
    .maybeSingle();

  if (!existing || existing.status !== "blocked") {
    throw new Error("User is not currently blocked.");
  }

  if (existing.action_user_id !== currentUserId) {
    throw new Error("You cannot unblock a user who blocked you.");
  }

  const { error } = await admin.from("friendships").delete().eq("id", existing.id);
  if (error) {
    console.error("[friends] unblockUser error:", error);
    throw new Error("Failed to unblock user.");
  }

  return { success: true, message: "User unblocked." };
}

/**
 * Retrieves public profile and mutual accountability information for /friends/[username].
 * Strictly obeys privacy controls:
 * - Does not expose email or private account fields
 * - Only reveals shared goals if privacy_share_goals is enabled and is_shared_with_friends is true
 * - Only reveals telemetry stats if privacy_share_stats is enabled
 */
export async function getFriendProfile(
  currentUserId: string,
  targetUsernameOrId: string
): Promise<FriendProfileDetails> {
  const admin = getAdminClient();
  const cleaned = targetUsernameOrId.trim().replace(/^@/, "").toLowerCase();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleaned);
  let rawProfile: any = null;

  if (isUuid) {
    const { data } = await admin.from("profiles").select("*").eq("id", cleaned).maybeSingle();
    rawProfile = data;
  } else if (cleaned.toUpperCase().startsWith("AM-")) {
    const { data } = await admin.from("profiles").select("*").eq("auramind_id", cleaned.toUpperCase()).maybeSingle();
    rawProfile = data;
  } else {
    const { data } = await admin.from("profiles").select("*").ilike("username", cleaned).maybeSingle();
    rawProfile = data;

    if (!rawProfile) {
      const { data: byEmail } = await admin.from("profiles").select("*").ilike("email", cleaned).maybeSingle();
      rawProfile = byEmail;
    }

    if (!rawProfile) {
      const formattedAmId = `AM-${cleaned.toUpperCase()}`;
      const { data: byAmId } = await admin.from("profiles").select("*").eq("auramind_id", formattedAmId).maybeSingle();
      rawProfile = byAmId;
    }

    if (!rawProfile) {
      const { data: byName } = await admin.from("profiles").select("*").ilike("full_name", `%${cleaned}%`).limit(1).maybeSingle();
      rawProfile = byName;
    }
  }

  if (!rawProfile) {
    throw new Error("Profile not found.");
  }

  const publicProfile = await ensureProfileIdentity(rawProfile);
  const isSelf = publicProfile.id === currentUserId;

  let friendshipStatus: FriendshipStatus = isSelf ? "self" : "none";

  if (!isSelf) {
    const { userId, friendId } = getCanonicalPair(currentUserId, publicProfile.id);
    const { data: rel } = await admin
      .from("friendships")
      .select("*")
      .eq("user_id", userId)
      .eq("friend_id", friendId)
      .maybeSingle();

    if (rel) {
      if (rel.status === "accepted") {
        friendshipStatus = "accepted";
      } else if (rel.status === "pending") {
        friendshipStatus = rel.action_user_id === currentUserId ? "pending_sent" : "pending_received";
      } else if (rel.status === "blocked") {
        friendshipStatus = rel.action_user_id === currentUserId ? "blocked" : "blocked_by";
      } else if (rel.status === "rejected") {
        friendshipStatus = "rejected";
      }
    }
  }

  if (friendshipStatus === "blocked_by") {
    throw new Error("This profile is unavailable.");
  }

  const isMutual = friendshipStatus === "accepted" || isSelf;

  // Aggregate stats if allowed
  let stats = null;
  if (isSelf || (isMutual && publicProfile.privacyShareStats !== false)) {
    try {
      const { data: sessions } = await admin
        .from("auramind_focus_sessions")
        .select("duration_min, xp_awarded")
        .eq("user_id", publicProfile.id);

      const totalFocusMin = (sessions || []).reduce((acc: number, s: any) => acc + (s.duration_min || 0), 0);
      const totalXp = 50 + (sessions || []).reduce((acc: number, s: any) => acc + (s.xp_awarded || 0), 0);

      const { data: goals } = await admin
        .from("requests")
        .select("id, status")
        .eq("user_id", publicProfile.id);

      const activeGoals = (goals || []).filter((g: any) => g.status !== "completed" && g.status !== "archived").length;

      stats = { totalFocusMin, totalXp, activeGoals };
    } catch {
      stats = { totalFocusMin: 0, totalXp: 50, activeGoals: 0 };
    }
  }

  // Load shared goals if allowed
  const sharedGoals: SharedGoal[] = [];
  if (isSelf || (isMutual && publicProfile.privacyShareGoals)) {
    try {
      let goalQuery = admin
        .from("requests")
        .select("id, context, category, current_level, target_level, status, plan, is_shared_with_friends, shared_caption, started_at, created_at")
        .eq("user_id", publicProfile.id)
        .order("created_at", { ascending: false });

      if (!isSelf) {
        goalQuery = goalQuery.eq("is_shared_with_friends", true);
      }

      const { data: goals } = await goalQuery;

      if (goals) {
        for (const g of goals) {
          const context = g.context || {};
          const plan = g.plan || {};
          const weeks = Array.isArray(plan.weekly_framework)
            ? plan.weekly_framework.map((wf: any) => ({
                week: wf.week,
                title: wf.title,
                outcome: wf.expected_outcome,
              }))
            : [];

          sharedGoals.push({
            id: g.id,
            goalTitle: context.goal || "Goal Trajectory",
            category: g.category || "General",
            currentLevel: g.current_level || "Beginner",
            targetLevel: g.target_level || "Advanced",
            sharedCaption: g.shared_caption || null,
            status: g.status || "active",
            startedAt: g.started_at,
            totalDays: 30,
            currentDay: 1,
            recentMilestones: weeks,
          });
        }
      }
    } catch (gErr) {
      console.warn("[friends] Error loading shared goals:", gErr);
    }
  }

  return {
    profile: publicProfile,
    friendshipStatus,
    isMutualFriend: isMutual,
    stats,
    sharedGoals,
  };
}

/**
 * Toggles social sharing on an individual goal.
 */
export async function toggleGoalSharing(
  currentUserId: string,
  goalId: string,
  isShared: boolean,
  caption?: string
): Promise<{ success: boolean; isShared: boolean }> {
  const admin = getAdminClient();

  const { data: goal } = await admin
    .from("requests")
    .select("id, user_id, context, shared_caption")
    .eq("id", goalId)
    .maybeSingle();

  if (!goal || goal.user_id !== currentUserId) {
    throw new Error("Goal not found or unauthorized.");
  }

  const { error } = await admin
    .from("requests")
    .update({
      is_shared_with_friends: isShared,
      shared_caption: caption !== undefined ? caption : (goal as any)?.shared_caption || null,
    })
    .eq("id", goalId);

  if (error) {
    console.error("[friends] toggleGoalSharing error:", error);
    throw new Error("Failed to update goal sharing preference.");
  }

  return { success: true, isShared };
}

/**
 * Updates user friendship & privacy settings.
 */
export async function updatePrivacySettings(
  currentUserId: string,
  settings: {
    username?: string;
    bio?: string;
    privacyDiscoverable?: boolean;
    privacyShareGoals?: boolean;
    privacyShareStats?: boolean;
    privacyAllowRequests?: string;
  }
): Promise<{ success: boolean; message: string; username: string }> {
  const admin = getAdminClient();

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (settings.bio !== undefined) {
    updatePayload.bio = settings.bio.trim().substring(0, 300);
  }

  if (settings.privacyDiscoverable !== undefined) {
    updatePayload.privacy_discoverable = settings.privacyDiscoverable;
  }

  if (settings.privacyShareGoals !== undefined) {
    updatePayload.privacy_share_goals = settings.privacyShareGoals;
  }

  if (settings.privacyShareStats !== undefined) {
    updatePayload.privacy_share_stats = settings.privacyShareStats;
  }

  if (settings.privacyAllowRequests !== undefined) {
    updatePayload.privacy_allow_requests = settings.privacyAllowRequests;
  }

  // Handle username change with validation
  let validatedUsername: string | null = null;
  if (settings.username !== undefined) {
    const raw = settings.username.trim().replace(/^@/, "").toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(raw)) {
      throw new Error("Username must be between 3 and 24 characters and contain only lowercase letters, numbers, or underscores.");
    }

    // Check collision
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .ilike("username", raw)
      .neq("id", currentUserId)
      .maybeSingle();

    if (existing) {
      throw new Error("This username is already taken. Please choose another.");
    }

    updatePayload.username = raw;
    validatedUsername = raw;
  }

  const { data: updated, error } = await admin
    .from("profiles")
    .update(updatePayload)
    .eq("id", currentUserId)
    .select("username")
    .single();

  if (error) {
    console.error("[friends] updatePrivacySettings error:", error);
    throw new Error("Failed to update privacy settings.");
  }

  return {
    success: true,
    message: "Privacy & profile settings updated successfully.",
    username: validatedUsername || updated?.username,
  };
}
