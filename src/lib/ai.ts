import { GoogleGenAI } from "@google/genai";

export type ThinkingLevel = "low" | "medium" | "high";

const SUPPORTED_MODELS = new Set([
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash"
]);

export function getGeminiModel() {
  const configured = String(process.env.GEMINI_MODEL || "gemini-3.8-flash").trim();
  return SUPPORTED_MODELS.has(configured) ? configured : "gemini-3.8-flash";
}

export function getGeminiClient() {
  const key = String(process.env.GEMINI_API_KEY || "").trim();
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
}

export function isGeminiEnabled() {
  return Boolean(String(process.env.GEMINI_API_KEY || "").trim());
}

export function getGeminiThinkingLevel(): ThinkingLevel {
  const configured = String(process.env.GEMINI_THINKING_LEVEL || "medium").toLowerCase();
  return configured === "low" || configured === "high" ? configured : "medium";
}

export async function generateGeminiJson<T>({
  contents,
  responseSchema,
  thinkingLevel = getGeminiThinkingLevel(),
  systemInstruction,
  attempts = 2
}: {
  contents: string;
  responseSchema: Record<string, unknown>;
  thinkingLevel?: ThinkingLevel;
  systemInstruction?: string;
  attempts?: number;
}): Promise<T> {
  const client = getGeminiClient();
  if (!client) throw new Error("GEMINI_API_KEY is not configured.");

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= Math.max(1, attempts); attempt += 1) {
    try {
      const response = await client.models.generateContent({
        model: getGeminiModel(),
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema,
          thinkingConfig: { thinkingLevel },
          ...(systemInstruction ? { systemInstruction } : {})
        }
      });

      const text = String(response.text || "").trim();
      if (!text) throw new Error("Gemini returned an empty response.");

      try {
        return JSON.parse(text) as T;
      } catch {
        if (attempt >= attempts) throw new Error("Gemini returned invalid JSON.");
      }
    } catch (error) {
      lastError = error;
      if (attempt >= attempts) break;
      await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Gemini request failed.");
}
