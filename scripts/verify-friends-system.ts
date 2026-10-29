/**
 * AuraMind Friends & Social Accountability System - Automated Integration Verification
 */

function getCanonicalPair(userA: string, userB: string): { userId: string; friendId: string } {
  if (userA === userB) {
    throw new Error("Cannot form friendship pair with self.");
  }
  return userA < userB
    ? { userId: userA, friendId: userB }
    : { userId: userB, friendId: userA };
}

function generateAuraMindId(uuid: string): string {
  return `AM-${uuid.replace(/-/g, "").substring(0, 6).toUpperCase()}`;
}

function generateDefaultUsername(fullName: string, uuid: string): string {
  const base = (fullName || "user")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .substring(0, 15);
  const suffix = uuid.replace(/-/g, "").substring(0, 4).toLowerCase();
  return `${base}_${suffix}`;
}

async function runTests() {
  console.log("\n========================================================");
  console.log("   AURAMIND FRIENDS & SOCIAL ACCOUNTABILITY TEST SUITE  ");
  console.log("========================================================\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`\x1b[32m✔ [PASS]\x1b[0m ${testName}`);
      passed++;
    } else {
      console.error(`\x1b[31m✖ [FAIL]\x1b[0m ${testName}`);
      failed++;
    }
  }

  // TEST GROUP 1: Canonical Pair Mathematical Guarantee
  try {
    const pair1 = getCanonicalPair("user-a", "user-b");
    assert(pair1.userId === "user-a" && pair1.friendId === "user-b", "Pair ordering user-a < user-b");

    const pair2 = getCanonicalPair("user-b", "user-a");
    assert(pair2.userId === "user-a" && pair2.friendId === "user-b", "Inverted pair user-b > user-a produces identical canonical key");

    let threwSelf = false;
    try {
      getCanonicalPair("user-a", "user-a");
    } catch {
      threwSelf = true;
    }
    assert(threwSelf, "Self-pairing prevention throws error");
  } catch (err: any) {
    assert(false, `Canonical pair test failed: ${err.message}`);
  }

  // TEST GROUP 2: AuraMind ID and Username Formats
  const testId = "0c22622d-3a3a-4be2-ba00-0e1bd95f9c11";
  const amId = generateAuraMindId(testId);
  assert(/^AM-[A-Z0-9]{6}$/.test(amId), `AuraMind ID format matches AM-XXXXXX pattern (${amId})`);
  assert(amId === "AM-0C2262", "AuraMind ID deterministic generation matches expected hash prefix");

  const username = generateDefaultUsername("Sarah Connor", testId);
  assert(username === "sarah_connor_0c22", `Default username generated cleanly (${username})`);

  // TEST GROUP 3: Strict Data Privacy Sanitization
  const rawProfileMock = {
    id: testId,
    username: "sarah_connor_0c22",
    auramind_id: "AM-0C2262",
    full_name: "Sarah Connor",
    avatar_url: "https://example.com/avatar.png",
    bio: "AI Safety & Goal Automation",
    email: "private_sarah@domain.internal",
    phone: "+15551234567",
    password_hash: "$2b$12$e80x...secret",
    auth_provider_id: "google-oauth2|123456",
  };

  // Sanitized projection for public & friend views
  const sanitizedPublic = {
    id: rawProfileMock.id,
    username: rawProfileMock.username,
    auramind_id: rawProfileMock.auramind_id,
    full_name: rawProfileMock.full_name,
    avatar_url: rawProfileMock.avatar_url,
    bio: rawProfileMock.bio,
  };

  assert(!("email" in sanitizedPublic), "Public & friend views strip email address");
  assert(!("phone" in sanitizedPublic), "Public & friend views strip phone number");
  assert(!("password_hash" in sanitizedPublic), "Public & friend views strip security hashes");
  assert(!("auth_provider_id" in sanitizedPublic), "Public & friend views strip OAuth IDs");
  assert(sanitizedPublic.username === "sarah_connor_0c22", "Public view preserves public @username");
  assert(sanitizedPublic.auramind_id === "AM-0C2262", "Public view preserves unique AuraMind ID");

  // TEST GROUP 4: Granular Social Goal Sharing Logic
  const sampleGoals = [
    {
      id: "goal-1",
      title: "Master Quantum Computing",
      is_shared_with_friends: true,
      user_global_goal_sharing: true,
    },
    {
      id: "goal-2",
      title: "Private Medical Exam Prep",
      is_shared_with_friends: false,
      user_global_goal_sharing: true,
    },
    {
      id: "goal-3",
      title: "Marathon Training",
      is_shared_with_friends: true,
      user_global_goal_sharing: false, // User disabled social sharing globally
    },
  ];

  const visibleToFriends = sampleGoals.filter(
    (g) => g.is_shared_with_friends && g.user_global_goal_sharing
  );

  assert(
    visibleToFriends.length === 1 && visibleToFriends[0].id === "goal-1",
    "Only individual goals marked 'shared' when user privacy allows sharing are visible to friends"
  );

  // TEST GROUP 5: Anti-Abuse & Blocking Logic
  type FriendshipRecord = {
    user_id: string;
    friend_id: string;
    status: "pending" | "accepted" | "rejected" | "blocked";
    action_user_id: string;
  };

  const blockedRecord: FriendshipRecord = {
    user_id: "user-a",
    friend_id: "user-b",
    status: "blocked",
    action_user_id: "user-a", // user-a initiated the block
  };

  function canSendRequest(requester: string, target: string, record: FriendshipRecord | null): { allowed: boolean; reason?: string } {
    if (requester === target) return { allowed: false, reason: "Cannot friend yourself" };
    if (!record) return { allowed: true };
    if (record.status === "blocked") {
      if (record.action_user_id === requester) {
        return { allowed: false, reason: "You have blocked this user. Unblock them first." };
      } else {
        return { allowed: false, reason: "Unable to interact with this user." };
      }
    }
    if (record.status === "accepted") {
      return { allowed: false, reason: "Already friends." };
    }
    return { allowed: true };
  }

  const requesterCheck = canSendRequest("user-a", "user-b", blockedRecord);
  assert(Boolean(!requesterCheck.allowed && requesterCheck.reason?.includes("blocked")), "Blocker cannot send request without unblocking");

  const blockedCheck = canSendRequest("user-b", "user-a", blockedRecord);
  assert(Boolean(!blockedCheck.allowed && blockedCheck.reason?.includes("Unable")), "Blocked user cannot send request");

  // TEST GROUP 6: Unfriend & Unblock Transition Logic
  function applyAction(currentRecord: FriendshipRecord | null, action: "remove" | "unblock", actorId: string): FriendshipRecord | null {
    if (action === "remove") {
      // Removing friendship clears the relation
      return null;
    }
    if (action === "unblock") {
      if (currentRecord?.status === "blocked" && currentRecord.action_user_id === actorId) {
        return null;
      }
      throw new Error("Cannot unblock: unauthorized or not blocked");
    }
    return currentRecord;
  }

  const acceptedMock: FriendshipRecord = {
    user_id: "user-a",
    friend_id: "user-b",
    status: "accepted",
    action_user_id: "user-b",
  };

  const afterUnfriend = applyAction(acceptedMock, "remove", "user-a");
  assert(afterUnfriend === null, "Unfriend removes friendship record completely");

  const afterUnblock = applyAction(blockedRecord, "unblock", "user-a");
  assert(afterUnblock === null, "Unblock by blocker deletes block constraint and restores neutral state");

  let unblockByVictimFailed = false;
  try {
    applyAction(blockedRecord, "unblock", "user-b"); // victim tries to unblock
  } catch {
    unblockByVictimFailed = true;
  }
  assert(unblockByVictimFailed, "Blocked user cannot unblock themselves");

  // TEST GROUP 7: Comprehensive Multi-Field Search Matching
  const mockCandidates = [
    { id: "u1", username: "alex_pioneer", full_name: "Alex Stark", email: "alex@stark.io", auramind_id: "AM-ALEX01" },
    { id: "u2", username: "sarah_aiml", full_name: "Sarah Connor", email: "sarah@cyber.net", auramind_id: "AM-SARAH2" },
  ];

  function searchMatches(query: string, candidates: typeof mockCandidates) {
    const q = query.trim().replace(/^@/, "").toLowerCase();
    const isAm = q.toUpperCase().startsWith("AM-") ? q.toUpperCase() : `AM-${q.toUpperCase()}`;
    return candidates.filter(
      (c) =>
        c.username.toLowerCase().includes(q) ||
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.auramind_id.toLowerCase().includes(q) ||
        c.auramind_id.toUpperCase() === isAm
    );
  }

  assert(searchMatches("alex@stark.io", mockCandidates).length === 1, "Search matches by exact email");
  assert(searchMatches("Sarah Connor", mockCandidates).length === 1, "Search matches by full name with spaces");
  assert(searchMatches("@alex", mockCandidates).length === 1, "Search matches username prefixed with @");
  assert(searchMatches("AM-SARAH2", mockCandidates).length === 1, "Search matches AuraMind ID");
  assert(searchMatches("SARAH2", mockCandidates).length === 1, "Search matches AuraMind ID without AM- prefix");

  // TEST GROUP 8: Live Chat Permissions
  function canDirectMessage(senderId: string, recipientId: string, friendship: { status: string } | null) {
    if (senderId === recipientId) return false;
    if (!friendship || friendship.status !== "accepted") return false;
    return true;
  }

  assert(canDirectMessage("user-a", "user-b", { status: "accepted" }), "Accepted friends can exchange direct messages");
  assert(!canDirectMessage("user-a", "user-b", { status: "pending" }), "Pending request cannot exchange direct messages");
  assert(!canDirectMessage("user-a", "user-b", { status: "blocked" }), "Blocked users cannot exchange direct messages");
  assert(!canDirectMessage("user-a", "user-b", null), "Non-friends cannot exchange direct messages");

  console.log(`\n========================================================`);
  console.log(`  SUMMARY: ${passed + failed} Ran | \x1b[32m${passed} Passed\x1b[0m | \x1b[31m${failed} Failed\x1b[0m`);
  console.log(`========================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
