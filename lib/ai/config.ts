import { GoogleGenAI } from "@google/genai";

const KNOWN_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.5-pro",
  "gemini-1.5-pro",
];

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key !== "[SENSITIVE]" && key.length > 10);
}

export function resolveModelName(): string {
  const envModel = process.env.GEMINI_MODEL?.trim();
  if (envModel && KNOWN_GEMINI_MODELS.includes(envModel)) {
    return envModel;
  }

  // If user provided an unrecognized or legacy name, log notice and default to gemini-2.5-flash
  if (envModel && envModel !== "gemini-2.5-flash") {
    console.warn(`[ai-config] GEMINI_MODEL '${envModel}' is unrecognized. Defaulting to validated standard 'gemini-2.5-flash'.`);
  }

  return "gemini-2.5-flash";
}

export function getCandidateModels(): string[] {
  const primary = resolveModelName();
  const fallbacks = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"].filter((m) => m !== primary);
  return [primary, ...fallbacks];
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "[SENSITIVE]") {
    throw new Error("ENV_GEMINI: GEMINI_API_KEY is not configured in server environment.");
  }
  return new GoogleGenAI({ apiKey });
}
