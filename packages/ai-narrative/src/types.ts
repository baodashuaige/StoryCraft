// ─── Provider State Machine ─────────────────────────────────────────

export type ProviderState =
  | "uninitialized"
  | "initializing"
  | "ready"
  | "degraded"
  | "failed"
  | "disposed";

export interface ProviderStatus {
  state: ProviderState;
  providerId: string;
  lastHealthCheck: number;
  consecutiveFailures: number;
  lastError?: string;
  configRedacted: { baseUrl: string; model: string };
}

// ─── Trust Level (self-contained, no @shared dependency) ────────────

export type TrustLevel = 0 | 1 | 2;

// ─── Grounding Data ─────────────────────────────────────────────────
// Known facts sent to the AI to constrain its output.

export interface GroundingData {
  currentRoomName: string;
  visibleExits: string[];
  presentNpcNames: string[];
  inventoryItemNames: string[];
  discoveredClueNames: string[];
  knownConsequences: string[];
  turnsRemaining: number;
}

// ─── Narrative Request (internal provider detail) ───────────────────
// Structured input passed between DialogueEngine and Provider.
// Uses self-contained opaque types instead of @shared imports.

type RuntimeEvent = Record<string, unknown>;
type VisibleState = Record<string, unknown>;

export interface NarrativeRequest {
  id: string;
  type: "narration" | "dialogue";
  turnIndex: number;
  events: RuntimeEvent[];
  commandMessage: string;
  visibleState: VisibleState;
  dialogueContext?: {
    npcId: string;
    npcName: string;
    npcRole: string;
    topic: string;
    topicResponse: string;
    trustLevel: TrustLevel;
    recentEvents: RuntimeEvent[];
  };
  grounding: GroundingData;
  timestamp: number;
  lang: "en" | "zh";
}

// ─── Validation Result ──────────────────────────────────────────────

export interface ConstraintViolation {
  rule: string;
  detail: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  passed: boolean;
  structuralValid: boolean;
  constraintViolations: ConstraintViolation[];
  warningNotes: string[];
}

// ─── Narrative Response ─────────────────────────────────────────────
// Output with provenance — every response declares its source.

export interface NarrativeResponse {
  requestId: string;
  text: string;
  source: "ai" | "passthrough";
  aiMeta?: {
    providerId: string;
    model: string;
    latencyMs: number;
    promptTokenCount?: number;
    completionTokenCount?: number;
  };
  validation: ValidationResult;
  timestamp: number;
}

// ─── Audit ──────────────────────────────────────────────────────────

export interface AuditRecord {
  requestId: string;
  turnIndex: number;
  requestType: "narration" | "dialogue";
  eventTypes: string[];
  commandVerb: string;
  responseSource: "ai" | "passthrough";
  responseTextPreview: string;
  validationPassed: boolean;
  constraintViolations: string[];
  providerState: ProviderState;
  providerId: string;
  promptStructure: {
    systemPromptHash: string;
    groundingFactCount: number;
    eventCount: number;
  };
  latencyMs: number;
  timestamp: number;
}

export interface AuditFilter {
  source?: "ai" | "passthrough";
  minTurnIndex?: number;
  maxTurnIndex?: number;
  requestType?: "narration" | "dialogue";
  validationPassed?: boolean;
}

export interface AuditStats {
  totalRequests: number;
  aiSuccessCount: number;
  passthroughCount: number;
  aiFailureCount: number;
  validationFailureCount: number;
  constraintViolationCount: number;
  averageLatencyMs: number;
  byProvider: Record<string, { calls: number; failures: number }>;
}

// ─── Engine Config ──────────────────────────────────────────────────

export interface NarrativeEngineConfig {
  lang: "en" | "zh";
  maxRetries: number;
  retryDelayMs: number;
  healthCheckIntervalMs: number;
  auditLogMaxEntries: number;
  failOpen: boolean;
}

export const DEFAULT_ENGINE_CONFIG: NarrativeEngineConfig = {
  lang: "en",
  maxRetries: 1,
  retryDelayMs: 1000,
  healthCheckIntervalMs: 30000,
  auditLogMaxEntries: 1000,
  failOpen: true,
};

// ─── Engine Status ──────────────────────────────────────────────────

export interface EngineStatus {
  initialized: boolean;
  providerStatus: ProviderStatus;
  config: NarrativeEngineConfig;
  auditStats: AuditStats;
}

// ─── Provider Raw Response ──────────────────────────────────────────

export interface ProviderRawResponse {
  text: string;
  model: string;
  latencyMs: number;
  promptTokenCount?: number;
  completionTokenCount?: number;
}

// ─── Error Types ────────────────────────────────────────────────────

export class NarrativeError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "not_initialized"
      | "provider_failed"
      | "validation_failed"
      | "disposed",
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "NarrativeError";
  }
}
