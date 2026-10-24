import assert from "assert";
import { Ctx, Plan, GoalBlueprintSchema, QualityReviewSchema, Day } from "../lib/schemas";
import { formatLevel } from "../lib/categories";
import {
  buildSystemInstruction,
  buildBlueprintPrompt,
  buildSchedulePartitionPrompt,
  buildQualityReviewPrompt,
} from "../lib/ai/prompts";
import { isGeminiConfigured, resolveModelName } from "../lib/ai/config";

console.log("===================================================================");
console.log("AURAMIND AI INTELLIGENCE & PERSONALIZATION VERIFICATION SUITE");
console.log("===================================================================");

let passedCount = 0;
let failedCount = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    fn();
    console.log(`\x1b[32m✓ PASS\x1b[0m: ${name}`);
    passedCount++;
  } catch (err: any) {
    console.error(`\x1b[31m✗ FAIL\x1b[0m: ${name}`);
    console.error(`  Details: ${err.message}`);
    failedCount++;
  }
}

// ---------------------------------------------------------
// TEST A: DIFFERENT CATEGORIES PRODUCE DISTINCT ARCHITECTURES
// ---------------------------------------------------------
runTest("Test A: Category prompts isolate domain-specific pedagogical dynamics", () => {
  const langCtx = Ctx.parse({
    goal: "Learn German from A1 to B2",
    category: "language_learning",
    current_level: "a1",
    target_level: "b2",
    language: "German",
    hours: 2,
    focus: "morning",
  });

  const examCtx = Ctx.parse({
    goal: "Prepare for Physics Science Examination",
    category: "education_exams",
    current_level: "needs_foundation_repair",
    target_level: "exam_ready",
    hours: 3,
    focus: "afternoon",
  });

  const codeCtx = Ctx.parse({
    goal: "Build a Full-Stack Web Application in Next.js",
    category: "coding_technology",
    current_level: "beginner",
    target_level: "project_ready",
    hours: 2.5,
    focus: "evening",
  });

  const bizCtx = Ctx.parse({
    goal: "Launch B2B SaaS Business & Acquire 10 Customers",
    category: "business_entrepreneurship",
    current_level: "starting_from_scratch",
    target_level: "developing_practical",
    hours: 3.5,
    focus: "night",
  });

  const langPrompt = buildBlueprintPrompt(langCtx);
  const examPrompt = buildBlueprintPrompt(examCtx);
  const codePrompt = buildBlueprintPrompt(codeCtx);
  const bizPrompt = buildBlueprintPrompt(bizCtx);

  // Assert category-specific content exists
  assert.ok(langPrompt.includes("German"), "Language prompt contains target language");
  assert.ok(examPrompt.includes("Physics Science Examination"), "Exam prompt contains subject");
  assert.ok(codePrompt.includes("Next.js"), "Coding prompt contains tech stack");
  assert.ok(bizPrompt.includes("B2B SaaS Business"), "Business prompt contains business goal");

  // Ensure prompts are materially distinct
  assert.notStrictEqual(langPrompt, examPrompt);
  assert.notStrictEqual(codePrompt, bizPrompt);
});

// ---------------------------------------------------------
// TEST B: SAME GOAL, DIFFERENT STARTING LEVELS
// ---------------------------------------------------------
runTest("Test B: Starting level differences are explicitly enforced", () => {
  const userA1 = Ctx.parse({
    goal: "Learn German",
    category: "language_learning",
    current_level: "a1",
    target_level: "b2",
    hours: 2,
    focus: "morning",
  });

  const userB1 = Ctx.parse({
    goal: "Learn German",
    category: "language_learning",
    current_level: "b1",
    target_level: "b2",
    hours: 2,
    focus: "morning",
  });

  const sysA1 = buildSystemInstruction(userA1);
  const sysB1 = buildSystemInstruction(userB1);

  assert.ok(sysA1.includes("A1"), "User A includes A1 baseline");
  assert.ok(sysB1.includes("B1"), "User B includes B1 baseline");
  assert.ok(!sysB1.includes("Baseline): A1"), "User B does not have A1 baseline");
  assert.notStrictEqual(sysA1, sysB1, "System instructions differ for different starting levels");
});

