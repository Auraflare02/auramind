import { NextResponse } from "next/server";
import { getServerDb } from "../../../lib/server-db";
import { isGeminiEnabled } from "../../../lib/gemini";

export async function GET() {
  const db = getServerDb();
  return NextResponse.json({
    ok: true,
    services: {
      supabase: Boolean(db),
      gemini: isGeminiEnabled(),
      tavily: Boolean(process.env.TAVILY_API_KEY),
      adminKey: Boolean(process.env.AURAMIND_ADMIN_KEY)
    },
    hint: "This endpoint never returns secret values."
  });
}
