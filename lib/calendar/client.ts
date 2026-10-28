import { getAdminClient } from "@/lib/supabase/admin";
import { encryptToken, decryptToken, createOAuthState, computeEventHash } from "./crypto";

export interface CalendarConnectionRecord {
  id: string;
  user_id: string;
  google_email: string | null;
  google_account_id: string | null;
  encrypted_refresh_token: string;
  access_token: string | null;
  access_token_expires_at: string | null;
  calendar_id: string;
  auto_sync: boolean;
  sync_deletions: boolean;
  last_synced_at: string | null;
  sync_status: "connected" | "syncing" | "synced" | "error" | "disconnected";
  sync_error: string | null;
}

export interface AuraMindCalendarEventRecord {
  id: string;
  user_id: string;
  request_id: string;
  day: number;
  block_index: number;
  task_activity: string;
  google_calendar_id: string;
  google_event_id: string;
  event_start: string;
  event_end: string;
  sync_hash: string | null;
  last_synced_at: string;
}

export interface SyncResult {
  ok: boolean;
  totalBlocks: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export interface ConflictEvent {
  summary: string;
  start: string;
  end: string;
  blockActivity: string;
  blockStart: string;
  blockEnd: string;
}

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo";

export const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

export function getGoogleOAuthCredentials() {
  const clientId =
    process.env.GOOGLE_CALENDAR_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    "672978067393-k0qmvsbto45mspgmijlq799rhq1lovp0.apps.googleusercontent.com";

  const clientSecret =
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    "";

  return { clientId, clientSecret };
}

export function getRedirectUri(origin?: string): string {
  if (process.env.GOOGLE_CALENDAR_REDIRECT_URI) {
    return process.env.GOOGLE_CALENDAR_REDIRECT_URI;
  }
  const baseUrl =
    origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://auramind-vert.vercel.app");

  return `${baseUrl.replace(/\/+$/, "")}/api/calendar/callback`;
}

/**
 * Builds the Google OAuth 2.0 authorization URL for Google Calendar.
 */
export function buildCalendarAuthUrl(userId: string, origin?: string, returnUrl: string = "/settings"): string {
  const { clientId } = getGoogleOAuthCredentials();
  const redirectUri = getRedirectUri(origin);
  const state = createOAuthState(userId, returnUrl);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: CALENDAR_SCOPES,
    access_type: "offline",
    prompt: "consent", // Force refresh token issuance
    state,
    include_granted_scopes: "true",
  });

  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Exchanges authorization code for tokens, retrieves user email, and saves encrypted connection.
 */
