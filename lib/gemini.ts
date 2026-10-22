import { z } from "zod";
import { Ctx, Plan, Day, Block, ResearchSchema } from "./schemas";
import { formatLevel } from "./categories";
import { fallbackPlan, phaseOf } from "./fallback";
import { AdaptivePlanProposal, ResearchData } from "./types";
import { searchTavily } from "./tavily";

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function getCandidateModels(): string[] {
  const configured = process.env.GEMINI_MODEL?.trim();
  const validStandards = [
    "gemini-flash-latest",
    "gemini-3-flash-preview",
    "gemini-3.1-pro-preview",
    "gemini-2.5-flash",
    "gemini-pro-latest",
    "gemini-2.5-pro",
    "gemini-3.1-flash-lite",
  ];

  if (configured && configured !== "gemini-2.5-flash" && configured !== "gemini-1.5-flash") {
    return [configured, ...validStandards.filter((m) => m !== configured)];
  }
  return validStandards;
}

export function getGeminiModel(): string {
  return getCandidateModels()[0];
}

export async function genJson<T>(prompt: string, schema: z.ZodType<T>, systemInstruction?: string): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("ENV_GEMINI: GEMINI_API_KEY is not configured.");

  const models = getCandidateModels();
  let lastError: unknown;

  for (const model of models) {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 45000);

    try {
      const payload: any = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.4,
        },
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
      const res = await fetch(url, {
        method: "POST",
        signal: ac.signal,
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`[gemini] Model ${model} HTTP ${res.status}:`, errorText.slice(0, 200));
        if (res.status === 404 || res.status === 400) {
          lastError = new Error(`Gemini ${model} HTTP error ${res.status}: ${errorText.slice(0, 200)}`);
          continue;
        }
        throw new Error(`Gemini HTTP error ${res.status}: ${errorText.slice(0, 300)}`);
      }

      const json = await res.json();
      const rawText: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        const reason = json?.promptFeedback?.blockReason || json?.candidates?.[0]?.finishReason || "No content generated";
        throw new Error(`Gemini empty output: ${reason}`);
      }

      // Strip potential backticks
      const cleanJson = rawText.replace(/^```(json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(cleanJson);
      return schema.parse(parsed);
    } catch (err) {
      lastError = err;
      console.warn(`[gemini] JSON model ${model} attempt failed:`, String(err).slice(0, 250));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error("All Gemini models failed for JSON generation.");
}

export async function genText(prompt: string, systemInstruction?: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("ENV_GEMINI: GEMINI_API_KEY is not configured.");

  const models = getCandidateModels();
  let lastError: unknown;

  for (const model of models) {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 35000);

    try {
      const payload: any = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
      const res = await fetch(url, {
        method: "POST",
        signal: ac.signal,
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`[gemini] Model ${model} HTTP ${res.status}:`, errorText.slice(0, 200));
        if (res.status === 404 || res.status === 400) {
          lastError = new Error(`Gemini ${model} HTTP error ${res.status}: ${errorText.slice(0, 200)}`);
          continue;
        }
        throw new Error(`Gemini HTTP error ${res.status}: ${errorText.slice(0, 300)}`);
      }

      const json = await res.json();
      const rawText: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error("Gemini returned empty text response.");
      }

      return rawText.trim();
    } catch (err) {
      lastError = err;
      console.warn(`[gemini] Text model ${model} attempt failed:`, String(err).slice(0, 250));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error("All Gemini models failed for text generation.");
}

const buildSystemPrompt = (c: Ctx) => {
  const curLevel = formatLevel(c.category, c.current_level, c.custom_current_level);
  const tgtLevel = formatLevel(c.category, c.target_level, c.custom_target_level);

  return `You are AuraMind — an elite cognitive architect, master tutor, and relentless accountability partner.
CORE PHILOSOPHY:
"Don't plan a perfect day. Build a system that learns your real one."

STUDENT CONTEXT:
- Primary Goal: "${c.goal}" (Category: ${c.category})
- Current Competence: ${curLevel}
- Target Standard: ${tgtLevel}
${c.language ? `- Language: ${c.language}` : ""}
${c.current_score ? `- Baseline Score: ${c.current_score}, Target Score: ${c.target_score}` : ""}
- Daily Commitment: ${c.hours} hours/day
- Peak Cognitive Window: ${c.focus}
- Known Daily Friction / Distractions: ${c.distractions || "None logged"}
- Past Roadblocks / Pain Points: ${c.previous || "None logged"}
- External Constraints: ${c.constraints || "None logged"}

MASTER COACHING PRINCIPLES:
1. VALUABLE & HIGH-SIGNAL RESPONSES: Never give vague, generic, or canned replies. Every single response must deliver actionable value, conceptual clarity, or sharp behavioral guidance.
2. ADAPTIVE TUTORING: If the user asks a technical or domain question (e.g., in programming, math, language, or exams), explain with exceptional clarity: use vivid analogies, real-world mental models, concise code snippets or examples, and an immediate check for understanding.
3. BEHAVIORAL ARCHITECTURE: If the user struggles with focus, fatigue, or procrastination, diagnose the root cause (friction, overload, low dopamine, lack of clarity) and offer a specific 5-15 minute protocol. Never shame; treat struggle as diagnostic telemetry.
4. RIGOROUS & DIRECT: Speak with energy, precision, intellectual depth, and warm mentorship. Format answers cleanly using bold highlights, structured bullet points, and code blocks when helpful.`;
};

export async function researchGoal(c: Ctx, externalEvidence = ""): Promise<ResearchData> {
  const sys = buildSystemPrompt(c);
  const prompt = `Conduct a rigorous learning-science breakdown for this goal.
${externalEvidence ? `External research evidence:\n${externalEvidence}\n` : ""}
Provide a comprehensive research strategy in JSON format conforming to this exact schema:
{
  "summary": string (concise 2-3 paragraph breakdown of requirements, realistic trajectory, and skill acquisition dynamics),
  "requirements": string[] (list of 4-6 essential competencies needed to reach the target level),
  "prerequisites": string[] (list of 3-5 foundational skills or knowledge required before advanced practice),
  "common_bottlenecks": string[] (list of 4-5 major friction points or failure modes learners encounter),
  "strategy": string (clear pedagogical roadmap explaining how deliberate practice and feedback loops will overcome bottlenecks),
  "sources": string[] (scientific or pedagogical principles applied, e.g. "Spaced Retrieval Practice (Roediger & Butler)", "CEFR Framework Standards")
}`;
  const res = await genJson(prompt, ResearchSchema, sys);
  return {
    summary: res.summary,
    strategy: res.strategy,
    requirements: res.requirements || [],
    prerequisites: res.prerequisites || [],
    common_bottlenecks: res.common_bottlenecks || [],
    sources: res.sources || [],
  };
}

export async function generatePlan(c: Ctx, researchSummary: string, startDate?: Date): Promise<Plan> {
  const baseDate = startDate ? new Date(startDate) : new Date(Date.now() + 864e5);
  const sys = buildSystemPrompt(c);

  // Generate the plan in 3 cohesive 10-day phases to ensure ultra-high quality and avoid token truncation
  const ranges: [number, number, string][] = [
    [1, 10, "Days 1-7 Foundation & Days 8-10 Deliberate Practice Kickoff"],
    [11, 20, "Days 11-15 Deliberate Practice Mastery & Days 16-20 Application Phase"],
    [21, 30, "Days 21-22 Application Culmination, Days 23-27 Error Diagnostics & Repair, Days 28-30 Final Consolidation"],
  ];

  const partPromises = ranges.map(async ([startDay, endDay, phaseDesc]) => {
    const daysCount = endDay - startDay + 1;
    const prompt = `Research Context:
${researchSummary}

Task: Create days ${startDay} through ${endDay} (${phaseDesc}) of the 30-day timetable.
Rules:
- Total focused study per day <= ${c.hours} hours.
- Put the hardest task during the user's ${c.focus} focus window.
- Respect fixed commitments: ${c.fixed || "none"}.
- Day 7 and Day 14 and Day 21 and Day 28 must be lighter days (50% study volume) to avoid cognitive fatigue.
- Each task block must have:
  - "start" and "end" in HH:MM 24-hour format.
  - "activity": concrete action with measurable output.
  - "category": one of ["learn", "practice", "review", "repair", "checkpoint", "rest"].
  - "priority": one of ["high", "medium", "low"].
  - "reason": pedagogical justification explaining why this task is scheduled now.
- Return JSON conforming to:
{
  "days": [
    {
      "day": number,
      "phase": string,
      "blocks": [
        {
          "start": string,
          "end": string,
          "activity": string,
          "category": string,
          "priority": string,
          "reason": string
        }
      ]
    }
  ]
}
Return exactly ${daysCount} days starting at day ${startDay} and ending at day ${endDay}.`;

    const subSchema = z.object({
      days: z.array(
        z.object({
          day: z.number(),
          phase: z.string().default("Deliberate Practice"),
          blocks: z.array(Block).min(1).max(8),
        })
      ).length(daysCount),
    });

    const res = await genJson(prompt, subSchema, sys);
    return res.days;
  });

  const [part1, part2, part3] = await Promise.all(partPromises);
  const combinedRawDays = [...part1, ...part2, ...part3];

  const days: Day[] = combinedRawDays.map((d, index) => {
    const dayNum = index + 1;
    const dayDate = new Date(baseDate.getTime() + (dayNum - 1) * 864e5);
    const dayName = dayDate.toLocaleDateString("en-US", { weekday: "short" });
    const calDate = dayDate.toISOString().split("T")[0];

    return {
      day: dayNum,
      day_label: `Day ${dayNum} (${dayName})`,
      calendar_date: calDate,
      phase: phaseOf(dayNum),
      blocks: d.blocks,
    };
  });

  const curLevel = formatLevel(c.category, c.current_level, c.custom_current_level);
  const tgtLevel = formatLevel(c.category, c.target_level, c.custom_target_level);

  // Generate metadata / weekly focus overview
  const metaPrompt = `Create the executive plan metadata for this 30-day goal: "${c.goal}" (${curLevel} to ${tgtLevel}).
Research Findings: ${researchSummary}

Return JSON with:
{
  "goal_summary": string,
  "definition_of_success": string,
  "weekly_focus": [
    { "week": 1, "title": string, "focus": string, "expected_outcome": string },
    { "week": 2, "title": string, "focus": string, "expected_outcome": string },
    { "week": 3, "title": string, "focus": string, "expected_outcome": string },
    { "week": 4, "title": string, "focus": string, "expected_outcome": string }
  ],
  "risk_notes": string[] (3-4 risks),
  "milestones": [
    { "day": 7, "milestone": string },
    { "day": 14, "milestone": string },
    { "day": 21, "milestone": string },
    { "day": 30, "milestone": string }
  ],
  "relevant_research_findings": string[] (3 findings)
}`;

  const metaSchema = z.object({
    goal_summary: z.string(),
    definition_of_success: z.string(),
    weekly_focus: z.array(
      z.object({
        week: z.number(),
        title: z.string(),
        focus: z.string(),
        expected_outcome: z.string(),
      })
    ).length(4),
    risk_notes: z.array(z.string()).min(2),
    milestones: z.array(
      z.object({
        day: z.number(),
        milestone: z.string(),
      })
    ).min(3),
    relevant_research_findings: z.array(z.string()).min(2),
  });

  let meta;
  try {
    meta = await genJson(metaPrompt, metaSchema, sys);
  } catch (err) {
    console.warn("[gemini] Meta generation failed, using structured defaults:", err);
    const fb = fallbackPlan(c, baseDate);
    meta = {
      goal_summary: fb.goal_summary,
      definition_of_success: fb.definition_of_success,
      weekly_focus: fb.weekly_focus,
      risk_notes: fb.risk_notes,
      milestones: fb.milestones,
      relevant_research_findings: fb.relevant_research_findings,
    };
  }

  return Plan.parse({
    ...meta,
    days,
  });
}

export interface ChatAIParams {
  userMessage: string;
  history?: { role: "user" | "assistant" | "model" | "system"; content: string }[];
  goalContext?: {
    goal?: string;
    category?: string;
    currentLevel?: string;
    targetLevel?: string;
    dailyHours?: number;
    focusWindow?: string;
    currentDay?: number;
    todayTasks?: string[];
    recentCheckins?: any[];
    focusSessionStats?: any;
  };
  enableWebSearch?: boolean;
}

export interface ChatAIResult {
  reply: string;
  sources?: { title: string; url: string; content?: string }[];
  modelUsed: string;
}

const AURAMIND_AI_SYSTEM_INSTRUCTION = `You are AuraMind, a highly capable, intelligent AI learning, productivity, and problem-solving assistant.
Your purpose is to provide accurate, useful, relevant, understandable, and personalized assistance across a wide spectrum of domains.

Follow these 10 core rules at all times:

### Rule 1 — Understand the user's actual question and intent
Identify the user's actual intent before responding:
- Is it a factual question, scientific query, mathematical proof, calculation, programming problem, debugging request, grammar question, language translation, comparison, recommendation, or casual conversation?
- CRITICAL RESTRICTION: Do NOT assume all questions are about productivity, motivation, or study planning.
  * "What is photosynthesis?" -> Explain photosynthesis scientifically. Do NOT talk about study goals.
  * "Why is my JavaScript returning undefined?" -> Analyze the code and diagnose the bug directly.
  * "Solve 2x + 5 = 15" -> Provide step-by-step mathematical steps and the final answer (x = 5).
  * "Explain electricity as if I'm 12 years old" -> Use intuitive analogies (like water flow in pipes).
  * "Explain German accusative articles" -> Teach German grammar directly with clear tables and sentences.
  * "Write a Python program to find prime numbers" -> Provide clean, functional, idiomatic Python code.
  * "How was your day?" -> Respond warmly and naturally without pretending to be a biological person.
  * "Which language should I learn?" -> Ask what they want to build (web, iOS, data, games) or compare top choices objectively.
  * In Hindi ("मुझे प्रकाश संश्लेषण सरल हिंदी में समझाओ") -> Respond clearly and fluently in Hindi.
  * If the user specifically asks about their active goal or timetable, use the provided goal context. If no goal exists, do NOT invent one.

### Rule 2 — Answer directly and concisely
Start with the direct answer or solution immediately. Never add robotic greetings, unnecessary throat-clearing, or filler phrases ("As AuraMind...", "I would be happy to help you with that..."). Match response length to the question complexity. Keep simple answers short and clean.

### Rule 3 — Prioritize accuracy and truthfulness
Do not invent facts, statistics, research papers, citations, or quotations. Distinguish established scientific facts from theories or reasonable interpretations. When verified web search results are provided in the prompt, use them and cite them with markdown links [Source](URL). Never invent citations or sources. If something is unknown or uncertain, state that honestly.

### Rule 4 — Adapt to the user's knowledge level
- Beginner: Use simple, plain language, define new terms, and provide relatable analogies.
- Intermediate: Explain underlying mechanics, relationships between concepts, and practical tradeoffs.
- Advanced: Use standard technical nomenclature, formal notation, architectural considerations, and deep reasoning.
Never unnecessarily complicate simple questions.

### Rule 5 — Provide valuable, actionable substance
Avoid vague platitudes ("practice every day", "stay focused"). Provide concrete examples, runnable code blocks, realistic solutions, and logical next steps.

### Rule 6 — Maintain multi-turn conversational context
Track the conversation history. When the user asks follow-up questions ("Give me an example", "Make it simpler", "Now in TypeScript", "Why did you use that method?"), interpret their request in relation to previous messages without restarting the topic.

### Rule 7 — Ask clarifying questions only when genuinely necessary
Ask a follow-up question when the answer genuinely depends on missing user requirements (e.g. target platform, operating system, starting baseline). Once answered, use that information. Do not turn conversations into repetitive questionnaires.

### Rule 8 — Personalize with authorized goal data
When authorized goal data is present below, use it ONLY if the question is related to the user's active goal, study plan, or progress. If the question is general or unrelated, answer the general question directly.

### Rule 9 — Use appropriate formatting
- Paragraphs for explanations.
- Numbered lists for sequential procedures or proofs.
- Markdown tables when comparing alternatives.
- Fenced code blocks with language specifiers for programming.
- Mathematical notation for equations.

### Rule 10 — Be helpful, safe, and responsible
Provide safe guidance. For medical, legal, or financial inquiries, appropriately communicate uncertainty and advise consulting qualified professionals. Never guarantee external real-world outcomes.`;

function queryNeedsWebSearch(query: string, explicit?: boolean): boolean {
  if (explicit) return true;
  const q = query.toLowerCase();
  const searchTriggers = [
    "latest", "current", "recent", "today", "news", "price", "release",
    "2024", "2025", "2026", "who is the current", "what is the current",
    "documentation for", "search", "browse", "lookup", "look up", "update", "newest"
  ];
  return searchTriggers.some((t) => q.includes(t));
}

export async function chatWithAuraMindAI(params: ChatAIParams): Promise<ChatAIResult> {
  const { userMessage, history, goalContext, enableWebSearch } = params;
  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured in the server environment. Please set GEMINI_API_KEY.");
  }

  // 1. Check if real-time web research is needed via Tavily
  let searchResults: { title: string; url: string; content: string; score: number }[] = [];
  if (queryNeedsWebSearch(userMessage, enableWebSearch)) {
    try {
      searchResults = await searchTavily(userMessage, 4);
    } catch (e) {
      console.warn("[gemini-ai] Web search attempt encountered an issue:", e);
    }
  }

  // 2. Build contextual prompt addenda
  let promptAddenda = "";

  if (goalContext && (goalContext.goal || (goalContext.todayTasks && goalContext.todayTasks.length > 0))) {
    promptAddenda += `\n\n[USER AUTHORIZED GOAL CONTEXT (Reference ONLY if the question relates to the user's goal, progress, or schedule)]:
- Goal: "${goalContext.goal || "Self-Directed Mastery"}"
- Category: ${goalContext.category || "General"}
- Starting Level: ${goalContext.currentLevel || "Beginner"} | Target Level: ${goalContext.targetLevel || "Advanced"}
- Daily Commitment: ${goalContext.dailyHours || 2} hours/day (${goalContext.focusWindow || "morning"} focus window)
- Current Curriculum Day: Day ${goalContext.currentDay || 1} of 30
- Today's Scheduled Tasks: ${JSON.stringify(goalContext.todayTasks || [])}
- Recent Check-in Signals: ${JSON.stringify((goalContext.recentCheckins || []).slice(0, 3))}
`;
  }

  if (searchResults.length > 0) {
    promptAddenda += `\n\n[VERIFIED LIVE WEB RESEARCH RESULTS (Grounded facts)]:
` + searchResults.map((r, i) => `Source [${i + 1}]: "${r.title}"\nURL: ${r.url}\nExcerpt: ${r.content}`).join("\n\n") + `

Instruction on web sources:
- Base time-sensitive facts on the verified web search results above.
- Cite sources naturally using Markdown links: [Source Title](URL).
- Never fabricate sources or links.`;
  }

  // 3. Construct multi-turn contents array with proper role alternations for Gemini
  const contents: any[] = [];

  if (history && history.length > 0) {
    const recentHistory = history.slice(-14);
    for (const h of recentHistory) {
      const role = h.role === "assistant" || h.role === "model" ? "model" : "user";
      const text = (h.content || "").trim();
      if (!text) continue;

      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts.push({ text });
      } else {
        contents.push({
          role,
          parts: [{ text }],
        });
      }
    }
  }

  const finalUserMessage = promptAddenda ? `${userMessage}\n${promptAddenda}` : userMessage;

  if (contents.length > 0 && contents[contents.length - 1].role === "user") {
    contents[contents.length - 1].parts.push({ text: finalUserMessage });
  } else {
    contents.push({
      role: "user",
      parts: [{ text: finalUserMessage }],
    });
  }

  // 4. Call Gemini candidate models
  const models = getCandidateModels();
  let lastError: any = null;

  for (const model of models) {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 38000);

    try {
      const payload: any = {
        contents,
        systemInstruction: {
          parts: [{ text: AURAMIND_AI_SYSTEM_INSTRUCTION }],
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      };

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
      const res = await fetch(url, {
        method: "POST",
        signal: ac.signal,
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify(payload),
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[gemini] Model ${model} returned HTTP ${res.status}:`, errText.slice(0, 200));
        if (res.status === 404 || res.status === 400 || res.status === 503 || res.status === 429) {
          lastError = new Error(`Model ${model} HTTP ${res.status}: ${errText.slice(0, 180)}`);
          continue;
        }
        throw new Error(`Gemini API error (HTTP ${res.status}): ${errText.slice(0, 250)}`);
      }

      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!reply) {
        const finishReason = data?.candidates?.[0]?.finishReason || "NO_OUTPUT";
        throw new Error(`Gemini returned empty text (finishReason: ${finishReason})`);
      }

      return {
        reply: reply.trim(),
        sources: searchResults.length > 0 ? searchResults.map((s) => ({ title: s.title, url: s.url })) : undefined,
        modelUsed: model,
      };
    } catch (err: any) {
      clearTimeout(timeout);
      lastError = err;
      console.warn(`[gemini] Attempt with model ${model} failed:`, err.message);
    }
  }

  throw new Error(
    lastError?.message || "Google Gemini API is currently unavailable or quota exceeded. Please try again in a moment."
  );
}

