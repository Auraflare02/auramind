import { evaluateSecurityDeterministic } from "../lib/chat/security-bot";

console.log("\n========================================================");
console.log("   AURAMIND AI SECURITY BOT (AURASENTINEL) TEST SUITE   ");
console.log("========================================================\n");

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`\x1b[32m✔ [PASS]\x1b[0m ${testName}`);
    passed++;
  } else {
    console.error(`\x1b[31m✖ [FAIL]\x1b[0m ${testName}${detail ? " - " + detail : ""}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// 1. SOCIAL MEDIA & CONTACT SHARING BLOCKS
// ---------------------------------------------------------------------------
const socialMediaCases = [
  { text: "Follow my instagram https://instagram.com/alex_code for updates", desc: "Instagram URL blocked" },
  { text: "Hey bro my insta is @alex_dev reach me there", desc: "Instagram handle mention blocked" },
  { text: "Check my ig: dev_sarah", desc: "Short ig handle blocked" },
  { text: "Add me on snap: coolguy_99", desc: "Snapchat handle blocked" },
  { text: "Send me a snap on snapchat", desc: "Snapchat keyword blocked" },
  { text: "Join my telegram group t.me/pioneers_chat", desc: "Telegram URL blocked" },
  { text: "My telegram is @crypto_hustler ping me", desc: "Telegram handle blocked" },
  { text: "Dm me on tg @alex", desc: "Short tg handle blocked" },
  { text: "Join our discord server: discord.gg/auramind", desc: "Discord invite URL blocked" },
  { text: "My discord is alex#1234 add me", desc: "Discord tag blocked" },
  { text: "Follow me on twitter @techlead", desc: "Twitter handle blocked" },
  { text: "Check my profile x.com/superdev", desc: "X.com URL blocked" },
  { text: "My tiktok is @dailycoder check my reels", desc: "TikTok handle blocked" },
  { text: "Text me on whatsapp +1-234-567-8900", desc: "WhatsApp and phone number blocked" },
  { text: "Call me at 9876543210 right now", desc: "Direct phone callout blocked" },
  { text: "Hit me on i n s t a g r a m", desc: "Obfuscated social media blocked" },
];

for (const tc of socialMediaCases) {
  const res = evaluateSecurityDeterministic(tc.text);
  assert(!res.allowed && res.category === "social_media", tc.desc, res.reason);
}

// ---------------------------------------------------------------------------
// 2. OFF-TOPIC CONVERSATION BLOCKS
// ---------------------------------------------------------------------------
const offTopicCases = [
  { text: "Hey babe are you single wanna date sometime?", desc: "Dating / romantic advances blocked" },
  { text: "Send nudes right now", desc: "Inappropriate requests blocked" },
  { text: "Buy my token now crypto pump guaranteed profit!", desc: "Crypto shilling blocked" },
  { text: "Double your btc guaranteed 10x returns", desc: "Financial scams blocked" },
  { text: "Vote for my candidate election fraud is everywhere", desc: "Partisan political fighting blocked" },
  { text: "Anyone wanna play valorant right now drop your tag", desc: "Off-topic gaming lobbies blocked" },
];

for (const tc of offTopicCases) {
  const res = evaluateSecurityDeterministic(tc.text);
  assert(!res.allowed && res.category === "off_topic", tc.desc, res.reason);
}

// ---------------------------------------------------------------------------
// 3. LEGITIMATE ON-TOPIC MESSAGES (MUST BE PERMITTED)
// ---------------------------------------------------------------------------
const allowedCases = [
  { text: "Finished Day 5 of Python Data Structures! Feeling productive.", desc: "Daily progress update allowed" },
  { text: "Does anyone have good strategies for staying consistent with morning 6 AM focus blocks?", desc: "Productivity question allowed" },
  { text: "Just completed a 45-minute Pomodoro session on system architecture. Moving to Day 12.", desc: "Focus timer and milestone allowed" },
  { text: "Looking for an accountability partner for the AWS Solutions Architect exam this month!", desc: "Accountability partner request allowed" },
  { text: "Great job on your streak! Keep going strong.", desc: "Peer encouragement allowed" },
  { text: "Good morning pioneers! Let's crush our goals today.", desc: "Community greeting allowed" },
  { text: "Hit my 5km running milestone today. Pace improved by 30 seconds.", desc: "Fitness milestone allowed" },
];

for (const tc of allowedCases) {
  const res = evaluateSecurityDeterministic(tc.text);
  assert(res.allowed === true, tc.desc, res.reason);
}

console.log("\n========================================================");
console.log(`  SUMMARY: ${passed + failed} Ran | ${passed} Passed | ${failed} Failed`);
console.log("========================================================\n");

if (failed > 0) {
  process.exit(1);
}
