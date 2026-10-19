import { z } from "zod";
import { db, ok, maybeOk } from "@/lib/db";
import { J, guard, isAdmin, isUuid } from "@/lib/http";
import { Ctx, Plan } from "@/lib/schemas";
import { researchGoal, generatePlan, isGeminiConfigured } from "@/lib/gemini";
import { fallbackPlan } from "@/lib/fallback";
import { searchTavily } from "@/lib/tavily";

export const maxDuration = 60;

export const GET = guard(async (req) => {
  if (!isAdmin(req)) {
    return J({ error: "Unauthorized: Invalid or missing AURAMIND_ADMIN_KEY." }, 401);
  }

  const client = db();
  const res = await client
    .from("requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const requests = ok(res);
  return J({ requests });
});

export const POST = guard(async (req) => {
  if (!isAdmin(req)) {
    return J({ error: "Unauthorized: Invalid or missing AURAMIND_ADMIN_KEY." }, 401);
  }

  const body = await req.json().catch(() => null);
  const actionSchema = z.object({
    id: z.string(),
    action: z.enum([
      "research",
      "save_research",
      "generate_plan",
      "research_and_plan",
      "release",
      "archive",
    ]),
    research_data: z.any().optional(),
    custom_plan: z.any().optional(),
  });

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success || !isUuid(parsed.data.id)) {
    return J({ error: "Invalid admin action payload." }, 400);
  }

  const { id, action, research_data, custom_plan } = parsed.data;
  const client = db();

  // 1. Fetch current request record
  const fetchRes = await client.from("requests").select("*").eq("id", id).maybeSingle();
  const r = maybeOk(fetchRes);

  if (!r) {
    return J({ error: `Goal request ${id} not found.` }, 404);
  }

  const nowIso = new Date().toISOString();
  const ctx = Ctx.parse(r.context);

  // Helper to atomically update and verify affected row
  const updateRequest = async (updates: Record<string, any>) => {
    const res = await client
      .from("requests")
      .update({ ...updates, updated_at: nowIso })
      .eq("id", id)
      .select("id, status, ready_at, plan_source")
      .maybeSingle();

    const updated = ok(res);
    if (!updated) {
      throw new Error(`Failed to update request ${id}. No rows affected.`);
    }
    return updated;
  };

  // ACTION: ARCHIVE
  if (action === "archive") {
    await updateRequest({ status: "archived" });
    return J({ ok: true, status: "archived" });
  }

  // ACTION: RELEASE TO USER
  if (action === "release") {
    if (!r.plan || !r.plan.days || r.plan.days.length !== 30) {
      return J(
        {
          error: "Cannot release: A complete 30-day timetable must be generated and saved before release.",
        },
        409
      );
    }

    const updated = await updateRequest({
      status: "ready",
      ready_at: nowIso,
    });

    return J({
      ok: true,
      message: "Goal successfully released to user.",
      status: updated.status,
      ready_at: updated.ready_at,
    });
  }

  // ACTION: SAVE RESEARCH
  if (action === "save_research") {
    if (!research_data) {
      return J({ error: "research_data is required." }, 400);
    }
    await updateRequest({
      research_data,
      research: research_data.summary || r.research,
    });
    return J({ ok: true, message: "Research notes saved successfully." });
  }

  // ACTION: AI RESEARCH ONLY
  if (action === "research") {
    let externalEvidence = "";
    try {
      const searchResults = await searchTavily(`${ctx.goal} ${ctx.category} deliberate practice learning curve`);
      if (searchResults.length) {
        externalEvidence = searchResults.map((s) => `Title: ${s.title}\nContent: ${s.content}`).join("\n\n");
      }
    } catch (e) {
      console.warn("[admin] Tavily search skipped:", e);
    }

    let generatedResearch;
    if (isGeminiConfigured()) {
      try {
        generatedResearch = await researchGoal(ctx, externalEvidence);
      } catch (e) {
        console.error("[admin] Gemini research failed:", e);
      }
    }

    if (!generatedResearch) {
      generatedResearch = {
        summary: `Pedagogical breakdown for ${ctx.goal}. Emphasizes progressive transition from foundation mechanics to deliberate challenge sets and realistic application.`,
        requirements: ["Master core terminology and syntax", "Daily spaced retrieval exercises", "Consistent error-log diagnostics"],
        prerequisites: ["Baseline conceptual literacy", "Daily dedicated focus window"],
        common_bottlenecks: ["Cognitive overload in week 2", "Inconsistent recovery / fatigue", "Distraction during unguided practice"],
        strategy: "Use 25-45 minute deliberate practice intervals with immediate reflection check-ins after each block.",
        sources: ["Spaced Retrieval & Cognitive Load Principles"],
      };
    }

    await updateRequest({
      status: "researching",
      research_data: generatedResearch,
      research: generatedResearch.summary,
    });

    return J({ ok: true, research_data: generatedResearch });
  }

  // ACTION: GENERATE PLAN (OR COMBINED RESEARCH & PLAN)
  if (action === "generate_plan" || action === "research_and_plan") {
    let currentResearchSummary = r.research_data?.summary || r.research;
    let researchData = r.research_data;

    // Run research if needed
    if (!currentResearchSummary || action === "research_and_plan") {
      let externalEvidence = "";
      try {
        const searchResults = await searchTavily(`${ctx.goal} curriculum milestones deliberate practice`);
        if (searchResults.length) {
          externalEvidence = searchResults.map((s) => `Title: ${s.title}\nContent: ${s.content}`).join("\n\n");
        }
      } catch (err) {
        console.warn("[admin] Tavily skipped:", err);
      }

      if (isGeminiConfigured()) {
        try {
          researchData = await researchGoal(ctx, externalEvidence);
          currentResearchSummary = researchData.summary;
        } catch (e) {
          console.warn("[admin] Gemini research error:", e);
        }
      }

      if (!researchData) {
        researchData = {
          summary: `Curriculum progression for ${ctx.goal}. Balances foundation acquisition with application drills.`,
          requirements: ["Daily deliberate practice", "Error log diagnosis", "Checkpoint testing"],
          prerequisites: ["Fundamental literacy in domain"],
          common_bottlenecks: ["Passive consumption without active recall", "Distraction intervals"],
          strategy: "30-day phased ramp: Days 1-7 Foundation, 8-15 Deliberate Practice, 16-22 Application, 23-27 Error Repair, 28-30 Consolidation.",
          sources: ["Learning Science Standards"],
        };
        currentResearchSummary = researchData.summary;
      }
    }

    let plan: Plan;
    let planSource: "ai" | "fallback" = "ai";

    if (custom_plan) {
      plan = Plan.parse(custom_plan);
      planSource = "ai";
    } else if (isGeminiConfigured()) {
      try {
        plan = await generatePlan(ctx, currentResearchSummary || "");
        planSource = "ai";
      } catch (err) {
        console.error("[admin] Gemini plan generation failed, invoking deterministic fallback:", err);
        plan = fallbackPlan(ctx);
        planSource = "fallback";
      }
    } else {
      plan = fallbackPlan(ctx);
      planSource = "fallback";
    }

    // Persist to Supabase and transition status to 'review'
    await updateRequest({
      status: "review",
      research_data: researchData,
      research: currentResearchSummary,
      plan,
      plan_source: planSource,
    });

    return J({
      ok: true,
      status: "review",
      plan_source: planSource,
      plan_preview: {
        goal_summary: plan.goal_summary,
        total_days: plan.days.length,
        first_day: plan.days[0],
      },
    });
  }

  return J({ error: "Unsupported action." }, 400);
});