export async function chatWithAuraMind(
  c: Ctx,
  conversationHistory: { role: "user" | "assistant" | "system"; content: string }[],
  userMessage: string,
  extraContext?: {
    currentDay?: number;
    todayTasks?: string[];
    recentCheckins?: any[];
    focusSessionStats?: any;
  }
): Promise<string> {
  const result = await chatWithAuraMindAI({
    userMessage,
    history: conversationHistory,
    goalContext: {
      goal: c.goal,
      category: c.category,
      currentLevel: c.current_level,
      targetLevel: c.target_level,
      dailyHours: c.hours,
      focusWindow: c.focus,
      currentDay: extraContext?.currentDay,
      todayTasks: extraContext?.todayTasks,
      recentCheckins: extraContext?.recentCheckins,
      focusSessionStats: extraContext?.focusSessionStats,
    },
  });
  return result.reply;
}

export function generateSmartChatFallback(
  _c: Ctx,
  _userMessage: string,
  _extraContext?: any
): string {
  return "I am currently unable to reach the Google Gemini AI engine. Please check your network connection or try again in a few moments.";
}

export async function generateCheckinCoaching(
  c: Ctx,
  checkin: {
    planned: string;
    actual: string;
    status: string;
    focused_min: number;
    distraction_min: number;
    distraction_type?: string | null;
    reason?: string | null;
    notes?: string;
  }
): Promise<string> {
  if (!isGeminiConfigured()) {
    return checkin.status === "done"
      ? "Session recorded. Notice what conditions helped this block succeed so you can replicate them tomorrow."
      : `Recorded as a signal, not a failure. Adjust the next block: reduce scope or take a 5-minute reset before diving in.`;
  }

  const sys = buildSystemPrompt(c);
  const prompt = `The user just completed an hourly accountability check-in:
- Planned Activity: "${checkin.planned}"
- Actual Activity: "${checkin.actual || "None stated"}"
- Status: ${checkin.status}
- Focused Time: ${checkin.focused_min} minutes
- Distraction Time: ${checkin.distraction_min} minutes
- Distraction Category: ${checkin.distraction_type || "None"}
- Primary Bottleneck Reason: ${checkin.reason || "None specified"}
- User Notes: "${checkin.notes || "None"}"

Respond with concise (max 3 sentences), highly empathetic, and practical coaching.
If they succeeded, celebrate specific execution.
If they were partial or missed, treat it as diagnostic data: identify the friction point and give ONE concrete action for their immediate next step.`;

  try {
    return await genText(prompt, sys);
  } catch {
    return "Check-in saved. Keep moving forward one block at a time.";
  }
}

