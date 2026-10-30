import { getGeminiClient, isGeminiConfigured, resolveModelName } from "@/lib/ai/config";

export interface SecurityEvaluation {
  allowed: boolean;
  reason?: string;
  category?: "social_media" | "off_topic" | "harmful" | "clean";
  botMessage?: string;
  detectedPattern?: string;
}

// ---------------------------------------------------------------------------
// 1. DETERMINISTIC SOCIAL MEDIA & EXTERNAL CONTACT PATTERNS
// ---------------------------------------------------------------------------
const SOCIAL_MEDIA_DOMAINS = [
  /instagram\.com/i,
  /instagr\.am/i,
  /ig\.me/i,
  /twitter\.com/i,
  /x\.com\/(?:[a-z0-9_]{1,30})/i,
  /t\.me\/(?:[a-z0-9_]{3,32})/i,
  /telegram\.me/i,
  /telegram\.org/i,
  /snapchat\.com/i,
  /snap\.com/i,
  /discord\.gg/i,
  /discord\.com\/invite/i,
  /discordapp\.com/i,
  /tiktok\.com/i,
  /wa\.me/i,
  /api\.whatsapp\.com/i,
  /chat\.whatsapp\.com/i,
  /facebook\.com/i,
  /fb\.me/i,
  /linkedin\.com\/in/i,
  /threads\.net/i,
  /reddit\.com\/u(?:ser)?\//i,
];

