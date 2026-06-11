// ─── NPC Dialogue Types ──────────────────────────────────────────────
// Types for the AI-driven NPC free-form dialogue system.
//
// Key principle: AI produces CANDIDATE signals; the policy/runtime layer
// has final authority over all state changes (gates, trust, items).

/**
 * NPC Script — the complete character bible for AI-driven dialogue.
 * Defined per-NPC per-adventure.
 */
export interface NpcScript {
  npcId: string;
  name: string;
  role: string;
  /** Optional world/genre framing for the system prompt.
   *  E.g. "a murder mystery game set in a snowbound manor" */
  worldSetting?: string;
  persona: {
    personality: string;
    background: string;
    speechPatterns: string;
    emotionalBaseline?: string;
    forbiddenTone?: string;
  };
  publicKnowledge: NpcKnowledgeEntry[];
  privateKnowledge: NpcKnowledgeEntry[];
  gatedSecrets: NpcSecret[];
  ignorance: string[];
  relationships: { npcId: string; attitude: string; notes: string }[];
}

export interface NpcKnowledgeEntry {
  id: string;
  topic: string;
  content: string;
}

export interface NpcSecret {
  id: string;
  topicGateId: string;
  description: string;
  revealConditions: string;
  reactionWhenPressed: string;
  triggerKeywords?: string[];
  triggerPhrases?: string[];
}

export interface ConversationExchange {
  playerInput: string;
  npcResponse: string;
  /** Gate that was actually triggered (after policy review), or null. */
  triggeredTopicGateId: string | null;
  timestamp: number;
  policyNotes?: string[];
  possibleStateClaim?: "item_given" | "access_granted" | null;
  runtimeConfirmed?: boolean;
}

/**
 * What the AI returns — candidate signals, NOT executable decisions.
 *
 * AI proposes gate triggers/action hints, but the DialoguePolicy/runtime
 * layers decide what to accept.
 */
export interface DialogueAiResponse {
  dialogue: string;
  /** AI-proposed gate trigger — policy layer has final authority. */
  candidateGateId: string | null;
  /** What part of the player's input suggested this gate. */
  gateEvidence: string;
  /** AI confidence in the gate trigger. */
  gateConfidence: "low" | "medium" | "high";
  /** Optional action the AI thinks is happening (e.g., "item_given"). */
  candidateActionHint: string | null;
}

export interface DialogueContext {
  currentRoom: string;
  currentTurn: number;
  turnsRemaining: number;
  playerInventory: string[];
  discoveredClues: string[];
  currentTrust: number;
  exhaustedTopicGateIds: string[];
  recentExchanges: ConversationExchange[];
  validTopicGateIds: string[];
}

export interface DialogueRequest {
  npcScript: NpcScript;
  playerInput: string;
  context: DialogueContext;
}

/**
 * What the DialogueEngine returns to callers.
 *
 * Contains candidate signals from AI plus temporary backward-compatible
 * fields so that callers can migrate incrementally.
 */
export interface DialogueResult {
  dialogue: string;
  source: "ai" | "passthrough";
  latencyMs: number;

  // ── Candidate signals (policy reviews these) ──
  candidateGateId: string | null;
  gateEvidence: string;
  gateConfidence: "low" | "medium" | "high";
  /** AI-suggested action (e.g., "item_given"). Policy reviews this. */
  candidateActionHint: string | null;

  // ── Debug / dev-mode fields (populated for development) ──
  /** Raw AI output text before parsing. */
  rawAiText: string;
  /** Model identifier used for this call. */
  model: string;
  /** Prompt token count (if available from provider). */
  promptTokens?: number;
  /** Completion token count (if available from provider). */
  completionTokens?: number;
  /** Full system prompt sent to AI. */
  systemPrompt: string;
  /** Full user prompt sent to AI. */
  userPrompt: string;

  // ── Temporary backward compatibility ──
  /** @deprecated Use candidateGateId. Maps from candidateGateId. */
  triggeredTopicGateId: string | null;
}
