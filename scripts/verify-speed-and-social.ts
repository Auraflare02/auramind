import fs from "fs";
import path from "path";

// Load .env.local if present
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, "utf-8");
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
} catch (e) {
  // Non-fatal
}

import { getAdminClient } from "../lib/supabase/admin";
import {
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  searchUsers,
  getDashboardFriendsData,
  inMemoryProfiles,
} from "../lib/friends/client";
import {
  getWorldMessages,
  sendWorldMessage,
  getDirectMessages,
  sendDirectMessage,
  getDirectConversations,
} from "../lib/chat/client";
import { assertMessageSecurity } from "../lib/chat/security-bot";

async function runBenchmark() {
  console.log("\n========================================================");
  console.log("   AURAMIND SPEED & SOCIAL INTERACTION BENCHMARK       ");
  console.log("========================================================\n");

  const admin = getAdminClient();

  // Create two distinct test user accounts if needed
  const userA_id = "00000000-aaaa-4000-a000-000000000001";
  const userB_id = "00000000-bbbb-4000-b000-000000000002";

  await admin.from("profiles").upsert([
    {
      id: userA_id,
      full_name: "Speed Tester Alpha",
      username: "speed_alpha",
      auramind_id: "AM-ALPH01",
      email: "alpha@auramind.test",
      privacy_discoverable: true,
      privacy_allow_requests: "everyone",
    },
    {
      id: userB_id,
      full_name: "Speed Tester Beta",
      username: "speed_beta",
      auramind_id: "AM-BETA02",
      email: "beta@auramind.test",
      privacy_discoverable: true,
      privacy_allow_requests: "everyone",
    },
  ]);

  inMemoryProfiles.set(userA_id, {
    id: userA_id,
    full_name: "Speed Tester Alpha",
    username: "speed_alpha",
    auramind_id: "AM-ALPH01",
    email: "alpha@auramind.test",
    privacy_discoverable: true,
    privacy_allow_requests: "everyone",
  });
  inMemoryProfiles.set(userB_id, {
    id: userB_id,
    full_name: "Speed Tester Beta",
    username: "speed_beta",
    auramind_id: "AM-BETA02",
    email: "beta@auramind.test",
    privacy_discoverable: true,
    privacy_allow_requests: "everyone",
  });

  // Clean any old friendship between them
  await admin.from("friendships").delete().or(`user_id.eq.${userA_id},friend_id.eq.${userA_id}`);

  // 1. BENCHMARK: AURA SENTINEL SECURITY BOT
  console.log("▶ 1. Benchmarking AuraSentinel AI Moderation Speed...");
  const t0_sec = performance.now();
  const secResult = await assertMessageSecurity("Completed Day 3 of 30! Focused for 90 minutes on Python backend architecture.");
  const secTime = Math.round(performance.now() - t0_sec);
  console.log(`   ✔ Security Bot evaluated message in: \x1b[32m${secTime}ms\x1b[0m (Allowed: ${secResult.allowed})`);

  // 2. BENCHMARK: ADD TO FRIENDS SPEED
  console.log("\n▶ 2. Benchmarking Add to Friends & Request Lifecycle...");
  const t0_req = performance.now();
  const reqRes = await sendFriendRequest(userA_id, "speed_beta");
  const reqTime = Math.round(performance.now() - t0_req);
  console.log(`   ✔ sendFriendRequest completed in: \x1b[32m${reqTime}ms\x1b[0m (Status: ${reqRes.status})`);

  // Accept friendship
  const t0_acc = performance.now();
  const accRes = await acceptFriendRequest(userB_id, userA_id);
  const accTime = Math.round(performance.now() - t0_acc);
  console.log(`   ✔ acceptFriendRequest completed in: \x1b[32m${accTime}ms\x1b[0m (Success: ${accRes.success})`);

  // 3. BENCHMARK: DASHBOARD & FRIENDS CONNECT SPEED
  console.log("\n▶ 3. Benchmarking Friends Circle Data Load Speed...");
  const t0_dash = performance.now();
  const dashData = await getDashboardFriendsData(userA_id);
  const dashTime = Math.round(performance.now() - t0_dash);
  console.log(`   ✔ getDashboardFriendsData completed in: \x1b[32m${dashTime}ms\x1b[0m (Friends: ${dashData.friends.length})`);

  // 4. BENCHMARK: WORLD CHAT CONNECT & SEND SPEED
  console.log("\n▶ 4. Benchmarking World Live Chat Speed...");
  const t0_world_send = performance.now();
  const worldMsg = await sendWorldMessage(userA_id, "Testing lightning speed in World Chat Pioneer Square!");
  const worldSendTime = Math.round(performance.now() - t0_world_send);
  console.log(`   ✔ sendWorldMessage completed in: \x1b[32m${worldSendTime}ms\x1b[0m (ID: ${worldMsg.id})`);

  const t0_world_get = performance.now();
  const worldMessages = await getWorldMessages(50);
  const worldGetTime = Math.round(performance.now() - t0_world_get);
  console.log(`   ✔ getWorldMessages (50 rows) completed in: \x1b[32m${worldGetTime}ms\x1b[0m (Loaded: ${worldMessages.length})`);

  // 5. BENCHMARK: PRIVATE DIRECT CHAT CONNECT & SEND SPEED
  console.log("\n▶ 5. Benchmarking Private Direct Chat with Friends Speed...");
  const t0_dm_send = performance.now();
  const dmMsg = await sendDirectMessage(userA_id, userB_id, "Hey accountability partner, Day 1 complete!");
  const dmSendTime = Math.round(performance.now() - t0_dm_send);
  console.log(`   ✔ sendDirectMessage completed in: \x1b[32m${dmSendTime}ms\x1b[0m (ID: ${dmMsg.id})`);

  const t0_dm_get = performance.now();
  const dmMessages = await getDirectMessages(userA_id, userB_id, 50);
  const dmGetTime = Math.round(performance.now() - t0_dm_get);
  console.log(`   ✔ getDirectMessages completed in: \x1b[32m${dmGetTime}ms\x1b[0m (Loaded: ${dmMessages.length})`);

  const t0_convs = performance.now();
  const convs = await getDirectConversations(userA_id);
  const convsTime = Math.round(performance.now() - t0_convs);
  console.log(`   ✔ getDirectConversations completed in: \x1b[32m${convsTime}ms\x1b[0m (Conversations: ${convs.length})`);

  // Cleanup test friendship
  await removeFriend(userA_id, userB_id);
  console.log("   ✔ Cleaned up benchmark relations");

  console.log("\n========================================================");
  console.log("                BENCHMARK RESULTS SUMMARY               ");
  console.log("========================================================");
  console.log(` 1. Security Bot Moderation:    ${secTime}ms`);
  console.log(` 2. Send Friend Request:        ${reqTime}ms`);
  console.log(` 3. Accept Friend Request:      ${accTime}ms`);
  console.log(` 4. Friends Circle Dashboard:   ${dashTime}ms`);
  console.log(` 5. World Chat Send:            ${worldSendTime}ms`);
  console.log(` 6. World Chat Connect/Fetch:   ${worldGetTime}ms`);
  console.log(` 7. Private Chat Send:          ${dmSendTime}ms`);
  console.log(` 8. Private Chat Connect/Fetch: ${dmGetTime}ms`);
  console.log(` 9. Conversations List:         ${convsTime}ms`);
  console.log("========================================================\n");
}

runBenchmark().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
