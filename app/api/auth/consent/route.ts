import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserConsents, withdrawConsent, recordConsent, POLICY_VERSIONS, ConsentType } from "@/lib/consent";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const records = await getUserConsents(user.id);
    const meta = user.user_metadata || {};

    return NextResponse.json({
      ok: true,
      user_id: user.id,
      consents: records,
      metadata_consents: {
        terms_accepted: Boolean(meta.terms_accepted),
        terms_version: meta.terms_version || POLICY_VERSIONS.terms,
        terms_accepted_at: meta.terms_accepted_at || null,
        privacy_consented: Boolean(meta.privacy_consented),
        privacy_version: meta.privacy_version || POLICY_VERSIONS.privacy,
        privacy_consented_at: meta.privacy_consented_at || null,
        optional_updates_consented: Boolean(meta.optional_updates_consented),
        optional_updates_consented_at: meta.optional_updates_consented_at || null,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to retrieve consent records." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { consent_type, consented } = body;

    // Users can only toggle optional consents (e.g. product_updates)
    // Mandatory terms & privacy cannot be toggled false without deleting the account
    if (consent_type !== "product_updates") {
      return NextResponse.json(
        { error: "Mandatory account consents cannot be modified directly. Use account deletion to withdraw all consents." },
        { status: 400 }
      );
    }

    if (consented === false) {
      await withdrawConsent(user.id, "product_updates");
      await supabase.auth.updateUser({
        data: {
          optional_updates_consented: false,
          optional_updates_withdrawn_at: new Date().toISOString(),
        },
      });
    } else {
      await recordConsent({
        userId: user.id,
        consentType: "product_updates",
        policyName: "Product Communications",
        policyVersion: POLICY_VERSIONS.product_updates,
        consented: true,
      });
      await supabase.auth.updateUser({
        data: {
          optional_updates_consented: true,
          optional_updates_consented_at: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      ok: true,
      consent_type,
      consented: Boolean(consented),
      updated_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update consent preference." }, { status: 500 });
  }
}