export async function handleOAuthCallback(
  code: string,
  userId: string,
  origin?: string
): Promise<{ googleEmail: string }> {
  const { clientId, clientSecret } = getGoogleOAuthCredentials();
  const redirectUri = getRedirectUri(origin);

  if (!clientSecret) {
    throw new Error(
      "GOOGLE_CALENDAR_CLIENT_SECRET is missing. Please set GOOGLE_CALENDAR_CLIENT_SECRET in your server environment."
    );
  }

  // 1. Exchange code for tokens
  const tokenRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(
      tokenData.error_description || tokenData.error || "Failed to exchange authorization code with Google."
    );
  }

  const { access_token, refresh_token, expires_in } = tokenData;

  // 2. Fetch user's Google email
  let googleEmail = "unknown";
  let googleAccountId = null;
  try {
    const userinfoRes = await fetch(GOOGLE_USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (userinfoRes.ok) {
      const userInfo = await userinfoRes.json();
      googleEmail = userInfo.email || googleEmail;
      googleAccountId = userInfo.id || null;
    }
  } catch (e) {
    console.warn("[calendar oauth] could not fetch google userinfo:", e);
  }

  const admin = getAdminClient();

  // If Google did not return a refresh_token (can happen if already consented), fetch existing one
  let encryptedRefreshToken = "";
  if (refresh_token) {
    encryptedRefreshToken = encryptToken(refresh_token);
  } else {
    const { data: existing } = await admin
      .from("user_calendar_connections")
      .select("encrypted_refresh_token")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing?.encrypted_refresh_token) {
      encryptedRefreshToken = existing.encrypted_refresh_token;
    } else {
      throw new Error(
        "Google did not provide a refresh token. Please revoke AuraMind access in your Google Account security settings and reconnect."
      );
    }
  }

  const expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000).toISOString();

  // 3. Upsert into user_calendar_connections
  const { error: upsertErr } = await admin.from("user_calendar_connections").upsert(
    {
      user_id: userId,
      google_email: googleEmail,
      google_account_id: googleAccountId,
      encrypted_refresh_token: encryptedRefreshToken,
      access_token,
      access_token_expires_at: expiresAt,
      calendar_id: "primary",
      sync_status: "connected",
      sync_error: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (upsertErr) {
    throw new Error(`Failed to save calendar credentials: ${upsertErr.message}`);
  }

  return { googleEmail };
}

/**
 * Gets a fresh, valid Google Calendar access token for an authenticated user.
 */
export async function getValidAccessToken(userId: string): Promise<{
  accessToken: string;
  connection: CalendarConnectionRecord;
}> {
  const admin = getAdminClient();
  const { data: conn, error } = await admin
    .from("user_calendar_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !conn) {
    throw new Error("Google Calendar is not connected. Please connect your account first.");
  }

  if (conn.sync_status === "disconnected") {
    throw new Error("Google Calendar was disconnected. Please reconnect to resume synchronization.");
  }

  const now = Date.now();
  const expiresAtMs = conn.access_token_expires_at ? new Date(conn.access_token_expires_at).getTime() : 0;

  // If current access token is valid for at least another 60 seconds, reuse it
  if (conn.access_token && expiresAtMs > now + 60 * 1000) {
    return { accessToken: conn.access_token, connection: conn };
  }

  // Refresh access token using refresh token
  const refreshToken = decryptToken(conn.encrypted_refresh_token);
  const { clientId, clientSecret } = getGoogleOAuthCredentials();

  const refreshRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const refreshData = await refreshRes.json();

  if (!refreshRes.ok || !refreshData.access_token) {
    const isRevoked =
      refreshData.error === "invalid_grant" ||
      (refreshData.error_description && refreshData.error_description.includes("revoked"));

    const errMsg = isRevoked
      ? "Google Calendar authorization has expired or was revoked. Please reconnect in Settings."
      : refreshData.error_description || "Failed to refresh Google Calendar token.";

    await admin
      .from("user_calendar_connections")
      .update({
        sync_status: "error",
        sync_error: errMsg,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    throw new Error(errMsg);
  }

  const newAccessToken = refreshData.access_token;
  const newExpiresAt = new Date(Date.now() + (refreshData.expires_in || 3600) * 1000).toISOString();

  await admin
    .from("user_calendar_connections")
    .update({
      access_token: newAccessToken,
      access_token_expires_at: newExpiresAt,
      sync_status: "connected",
      sync_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  conn.access_token = newAccessToken;
  conn.access_token_expires_at = newExpiresAt;

  return { accessToken: newAccessToken, connection: conn };
}

/**
 * Disconnects Google Calendar and safely revokes the token.
 */
export async function disconnectCalendar(userId: string): Promise<void> {
  const admin = getAdminClient();
  const { data: conn } = await admin
    .from("user_calendar_connections")
    .select("encrypted_refresh_token")
    .eq("user_id", userId)
    .maybeSingle();

  if (conn?.encrypted_refresh_token) {
    try {
      const refreshToken = decryptToken(conn.encrypted_refresh_token);
      await fetch(`${GOOGLE_REVOKE_ENDPOINT}?token=${encodeURIComponent(refreshToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
    } catch (e) {
      console.warn("[calendar disconnect] revocation non-blocking error:", e);
    }
  }

  await admin
    .from("user_calendar_connections")
    .update({
      sync_status: "disconnected",
      access_token: null,
      access_token_expires_at: null,
      sync_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

/**
 * Parses diverse time representations (e.g. "07:00", "7:00 AM", "14:30") into HH:MM (24-hour).
 */
export function normalizeTimeToHHMM(timeStr: string): string {
  if (!timeStr) return "09:00";
  const clean = timeStr.trim().toUpperCase();

  const is12Hr = clean.includes("AM") || clean.includes("PM");
  if (is12Hr) {
    const isPM = clean.includes("PM");
    const numPart = clean.replace(/AM|PM/g, "").trim();
    const [hStr, mStr = "00"] = numPart.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isPM && h < 12) h += 12;
    if (!isPM && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }

  const [hStr, mStr = "00"] = clean.split(":");
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Synchronizes an entire 30-day plan or selected days to Google Calendar.
 */
export async function syncPlanToGoogleCalendar(
  userId: string,
  requestId: string,
  options: {
    days?: number[];
    force?: boolean;
    syncDeletions?: boolean;
  } = {}
): Promise<SyncResult> {
  const admin = getAdminClient();

  // 1. Validate connection and obtain valid access token
  const { accessToken, connection } = await getValidAccessToken(userId);
  const calendarId = connection.calendar_id || "primary";

  // Mark connection as syncing
  await admin
    .from("user_calendar_connections")
    .update({ sync_status: "syncing", sync_error: null, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  // 2. Fetch the goal request and plan
  const { data: request, error: reqErr } = await admin
    .from("requests")
    .select("id, request_code, user_id, timezone, plan, context, started_at")
    .eq("id", requestId)
    .maybeSingle();

  if (reqErr || !request) {
    throw new Error("Goal request not found.");
  }

  if (request.user_id && request.user_id !== userId) {
    throw new Error("Unauthorized: You do not have permission to sync this goal.");
  }

  const plan = request.plan;
  if (!plan || !Array.isArray(plan.days) || plan.days.length === 0) {
    throw new Error("This goal does not have an active 30-day timetable to synchronize.");
  }

  const userTimezone = request.timezone || request.context?.timezone || "UTC";

  // 3. Retrieve existing synced events mapping for this request
  const { data: existingEvents } = await admin
    .from("auramind_calendar_events")
    .select("*")
    .eq("request_id", requestId);

  const existingMap = new Map<string, AuraMindCalendarEventRecord>();
  if (existingEvents) {
    for (const ev of existingEvents) {
      existingMap.set(`${ev.day}_${ev.block_index}`, ev);
    }
  }

  const daysToSync = options.days
    ? plan.days.filter((d: any) => options.days?.includes(d.day))
    : plan.days;

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  let totalBlocks = 0;
  const errors: string[] = [];

  const goalSummary = request.context?.goal || plan.goal_summary || "Deliberate Practice";
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://auramind-vert.vercel.app";
  const goalUrl = `${appBaseUrl}/goal/${request.request_code || request.id}`;

  // 4. Process each scheduled day and block
  for (const day of daysToSync) {
    if (!day.blocks || !Array.isArray(day.blocks)) continue;

    // Determine calendar date for this day
    let dateStr = day.calendar_date;
    if (!dateStr || !dateStr.includes("-")) {
      const baseTime = request.started_at ? new Date(request.started_at).getTime() : Date.now();
      const targetTime = baseTime + (day.day - 1) * 864e5;
      dateStr = new Date(targetTime).toISOString().split("T")[0];
    }

    for (let bIdx = 0; bIdx < day.blocks.length; bIdx++) {
      totalBlocks++;
      const block = day.blocks[bIdx];
      const mapKey = `${day.day}_${bIdx}`;
      const existing = existingMap.get(mapKey);

      const startHhMm = normalizeTimeToHHMM(block.start);
      const endHhMm = normalizeTimeToHHMM(block.end);

      const hash = computeEventHash({
        activity: block.activity,
        start: startHhMm,
        end: endHhMm,
        date: dateStr,
        category: block.category,
      });

      // If already synced and nothing changed, skip API call (Idempotent!)
      if (existing && existing.sync_hash === hash && !options.force) {
        skipped++;
        continue;
      }

      // Prepare Google Calendar Event payload
      const startDateTime = `${dateStr}T${startHhMm}:00`;
      const endDateTime = `${dateStr}T${endHhMm}:00`;

      const eventPayload = {
        summary: `[AuraMind] ${block.activity}`,
        description: [
          `Goal: ${goalSummary}`,
          `Day ${day.day} of 30 (${day.phase || "Deliberate Practice"})`,
          `Category: ${block.category ? block.category.toUpperCase() : "PRACTICE"} | Priority: ${block.priority || "Normal"}`,
          "",
          block.instructions ? `Protocol: ${block.instructions}` : null,
          block.why_it_matters || block.reason ? `Reason: ${block.why_it_matters || block.reason}` : null,
          block.expected_output ? `Deliverable: ${block.expected_output}` : null,
          "",
          `View interactive goal workspace: ${goalUrl}`,
        ]
          .filter(Boolean)
          .join("\n"),
        start: {
          dateTime: startDateTime,
          timeZone: userTimezone,
        },
        end: {
          dateTime: endDateTime,
          timeZone: userTimezone,
        },
        colorId: "5", // Banana / Yellow in Google Calendar palette
        reminders: {
          useDefault: false,
          overrides: [{ method: "popup", minutes: 15 }],
        },
        extendedProperties: {
          private: {
            auramind_managed: "true",
            request_id: requestId,
            day: String(day.day),
            block_index: String(bIdx),
          },
        },
      };

      try {
        if (existing?.google_event_id) {
          // Update existing Google Calendar event
          const patchUrl = `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(
            calendarId
          )}/events/${encodeURIComponent(existing.google_event_id)}`;

          const patchRes = await fetch(patchUrl, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(eventPayload),
          });

          if (patchRes.ok) {
            await admin
              .from("auramind_calendar_events")
              .update({
                task_activity: block.activity,
                event_start: new Date(startDateTime).toISOString(),
                event_end: new Date(endDateTime).toISOString(),
                sync_hash: hash,
                last_synced_at: new Date().toISOString(),
              })
              .eq("id", existing.id);

            updated++;
          } else if (patchRes.status === 404 || patchRes.status === 410) {
            // Event was deleted in Google Calendar: recreate it
            const postUrl = `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`;
            const postRes = await fetch(postUrl, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(eventPayload),
            });
            const newEvent = await postRes.json();
            if (postRes.ok && newEvent.id) {
              await admin
                .from("auramind_calendar_events")
                .update({
                  google_event_id: newEvent.id,
                  task_activity: block.activity,
                  event_start: new Date(startDateTime).toISOString(),
                  event_end: new Date(endDateTime).toISOString(),
                  sync_hash: hash,
                  last_synced_at: new Date().toISOString(),
                })
                .eq("id", existing.id);
              updated++;
            } else {
              failed++;
              errors.push(`Day ${day.day} recreate failed: ${newEvent.error?.message || "Unknown error"}`);
            }
          } else {
            failed++;
            const errData = await patchRes.json().catch(() => ({}));
            errors.push(`Day ${day.day} block ${bIdx + 1} update error: ${errData.error?.message || patchRes.statusText}`);
          }
        } else {
          // Create new Google Calendar event
          const postUrl = `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`;
          const postRes = await fetch(postUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(eventPayload),
          });

          const newEvent = await postRes.json();
          if (postRes.ok && newEvent.id) {
            await admin.from("auramind_calendar_events").upsert(
              {
                user_id: userId,
                request_id: requestId,
                day: day.day,
                block_index: bIdx,
                task_activity: block.activity,
                google_calendar_id: calendarId,
                google_event_id: newEvent.id,
                event_start: new Date(startDateTime).toISOString(),
                event_end: new Date(endDateTime).toISOString(),
                sync_hash: hash,
                last_synced_at: new Date().toISOString(),
              },
              { onConflict: "request_id,day,block_index" }
            );
            created++;
          } else {
            failed++;
            errors.push(`Day ${day.day} create error: ${newEvent.error?.message || postRes.statusText}`);
          }
        }
      } catch (err: any) {
        failed++;
        errors.push(`Day ${day.day} block ${bIdx + 1}: ${err.message}`);
      }
    }
  }

  // Finalize sync status
  const finalStatus = failed === 0 ? "synced" : created > 0 || updated > 0 ? "synced" : "error";
  await admin
    .from("user_calendar_connections")
    .update({
      sync_status: finalStatus,
      last_synced_at: new Date().toISOString(),
      sync_error: errors.length > 0 ? errors.slice(0, 3).join("; ") : null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return {
    ok: failed === 0,
    totalBlocks,
    created,
    updated,
    skipped,
    failed,
    errors,
  };
}

/**
 * Checks for schedule conflicts between planned AuraMind blocks and existing user Google Calendar events.
 */
export async function detectCalendarConflicts(
  userId: string,
  requestId: string,
  dayNumber: number
): Promise<{ hasConflicts: boolean; conflicts: ConflictEvent[] }> {
  const admin = getAdminClient();
  const { accessToken, connection } = await getValidAccessToken(userId);
  const calendarId = connection.calendar_id || "primary";

  const { data: request } = await admin
    .from("requests")
    .select("timezone, plan, context, started_at")
    .eq("id", requestId)
    .maybeSingle();

  if (!request?.plan?.days) {
    return { hasConflicts: false, conflicts: [] };
  }

  const dayPlan = request.plan.days.find((d: any) => d.day === dayNumber);
  if (!dayPlan || !dayPlan.blocks || dayPlan.blocks.length === 0) {
    return { hasConflicts: false, conflicts: [] };
  }

  let dateStr = dayPlan.calendar_date;
  if (!dateStr || !dateStr.includes("-")) {
    const baseTime = request.started_at ? new Date(request.started_at).getTime() : Date.now();
    dateStr = new Date(baseTime + (dayNumber - 1) * 864e5).toISOString().split("T")[0];
  }

  const timeMin = new Date(`${dateStr}T00:00:00Z`).toISOString();
  const timeMax = new Date(`${dateStr}T23:59:59Z`).toISOString();
  const userTimezone = request.timezone || request.context?.timezone || "UTC";

  // Query Google Calendar for existing events on that day
  const eventsUrl = `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(
    calendarId
  )}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(
    timeMax
  )}&singleEvents=true&orderBy=startTime`;

  const eventsRes = await fetch(eventsUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!eventsRes.ok) {
    return { hasConflicts: false, conflicts: [] };
  }

  const eventsData = await eventsRes.json();
  const existingEvents: any[] = eventsData.items || [];

  // Filter out events created by AuraMind
  const externalEvents = existingEvents.filter(
    (ev) =>
      !ev.summary?.startsWith("[AuraMind]") &&
      ev.extendedProperties?.private?.auramind_managed !== "true"
  );

  const conflicts: ConflictEvent[] = [];

  for (const block of dayPlan.blocks) {
    const startHhMm = normalizeTimeToHHMM(block.start);
    const endHhMm = normalizeTimeToHHMM(block.end);
    const blockStart = new Date(`${dateStr}T${startHhMm}:00`).getTime();
    const blockEnd = new Date(`${dateStr}T${endHhMm}:00`).getTime();

    for (const ext of externalEvents) {
      const extStartStr = ext.start?.dateTime || ext.start?.date;
      const extEndStr = ext.end?.dateTime || ext.end?.date;
      if (!extStartStr || !extEndStr) continue;

      const extStart = new Date(extStartStr).getTime();
      const extEnd = new Date(extEndStr).getTime();

      // Check overlap: (StartA < EndB) and (EndA > StartB)
      if (blockStart < extEnd && blockEnd > extStart) {
        conflicts.push({
          summary: ext.summary || "Busy",
          start: extStartStr,
          end: extEndStr,
          blockActivity: block.activity,
          blockStart: block.start,
          blockEnd: block.end,
        });
      }
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
}
