# AuraMind — Antigravity Development Brief

You are the lead product engineer for AuraMind. This folder is the current standalone AuraMind source package. Improve this project in-place; do not rebuild it from scratch unless a redesign is demonstrably necessary.

## Product
AuraMind is a research-first AI accountability platform that turns goals into consistent action.

Core loop:

GOAL → RESEARCH → PERSONALIZED 30-DAY PLAN → START GOAL → CHECK-INS → COACHING → DAILY ANALYSIS → WEEKLY PATTERNS → ADAPTATION

AuraMind is not intended to be a generic chatbot, calendar, to-do list, or simple study planner.

## Current stack
- Next.js 14
- React 18
- TypeScript
- Supabase
- Gemini REST API
- Zod
- Vercel-friendly server routes

## Current project structure
- `app/page.tsx` — request form
- `app/goal/[id]/page.tsx` — request status, 30-day goal dashboard and check-ins
- `app/admin/page.tsx` — private research/review/release UI
- `app/api/requests/route.ts` — create/check request
- `app/api/admin/requests/route.ts` — research, plan generation, release/archive
- `app/api/start/route.ts` — start a ready goal
- `app/api/checkin/route.ts` — persist check-ins and return coaching/analysis
- `lib/gemini.ts` — Gemini generation and JSON validation
- `lib/fallback.ts` — deterministic 30-day fallback planner
- `lib/analysis.ts` — transparent daily/weekly analysis rules
- `lib/schemas.ts` — Zod validation
- `lib/db.ts` — Supabase server client
- `supabase/schema.sql` — requests/checkins schema

## Current behavior that must be preserved
1. Users submit a goal with real-life context.
2. A request is created in Supabase.
3. Admin researches and generates a 30-day plan.
4. Plan is held in `review` until explicitly released.
5. User can only start after release.
6. User logs what actually happened.
7. AuraMind gives non-judgmental coaching.
8. Daily analysis uses logged evidence.
9. Weekly analysis only promotes repeated patterns when enough data exists.
10. Gemini failures fall back to a deterministic 30-day plan instead of leaving the user stuck.

## Critical product principles
- Do not make fake claims about customers, revenue, retention, outcomes or success.
- Do not promise that a user will achieve a goal.
- Do not shame users for missed work.
- Treat missed tasks as behavioral signals that can inform adaptation.
- Do not claim a pattern from insufficient data; show “Not enough data yet.”
- Do not expose API keys or service-role secrets to the browser.
- Do not silently replace a real AI failure with a misleading success message.

## FIRST TASK: diagnose before rewriting
Before making large changes:
1. Run `npm install`.
2. Run `npm run typecheck`.
3. Run `npm run build`.
4. Start the dev server with `npm run dev`.
5. Exercise the request → admin → release → start → check-in flow.
6. Identify the actual failures.
7. Fix root causes rather than only changing UI error text.

Never claim a test passed unless you actually ran it.

## Priority roadmap
### P0 — reliability
- Make request creation robust.
- Make Gemini generation reliable with timeout, retry, malformed JSON handling and validated schemas.
- Ensure fallback generation is always available when Gemini is unavailable.
- Make admin research/plan/review/release transitions atomic and understandable.
- Prevent duplicate check-ins and conflicting state.
- Improve server error logging without leaking secrets.

### P0 — security/data isolation
- Keep `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` and `AURAMIND_ADMIN_KEY` server-only.
- Do not rely on a raw UUID alone for durable public access; add a safe per-request access mechanism before real users are onboarded.
- Ensure one user/request cannot access another user's check-ins or plan.
- Keep admin actions server-authorized.

### P1 — real product UX
- Make the landing/request form premium and mobile-first.
- Improve the request-status experience with clear progress states: pending → researching → review → ready.
- Make the 30-day plan easy to scan on mobile.
- Make check-ins fast enough to complete in under a minute.
- Make daily/weekly analysis visually understandable.
- Add empty/loading/error/success states everywhere.
- Avoid unnecessary animations and visual clutter.

### P1 — stronger AI behavior
- Make research output specific to the goal and user constraints.
- Generate measurable tasks rather than generic advice.
- Respect deadlines and fixed commitments.
- Avoid impossible schedules and overbooking.
- Vary task types across 30 days.
- Use behavioral evidence from check-ins to adjust future scheduling.

### P1 — product intelligence
- Add a true adaptive 7-day rebuild based on evidence.
- Surface recurring bottlenecks and explain why the schedule changed.
- Keep rule-based analysis as a transparent fallback.

### P2 — growth readiness
- Add product analytics only after core reliability is solid.
- Prepare real user accounts/authentication.
- Prepare payment integration only when the core product is stable.
- Prepare referral/feedback loops.
- Design data structures for real users rather than a single-device demo.

### P2 — Android readiness
Keep the UI and architecture mobile-first and API-driven so the web product can later be packaged as an Android app.

## UX direction
Brand feeling: focused intelligence + accountability.

Preferred direction:
- premium
- modern
- calm
- trustworthy
- slightly futuristic
- strong typography
- accessible contrast
- mobile-first

Avoid:
- generic SaaS templates
- childish gamification
- excessive gradients
- huge walls of text
- fake AI jargon

## AI implementation rules
Use strict Zod validation for all structured model output.

Gemini generation should:
- have a bounded timeout
- retry a small number of times
- validate JSON before persistence
- reject incomplete schedules
- never leak the raw provider response to the browser
- return a helpful, user-safe error or fallback

## Fallback rules
The deterministic fallback planner is part of product reliability, not a demo-only toy.
It must:
- produce exactly 30 days
- respect the user's daily-hours limit
- respect focus period as reasonably as possible
- include varied phases
- avoid impossible overloading
- remain clearly labeled as fallback internally

## Competition/startup readiness
AuraMind may be used as a student startup/AI competition project. Build it so a live demo can show:
1. a real goal
2. research
3. a personalized 30-day timetable
4. a user starting the goal
5. a missed/partial check-in
6. a diagnostic coaching response
7. an evidence-based schedule adaptation

Never fabricate traction. Real customer/revenue data must come from real transactions and logs.

## Free-first constraint
Prefer free/open tools during development. Do not introduce paid services unless necessary. If a paid service is added, explain the reason and the likely cost before requiring it.

## Definition of “best” for this project
The best version is not the version with the most features. It is the version that:
- works reliably
- produces useful personalized plans
- feels fast and polished
- handles failures gracefully
- keeps user data isolated
- learns from actual user behavior
- is easy to demo
- is maintainable by a small team

## Working agreement
Make changes in small, testable steps. After each meaningful change, report:
- files changed
- what changed
- why it changed
- tests run
- remaining issues
- any environment variables required

Do not rewrite working features simply to make code look different.