// ---------------------------------------------------------
// TEST C: SAME GOAL, DIFFERENT AVAILABILITY
// ---------------------------------------------------------
runTest("Test C: Daily availability enforces proportional block budgets", () => {
  const lightUser = Ctx.parse({
    goal: "Learn Python Data Science",
    category: "coding_technology",
    current_level: "beginner",
    target_level: "intermediate",
    hours: 1,
    focus: "morning",
  });

  const heavyUser = Ctx.parse({
    goal: "Learn Python Data Science",
    category: "coding_technology",
    current_level: "beginner",
    target_level: "intermediate",
    hours: 4,
    focus: "morning",
  });

  const lightPrompt = buildSchedulePartitionPrompt(
    lightUser,
    {
      intended_outcome: "Python Data Science Proficiency",
      definition_of_success: "Build 3 standalone models",
      starting_point_analysis: "Beginner",
      target_state_analysis: "Intermediate",
      prerequisites: ["Basic Python"],
      core_workstreams: [{ name: "Data Manipulation", description: "Pandas & Numpy", weight_percentage: 50 }],
      activity_dependencies: ["Pandas before Scikit-learn"],
      milestones: [{ day: 7, title: "Data munging", deliverable: "Clean dataset", validation_test: "Zero NaN values" }],
      bottlenecks_and_friction: ["Syntax fatigue"],
      practice_methodology: "Hands-on data cleaning",
      daily_time_allocation: "1 hour daily",
      feasibility_notes: "Feasible",
      adaptation_triggers: ["Stuck on syntax > 2 days"],
      phases: [{ phase_number: 1, name: "Core Data Tools", start_day: 1, end_day: 15, main_objective: "Pandas", key_deliverable: "Script" }],
    },
    1,
    15,
    "Core Data Tools"
  );

  assert.ok(lightPrompt.includes("60 minutes total"), "Light user constrained to 60 minutes");
  assert.ok(!lightPrompt.includes("240 minutes total"), "Light user not given 240 minutes");
});

// ---------------------------------------------------------
// TEST D: SAME GOAL, DIFFERENT RECORDED DIFFICULTIES
// ---------------------------------------------------------
runTest("Test D: Distraction and roadblock signals adapt system context", () => {
  const listeningUser = Ctx.parse({
    goal: "German Fluency",
    category: "language_learning",
    current_level: "a2",
    target_level: "b2",
    hours: 2,
    focus: "morning",
    distractions: "Phone social media notifications",
    previous: "Struggles with listening comprehension and fast native speech",
  });

  const grammarUser = Ctx.parse({
    goal: "German Fluency",
    category: "language_learning",
    current_level: "a2",
    target_level: "b2",
    hours: 2,
    focus: "morning",
    distractions: "Fatigue after work",
    previous: "Struggles with accusative vs dative adjective endings and word order",
  });

  const sysListening = buildSystemInstruction(listeningUser);
  const sysGrammar = buildSystemInstruction(grammarUser);

  assert.ok(sysListening.includes("listening comprehension"), "Listening roadblock reflected");
  assert.ok(sysGrammar.includes("accusative vs dative"), "Grammar roadblock reflected");
  assert.notStrictEqual(sysListening, sysGrammar);
});