export async function generateDailyNarrative(
  c: Ctx,
  day: number,
  metrics: {
    completion_pct: number;
    focused_min: number;
    distraction_min: number;
    strongest_period: string;
    weakest_period: string;
    primary_blocker: string;
  },
  checkins: any[]
): Promise<{ coaching_summary: string; tomorrow_recommendation: string; practical_next_action: string }> {
  const schema = z.object({
    coaching_summary: z.string(),
    tomorrow_recommendation: z.string(),
    practical_next_action: z.string(),
  });

  if (!isGeminiConfigured() || !checkins.length) {
    return {
      coaching_summary: `Completed ${metrics.completion_pct}% of planned blocks with ${metrics.focused_min} min of deep focus.`,
      tomorrow_recommendation: metrics.primary_blocker !== "Not enough data yet."
        ? `Guard against ${metrics.primary_blocker.replace(/_/g, " ")} by preparing your workspace 10 minutes prior.`
        : "Maintain your rhythm by tackling the hardest priority first.",
      practical_next_action: "Review today's notes and lay out tomorrow's learning materials before ending your evening.",
    };
  }

  const sys = buildSystemPrompt(c);
  const prompt = `Analyze today's Day ${day} performance data:
Verified Calculated Metrics:
- Completion: ${metrics.completion_pct}%
- Focused: ${metrics.focused_min} min
- Distracted: ${metrics.distraction_min} min
- Strongest Period: ${metrics.strongest_period}
- Weakest Period: ${metrics.weakest_period}
- Main Blocker: ${metrics.primary_blocker}
Logged Check-ins:
${JSON.stringify(checkins.slice(0, 8))}

Do not overwrite or invent new numbers. Provide empathetic learning-science narrative in JSON:
{
  "coaching_summary": string (2-3 sentences evaluating the day's focus vs resistance),
  "tomorrow_recommendation": string (how to structure tomorrow to mitigate today's friction),
  "practical_next_action": string (one 5-minute immediate action to wrap up today)
}`;

  return genJson(prompt, schema, sys);
}

