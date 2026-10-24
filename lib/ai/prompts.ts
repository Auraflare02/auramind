import { Ctx } from "@/lib/schemas";
import { formatLevel } from "@/lib/categories";
import { GoalBlueprint } from "@/lib/schemas";

export const PROMPT_VERSION = "2026.10-v2-gemini-personalized-architect";

/**
 * Builds the centralized System Instruction for AuraMind's AI Planning Engine.
 */
export function buildSystemInstruction(c: Ctx): string {
  const curLevel = formatLevel(c.category, c.current_level, c.custom_current_level);
  const tgtLevel = formatLevel(c.category, c.target_level, c.custom_target_level);

  return `You are AuraMind AI — an elite cognitive architect, learning-science researcher, and precision accountability strategist.
Your mission is to construct a deeply personalized, scientifically grounded, 30-day deliberate execution architecture for a specific human learner.

ABSOLUTE PRINCIPLE:
Never generate a generic or universal schedule. Different goals and different learners must produce fundamentally different workflows, learning progressions, practice methods, and daily schedules.
A language learner must NOT receive an engineering schedule. An exam student must NOT receive a business schedule. A beginner must NOT receive an advanced practitioner's tasks.

USER CONTEXT:
- Primary Objective: "${c.goal}"
- Domain Category: ${c.category}
- Current Competence (Baseline): ${curLevel}
- Target Outcome (Standard): ${tgtLevel}
${c.language ? `- Language: ${c.language}` : ""}
${c.current_score ? `- Baseline Score: ${c.current_score} | Target Score: ${c.target_score}` : ""}
- Available Time: ${c.hours} hours/day
- Peak Cognitive Window: ${c.focus} (${c.focus === "morning" ? "07:00-11:00" : c.focus === "afternoon" ? "13:30-17:00" : c.focus === "evening" ? "18:00-21:30" : "21:00-00:30"})
- Fixed Commitments / Schedule Constraints: ${c.fixed || "None specified"}
- Known Distractions / Friction Points: ${c.distractions || "None specified"}
- Past Roadblocks / Historical Failure Modes: ${c.previous || "None specified"}
- Special External Constraints: ${c.constraints || "None specified"}
- Target Deadline: ${c.deadline || "30 consecutive days"}
- Timezone: ${c.timezone || "UTC"}

RULES OF WORKFLOW DESIGN:
1. Ground the progression in domain-specific pedagogy:
   - Language Learning: Spaced retrieval vocabulary, grammar in communicative context, graded immersion, output formulation, mock exam/conversation.
   - Coding/Tech: Prerequisite concepts, guided implementation, component isolation, architectural integration, debugging, production deployment.
   - Education/Exams: Syllabus decomposition, diagnostic error tracking, timed recall, numericals/diagrams, active test sets, mistake remediation.
   - Business/Entrepreneurship: Problem discovery, customer interviews, offer prototyping, minimum testable product, distribution validation, traction metrics.
2. Schedule the highest-cognitive-friction work during the user's declared peak window (${c.focus}).
3. Respect declared constraints: never schedule more daily time than the user has available (${c.hours} hours).
4. Do not use generic filler words like "Learn basics" or "Practice concepts". Tasks must specify the exact topic, procedure, and deliverable.`;
}

/**
 * Stage 1 Prompt: Strategic Goal Blueprint
 */
