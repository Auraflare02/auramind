import { J } from "@/lib/http";
import { testDbConnection, isDbConfigured } from "@/lib/db";
import { isGeminiConfigured, getGeminiModel } from "@/lib/gemini";

export async function GET() {
  const dbHealth = await testDbConnection();

  const status = {
    app: "AuraMind",
    status: dbHealth.ok ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    services: {
      supabase: {
        configured: isDbConfigured(),
        status: dbHealth.ok ? "connected" : "error",
        message: dbHealth.message,
      },
      gemini: {
        configured: isGeminiConfigured(),
        model: getGeminiModel(),
        status: isGeminiConfigured() ? "ready" : "missing_key",
      },
      tavily: {
        configured: Boolean(process.env.TAVILY_API_KEY),
        status: Boolean(process.env.TAVILY_API_KEY) ? "ready" : "optional_not_configured",
      },
      admin_access: {
        configured: Boolean(process.env.AURAMIND_ADMIN_KEY),
      },
    },
  };

  return J(status, dbHealth.ok ? 200 : 503);
}
