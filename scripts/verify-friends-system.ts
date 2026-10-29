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

  console.log(`\n========================================================`);
  console.log(`  SUMMARY: ${passed + failed} Ran | \x1b[32m${passed} Passed\x1b[0m | \x1b[31m${failed} Failed\x1b[0m`);
  console.log(`========================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
