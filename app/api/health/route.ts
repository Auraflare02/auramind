import { J } from "@/lib/http";
import { testDbConnection, isDbConfigured } from "@/lib/db";
import { isGeminiConfigured, getGeminiModel } from "@/lib/gemini";

export async function GET() {
  const dbHealth = await testDbConnection();

  let liveModels: string[] = [];
  let geminiApiTest = "not_tested";
  const key = process.env.GEMINI_API_KEY;
  if (key) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
      if (res.ok) {
        const data = await res.json();
        liveModels = (data.models || []).map((m: any) => m.name.replace("models/", "")).filter((m: string) => m.includes("gemini") || m.includes("flash"));
        geminiApiTest = "ok";
      } else {
        const err = await res.text();
        geminiApiTest = `HTTP ${res.status}: ${err.slice(0, 150)}`;
      }
    } catch (e: any) {
      geminiApiTest = `Error: ${e.message}`;
    }
  }

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
        api_test: geminiApiTest,
        available_models: liveModels.slice(0, 15),
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
