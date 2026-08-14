import { env, isAiMocked } from "../config/env";
import { AnthropicAIProvider } from "./anthropicProvider";
import { GeminiAIProvider } from "./geminiProvider";
import { mockAIProvider } from "./mockProvider";
import type { AIProvider } from "./provider";

function selectProvider(): AIProvider {
  if (isAiMocked) return mockAIProvider;
  if (env.AI_PROVIDER === "gemini") return new GeminiAIProvider(env.GEMINI_API_KEY, env.GEMINI_MODEL);
  return new AnthropicAIProvider(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL);
}

export const aiProvider: AIProvider = selectProvider();

export type { AIProvider } from "./provider";
export type { ParsedResumeData } from "./schemas";
