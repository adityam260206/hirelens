import { env, isAiMocked } from "../config/env";
import { AnthropicAIProvider } from "./anthropicProvider";
import { mockAIProvider } from "./mockProvider";
import type { AIProvider } from "./provider";

export const aiProvider: AIProvider = isAiMocked
  ? mockAIProvider
  : new AnthropicAIProvider(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL);

export type { AIProvider } from "./provider";
export type { ParsedResumeData } from "./schemas";