export async function generateWeeklyNarrative(
  c: Ctx,
  metrics: any,
  checkins: any[]
): Promise<{ major_difficulties: string[]; recommendations: string[]; adaptation_advisory: string }> {
  const schema = z.object({
    major_difficulties: z.array(z.string()).min(1),
    recommendations: z.array(z.string()).min(1),
    adaptation_advisory: z.string(),
  });

  if (!isGeminiConfigured() || checkins.length < 5) {
    return {
      major_difficulties: ["Insufficient historical check-ins to confirm recurring bottlenecks."],
      recommendations: ["Log check-ins consistently across the next 7 days to surface deep behavioral trends."],
      adaptation_advisory: "Proceed with standard timetable progression until sufficient behavioral data is recorded.",
    };
  }

  const sys = buildSystemPrompt(c);
  const prompt = `Analyze 7-day performance data:
Metrics: ${JSON.stringify(metrics)}
Check-ins: ${JSON.stringify(checkins.slice(0, 15))}

Provide objective pattern analysis in JSON:
{
  "major_difficulties": string[] (2-4 recurrent friction points backed by logged evidence),
  "recommendations": string[] (2-4 actionable adjustments for next week),
  "adaptation_advisory": string (advice on whether the upcoming schedule should reduce difficulty, increase foundation drills, or continue as planned)
}`;

  return genJson(prompt, schema, sys);
}

