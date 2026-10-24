import { GoogleGenAI } from "@google/genai";

const KNOWN_GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key !== "[SENSITIVE]" && key.length > 10);
}

export function resolveModelName(): string {
  const envModel = process.env.GEMINI_MODEL?.trim()?.replace(/^["']|["']$/g, "");
  // Prioritize active quota models (gemini-3.5-flash, gemini-3.1-flash-lite)
  if (envModel && (envModel === "gemini-3.5-flash" || envModel === "gemini-3.1-flash-lite")) {
    return envModel;
  }
  return "gemini-3.5-flash";
}

export function getCandidateModels(): string[] {
  const primary = resolveModelName();
  const fallbacks = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
  ].filter((m) => m !== primary);
  return [primary, ...fallbacks];
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "[SENSITIVE]") {
    throw new Error("ENV_GEMINI: GEMINI_API_KEY is not configured in server environment.");
  }
  return new GoogleGenAI({ apiKey });
}
