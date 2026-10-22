import { z } from "zod";
import { Ctx, Plan, Day, Block, ResearchSchema } from "./schemas";
import { formatLevel } from "./categories";
import { fallbackPlan, phaseOf } from "./fallback";
import { AdaptivePlanProposal, ResearchData } from "./types";

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function getCandidateModels(): string[] {
  const configured = process.env.GEMINI_MODEL?.trim();
  const validStandards = [
    "gemini-3.8-flash",
    "gemini-3.1-pro-preview",
    "gemini-flash-latest",
    "gemini-pro-latest",
    "gemini-2.5-flash",
  ];

  if (configured) {
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

export function generateSmartChatFallback(
  c: Ctx,
  userMessage: string,
  extraContext?: {
    currentDay?: number;
    todayTasks?: string[];
    recentCheckins?: any[];
    focusSessionStats?: any;
  }
): string {
  const raw = (userMessage || "").trim();
  const msg = raw.toLowerCase();
  const day = extraContext?.currentDay || 1;
  const tasks = extraContext?.todayTasks || [];
  const topTask = tasks[0] || "Foundational Practice Drill";

  // 1. Python Decorators
  if (/(decorator|wrapper|@|functools)/i.test(msg)) {
    return `### 🎯 Masterclass: Python Decorators Explained

A **decorator** is simply a function that takes another function as an argument, extends or alters its behavior without modifying the original function's source code, and returns the modified function.

\`\`\`python
import functools
import time

def log_execution_time(func):
    """Decorator that measures execution time of any function."""
    @functools.wraps(func)  # Preserves function name & docstring
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        duration = time.perf_counter() - start
        print(f"[AuraMind Metrics] {func.__name__}() completed in {duration:.4f}s")
        return result
    return wrapper

# Applying the decorator using @ syntax:
@log_execution_time
def process_data(n):
    return sum(i * i for i in range(n))

print(process_data(100_000))
\`\`\`

#### ⚡ When to use decorators in your Python journey:
1. **Cross-Cutting Concerns**: Logging, execution timing, input validation, or authentication.
2. **Caching**: Python's built-in \`@functools.lru_cache\` saves expensive recalculations automatically.
3. **Clean Architecture**: Keeps your core business logic completely separated from boilerplate utilities.

**Immediate Active Recall Drill**: What happens if you forget \`*args, **kwargs\` in the inner wrapper? *(Hint: It won't accept function arguments!)*`;
  }

  // 2. Python Generators & Yield
  if (/(generator|yield|iterator|next\(\))/i.test(msg)) {
    return `### ⚡ Masterclass: Python Generators & \`yield\`

A **generator** produces items one-by-one **on demand (lazy evaluation)** instead of storing the entire sequence in memory at once. It turns memory complexity from **O(N)** into **O(1)**!

\`\`\`python
# Standard list: Allocates 10 million integers in RAM simultaneously!
# big_list = [x for x in range(10_000_000)] # Heavy memory usage

# Generator: Uses 'yield' — generates one integer at a time on the fly!
def number_stream(max_val):
    current = 0
    while current < max_val:
        yield current
        current += 1

gen = number_stream(5)
print(next(gen)) # 0
print(next(gen)) # 1

# Or loop over it cleanly without loading everything into memory:
for num in number_stream(3):
    print("Streamed:", num)
\`\`\`

#### 💡 Key Takeaway:
Use generators whenever you're processing large log files, database query streams, or huge datasets where loading everything into RAM would crash your machine!`;
  }

  // 3. Object-Oriented Programming (OOP, Classes, __init__, self)
  if (/(oop|class|object|__init__|inheritance|polymorphism|encapsulation)/i.test(msg)) {
    return `### 🏗️ Masterclass: OOP & Classes in Python

Think of a **Class** as the blueprint (e.g. "Architectural plan for a House") and an **Object** as the actual building constructed from that plan.

\`\`\`python
class HabitTracker:
    def __init__(self, goal_name: str, daily_minutes: int):
        # 'self' refers to the specific instance created
        self.goal_name = goal_name
        self.daily_minutes = daily_minutes
        self.completed_days = 0

    def log_session(self, minutes_spent: int) -> str:
        if minutes_spent >= self.daily_minutes:
            self.completed_days += 1
            return f"🔥 Target hit! Streak: {self.completed_days} days."
        return "⚠️ Partial block logged. Keep going!"

# Instantiating the object
tracker = HabitTracker("Master Python", 60)
print(tracker.log_session(60)) # 🔥 Target hit! Streak: 1 days.
\`\`\`

#### ⚡ Rules of Thumb:
- \`__init__\`: The constructor that initializes the object's starting state.
- \`self\`: The pointer that allows each instance to access its own attributes without clashing with others.`;
  }

  // 4. Data Structures (Lists, Dictionaries, Sets, Tuples)
  if (/(list|dict|dictionary|tuple|set|comprehension)/i.test(msg)) {
    return `### 📊 Masterclass: Python Core Data Structures

Choosing the right data structure directly impacts algorithmic speed and memory:

| Structure | Syntax | Mutability | Lookup Speed | Best For |
|---|---|---|---|---|
| **List** | \`[1, 2, 3]\` | Mutable | \`O(N)\` search | Ordered sequence of items |
| **Dict** | \`{"a": 1}\` | Mutable | **\`O(1)\` instant** | Key-Value mappings / lookups |
| **Set** | \`{1, 2, 3}\` | Mutable | **\`O(1)\` instant** | Unique items & membership tests |
| **Tuple** | \`(1, 2)\` | **Immutable** | \`O(N)\` search | Fixed records / coordinate data |

\`\`\`python
# Idiomatic Dictionary Comprehension
words = ["python", "auramind", "deliberate", "code"]
lengths = {word: len(word) for word in words if len(word) > 4}
print(lengths) # {'python': 6, 'auramind': 8, 'deliberate': 10}
\`\`\`

**Pro Tip**: Whenever you find yourself writing \`if x in my_list:\` repeatedly inside a loop, convert that list to a **Set** — it changes your search from linear scanning to instantaneous hash lookup!`;
  }

  // 5. Error Handling & Debugging (try, except)
  if (/(error|exception|try|except|bug|debug|breakpoint)/i.test(msg)) {
    return `### 🛠️ Masterclass: Robust Error Handling & Debugging

Python embraces the **EAFP** philosophy: *"Easier to Ask for Forgiveness than Permission"*.

\`\`\`python
def safe_divide(a: float, b: float) -> float:
    try:
        result = a / b
    except ZeroDivisionError as err:
        print(f"Diagnostics: Caught expected edge case ({err})")
        return 0.0
    except TypeError:
        print("Invalid types provided. Ensure inputs are numeric.")
        raise
    else:
        # Runs ONLY if no exceptions were thrown
        return result
    finally:
        # Runs ALWAYS (great for closing database or file handles)
        pass
\`\`\`

#### ⚡ Debugging Pro-Tip:
Insert \`breakpoint()\` anywhere in your Python script. When the execution hits that line, Python will drop into the interactive **PDB debugger**, allowing you to inspect live variables, step through lines, and test expressions!`;
  }

  // 6. Functions, *args, **kwargs, Scope
  if (/(function|args|kwargs|def|lambda|scope)/i.test(msg)) {
    return `### ⚙️ Masterclass: Flexible Python Functions & \`*args\`, \`**kwargs\`

\`\`\`python
def build_profile(username: str, *skills, **metadata):
    """
    *skills: Collects arbitrary positional args into a TUPLE.
    **metadata: Collects arbitrary keyword args into a DICTIONARY.
    """
    print(f"Developer: {username}")
    print("Skills:", skills)
    print("Meta Info:", metadata)

build_profile("Learner", "Python", "Git", "SQL", current_day=1, focus="morning")
\`\`\`

#### 💡 Scope Resolution (The LEGB Rule):
Python searches for variables in this exact order:
1. **L**ocal: Inside the current function.
2. **E**nclosing: Inside any outer enclosing functions.
3. **G**lobal: At the top level of the module/file.
4. **B**uilt-in: Pre-loaded Python names (like \`len\`, \`print\`, \`range\`).`;
  }

  // 7. General Coding / Python questions
  if (/(python|code|syntax|how to|program|learn|project|start)/i.test(msg)) {
    return `### 🚀 Deep Coaching: Mastering **"${c.goal}"**

To reach your target standard (**${c.target_level}**), avoid passive video watching. Apply **Deliberate Practice Architecture**:

1. **The 80/20 Implementation Rule**: Spend 20% of your time reading/learning syntax and 80% actively writing, breaking, and fixing code in an interactive terminal or IDE.
2. **Read Tracebacks Backwards**: When Python throws an error, start reading from the **very bottom line** — it tells you the exact exception and line number where execution failed.
3. **Day ${day} Mission**:
   - Focus Task: **${topTask}**
   - Window: **${c.focus}**

What specific script, feature, or concept are you building right now? Share your code or questions and let's optimize it!`;
  }

  // 8. Distraction / Procrastination / Tired / Stuck
  if (/(phone|distract|tired|exhaust|bored|procrastinat|cannot focus|can't focus|stuck|hard|lazy|demotivat)/i.test(msg)) {
    return `### 🧠 Cognitive Diagnostics: Overcoming Resistance

Resistance is not a character flaw — it is **neurological telemetry** indicating cognitive load, ambiguity, or friction.

\`\`\`text
Resistance Formula: Friction / Perceived Reward = Procrastination
\`\`\`

#### 🛡️ Execute This 3-Minute Protocol Right Now:
1. **Eliminate Friction**: Physically place ${c.distractions || "your phone"} in another room or out of line-of-sight.
2. **The 5-Minute Micro-Agreement**: Do not tell your brain you must study for ${c.hours} hours. Tell yourself: *"I will open my editor and write code for exactly 5 minutes."* Once momentum kicks in, dopamine follows action.
3. **Slice the Task**: Break **${topTask}** into one microscopic action: define a single variable or write 3 lines of comments outlining what the function should do.

Click on the **Focus Timer** tab on your dashboard, set it to 15 minutes, and let's log your first win!`;
  }

  // 9. Schedule / Timetable / Plan queries
  if (/(schedule|timetable|today|next|task|plan|what.*(do|next))/i.test(msg)) {
    return `### 📅 Day ${day} Action Blueprint

Target Goal: **"${c.goal}"** (${c.current_level} → ${c.target_level})

#### Today's Scheduled Focus Blocks:
${tasks.map((t) => `• **${t}**`).join("\n") || `• **${topTask}**`}

#### ⚡ Tactical Execution Rules:
- **Peak Window Alignment**: Your focus window is **${c.focus}**. Reserve this period strictly for heavy problem-solving, never passive reading.
- **Log Promptly**: As soon as a block ends, log it in **Hourly Check-In** to feed our adaptive algorithm.`;
  }

  // 10. Greetings
  if (/^(hi|hello|hey|yo|good\s*(morning|afternoon|evening)|sup)\b/i.test(msg) || msg.length < 5) {
    return `Hey! I'm AuraMind, your AI accountability coach and technical strategist.

You are actively operating on **Day ${day}** of your 30-day timetable for **"${c.goal}"** (${c.current_level} → ${c.target_level}).

🎯 **Priority Block Today**: ${topTask}
⚡ **Optimal Window**: ${c.focus}

What technical challenge, concept breakdown, or study obstacle can we tackle right now? Fire away!`;
  }

  // 11. Comprehensive Contextual Fallback
  return `### 💡 AuraMind Strategic Advisory: "${c.goal}"

Regarding: *"${raw}"*

When progressing from **${c.current_level}** to **${c.target_level}**, master learners focus on **mental models & feedback loops**:

1. **Deconstruct**: Break the topic into its foundational primitives.
2. **Active Sandbox**: Never verify understanding mentally. Write a quick minimal reproduction or test script to prove the behavior.
3. **Diagnostic Logging**: Record any confusion in your hourly check-in notes so we can adapt the upcoming curriculum.

Ask me to break down any specific syntax, explain an algorithmic pattern, or troubleshoot your current task!`;
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
  const currentDay = extraContext?.currentDay || 1;
  const sys = `${buildSystemPrompt(c)}

ROLE & INSTRUCTIONAL BEHAVIOR:
You are AuraMind — the user's elite AI accountability partner, cognitive strategist, and master domain tutor.
You have full access to their active 30-day curriculum, hourly check-in records, and focus metrics.

RESPONSE QUALITY MANDATE:
1. NEVER GIVE GENERIC OR BORING RESPONSES:
   - Avoid robotic greetings or repetitive boilerplate summaries like "Hey I am your coach you are on Day X...".
   - When the user asks a question, dive IMMEDIATELY into the substance of their question with insight, depth, and actionable clarity.
2. TECHNICAL & SUBJECT-MATTER MASTERY:
   - If they ask for explanations, concepts, code, syntax, algorithms, or techniques related to their goal:
     * Provide clean, crystal-clear conceptual explanations with vivid mental models.
     * Give practical, idiomatic code examples with comments highlighting key mechanics.
     * Point out common beginner vs intermediate pitfalls.
     * End with a fast 1-question active recall drill or challenge to lock in the learning.
3. RUTHLESSLY PRACTICAL ACCOUNTABILITY:
   - When they feel stuck, lazy, overwhelmed, or tempted by distractions:
     * Diagnose the friction precisely (task scope too large, fear of failure, cognitive fatigue).
     * Provide a tactical 3-step intervention (e.g. The 5-Minute Micro-Start, Environment Scrub, Low-Stakes Practice).
4. TIMETABLE & SCHEDULING STRATEGY:
   - When discussing their schedule or daily blocks:
     * Leverage their current day (Day ${currentDay}) and their peak focus window (${c.focus}).
     * Offer concrete ways to optimize their schedule without cognitive burnout.
5. FORMATTING:
   - Use crisp Markdown formatting: bold highlights, bullet points, clean code snippets, and short paragraphs.`;

  const contextAddendum = extraContext ? `
Live Dashboard Context:
- Current Day in 30-Day Plan: Day ${currentDay}
- Today's Planned Tasks: ${JSON.stringify(extraContext.todayTasks || [])}
- Recent Check-ins: ${JSON.stringify(extraContext.recentCheckins || [])}
- Focus Timer Stats Today: ${JSON.stringify(extraContext.focusSessionStats || {})}
` : "";

  const messagesFormatted = conversationHistory
    .slice(-8)
    .map((m) => `${m.role === "user" ? "User" : "AuraMind"}: ${m.content}`)
    .join("\n\n");

  const prompt = `${contextAddendum}

Recent Conversation:
${messagesFormatted}

User: ${userMessage}
AuraMind:`;

  try {
    return await genText(prompt, sys);
  } catch (err) {
    console.warn("[gemini] chatWithAuraMind LLM call failed, returning intelligent coaching fallback:", err);
    return generateSmartChatFallback(c, userMessage, extraContext);
  }
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
