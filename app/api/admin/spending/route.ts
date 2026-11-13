import { J, guard, isAdmin } from "@/lib/http";
import {
  getSpendingDashboardData,
  toggleEmergencyKillSwitch,
} from "@/lib/spending/controls";
import { z } from "zod";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export const GET = guard(async (req) => {
  if (!isAdmin(req)) {
    return J({ error: "Unauthorized: Invalid or missing AURAMIND_ADMIN_KEY." }, 401);
  }

  const data = await getSpendingDashboardData();
  return J({ ok: true, data });
});

export const POST = guard(async (req) => {
  if (!isAdmin(req)) {
    return J({ error: "Unauthorized: Invalid or missing AURAMIND_ADMIN_KEY." }, 401);
  }

  const body = await req.json().catch(() => null);
  const actionSchema = z.object({
    action: z.enum(["toggle_kill_switch"]),
    target: z.enum(["calling", "whatsapp"]),
    enabled: z.boolean(),
  });

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return J({ error: "Invalid financial control action payload." }, 400);
  }

  const { target, enabled } = parsed.data;
  const result = await toggleEmergencyKillSwitch(target, enabled);

  return J({ ok: true, result });
});
