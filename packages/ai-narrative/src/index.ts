// ─── Provider ───────────────────────────────────────────────────────
export type { NarrativeProvider } from "./provider";
export { PassthroughProvider } from "./provider";
export { OpenAICompatibleProvider } from "./providers/openai-compatible";
export { loadConfigFromEnv } from "./providers/config";
export type { ProviderConfig } from "./providers/config";

// ─── Shared Types ───────────────────────────────────────────────────
export type {
  ProviderStatus,
  ProviderState,
  ProviderRawResponse,
  TrustLevel,
  NarrativeRequest,
  GroundingData,
  AuditRecord,
  AuditStats,
} from "./types";

// ─── Shared Utilities ───────────────────────────────────────────────
export { AuditLog } from "./audit";

// ─── Dialogue Module ────────────────────────────────────────────────
export { DialogueEngine } from "./dialogue/engine";
export type { DialogueEngineConfig } from "./dialogue/engine";
export { buildNpcDialoguePrompt } from "./dialogue/prompts";
export type { DialoguePromptPair } from "./dialogue/prompts";
export { parseAiJson } from "./dialogue/parse";
export { validateDialogueResponse } from "./dialogue/schema";
export { reviewGateTrigger, expandKeywordsBilingually } from "./dialogue/gate-review";
export type {
  NpcScript,
  NpcKnowledgeEntry,
  NpcSecret,
  ConversationExchange,
  DialogueAiResponse,
  DialogueContext,
  DialogueRequest,
  DialogueResult,
} from "./dialogue/types";
