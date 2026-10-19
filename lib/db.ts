import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabaseClient: SupabaseClient | null = null;

export function isDbConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function db(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("ENV_SUPABASE: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your server environment (.env.local).");
  }

  // Basic sanity validation
  if (!url.startsWith("https://") && !url.startsWith("http://")) {
    throw new Error("ENV_SUPABASE: SUPABASE_URL must be a valid HTTP/HTTPS URL.");
  }

  // Detect accidental anon key usage
  if (key.includes("anon") || key.length < 20) {
    console.warn("[supabase] WARNING: SUPABASE_SERVICE_ROLE_KEY may be misconfigured. Ensure you are using the secret service_role key, not the publishable anon key.");
  }

  if (!_supabaseClient) {
    _supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: "public",
      },
    });
  }

  return _supabaseClient;
}

export interface DbResult<T> {
  data: T | null;
  error: { message: string; code?: string; details?: string; hint?: string } | null;
  count?: number | null;
}

export function ok<T>(r: DbResult<T>): T {
  if (r.error) {
    const code = r.error.code || "";
    let msg = `Database error [${code}]: ${r.error.message}`;

    if (code === "42501") {
      msg = `Database permission error (42501). Row-level security prevented this operation. Ensure SUPABASE_SERVICE_ROLE_KEY is the secret service_role key, and that schema migrations have granted permissions to service_role. Details: ${r.error.details || r.error.message}`;
    } else if (code === "42P01") {
      msg = `Database table missing (42P01). The required table does not exist. Please run supabase/schema.sql in your Supabase SQL Editor. Details: ${r.error.details || r.error.message}`;
    } else if (code === "23505") {
      msg = `Database unique constraint violation (23505): ${r.error.details || r.error.message}`;
    }

    console.error("[supabase error]", { code, message: r.error.message, details: r.error.details, hint: r.error.hint });
    throw new Error(msg);
  }

  if (r.data === null || r.data === undefined) {
    throw new Error("Database returned null data when a record was expected.");
  }

  return r.data;
}

export function maybeOk<T>(r: DbResult<T>): T | null {
  if (r.error) {
    if (r.error.code === "PGRST116") {
      return null; // Not found
    }
    return ok(r);
  }
  return r.data;
}

export async function testDbConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    if (!isDbConfigured()) {
      return { ok: false, message: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." };
    }
    const client = db();
    const { error } = await client.from("requests").select("id").limit(1);
    if (error) {
      if (error.code === "42P01") {
        return { ok: false, message: "Connected to Supabase, but 'requests' table does not exist. Run schema.sql." };
      }
      if (error.code === "42501") {
        return { ok: false, message: "Permission denied (42501). Check that SUPABASE_SERVICE_ROLE_KEY has service_role privileges." };
      }
      return { ok: false, message: `Database error: ${error.message} (${error.code})` };
    }
    return { ok: true, message: "Database connection and permissions verified." };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
