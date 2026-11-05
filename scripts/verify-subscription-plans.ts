import { SUBSCRIPTION_PLANS, COMPARISON_TABLE_ROWS, THREE_LEVELS_PHILOSOPHY } from "../lib/subscription/config";
import {
  getUserSubscription,
  updateUserSubscription,
  checkGoalLimit,
  checkFriendLimit,
  inMemorySubscriptions,
} from "../lib/subscription/client";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${msg}`);
    process.exit(1);
  }
  console.log(`✔ [PASS] ${msg}`);
}

async function testPlans() {
  console.log("\n========================================================");
  console.log("   AURAMIND SUBSCRIPTION PLANS & QUOTA TEST SUITE       ");
  console.log("========================================================\n");

  // 1. Verify Configuration Specifications
  assert(Boolean(SUBSCRIPTION_PLANS.gold), "Gold plan is defined");
  assert(SUBSCRIPTION_PLANS.gold.monthlyPriceIntro === 199, "Gold intro price is ₹199/month");
  assert(SUBSCRIPTION_PLANS.gold.monthlyPriceRegular === 249, "Gold regular price is ₹249/month");
  assert(SUBSCRIPTION_PLANS.gold.maxGoals === 1, "Gold allows up to 1 goal");
  assert(SUBSCRIPTION_PLANS.gold.maxFriends === 5, "Gold allows up to 5 friends");
  assert(SUBSCRIPTION_PLANS.gold.whatsAppCheckins === false, "Gold does not include WhatsApp check-ins");
  assert(SUBSCRIPTION_PLANS.gold.aiCallsPerMonth === 0, "Gold has 0 AI calls");
  assert(SUBSCRIPTION_PLANS.gold.coreLevelPhilosophy === "Organise your goals.", "Gold core philosophy matches");

  assert(Boolean(SUBSCRIPTION_PLANS.platinum), "Platinum plan is defined");
  assert(SUBSCRIPTION_PLANS.platinum.monthlyPriceIntro === 499, "Platinum intro price is ₹499/month");
  assert(SUBSCRIPTION_PLANS.platinum.monthlyPriceRegular === 699, "Platinum regular price is ₹699/month");
  assert(SUBSCRIPTION_PLANS.platinum.maxGoals === 3, "Platinum allows up to 3 goals");
  assert(SUBSCRIPTION_PLANS.platinum.maxFriends === 15, "Platinum allows up to 15 friends");
  assert(SUBSCRIPTION_PLANS.platinum.whatsAppCheckins === true, "Platinum includes WhatsApp check-ins");
  assert(SUBSCRIPTION_PLANS.platinum.aiCallsPerMonth >= 2, "Platinum includes AI calls");
  assert(SUBSCRIPTION_PLANS.platinum.hindiCallingAgent === true, "Platinum includes Hindi AI calling");
  assert(SUBSCRIPTION_PLANS.platinum.googleCalendar === "basic", "Platinum includes Google Calendar");
  assert(SUBSCRIPTION_PLANS.platinum.coreLevelPhilosophy === "Stay accountable with AI.", "Platinum core philosophy matches");

  assert(Boolean(SUBSCRIPTION_PLANS.diamond), "Diamond plan is defined");
  assert(SUBSCRIPTION_PLANS.diamond.monthlyPriceIntro === 999, "Diamond intro price is ₹999/month");
  assert(SUBSCRIPTION_PLANS.diamond.monthlyPriceRegular === 1299, "Diamond regular price is ₹1299/month");
  assert(SUBSCRIPTION_PLANS.diamond.maxGoals === 25, "Diamond allows up to 25 goals");
  assert(SUBSCRIPTION_PLANS.diamond.maxFriends === 50, "Diamond allows up to 50 friends");
  assert(SUBSCRIPTION_PLANS.diamond.whatsAppCheckins === true, "Diamond includes WhatsApp check-ins");
  assert(SUBSCRIPTION_PLANS.diamond.aiCallsPerMonth >= 15, "Diamond includes 15+ AI calls");
  assert(SUBSCRIPTION_PLANS.diamond.googleCalendar === "full", "Diamond includes full Google Calendar sync");
  assert(SUBSCRIPTION_PLANS.diamond.coreLevelPhilosophy === "Experience complete AI-powered accountability.", "Diamond core philosophy matches");

  // 2. Verify Comparison Table
  assert(COMPARISON_TABLE_ROWS.length >= 15, `Comparison table has ${COMPARISON_TABLE_ROWS.length} rows`);
  const activeGoalsRow = COMPARISON_TABLE_ROWS.find((r) => r.feature === "Active Goals");
  assert(activeGoalsRow?.gold === "1" && activeGoalsRow?.platinum === "3" && activeGoalsRow?.diamond === "25", "Comparison table goals row matches specification");

  const friendsRow = COMPARISON_TABLE_ROWS.find((r) => r.feature === "Friends Limit");
  assert(friendsRow?.gold === "5" && friendsRow?.platinum === "15" && friendsRow?.diamond === "50", "Comparison table friends row matches specification");

  // 3. Verify Three Levels Philosophy
  assert(THREE_LEVELS_PHILOSOPHY.length === 3, "Three levels philosophy has 3 levels");

  // 4. Test User Subscription Client & Upgrades
  const testUserId = "test-user-sub-" + Date.now();
  inMemorySubscriptions.clear();

  // Initial user defaults to gold
  const subInitial = await getUserSubscription(testUserId);
  assert(subInitial.tier === "gold", "New user defaults to Gold plan");
  assert(subInitial.plan.maxGoals === 1, "User on Gold has 1 max goal");
  assert(subInitial.plan.maxFriends === 5, "User on Gold has 5 max friends");

  // Upgrade to Platinum
  const upgradePlat = await updateUserSubscription(testUserId, "platinum", "monthly");
  assert(upgradePlat.success === true, "Upgrade to Platinum succeeds");
  assert(upgradePlat.subscription.tier === "platinum", "Subscription tier updated to Platinum");
  assert(upgradePlat.subscription.plan.maxGoals === 3, "Platinum goal limit is 3");
  assert(upgradePlat.subscription.plan.maxFriends === 15, "Platinum friend limit is 15");

  // Upgrade to Diamond
  const upgradeDia = await updateUserSubscription(testUserId, "diamond", "annual");
  assert(upgradeDia.success === true, "Upgrade to Diamond succeeds");
  assert(upgradeDia.subscription.tier === "diamond", "Subscription tier updated to Diamond");
  assert(upgradeDia.subscription.plan.maxGoals === 25, "Diamond goal limit is 25");
  assert(upgradeDia.subscription.plan.maxFriends === 50, "Diamond friend limit is 50");
  assert(upgradeDia.subscription.billingCycle === "annual", "Annual billing cycle stored correctly");

  // 5. Test Quota Checks
  const goalCheck = await checkGoalLimit(testUserId);
  assert(goalCheck.allowed === true, "Goal limit check allows creation when usage < max");

  const friendCheck = await checkFriendLimit(testUserId);
  assert(friendCheck.allowed === true, "Friend limit check allows connection when usage < max");

  console.log("\n========================================================");
  console.log("  ALL SUBSCRIPTION TESTS PASSED SUCCESSFULLY!          ");
  console.log("========================================================\n");
}

testPlans().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