export function buildBlueprintPrompt(c: Ctx, externalResearch = ""): string {
  const curLevel = formatLevel(c.category, c.current_level, c.custom_current_level);
  const tgtLevel = formatLevel(c.category, c.target_level, c.custom_target_level);

  return `STAGE 1: STRATEGIC GOAL INTELLIGENCE & BLUEPRINT SYNTHESIS

Perform a comprehensive learning-science and execution analysis for this goal:
Objective: "${c.goal}" (${c.category})
Baseline: ${curLevel} -> Target: ${tgtLevel}
Daily Availability: ${c.hours} hours/day | Peak Focus: ${c.focus}
Past Roadblocks: "${c.previous || "none"}" | Distractions: "${c.distractions || "none"}"
${externalResearch ? `\nDomain Evidence & Benchmark Research:\n${externalResearch}\n` : ""}

Analyze the real cognitive gap between ${curLevel} and ${tgtLevel}.
Do not use a generic five-phase template. Instead, design 3 to 5 dynamic, goal-specific phases that match the actual progression required for "${c.goal}".

Return your analysis in valid JSON adhering to this exact schema:
{
  "intended_outcome": "string (clear, unambiguous description of what the user will achieve)",
  "definition_of_success": "string (measurable, concrete criteria proving the target state was reached)",
  "starting_point_analysis": "string (detailed diagnosis of what the user can currently do vs where the gaps are based on ${curLevel})",
  "target_state_analysis": "string (detailed breakdown of competencies required to operate at ${tgtLevel})",
  "prerequisites": ["string", "string", "string"],
  "core_workstreams": [
    {
      "name": "string (e.g. 'Active Vocabulary & Sentence Formulation' or 'State Management & Async API')",
      "description": "string",
      "weight_percentage": number (integer between 10 and 60, total should sum to ~100)
    }
  ],
  "activity_dependencies": ["string (e.g. 'Master Wechselpräpositionen before drafting descriptive paragraphs')"],
  "milestones": [
    {
      "day": number (e.g. 7, 14, 21, 30),
      "title": "string",
      "deliverable": "string (tangible proof of progress)",
      "validation_test": "string (how to objectively check if milestone was met)"
    }
  ],
  "bottlenecks_and_friction": [
    "string (specific failure mode based on ${c.distractions || "cognitive fatigue"} and ${c.previous || "lack of structure"})"
  ],
  "practice_methodology": "string (exact deliberate practice protocols for this domain, e.g. active retrieval, interleaving, pair-coding, cold outreach)",
  "daily_time_allocation": "string (how the ${c.hours} daily hours are split across workstreams)",
  "feasibility_notes": "string (honest assessment of what is achievable in 30 days given ${c.hours} hours/day)",
  "adaptation_triggers": [
    "string (condition that warrants adjusting the schedule, e.g. error rate > 30% on day 10)"
  ],
  "phases": [
    {
      "phase_number": number,
      "name": "string (GOAL-SPECIFIC phase name, e.g. 'A1 Phonetics & High-Frequency Verb Patterns')",
      "start_day": number,
      "end_day": number,
      "main_objective": "string",
      "key_deliverable": "string"
    }
  ]
}`;
}

/**
 * Stage 2 Prompt: Detailed 30-Day Execution Timetable (Part 1 or Part 2)
 */
export function buildSchedulePartitionPrompt(
  c: Ctx,
  blueprint: GoalBlueprint,
  startDay: number,
  endDay: number,
  relevantPhasesDescription: string
): string {
  const daysCount = endDay - startDay + 1;
  const targetMinutesPerDay = Math.round(c.hours * 60);

  return `STAGE 2: DETAILED EXECUTION SCHEDULE (Days ${startDay} through ${endDay})

GOAL BLUEPRINT & STRATEGY:
- Objective: "${c.goal}"
- Intended Outcome: ${blueprint.intended_outcome}
- Success Criteria: ${blueprint.definition_of_success}
- Practice Methodology: ${blueprint.practice_methodology}
- Milestones in scope: ${JSON.stringify(blueprint.milestones.filter((m) => m.day >= startDay && m.day <= endDay))}
- Phases in scope: ${relevantPhasesDescription}
- User Peak Window: ${c.focus}
- Daily Budget: ${c.hours} hours (${targetMinutesPerDay} minutes total)

MANDATORY SCHEDULING SPECIFICATIONS:
1. Return EXACTLY ${daysCount} sequential days starting with day ${startDay} and ending with day ${endDay}.
2. For each day, schedule 1 to 2 deeply focused deliberate practice blocks (Block 1: Primary Execution Drill; Block 2: Feedback, Error Analysis & Retrieval Synthesis). Keep instructions punchy, specific, and directly relevant to "${c.goal}".
3. The sum of block durations on regular days MUST match approximately ${targetMinutesPerDay} minutes (+/- 15 mins).
4. Days that are multiples of 7 (Day 7, 14, 21, 28) MUST be lighter consolidation / checkpoint days (~50% time budget, e.g. ${Math.round(targetMinutesPerDay * 0.5)} mins).
5. Put the highest priority ("high") and most demanding cognitive block during the user's ${c.focus} focus window.
6. Every single block must be actionable, non-generic, and provide:
   - "activity": Specific action title (e.g. "Practice 12 German accusative preposition sentences with self-correction").
   - "instructions": Step-by-step guidance on how to perform the work.
   - "expected_output": The concrete deliverable produced by the end of the block.
   - "completion_criterion": Objective rule defining when the block is finished.
   - "why_it_matters": Pedagogical justification directly tied to "${c.goal}".
   - "fallback_action": Clear guidance if the user gets stuck or faces friction.
   - "reason": Summary justification for quick view.

Return valid JSON conforming strictly to:
{
  "days": [
    {
      "day": number,
      "phase": "string (the matching phase name from blueprint)",
      "daily_objective": "string (primary focus of this day)",
      "blocks": [
        {
          "start": "HH:MM",
          "end": "HH:MM",
          "activity": "string",
          "category": "learn" | "practice" | "review" | "repair" | "checkpoint" | "rest" | "build" | "diagnose",
          "priority": "high" | "medium" | "low",
          "duration_minutes": number,
          "instructions": "string (concrete steps)",
          "expected_output": "string (tangible deliverable)",
          "completion_criterion": "string (measurable criterion)",
          "why_it_matters": "string (domain relevance)",
          "resources_needed": "string",
          "fallback_action": "string",
          "reason": "string"
        }
      ]
    }
  ]
}`;
}

