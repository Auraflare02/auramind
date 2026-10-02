import { GoogleGenAI } from "@google/genai";

export function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL || "gemini-3.8-flash";
}

export function isGeminiEnabled() {
  return Boolean(process.env.GEMINI_API_KEY);
}
