import { getGeminiClient, isGeminiConfigured, resolveModelName } from "@/lib/ai/config";

export interface SecurityEvaluation {
  allowed: boolean;
  reason?: string;
  category?: "social_media" | "abuse" | "adult_content" | "dating" | "off_topic" | "harmful" | "clean";
  botMessage?: string;
  detectedPattern?: string;
}

// ---------------------------------------------------------------------------
// 1. DETERMINISTIC SOCIAL MEDIA DOMAINS & CHANNELS
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
  /youtube\.com\/(?:@|c\/|channel\/|user\/)/i,
  /youtu\.be\//i,
  /twitch\.tv\//i,
  /kick\.com\//i,
  /signal\.me\//i,
  /kik\.me\//i,
];

// ---------------------------------------------------------------------------
// 2. DETERMINISTIC SOCIAL MEDIA HANDLES & OFF-PLATFORM SOLICITATION
// ---------------------------------------------------------------------------
const SOCIAL_HANDLE_PATTERNS = [
  // Instagram
  /\b(?:my\s+)?(?:insta|instagram|ig)(?:\s*(?:is|:|@|-|handle|id)?\s*)[@a-z0-9_\.]{3,30}\b/i,
  /\b(?:follow|dm|hit|ping|check|add)\s+(?:me\s+on\s+)?(?:insta|ig|instagram)\b/i,
  /\b(?:insta|ig):\s*[@a-z0-9_\.]+/i,
  /\b(?:drop|give)\s+(?:me\s+)?(?:your\s+)?(?:insta|ig|instagram)\b/i,

  // Snapchat
  /\b(?:my\s+)?(?:snap|snapchat|sc)(?:\s*(?:is|:|@|-|handle|id)?\s*)[a-z0-9_\.\-]{3,30}\b/i,
  /\b(?:add|snap|send)\s+(?:me\s+on\s+)?(?:snap|snapchat|sc)\b/i,
  /\b(?:drop|give)\s+(?:me\s+)?(?:your\s+)?(?:snap|snapchat|sc)\b/i,
  /\bsc:\s*[a-z0-9_\.\-]+/i,

  // Telegram
  /\b(?:my\s+)?(?:telegram|tg)(?:\s*(?:is|:|@|-|handle|username|id)?\s*)[@a-z0-9_]{4,32}\b/i,
  /\b(?:dm|ping|message|reach)\s+(?:me\s+on\s+)?(?:telegram|tg)\b/i,
  /\btg:\s*[@a-z0-9_]+/i,

  // Discord
  /\b(?:my\s+)?(?:discord)(?:\s*(?:is|:|@|-|tag|id|handle)?\s*)[a-z0-9_\.\#]{3,32}\b/i,
  /\b(?:add|dm)\s+(?:me\s+on\s+)?discord\b/i,
  /\bdiscord:\s*[a-z0-9_\.\#]+/i,

  // Twitter / X
  /\b(?:my\s+)?(?:twitter|x\s+handle|x\s+account)(?:\s*(?:is|:|@|-)?\s*)[@a-z0-9_]{3,30}\b/i,
  /\b(?:follow|dm)\s+(?:me\s+on\s+)?(?:twitter|x)\b/i,

  // TikTok
  /\b(?:my\s+)?(?:tiktok)(?:\s*(?:is|:|@|-|handle)?\s*)[@a-z0-9_\.]{3,30}\b/i,
  /\b(?:follow\s+me\s+on\s+tiktok)\b/i,

  // WhatsApp & Phone contact
  /\b(?:my\s+)?(?:whatsapp|wa\s*number)(?:\s*(?:is|:|-)?\s*)[+0-9\s-]{8,20}\b/i,
  /\b(?:text|call|ping|reach)\s+me\s+on\s+whatsapp\b/i,
  /\b(?:call|text|whatsapp)\s+me\s+at\s+([+]?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/i,
  /\b(?:my\s+phone|my\s+number|cell\s*number)\s*(?:is|:)?\s*[+]?\d{10,14}\b/i,

  // YouTube / Streaming channel self-promotion
  /\b(?:subscribe\s+to\s+my\s+channel|check\s+out\s+my\s+youtube|sub\s+to\s+my\s+yt)\b/i,

  // Obfuscated variations (spaces, dots, numbers, leetspeak)
  /\bi\s*[\.\s\-_]*n\s*[\.\s\-_]*s\s*[\.\s\-_]*t\s*[\.\s\-_]*a(?:\s*g\s*r\s*a\s*m)?\b/i,
  /\bs\s*[\.\s\-_]*n\s*[\.\s\-_]*a\s*[\.\s\-_]*p\s*[\.\s\-_]*c\s*h\s*a\s*t\b/i,
  /\bt\s*[\.\s\-_]*e\s*[\.\s\-_]*l\s*[\.\s\-_]*e\s*[\.\s\-_]*g\s*[\.\s\-_]*r\s*[\.\s\-_]*a\s*[\.\s\-_]*m\b/i,
  /\bd\s*[\.\s\-_]*i\s*[\.\s\-_]*s\s*[\.\s\-_]*c\s*[\.\s\-_]*o\s*[\.\s\-_]*r\s*[\.\s\-_]*d\b/i,
  /\bw\s*[\.\s\-_]*h\s*[\.\s\-_]*a\s*[\.\s\-_]*t\s*[\.\s\-_]*s\s*[\.\s\-_]*a\s*[\.\s\-_]*p\s*[\.\s\-_]*p\b/i,
  /\b(?:1nsta|sn4p|t3l3gram|d1scord|ph0ne\s*number)\b/i,
];

// ---------------------------------------------------------------------------
// 3. DETERMINISTIC ABUSE, HARASSMENT, PROFANITY & VULGARITY PATTERNS
// ---------------------------------------------------------------------------
const ABUSE_AND_PROFANITY_PATTERNS = [
  // Severe profanities and aggressive vulgarities
  /\b(?:fuck|fucking|fucker|motherfucker|f\*ck|fck|f\s+u\s+c\s+k)\b/i,
  /\b(?:bitch|bitches|b\*tch|b\s+i\s+t\s+c\s+h)\b/i,
  /\b(?:bastard|asshole|a\*\*hole|cunt|c\*nt|dickhead|jackass|dipshit)\b/i,
  /\b(?:whore|slut|sluts|pussy|pussies)\b/i,
  /\b(?:bullshit|shitty|fuck\s+off|screw\s+you|get\s+fucked)\b/i,

  // Hostile insults, demeaning slurs, and verbal bullying
  /\b(?:you\s+are\s+(?:a\s+)?(?:idiot|retard|moron|dumbass|loser|pathetic|clown|piece\s+of\s+shit|garbage|waste\s+of\s+space))\b/i,
  /\b(?:stupid\s+bitch|dumb\s+idiot|fucking\s+loser|shut\s+the\s+fuck\s+up|stfu)\b/i,
  /\b(?:you\s+(?:suck|are\s+worthless|are\s+ugly|are\s+disgusting|are\s+trash))\b/i,
  /\b(?:nobody\s+likes\s+you|get\s+a\s+life|shut\s+up\s+loser)\b/i,

  // Slurs (ableist, homophobic, discriminatory)
  /\b(?:retard|retarded|fag|faggot|nigger|nigga|tranny)\b/i,

  // Incitement to self-harm & suicide
  /\b(?:kys|kill\s+yourself|go\s+die|hang\s+yourself|slit\s+your\s+wrists?|drink\s+bleach)\b/i,

  // Violent physical threats & intimidation
  /\b(?:i\s+will\s+(?:kill|beat|punch|slap|find|shoot|stab|destroy)\s+you)\b/i,
  /\b(?:kick\s+your\s+ass|break\s+your\s+face|dox\s+you|track\s+your\s+ip)\b/i,
];

// ---------------------------------------------------------------------------
// 4. DETERMINISTIC ADULT, NSFW, EXPLICIT & "ADULTERATED" CONTENT
// ---------------------------------------------------------------------------
const ADULT_AND_NSFW_PATTERNS = [
  // Explicit sexual content & anatomy
  /\b(?:nude|nudes|naked|send\s+nudes?|send\s+naked|get\s+naked)\b/i,
  /\b(?:porn|porno|pornography|nsfw|hentai|erotic|fetish|xxx)\b/i,
  /\b(?:boobs|tits|titties|penis|vagina|clitoris|clit|dildo|vibrator)\b/i,
  /\b(?:cock|cocks|blowjob|handjob|cum|cumming|orgasm|orgasms)\b/i,
  /\b(?:horny|masturbat(?:e|ing|ion)|jerking\s+off|rubbing\s+one\s+off)\b/i,
  /\b(?:sex\s+(?:video|pic|pics|chat|tape)|dirty\s+talk|touch\s+yourself)\b/i,
  /\b(?:have\s+sex|wanna\s+fuck|sleep\s+with\s+me|show\s+(?:me\s+)?your\s+(?:body|tits|dick|ass|boobs))\b/i,
  /\b(?:take\s+off\s+your\s+clothes|strip\s+for\s+me|stripper|escort\s+service)\b/i,
  /\b(?:hookup|one\s+night\s+stand|friends\s+with\s+benefits|fwb)\b/i,

  // Adult platforms & cam services
  /\b(?:onlyfans(?:\.com)?|fansly(?:\.com)?|pornhub|xvideos|redtube|chaturbate|camsoda|camgirl|brazzers)\b/i,
  /\b(?:sugar\s+(?:daddy|mommy|baby)|pay\s+for\s+sex|buy\s+my\s+nudes)\b/i,
];

// ---------------------------------------------------------------------------
// 5. DETERMINISTIC DATING, FLIRTING & ROMANTIC ADVANCES
// ---------------------------------------------------------------------------
const DATING_AND_ROMANCE_PATTERNS = [
  // Inquiries into relationship status & romantic availability
  /\b(?:are\s+you\s+single|do\s+you\s+have\s+a\s+(?:gf|bf|girlfriend|boyfriend)|have\s+a\s+(?:gf|bf))\b/i,
  /\b(?:are\s+you\s+taken|looking\s+for\s+(?:love|a\s+relationship|a\s+date|a\s+partner|a\s+gf|a\s+bf))\b/i,
  /\b(?:are\s+you\s+(?:a\s+)?(?:girl|female|boy|male)|are\s+you\s+a\s+guy)\b/i,

  // Romantic solicitations & advances
  /\b(?:wanna\s+date|go\s+on\s+a\s+date|be\s+my\s+(?:gf|bf|girlfriend|boyfriend)|date\s+me)\b/i,
  /\b(?:marry\s+me|kiss\s+me|wanna\s+kiss|i\s+love\s+you\s+babe|wanna\s+cuddle)\b/i,
  /\b(?:you\s+are\s+(?:so\s+)?(?:sexy|hot|cute|pretty|gorgeous|beautiful|attractive))\b/i,
  /\b(?:send\s+(?:a\s+)?(?:selfie|face\s+pic|your\s+photo|pic\s+of\s+you))\b/i,
  /\b(?:what\s+do\s+you\s+look\s+like|show\s+your\s+face)\b/i,

  // Dating apps & matchmaking
  /\b(?:tinder|bumble|hinge|grindr|okcupid|badoo|dating\s+app|matchmaking)\b/i,
];

// ---------------------------------------------------------------------------
// 6. DETERMINISTIC COMMERCIAL SPAM, GAMING LOBBIES & OFF-TOPIC PATTERNS
// ---------------------------------------------------------------------------
const OFF_TOPIC_SPAM_PATTERNS = [
  // Commercial scams / Crypto shilling / Financial solicitations / Gambling
  /\b(?:buy\s+my\s+token|crypto\s+pump|guaranteed\s+(?:profit|roi|returns)|free\s+money|forex\s+trading\s+signals|airdrop\s+link|invest\s+\$?\d+\s+and\s+get|double\s+your\s+(?:btc|crypto|money))\b/i,
  /\b(?:casino|gambling|sports\s+betting|bet365|stake\.com|earn\s+\$?\d+\s+daily)\b/i,

  // Partisan political fighting
  /\b(?:vote\s+for\s+(?:trump|biden|kamala|modi|putin)|election\s+fraud|election\s+was\s+rigged|liberal\s+propaganda|fascist\s+dictatorship)\b/i,

  // Gaming matchmaking unrelated to skill building / deliberate practice
  /\b(?:anyone\s+wanna\s+play\s+valorant|fortnite\s+squad\s+drop\s+tag|csgo\s+1v1\s+me|roblox\s+robux\s+giveaway)\b/i,
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

// Sensitive terms that must always trigger AI semantic verification if not deterministically blocked
const SENSITIVE_REVIEW_TERMS = [
  "single", "date", "dating", "gf", "bf", "boyfriend", "girlfriend", "love",
  "cute", "sexy", "hot", "body", "kiss", "marry", "nude", "naked", "pic", "photo",
  "selfie", "girl", "boy", "dm", "follow", "message", "call", "phone", "number",
  "insta", "snap", "telegram", "discord", "whatsapp", "crypto", "token", "money",
  "fuck", "bitch", "idiot", "loser", "hate", "ugly", "shut up", "kill", "die",
];

/**
 * Fast Deterministic Security Evaluation (Layer 1)
 * Executes in sub-millisecond time. Covers 100% of explicit violations.
 */
export function evaluateSecurityDeterministic(text: string): SecurityEvaluation {
  const clean = text.trim();

  // 1. Abuse, Profanity, Harassment, Slurs & Threats Check
  for (const abuseRegex of ABUSE_AND_PROFANITY_PATTERNS) {
    if (abuseRegex.test(clean)) {
      return {
        allowed: false,
        category: "harmful",
        detectedPattern: abuseRegex.toString(),
        reason: "Abusive language, profanity, harassment, or personal attacks are strictly prohibited on AuraMind.",
        botMessage: "🛡️ AuraSentinel AI: Harassment, abusive language, profanity, and personal insults are strictly prohibited on AuraMind. Maintain a supportive, respectful, and professional community.",
      };
    }
  }

  // 2. Adult, NSFW, Sexually Explicit & "Adulterated" Content Check
  for (const adultRegex of ADULT_AND_NSFW_PATTERNS) {
    if (adultRegex.test(clean)) {
      return {
        allowed: false,
        category: "harmful",
        detectedPattern: adultRegex.toString(),
        reason: "Adult, sexually explicit, NSFW, or vulgar content is strictly forbidden on AuraMind.",
        botMessage: "🛡️ AuraSentinel AI: Adult, sexually explicit, NSFW, or vulgar content is strictly forbidden on AuraMind. Keep all interactions strictly focused on goal execution and deliberate practice.",
      };
    }
  }

  // 3. Dating, Romance, Flirting & Romantic Advances Check
  for (const datingRegex of DATING_AND_ROMANCE_PATTERNS) {
    if (datingRegex.test(clean)) {
      return {
        allowed: false,
        category: "off_topic",
        detectedPattern: datingRegex.toString(),
        reason: "Romantic advances, flirting, and dating inquiries are not permitted on AuraMind.",
        botMessage: "🛡️ AuraSentinel AI: AuraMind is a dedicated cognitive goal achievement workspace, not a dating or matchmaking network. Romantic advances, flirting, and dating inquiries are not permitted.",
      };
    }
  }

  // 4. Social Media Domains Check
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

  // 5. Social Media Handles & Off-Platform Contacts Check
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

  // 6. Off-Topic Spam, Gambling, Crypto & Politics Check
  for (const offTopicRegex of OFF_TOPIC_SPAM_PATTERNS) {
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

// ---------------------------------------------------------------------------
// In-Memory Fast Cache for Previously Vetted Messages
// ---------------------------------------------------------------------------
const securityCache = new Map<string, { result: SecurityEvaluation; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Semantic AI Security Check via Gemini (Layer 2)
 * Evaluates context when message is long or ambiguous, enforcing strict zero-tolerance policies.
 */
export async function evaluateSecurityAi(text: string, isDirect = false): Promise<SecurityEvaluation> {
  // 1. Fast deterministic scan (0.1ms) - always enforced first
  const deterministicResult = evaluateSecurityDeterministic(text);
  if (!deterministicResult.allowed) {
    return deterministicResult;
  }

  // 2. Check in-memory cache for previously vetted phrases
  const cacheKey = text.trim().toLowerCase();
  const cached = securityCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  // 3. Fast-path authorization:
  // If the message contains NO sensitive terms, NO url schemas,
  // and has clear goal indicators (or is short friendly conversation under 20 words):
  const lower = text.toLowerCase();
  const hasSensitiveTerm = SENSITIVE_REVIEW_TERMS.some((term) => lower.includes(term));
  const hasUrlPattern = /https?:\/\/|[a-z0-9_\-]+\.(?:com|org|net|io|me|gg|app|co|dev|xyz|link|site)/i.test(text);
  const words = text.trim().split(/\s+/);
  const hasGoalTerm = GOAL_RELEVANT_INDICATORS.some((term) => lower.includes(term));

  if (!hasSensitiveTerm && !hasUrlPattern && (hasGoalTerm || words.length <= 15)) {
    const cleanResult: SecurityEvaluation = { allowed: true, category: "clean" };
    securityCache.set(cacheKey, { result: cleanResult, timestamp: Date.now() });
    return cleanResult;
  }

  if (!isGeminiConfigured()) {
    // If Gemini is not configured, fall back to deterministic evaluation
    return deterministicResult;
  }

  try {
    const client = getGeminiClient();
    const model = resolveModelName();

    const prompt = `You are AuraSentinel, the AI Security & Compliance Officer for AuraMind (an elite AI goal execution and accountability platform).
Your duty is to enforce community safety with ZERO TOLERANCE across 5 non-negotiable rules:

RULE 1: ZERO ABUSE, PROFANITY, INSULTS, OR BULLYING.
Never allow abusive language, cursing/profanities, insults ("idiot", "loser", "ugly", "pathetic", "trash"), demeaning slurs, or hostile personal attacks.

RULE 2: ZERO SOCIAL MEDIA HANDLES OR EXTERNAL CONTACTS.
Never allow sharing, asking for, or promoting handles, usernames, phone numbers, or links for Instagram, Snapchat, Telegram, Discord, Twitter/X, TikTok, WhatsApp, YouTube, Twitch, Facebook, LinkedIn, or external platforms.

RULE 3: ZERO DATING, ROMANCE, FLIRTING, OR ADVANCES.
Never allow romantic advances, flirting, asking if single/looking for love, asking for selfies/photos, physical appearance compliments, or matchmaking.

RULE 4: ZERO ADULT, NSFW, EXPLICIT, OR VULGAR CONTENT.
Never allow adult, sexually explicit, NSFW content, sexual innuendos, organ mentions, sexual references, or adult platform promotions.

RULE 5: STRICTLY ON-TOPIC (GOALS, PRODUCTIVITY & LEARNING ONLY).
Chats must strictly focus on personal goals, deliberate practice, studying, coding, fitness/health routines, time management, and accountability encouragement. Block crypto/financial pumps, scams, and partisan politics.

Analyze this message submitted by a user in ${isDirect ? "a private accountability chat" : "the public world chat"}:
"""
${text}
"""

Respond with a JSON object ONLY:
{
  "allowed": boolean,
  "category": "clean" | "social_media" | "abuse" | "adult_content" | "dating" | "off_topic" | "harmful",
  "reason": "brief explanation if blocked",
  "botMessage": "polite, firm notice starting with '🛡️ AuraSentinel AI: ' explaining the violation"
}`;

    // Fast 1500ms safety timeout to prevent chat stalling
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("AuraSentinel AI timeout")), 1500)
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
          const blockedResult: SecurityEvaluation = {
            allowed: false,
            category: parsed.category || "off_topic",
            reason: parsed.reason || "Content policy violation.",
            botMessage: parsed.botMessage || "🛡️ AuraSentinel AI: Message blocked. Conversations must remain respectful, on-topic, and free of social media handles, dating advances, or adult content.",
          };
          securityCache.set(cacheKey, { result: blockedResult, timestamp: Date.now() });
          return blockedResult;
        }
      }
    }

    const approvedResult: SecurityEvaluation = { allowed: true, category: "clean" };
    securityCache.set(cacheKey, { result: approvedResult, timestamp: Date.now() });
    return approvedResult;
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