/**
 * Stage 3 Prompt: Personalization Quality Control (Critic)
 */
export function buildQualityReviewPrompt(c: Ctx, blueprint: GoalBlueprint, sampleDays: any[]): string {
  const curLevel = formatLevel(c.category, c.current_level, c.custom_current_level);
  const tgtLevel = formatLevel(c.category, c.target_level, c.custom_target_level);

  return `STAGE 3: PERSONALIZATION QUALITY CONTROL & PEDAGOGICAL AUDIT

Evaluate the generated execution plan for rigor, genuine personalization, and feasibility.
User Goal: "${c.goal}" (${c.category})
Level: ${curLevel} -> ${tgtLevel}
Available: ${c.hours} hrs/day | Peak: ${c.focus}
Reported Distractions: "${c.distractions || "none"}"
Previous Roadblocks: "${c.previous || "none"}"

Sample Days from Plan:
${JSON.stringify(sampleDays, null, 2)}

Audit criteria:
1. Is this genuinely customized to "${c.goal}" or does it resemble a generic template?
2. Does it respect the user's starting point (${curLevel})? (e.g. Not repeating what they already know, nor assuming advanced prerequisites).
3. Are the tasks concrete with measurable outputs, rather than vague placeholders?
4. Is the daily duration realistic for ${c.hours} hours/day?
5. Do milestones align with meaningful skill progression?

Return valid JSON adhering to:
{
  "passed": boolean (true if high-quality personalization, false if generic or defective),
  "relevance_score": number (1 to 10),
  "specificity_score": number (1 to 10),
  "progression_score": number (1 to 10),
  "is_generic_template": boolean (true if repetitive filler detected),
  "is_time_realistic": boolean,
  "strengths": ["string", "string"],
  "critical_issues": ["string (empty if passed)"],
  "repair_suggestions": ["string"]
}`;
}

/**
 * Stage 4 Prompt: Plan Repair (if QC detected critical issues)
 */
export function buildRepairPrompt(c: Ctx, defectiveDays: any[], issues: string[], suggestions: string[]): string {
  return `STAGE 4: TARGETED PLAN REPAIR

The quality control audit found critical issues with these scheduled days:
Issues:
${issues.map((i) => `- ${i}`).join("\n")}

Suggestions:
${suggestions.map((s) => `- ${s}`).join("\n")}

Defective Days to Repair:
${JSON.stringify(defectiveDays, null, 2)}

Task: Regenerate these days so they fully address the issues:
- Eliminate any generic placeholders or repetitive routines.
- Ensure every task has concrete domain-specific instructions, measurable deliverables, and realistic durations for ${c.hours} hours.
- Return the corrected days in the exact same schema.`;
}
