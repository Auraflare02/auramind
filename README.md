# AuraMind &mdash; AI Accountability & Goal Execution Platform

> *"Don't plan a perfect day. Build a system that learns your real one."*

AuraMind is a research-first AI accountability platform that turns ambitious goals into consistent, measurable action through a closed feedback loop:

```
GOAL & CONSTRAINTS 
  ↓
LEARNING-SCIENCE RESEARCH 
  ↓
PERSONALIZED 30-DAY TIMETABLE (GEMINI) 
  ↓
START GOAL & PERSISTENT SESSION 
  ↓
EXECUTE TASKS WITH FOCUS TIMER 
  ↓
HOURLY ACCOUNTABILITY CHECK-INS 
  ↓
EMPIRICAL METRICS & AI COACHING 
  ↓
DAILY & WEEKLY REPORT NARRATIVES 
  ↓
ADAPTIVE 7-DAY SCHEDULE REBUILD 
  ↓
CONTINUOUS IMPROVEMENT
```

---

## 1. Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Frontend**: React 18, Strict TypeScript, Modern Black-and-Yellow UI Design System
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **AI Intelligence**: Google Gemini API (`gemini-2.5-flash`)
- **External Web Research**: Tavily API (Optional)
- **Deployment**: Vercel Ready

---

## 2. Environment Variables

Create `.env.local` in the project root based on `.env.example`:

| Variable | Required | Description |
| :--- | :---: | :--- |
| `SUPABASE_URL` | **Yes** | HTTPS URL of your Supabase project (e.g. `https://xyz.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Privileged Supabase `service_role` secret key. **Never** use the public `anon` key. |
| `AURAMIND_ADMIN_KEY` | **Yes** | Admin passphrase required to access `/admin` and release plans. |
| `GEMINI_API_KEY` | **Yes** | Google AI Studio Gemini API key. |
| `GEMINI_MODEL` | No | Defaults to `gemini-2.5-flash`. |
| `GEMINI_THINKING_LEVEL` | No | Optional thinking level parameter (`low`, `medium`, `high`). |
| `TAVILY_API_KEY` | No | Optional key for live web search during admin research phase. |

---

## 3. Database Setup & Fixing Error 42501

Previous versions experienced PostgreSQL Error `42501` (`insufficient_privilege`) when inserting goal requests or check-ins. This occurred when the frontend anon key was used or when RLS policies did not permit `service_role` execution.

### To Apply Database Schema:

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **SQL Editor**.
3. Copy the contents of `supabase/schema.sql` (or `supabase/migrations/20261019_auramind_complete.sql`).
4. Run the query.

This creates the following verified schema:
- `requests` (Main table with `request_code`, `category`, `current_level`, `target_level`, `plan`, `ready_at`, etc.)
- `goal_requests` (View alias for compatibility)
- `checkins` / `auramind_run_logs` (Hourly check-in records)
- `auramind_focus_sessions` (Timer sessions and recorded minutes)
- `auramind_goal_runs` (Persistent sessions, streaks, XP, adaptive schedules)
- `auramind_messages` (Ask AuraMind conversational history)
- `auramind_run_reports` (Daily and weekly performance reports)
- `auramind_knowledge` (Cached curriculum benchmarks)
- Full `service_role` grants and explicit RLS policies that prevent 42501 errors.

---

## 4. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Verify TypeScript types
npm run typecheck

# 3. Test production build
npm run build

# 4. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. End-to-End Application Workflow

1. **User Creates Goal (`/`)**:
   - Submits goal with category-specific starting level and target level (CEFR, Coding, Education, Career, etc.).
   - Specifies daily hours, peak focus window, fixed commitments, and distractions.
   - Receives unique Request Code formatted as `AM-A1B2C3D4E5F60718`.
2. **Admin Research & Review (`/admin`)**:
   - Admin signs in using `AURAMIND_ADMIN_KEY`.
   - Admin conducts research (with Tavily external search and Gemini learning-science breakdown).
   - Admin synthesizes a 30-day timetable (with 30 sequential calendar days, phases, and task blocks).
   - Admin reviews the timetable and clicks **Release to User**.
   - Backend atomically verifies the plan exists, sets status to `ready` and stamps `ready_at`.
3. **User Starts 30-Day Goal (`/goal/[id]`)**:
   - Status transitions to ready. User clicks **Start 30-Day Goal**.
   - Cryptographic session token is generated and persisted in `auramind_goal_runs`.
4. **Execution Dashboard**:
   - **Curriculum**: View today's blocks, start times, and reasons.
   - **Focus Timer**: Interactive timer with 25m, 50m, 90m presets and break modes. Accurate against sleep and page refresh. Automatically logs sessions and awards XP.
   - **Hourly Check-In**: Quick logging of planned vs. actual work, focus/distraction minutes, and reasons. Provides immediate diagnostic Gemini coaching.
   - **Ask AuraMind**: Real Gemini AI assistant with live context of the user's schedule and check-ins.
   - **Reports & Analytics**: Deterministic metrics combined with Gemini daily/weekly synthesis.
   - **Adaptive Timetable**: Evidence-based schedule adjustment for the upcoming 7 days based on real logged friction.

---

## 6. Deployment to Vercel

1. Push your repository to GitHub / GitLab.
2. Import the project into [Vercel](https://vercel.com).
3. Set the Environment Variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AURAMIND_ADMIN_KEY`, `GEMINI_API_KEY`).
4. Deploy!

---

## 7. Known Limitations & Fallbacks

- **Gemini Fallback**: If `GEMINI_API_KEY` is not provided or Gemini is temporarily unreachable, the system automatically falls back to our deterministic learning-science planner (`lib/fallback.ts`) ensuring users and admins are never blocked.
- **External Web Research**: Tavily search is optional; if `TAVILY_API_KEY` is omitted, Gemini generates research using its internal learning-science knowledge base.
