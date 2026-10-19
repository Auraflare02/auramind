import { NextResponse } from "next/server";
import { timingSafeEqual, randomBytes } from "crypto";

export const J = (d: unknown, s = 200) => NextResponse.json(d, { status: s });

export const guard = (f: (r: Request) => Promise<Response>) => async (r: Request) => {
  try {
    return await f(r);
  } catch (e) {
    const m = (e as Error)?.message || String(e);
    console.error("[api error]", m.slice(0, 500));

    if (m.includes("ENV_SUPABASE")) {
      return J(
        {
          error: "Database credentials are not configured. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local.",
        },
        503
      );
    }

    if (m.includes("ENV_GEMINI")) {
      return J(
        {
          error: "Gemini AI is not configured. Please add GEMINI_API_KEY to your environment.",
        },
        503
      );
    }

    if (m.includes("42501")) {
      return J(
        {
          error: "Database permission error (42501). Ensure SUPABASE_SERVICE_ROLE_KEY is the secret service_role key and RLS policies are applied.",
        },
        500
      );
    }

    return J(
      {
        error: m.length < 150 ? m : "An error occurred while processing your request. Please try again in a moment.",
      },
      500
    );
  }
};

export function isAdmin(req: Request): boolean {
  const adminKey = process.env.AURAMIND_ADMIN_KEY;
  const headerKey = req.headers.get("x-admin-key") || "";

  if (!adminKey || !headerKey) return false;

  try {
    const a = Buffer.from(headerKey);
    const b = Buffer.from(adminKey);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function generateRequestCode(): string {
  // Format: AM-A1B2C3D4E5F60718
  const chars = "0123456789ABCDEF";
  let hex = "";
  const bytes = randomBytes(8);
  for (let i = 0; i < bytes.length; i++) {
    hex += chars[(bytes[i] >> 4) & 0xf] + chars[bytes[i] & 0xf];
  }
  return `AM-${hex}`;
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function verifySession(req: Request, expectedToken: string): boolean {
  if (!expectedToken) return false;
  const authHeader = req.headers.get("authorization") || "";
  const tokenHeader = req.headers.get("x-session-token") || "";

  const token = authHeader.replace(/^Bearer\s+/i, "").trim() || tokenHeader.trim();
  if (!token) return false;

  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expectedToken);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const isUuid = (s: string | null): s is string =>
  !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export const isRequestCode = (s: string | null): s is string =>
  !!s && /^AM-[0-9A-Z]{16}$/i.test(s);