const SOCIAL_HANDLE_PATTERNS = [
  // Instagram
  /\b(?:my\s+)?(?:insta|instagram|ig)(?:\s*(?:is|:|@|-|handle|id)?\s*)[@a-z0-9_\.]{3,30}\b/i,
  /\b(?:follow|dm|hit|ping|check|add)\s+(?:me\s+on\s+)?(?:insta|ig|instagram)\b/i,
  /\b(?:insta|ig):\s*[@a-z0-9_\.]+/i,

  // Snapchat
  /\b(?:my\s+)?(?:snap|snapchat|sc)(?:\s*(?:is|:|@|-|handle|id)?\s*)[a-z0-9_\.\-]{3,30}\b/i,
  /\b(?:add|snap|send)\s+(?:me\s+on\s+)?(?:snap|snapchat|sc)\b/i,

  // Telegram
  /\b(?:my\s+)?(?:telegram|tg)(?:\s*(?:is|:|@|-|handle|username|id)?\s*)[@a-z0-9_]{4,32}\b/i,
  /\b(?:dm|ping|message|reach)\s+(?:me\s+on\s+)?(?:telegram|tg)\b/i,

  // Discord
  /\b(?:my\s+)?(?:discord)(?:\s*(?:is|:|@|-|tag|id|handle)?\s*)[a-z0-9_\.\#]{3,32}\b/i,
  /\b(?:add|dm)\s+(?:me\s+on\s+)?discord\b/i,

  // Twitter / X
  /\b(?:my\s+)?(?:twitter|x\s+handle|x\s+account)(?:\s*(?:is|:|@|-)?\s*)[@a-z0-9_]{3,30}\b/i,
  /\b(?:follow|dm)\s+(?:me\s+on\s+)?(?:twitter|x)\b/i,

  // TikTok
  /\b(?:my\s+)?(?:tiktok)(?:\s*(?:is|:|@|-|handle)?\s*)[@a-z0-9_\.]{3,30}\b/i,

  // WhatsApp & Phone contact
  /\b(?:my\s+)?(?:whatsapp|wa\s*number)(?:\s*(?:is|:|-)?\s*)[+0-9\s-]{8,20}\b/i,
  /\b(?:text|call|ping|reach)\s+me\s+on\s+whatsapp\b/i,
  /\b(?:call|text|whatsapp)\s+me\s+at\s+([+]?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/i,
  /\b(?:my\s+phone|my\s+number|cell\s*number)\s*(?:is|:)?\s*[+]?\d{10,14}\b/i,

  // Obfuscated patterns (e.g. i n s t a, s n a p, t g)
  /\bi\s*n\s*s\s*t\s*a(?:\s*g\s*r\s*a\s*m)?\b/i,
  /\bs\s*n\s*a\s*p\s*c\s*h\s*a\s*t\b/i,
  /\bt\s*e\s*l\s*e\s*g\s*r\s*a\s*m\b/i,
  /\bd\s*i\s*s\s*c\s*o\s*r\s*d\b/i,
];

// ---------------------------------------------------------------------------
// 2. DETERMINISTIC OFF-TOPIC & HARMFUL PATTERNS
// ---------------------------------------------------------------------------
const OFF_TOPIC_PATTERNS = [
  // Flirting / Dating / Inappropriate personal solicitations
  /\b(?:are\s+you\s+single|wanna\s+date|be\s+my\s+(?:gf|bf|girlfriend|boyfriend)|send\s+(?:nudes|pics|selfie)|looking\s+for\s+(?:love|date|hookup|sugar))\b/i,
  /\b(?:you\s+are\s+(?:so\s+)?(?:sexy|hot|cute)|marry\s+me|kiss\s+me)\b/i,

  // Commercial scams / Crypto shilling / Financial solicitations
  /\b(?:buy\s+my\s+token|crypto\s+pump|guaranteed\s+(?:profit|roi|returns)|free\s+money|forex\s+trading\s+signals|airdrop\s+link|invest\s+\$?\d+\s+and\s+get|double\s+your\s+(?:btc|crypto|money))\b/i,

  // Partisan political fighting
  /\b(?:vote\s+for\s+(?:trump|biden|kamala|modi|putin)|election\s+fraud|liberal\s+propaganda|fascist\s+dictatorship)\b/i,

  // Gaming matchmaking unrelated to skill building / goals
  /\b(?:anyone\s+wanna\s+play\s+valorant|fortnite\s+squad\s+drop\s+tag|csgo\s+1v1\s+me|roblox\s+robux\s+giveaway)\b/i,

  // Explicit abuse / harassment
  /\b(?:kys|kill\s+yourself|fuck\s+you|bitch|idiot|retard|stfu)\b/i,
];

// Keywords showing legitimate on-topic intent (goals, execution, learning, productivity)
const GOAL_RELEVANT_INDICATORS = [
  "goal", "task", "study", "code", "coding", "learn", "learning", "read", "book",
  "habit", "routine", "focus", "pomodoro", "timer", "streak", "day", "days",
  "project", "build", "practice", "workout", "gym", "fitness", "diet", "run",
  "exam", "test", "cert", "certification", "skill", "track", "progress",
  "accountability", "partner", "auramind", "milestone", "consistent", "procrastinat",
  "morning", "evening", "discipline", "challenge", "commit", "timetable", "schedule",
  "hello", "hi", "hey", "welcome", "good morning", "good evening", "congrats", "great job",
  "keep going", "proud", "help", "question", "advice", "how to", "review",
];

/**
 * Fast Deterministic Security Evaluation (Layer 1)
 */
export function evaluateSecurityDeterministic(text: string): SecurityEvaluation {
  const clean = text.trim();

  // 1. Social Media Domains Check
  for (const domainRegex of SOCIAL_MEDIA_DOMAINS) {
    if (domainRegex.test(clean)) {
      return {
        allowed: false,
        category: "social_media",
        detectedPattern: domainRegex.toString(),
        reason: "Sharing external social media links or domain URLs is prohibited on AuraMind.",
        botMessage: "🛡️ AuraSentinel AI: Sharing external social media links is prohibited on AuraMind. Keep your focus on your goals and accountability inside the platform!",
      };
    }
  }

  // 2. Social Media Handles & Off-Platform Contacts Check
  for (const handleRegex of SOCIAL_HANDLE_PATTERNS) {
    if (handleRegex.test(clean)) {
      return {
        allowed: false,
        category: "social_media",
        detectedPattern: handleRegex.toString(),
        reason: "Sharing social media handles, phone numbers, or off-platform contact information is strictly prohibited.",
        botMessage: "🛡️ AuraSentinel AI: Sharing social media handles or contact info is not allowed on AuraMind. Connect with accountability partners directly through AuraMind instead!",
      };
    }
  }

  // 3. Off-Topic & Harmful Patterns Check
  for (const offTopicRegex of OFF_TOPIC_PATTERNS) {
    if (offTopicRegex.test(clean)) {
      return {
        allowed: false,
        category: "off_topic",
        detectedPattern: offTopicRegex.toString(),
        reason: "Conversations must remain on-topic, professional, and focused on goals, learning, and accountability.",
        botMessage: "🛡️ AuraSentinel AI: Please keep the conversation focused on goals, learning, habits, and productivity. Off-topic, dating, commercial, or disruptive chat is not permitted.",
      };
    }
  }

  return {
    allowed: true,
    category: "clean",
  };
}

/**
 * Semantic AI Security Check via Gemini (Layer 2)
 * Evaluates context when message is long or ambiguous, with automatic 2.5s fallback.
 */
export async function evaluateSecurityAi(text: string, isDirect = false): Promise<SecurityEvaluation> {
  if (!isGeminiConfigured()) {
    return evaluateSecurityDeterministic(text);
  }

  // First run fast deterministic scan
  const deterministicResult = evaluateSecurityDeterministic(text);
  if (!deterministicResult.allowed) {
    return deterministicResult;
  }

  // If very short friendly message (e.g. "Good morning!", "Nice job!"), allow directly
  const words = text.trim().split(/\s+/);
  if (words.length <= 6) {
    const lower = text.toLowerCase();
    const hasGoalTerm = GOAL_RELEVANT_INDICATORS.some((term) => lower.includes(term));
    if (hasGoalTerm || lower.length < 25) {
      return { allowed: true, category: "clean" };
    }
  }

  try {
    const client = getGeminiClient();
    const model = resolveModelName();

    const prompt = `You are AuraSentinel, the AI Security & Compliance Officer for AuraMind (an elite AI goal execution and accountability platform).
Your duty is to enforce two non-negotiable community rules:

RULE 1: NO SOCIAL MEDIA HANDLES OR EXTERNAL CONTACTS.
Users must NEVER share or ask for handles, usernames, phone numbers, or links for Instagram, Snapchat, Discord, Telegram, Twitter/X, TikTok, WhatsApp, Facebook, LinkedIn, or external chat platforms.

RULE 2: MUST REMAIN ON-TOPIC.
AuraMind chats are strictly dedicated to goals, learning, coding, fitness, exams, projects, habit consistency, focus sessions, time management, and accountability encouragement.
Users must NOT talk off-topic (e.g. romantic/dating advances, political debates, random gaming matchmaking, financial/crypto promotion, gossip, or trolling).

Analyze this message submitted by a user in ${isDirect ? "a private accountability chat" : "the public world chat"}:
"""
${text}
"""

Respond with a JSON object ONLY:
{
  "allowed": boolean,
  "category": "clean" | "social_media" | "off_topic" | "harmful",
  "reason": "brief explanation if blocked",
  "botMessage": "polite, firm notice starting with '🛡️ AuraSentinel AI: ' explaining the violation"
}`;

    // 2500ms safety timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("AuraSentinel AI timeout")), 2500)
    );

    const requestPromise = client.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const response: any = await Promise.race([requestPromise, timeoutPromise]);
    const rawText: string | undefined = response?.text;

    if (rawText) {
      const cleanJson = rawText.replace(/^```(json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(cleanJson);
      if (typeof parsed.allowed === "boolean") {
        if (!parsed.allowed) {
          return {
            allowed: false,
            category: parsed.category || "off_topic",
            reason: parsed.reason || "Content policy violation.",
            botMessage: parsed.botMessage || "🛡️ AuraSentinel AI: Message blocked. Please keep conversations on-topic and refrain from sharing external social media handles.",
          };
        }
      }
    }

    return { allowed: true, category: "clean" };
  } catch (err: any) {
    console.warn("[AuraSentinel AI] Fast fallback activated:", err.message || err);
    return evaluateSecurityDeterministic(text);
  }
}

/**
 * Master Security Bot Gatekeeper
 * Intercepts incoming messages for both World and Direct chat.
 */
export async function assertMessageSecurity(
  message: string,
  options?: { isDirect?: boolean }
): Promise<SecurityEvaluation> {
  const result = await evaluateSecurityAi(message, options?.isDirect);
  return result;
}
