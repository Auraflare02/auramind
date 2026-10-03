import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getServerDb() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;
  if (cached) return cached;

  cached = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  return cached;
}

export function requireAdminKey(request: Request) {
  const expected = process.env.AURAMIND_ADMIN_KEY;
  const provided = request.headers.get("x-admin-key");
  return Boolean(expected && provided && provided === expected);
}

export function dbUnavailableMessage() {
  return "AuraMind request storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.";
}