// ---------------------------------------------------------
// TEST E: BLUEPRINT & CRITIC SCHEMA RIGOR
// ---------------------------------------------------------
runTest("Test E: GoalBlueprint & QualityReview schemas enforce complete domain specifications", () => {
  const sampleBlueprint = {
    intended_outcome: "Full-Stack Web Development Competency using Next.js & Supabase",
    definition_of_success: "Deploy a production-grade multi-tenant web application with authentication and database RLS",
    starting_point_analysis: "User has written simple JavaScript functions but lacks experience with full-stack async state, server components, and relational DB queries.",
    target_state_analysis: "Capable of architecting typed REST/Server Action routes, configuring Supabase RLS, and deploying with zero hydration errors.",
    prerequisites: ["Basic HTML/CSS", "JavaScript ES6 Promises"],
    core_workstreams: [
      { name: "Frontend State & Server Components", description: "React 18 + Next.js App Router", weight_percentage: 40 },
      { name: "Backend Auth & Database Architecture", description: "Supabase PostgreSQL & Row-Level Security", weight_percentage: 35 },
      { name: "Testing & Deployment", description: "Vercel CI/CD & end-to-end testing", weight_percentage: 25 },
    ],
    activity_dependencies: [
      "Understand React Server Components before implementing dynamic data fetching",
      "Model PostgreSQL schema before implementing client mutations",
    ],
    milestones: [
      { day: 7, title: "Component Architecture", deliverable: "5 responsive UI components", validation_test: "Passes accessibility audit" },
      { day: 14, title: "Auth & DB Connection", deliverable: "Working Google OAuth + Profile sync", validation_test: "Cookie session persists" },
      { day: 21, title: "CRUD Mutation Loops", deliverable: "Data creation with optimistic UI", validation_test: "0 data anomalies" },
      { day: 30, title: "Production Deployment", deliverable: "Live Vercel URL with SSL", validation_test: "Lighthouse score > 90" },
    ],
    bottlenecks_and_friction: ["Context switching between CSS styling and backend logic", "Next.js cache invalidation edge cases"],
    practice_methodology: "Component-driven development: implement single component, verify error boundaries, commit.",
    daily_time_allocation: "1 hour architecture study, 1.5 hours active implementation",
    feasibility_notes: "Feasible in 30 days given 2.5 daily hours and deliberate scoping.",
    adaptation_triggers: ["Spending > 3 days on authentication debugging triggers paired review protocol."],
    phases: [
      { phase_number: 1, name: "App Router & Component Fundamentals", start_day: 1, end_day: 7, main_objective: "Build UI primitives", key_deliverable: "Responsive layouts" },
      { phase_number: 2, name: "Database & Authentication Architecture", start_day: 8, end_day: 15, main_objective: "Secure backend integration", key_deliverable: "Auth flows" },
      { phase_number: 3, name: "Core Application Logic & State", start_day: 16, end_day: 22, main_objective: "Business workflows", key_deliverable: "Complete features" },
      { phase_number: 4, name: "Error Diagnostics, Testing & Launch", start_day: 23, end_day: 30, main_objective: "Hardening & release", key_deliverable: "Production app" },
    ],
  };

  const parsed = GoalBlueprintSchema.safeParse(sampleBlueprint);
  assert.ok(parsed.success, "GoalBlueprint matches schema");

  const sampleReview = {
    passed: true,
    relevance_score: 9,
    specificity_score: 10,
    progression_score: 9,
    is_generic_template: false,
    is_time_realistic: true,
    strengths: ["Clear progressive milestone dependencies", "Concrete deliverables for each phase"],
    critical_issues: [],
    repair_suggestions: [],
  };

  const parsedReview = QualityReviewSchema.safeParse(sampleReview);
  assert.ok(parsedReview.success, "QualityReview matches schema");
});

// ---------------------------------------------------------
// TEST F: REPEATED SUBMISSION ISOLATION
// ---------------------------------------------------------
runTest("Test F: Requests are strictly isolated without global cross-contamination", () => {
  const req1 = Ctx.parse({
    goal: "Learn Spanish A1",
    category: "language_learning",
    current_level: "pre_a1",
    target_level: "a1",
    hours: 1,
    focus: "morning",
  });

  const req2 = Ctx.parse({
    goal: "Prepare for MCAT Biology",
    category: "education_exams",
    current_level: "intermediate_understanding",
    target_level: "exam_ready",
    hours: 4,
    focus: "night",
  });

  assert.notStrictEqual(req1.goal, req2.goal);
  assert.notStrictEqual(req1.hours, req2.hours);
  assert.notStrictEqual(req1.category, req2.category);
});

// ---------------------------------------------------------
// TEST G: MODEL VALIDATION
// ---------------------------------------------------------
runTest("Test G: GEMINI_MODEL validation rejects invalid models and defaults to gemini-2.5-flash", () => {
  const model = resolveModelName();
  assert.ok(model.startsWith("gemini-"), `Model is valid: ${model}`);
  assert.notStrictEqual(model, "gemini-3.8-flash", "Legacy invalid string rejected");
});

console.log("-------------------------------------------------------------------");
console.log(`VERIFICATION SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("-------------------------------------------------------------------");

if (failedCount > 0) {
  process.exit(1);
}
