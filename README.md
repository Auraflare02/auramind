# AuraMind

AuraMind is a research-first accountability product.

## Current V1 flow

1. A user submits a goal and real-life constraints.
2. AuraMind creates a unique request ID such as `AM-1A2B3C4D5E6F7788`.
3. The request enters the research queue with a target window of up to 12 hours.
4. The operator/researcher opens the private admin queue and performs the goal research.
5. Research notes are saved to the request.
6. Gemini converts the reviewed research into a **30-day** timetable.
7. The operator reviews the timetable and releases it to the user.
8. The user enters/opens the request, starts the goal, and uses hourly accountability, daily analysis, weekly intelligence, and adaptive planning.

## Supabase setup

Run `supabase/schema.sql` in the Supabase SQL editor.

Set these Vercel environment variables:

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
AURAMIND_ADMIN_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash
```

Keep `SUPABASE_SERVICE_ROLE_KEY` and `AURAMIND_ADMIN_KEY` server-side only. Do not prefix them with `NEXT_PUBLIC_`.

## Admin

Open `/admin`, enter the same value configured as `AURAMIND_ADMIN_KEY`, load requests, research a request, generate the 30-day timetable, review it, then release it.

## Product principle

AuraMind does not pretend that an instant generic AI response is the same thing as researched planning. The operator can research the goal first; AI is then used as a planning/analysis layer, while the accountability loop learns from the user's actual behavior.


## Hardening upgrade

The current hardening branch adds:

- Persistent goal-run sessions, hourly logs and AI reports in Supabase.
- A database-backed AuraMind knowledge layer with seeded planning, learning and behavior principles.
- A goal-aware "Ask AuraMind" assistant with conversational memory.
- Centralized Gemini JSON generation with structured output, retry handling and configurable thinking level.
- Strict validation for 30-day and adaptive 7-day schedules.
- Goal-specific timezone handling for hourly accountability.
- A local-storage fallback so the dashboard remains usable when persistence is temporarily unavailable.

### Additional environment variable

```
GEMINI_THINKING_LEVEL=medium
```

Use `low` for fast responses, `medium` for normal reasoning, and `high` for complex planning/adaptation.

### Database

Run `supabase/schema.sql` for a complete fresh setup. For an existing database, run:

```
supabase/migrations/20261008_aura_hardening.sql
```

The public app never receives the Supabase service-role key.