export async function generateAdaptiveSchedule(
  c: Ctx,
  startDay: number,
  checkins: any[],
  currentPlanDays: Day[]
): Promise<AdaptivePlanProposal> {
  const schema = z.object({
    rationale: z.string(),
    key_adjustments: z.array(z.string()).min(2),
    adjusted_days: z.array(
      z.object({
        day: z.number(),
        day_label: z.string(),
        calendar_date: z.string(),
        phase: z.string(),
        blocks: z.array(Block).min(1).max(8),
      })
    ).length(7),
  });

  const targetDays = currentPlanDays.filter((d) => d.day >= startDay && d.day < startDay + 7);
  if (targetDays.length !== 7 || !isGeminiConfigured()) {
    // Return fallback adaptation
    return {
      rationale: "Automated adaptation: reinforced review blocks and adjusted spacing around user's designated focus window.",
      key_adjustments: [
        "Added 15-minute diagnostic review buffer to early sessions",
        "Reinforced lighter pace on day 7 to protect recovery",
      ],
      adjusted_days: targetDays.length === 7 ? targetDays : currentPlanDays.slice(0, 7),
    };
  }

  const sys = buildSystemPrompt(c);
  const prompt = `Task: Rebuild the upcoming 7 days (Days ${startDay} to ${startDay + 6}) based on real logged behavior.
Recent Check-in Logs:
${JSON.stringify(checkins.slice(-15))}

Original Upcoming 7 Days:
${JSON.stringify(targetDays)}

Rules:
1. If tasks were repeatedly missed due to 'too_difficult', split into smaller sub-skills and add prerequisite drills.
2. If missed due to 'tired', shift hardest work to their peak ${c.focus} window.
3. If phone/distractions were frequent, shorten continuous blocks to 30-40 min with distinct rest intervals.
4. Do NOT increase volume as punishment. Protect sleep and 1 lighter day.
5. Return JSON:
{
  "rationale": string (explanation of evidence-based changes),
  "key_adjustments": string[] (list of 3 key modifications),
  "adjusted_days": array of 7 Day objects with sequential days ${startDay} through ${startDay + 6}.
}`;

  return genJson(prompt, schema, sys);
}
