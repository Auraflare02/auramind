import { redirect } from "next/navigation";
import { createClient, isSupabaseAuthConfigured } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { ensureProfileIdentity } from "@/lib/friends/client";
import DashboardClient from "@/components/DashboardClient";

export const metadata = {
  title: "Dashboard — AuraMind",
  description: "Your personalized deliberate practice trajectories and behavioral telemetry.",
};

export default async function DashboardPage() {
  if (!isSupabaseAuthConfigured()) {
    redirect("/login?next=/dashboard");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  // Retrieve user profile
  let profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    created_at: string;
    username?: string | null;
    auramind_id?: string | null;
  } = {
    id: user.id,
    full_name: (user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "AuraMind Pioneer") as string,
    email: user.email || "",
    avatar_url: (user.user_metadata?.avatar_url || user.user_metadata?.picture || null) as string | null,
    created_at: user.created_at || new Date().toISOString(),
    username: null,
    auramind_id: null,
  };

  try {
    const admin = getAdminClient();
    const { data: dbProfile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (dbProfile) {
      profile = {
        ...profile,
        ...dbProfile,
      };
      const ensured = await ensureProfileIdentity(profile);
      profile = {
        ...profile,
        username: ensured.username,
        auramind_id: ensured.auramindId,
      };
    } else {
      // Upsert profile in background
      await admin.from("profiles").upsert(
        {
          id: user.id,
          full_name: profile.full_name,
          email: profile.email,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      const ensured = await ensureProfileIdentity(profile);
      profile = {
        ...profile,
        username: ensured.username,
        auramind_id: ensured.auramindId,
      };
    }
  } catch (err) {
    console.warn("[dashboard profile warning]", err);
  }

  // Retrieve user's goals from requests table
  let userGoals: any[] = [];
  let totalFocusMin = 0;
  let totalXp = 50;

  try {
    const admin = getAdminClient();
    const { data: goalsData } = await admin
      .from("requests")
      .select("id, request_code, status, category, current_level, target_level, context, plan, created_at, started_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (goalsData && Array.isArray(goalsData)) {
      userGoals = goalsData;

      // Calculate total focus minutes and XP across all user goals
      if (userGoals.length > 0) {
        const goalIds = userGoals.map((g) => g.id);
        const { data: focusSessions } = await admin
          .from("auramind_focus_sessions")
          .select("duration_min, xp_awarded")
          .in("request_id", goalIds);

        if (focusSessions && Array.isArray(focusSessions)) {
          totalFocusMin = focusSessions.reduce((acc, s) => acc + (s.duration_min || 0), 0);
          totalXp += focusSessions.reduce((acc, s) => acc + (s.xp_awarded || 0), 0);
        }
      }
    }
  } catch (err) {
    console.warn("[dashboard goals query warning]", err);
  }

  const stats = {
    totalGoals: userGoals.length,
    activeGoals: userGoals.filter((g) => g.status !== "completed" && g.status !== "archived").length,
    totalFocusMin,
    totalXp,
  };

  return <DashboardClient profile={profile} goals={userGoals} stats={stats} />;
}
