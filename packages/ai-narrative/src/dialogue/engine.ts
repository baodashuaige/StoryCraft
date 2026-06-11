import type { NarrativeProvider } from "../provider";
import type { AuditRecord } from "../types";
import { AuditLog } from "../audit";
import { buildNpcDialoguePrompt } from "./prompts";
import { parseAiJson } from "./parse";
import { validateDialogueResponse } from "./schema";
import { reviewGateTrigger } from "./gate-review";
import type {
  NpcScript,
  DialogueAiResponse,
  DialogueRequest,
  DialogueResult,
} from "./types";

// ─── DialogueEngine ──────────────────────────────────────────────────
// Handles AI-driven free-form NPC dialogue.
// Reuses the existing NarrativeProvider.
// Does NOT modify game state — only returns candidate signals.
// The DialoguePolicy in web-services has final authority.

export interface DialogueEngineConfig {
  lang: "en" | "zh";
  maxConversationHistory: number;
  failOpen: boolean;
  /** Optional bilingual keyword map for cross-language gate matching.
   *  Keys are English terms, values are arrays of Chinese equivalents. */
  bilingualKeywordMap?: Record<string, string[]>;
}

const DEFAULT_DIALOGUE_CONFIG: DialogueEngineConfig = {
  lang: "en",
  maxConversationHistory: 5,
  failOpen: true,
};

export class DialogueEngine {
  private provider: NarrativeProvider;
  private auditLog: AuditLog;
  private config: DialogueEngineConfig;
  private lang: "en" | "zh";
  private initialized = false;

  constructor(provider: NarrativeProvider, config?: Partial<DialogueEngineConfig>) {
    this.provider = provider;
    this.config = { ...DEFAULT_DIALOGUE_CONFIG, ...config };
    this.lang = this.config.lang;
    this.auditLog = new AuditLog(1000);
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────

  async initialize(): Promise<void> {
    if (this.initialized) return;
    // Provider should already be initialized by the caller
    this.initialized = true;
  }

  async dispose(): Promise<void> {
    this.initialized = false;
  }

  isAiAvailable(): boolean {
    if (this.provider.id === "passthrough") return false;
    const status = this.provider.getStatus();
    return status.state === "ready" || status.state === "degraded";
  }

  // ─── Core API ──────────────────────────────────────────────────────

  async handleFreeFormDialogue(request: DialogueRequest): Promise<DialogueResult> {
    const startTime = Date.now();

    const passthroughResult: DialogueResult = {
      dialogue: "",
      candidateGateId: null,
      gateEvidence: "",
      gateConfidence: "low",
      candidateActionHint: null,
      triggeredTopicGateId: null,
      source: "passthrough",
      latencyMs: Date.now() - startTime,
      rawAiText: "",
      model: "",
      systemPrompt: "",
      userPrompt: "",
    };

    // If AI is not available, return passthrough
    if (!this.isAiAvailable()) {
      return passthroughResult;
    }

    // Build prompt
    const { system, user } = buildNpcDialoguePrompt(
      request.npcScript,
      request.playerInput,
      request.context,
      request.context.recentExchanges.slice(-this.config.maxConversationHistory),
      this.lang
    );

    // Call provider
    let rawText: string;
    let rawModel: string = "";
    let rawPromptTokens: number | undefined;
    let rawCompletionTokens: number | undefined;
    try {
      const narrativeRequest = this.buildMinimalRequest(request);
      const raw = await this.provider.call(narrativeRequest, system, user);
      rawText = raw.text;
      rawModel = raw.model;
      rawPromptTokens = raw.promptTokenCount;
      rawCompletionTokens = raw.completionTokenCount;
    } catch (err) {
      console.error("[DialogueEngine] provider.call failed:", err);
      return passthroughResult;
    }

    // Parse AI JSON
    let parsed: DialogueAiResponse;
    try {
      parsed = parseAiJson(rawText);
    } catch {
      // JSON parse failed — show raw AI text as dialogue (better than canned greeting)
      return {
        dialogue: rawText.slice(0, 1000) || "...",
        candidateGateId: null,
        gateEvidence: "",
        gateConfidence: "low",
        candidateActionHint: null,
        triggeredTopicGateId: null,
        source: "ai",
        latencyMs: Date.now() - startTime,
        rawAiText: rawText,
        model: rawModel,
        systemPrompt: system,
        userPrompt: user,
      };
    }

    // Validate structure
    const validated = validateDialogueResponse(parsed);

    // Gate trigger review (keyword relevance + evidence quality only)
    const reviewed = reviewGateTrigger(
      validated,
      request.playerInput,
      request.npcScript,
      request.context,
      { bilingualKeywordMap: this.config.bilingualKeywordMap }
    );

    // Record audit
    this.recordAudit(request, reviewed, startTime);

    return {
      dialogue: reviewed.dialogue,
      candidateGateId: reviewed.candidateGateId,
      gateEvidence: reviewed.gateEvidence,
      gateConfidence: reviewed.gateConfidence,
      candidateActionHint: reviewed.candidateActionHint,
      source: "ai",
      latencyMs: Date.now() - startTime,
      rawAiText: rawText,
      model: rawModel,
      promptTokens: rawPromptTokens,
      completionTokens: rawCompletionTokens,
      systemPrompt: system,
      userPrompt: user,
      // Backward compatibility
      triggeredTopicGateId: reviewed.candidateGateId,
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  private buildMinimalRequest(request: DialogueRequest) {
    return {
      id: `dlg_${Date.now().toString(36)}`,
      type: "dialogue" as const,
      turnIndex: request.context.currentTurn,
      events: [],
      commandMessage: request.playerInput,
      visibleState: {} as any,
      grounding: {
        currentRoomName: request.context.currentRoom,
        visibleExits: [],
        presentNpcNames: [],
        inventoryItemNames: request.context.playerInventory,
        discoveredClueNames: request.context.discoveredClues,
        knownConsequences: [],
        turnsRemaining: request.context.turnsRemaining,
      },
      timestamp: Date.now(),
      lang: this.lang,
    };
  }

  private recordAudit(
    request: DialogueRequest,
    result: DialogueAiResponse,
    startTime: number
  ): void {
    const record: AuditRecord = {
      requestId: `dlg_audit_${Date.now().toString(36)}`,
      turnIndex: request.context.currentTurn,
      requestType: "dialogue",
      eventTypes: [],
      commandVerb: "talk",
      responseSource: "ai",
      responseTextPreview: result.dialogue.slice(0, 100),
      validationPassed: true,
      constraintViolations: [],
      providerState: this.provider.getStatus().state as AuditRecord["providerState"],
      providerId: this.provider.id,
      promptStructure: {
        systemPromptHash: "",
        groundingFactCount: 0,
        eventCount: 0,
      },
      latencyMs: Date.now() - startTime,
      timestamp: Date.now(),
    };
    this.auditLog.append(record);
  }
}
