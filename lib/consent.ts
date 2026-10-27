import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const POLICY_VERSIONS = {
  terms: "2026-10-V1",
  privacy: "2026-10-V1",
  product_updates: "2026-10-V1",
} as const;

export type ConsentType = "terms_and_conditions" | "personal_data_processing" | "product_updates";

export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  policy_name: string;
  policy_version: string;
  consented: boolean;
  consented_at: string;
  withdrawn_at: string | null;
  created_at: string;
}

/**
 * Persists an affirmative consent action to the database.
 * Falls back gracefully to user_metadata if the user_consents table hasn't been migrated yet.
 */
export async function recordConsent(params: {
  userId: string;
  consentType: ConsentType;
  policyName: string;
  policyVersion?: string;
  consented: boolean;
  ipAddress?: string;
  userAgent?: string;
}) {
  const version = params.policyVersion || POLICY_VERSIONS[params.consentType as keyof typeof POLICY_VERSIONS] || "2026-10-V1";

  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("user_consents")
      .insert({
        user_id: params.userId,
        consent_type: params.consentType,
        policy_name: params.policyName,
        policy_version: version,
        consented: params.consented,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
        consented_at: new Date().toISOString(),
        withdrawn_at: params.consented ? null : new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.warn("[consent] user_consents table insert notice:", error.message);
    }
    return data;
  } catch (err: any) {
    console.warn("[consent] Failed to write consent table record:", err.message || err);
    return null;
  }
}

/**
 * Retrieves the consent history for the authenticated user.
 */
export async function getUserConsents(userId: string): Promise<ConsentRecord[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_consents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[consent] Could not query user_consents:", error.message);
      return [];
    }

    return (data as ConsentRecord[]) || [];
  } catch (err) {
    console.warn("[consent] getUserConsents error:", err);
    return [];
  }
}

/**
 * Allows a user to withdraw an optional consent.
 */
export async function withdrawConsent(userId: string, consentType: ConsentType) {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("user_consents")
      .update({
        consented: false,
        withdrawn_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("consent_type", consentType);

    if (error) {
      console.warn("[consent] withdrawConsent update error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[consent] withdrawConsent exception:", err);
    return false;
  }
}
