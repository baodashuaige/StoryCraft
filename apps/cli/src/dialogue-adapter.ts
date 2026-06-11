/**
 * CLI DialogueService: slim version of the web DialogueService
 * without devlog dependency. Reuses dialogue-intent and dialogue-policy.
 */
import type { CommandInput, WorldState, VisibleState, AdventureDefinition } from "@shared";
import { executeCommand, getVisibleState, evaluateAll } from "@game-runtime";
import { DialogueEngine, PassthroughProvider, OpenAICompatibleProvider, loadConfigFromEnv } from "@wutiankai/npc-dialogue";
import type { DialogueResult, NpcScript, DialogueContext, ConversationExchange } from "@wutiankai/npc-dialogue";
import type { WorldPack } from "../../web/src/world-registry";
import { classifyIntent } from "../../web/src/services/dialogue-intent";
import { FROSTMERE_KEYWORDS } from "../../web/src/worlds/frostmere/keywords";
import type { DialogueIntent } from "../../web/src/services/dialogue-intent";
import { reviewDialogueCandidates } from "../../web/src/services/dialogue-policy";

// ─── Types ──────────────────────────────────────────────────────────

export interface GateEffects {
  clueIds: string[];
  revealedItemIds: string[];
  grantedItemIds: string[];
  trustChange: number;
  turnSpent: boolean;
}

export interface DialogueServiceResult {
  dialogue: string;
  source: "ai" | "error";
  state: WorldState;
  visibleState: VisibleState;
  triggeredGateId: string | null;
  gateEffects: GateEffects | null;
  trustDeltaApplied: number;
  isComplete: boolean;
  endingId: string | null;
  intent: DialogueIntent;
  latencyMs: number;
}

// ─── Provider factory ───────────────────────────────────────────────

export async function createCliDialogueService(lang: string): Promise<CliDialogueService> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;

  let provider;
  if (apiKey) {
    const config = loadConfigFromEnv();
    provider = new OpenAICompatibleProvider(config);
  } else {
    provider = new PassthroughProvider();
  }

  await provider.initialize();
  const engine = new DialogueEngine(provider, { lang, bilingualKeywordMap: FROSTMERE_KEYWORDS });
  await engine.initialize();

  return new CliDialogueService(engine);
}

// ─── CliDialogueService ─────────────────────────────────────────────

export class CliDialogueService {
  private engine: DialogueEngine;
  private conversationHistory: Map<string, ConversationExchange[]> = new Map();
  private maxHistory = 5;

  constructor(engine: DialogueEngine) {
    this.engine = engine;
  }

  isAiAvailable(): boolean {
    return this.engine.isAiAvailable();
  }

  async handleDialogue(opts: {
    npcId: string;
    playerInput: string;
    state: WorldState;
    adventure: AdventureDefinition;
    pack: WorldPack;
  }): Promise<DialogueServiceResult> {
    const { npcId, playerInput, state, adventure, pack } = opts;

    const npcScript = pack.npcScripts?.[npcId];
    if (!npcScript) throw new Error(`NPC script not found: ${npcId}`);

    const npcAlias = pack.meta.npcAliases[npcId] ?? npcId;
    const history = this.conversationHistory.get(npcId) ?? [];

    // Build context
    const topicGates = adventure.topicGates ?? {};
    const validGateIds = Object.values(topicGates)
      .filter((g: any) => g.npcId === npcId)
      .filter((g: any) => !state.flags[`talked_${g.id}`])
      .filter((g: any) => evaluateAll(g.requires, state, adventure))
      .map((g: any) => g.id);
    const exhaustedGateIds = Object.values(topicGates)
      .filter((g: any) => g.npcId === npcId && state.flags[`talked_${g.id}`] === true)
      .map((g: any) => g.id);

    const context: DialogueContext = {
      currentRoom: (adventure.rooms as any)[state.currentRoomId]?.name ?? "",
      currentTurn: state.turnIndex,
      turnsRemaining: state.turnsRemaining,
      playerInventory: state.inventoryItemIds.map(
        (id: string) => (adventure.items as any)[id]?.name ?? id,
      ),
      discoveredClues: Object.keys(state.discoveredCluesById).map(
        (id: string) => (adventure.clues as any)[id]?.title ?? id,
      ),
      currentTrust: state.trustByNpcId[npcId] ?? 0,
      exhaustedTopicGateIds: exhaustedGateIds,
      recentExchanges: history,
      validTopicGateIds: validGateIds,
    };

    // Call engine
    const result = await this.engine.handleFreeFormDialogue({
      npcScript,
      playerInput,
      context,
    });

    if (result.source === "passthrough") {
      return this.makeDegradedResult(playerInput, state, adventure);
    }

    // Classify intent → policy review
    const intent = classifyIntent(playerInput);
    const policy = reviewDialogueCandidates({
      intent,
      candidateGateId: result.candidateGateId,
      gateConfidence: result.gateConfidence,
      validGateIds,
      npcId,
      topicGates,
      candidateActionHint: result.candidateActionHint,
    });

    // Apply accepted gate
    let currentState = state;
    let gateEffects: GateEffects | null = null;

    if (policy.acceptedGateId) {
      const gate = (topicGates as any)[policy.acceptedGateId];
      if (gate) {
        const topic = gate.topicAliases[0];
        const talkResult = executeCommand(
          currentState,
          { verb: "talk", npc: npcAlias, topic } as CommandInput,
          adventure,
        );
        currentState = talkResult.state;

        if (talkResult.ok && talkResult.turnSpent) {
          gateEffects = {
            clueIds: gate.revealsClueIds ?? [],
            revealedItemIds: gate.revealsItemIds ?? [],
            grantedItemIds: gate.grantsItemIds ?? [],
            trustChange: gate.trustDelta ?? 0,
            turnSpent: true,
          };
        }
      }
    }

    const trustDeltaApplied =
      (currentState.trustByNpcId[npcId] ?? 0) - (state.trustByNpcId[npcId] ?? 0);

    // Record exchange
    const exchange: ConversationExchange = {
      playerInput,
      npcResponse: result.dialogue,
      triggeredTopicGateId: policy.acceptedGateId,
      timestamp: Date.now(),
    };
    this.updateHistory(npcId, exchange);

    return {
      dialogue: result.dialogue,
      source: "ai",
      state: currentState,
      visibleState: getVisibleState(currentState, adventure),
      triggeredGateId: policy.acceptedGateId,
      gateEffects,
      trustDeltaApplied,
      isComplete: currentState.isComplete,
      endingId: currentState.endingId ?? null,
      intent,
      latencyMs: result.latencyMs,
    };
  }

  private makeDegradedResult(
    playerInput: string,
    state: WorldState,
    adventure: AdventureDefinition,
  ): DialogueServiceResult {
    const fallback = "…";
    return {
      dialogue: fallback,
      source: "ai",
      state,
      visibleState: getVisibleState(state, adventure),
      triggeredGateId: null,
      gateEffects: null,
      trustDeltaApplied: 0,
      isComplete: false,
      endingId: null,
      intent: { kind: "unknown", isGreeting: false, isShortInput: false },
      latencyMs: 0,
    };
  }

  private updateHistory(npcId: string, exchange: ConversationExchange): void {
    const hist = this.conversationHistory.get(npcId) ?? [];
    hist.push(exchange);
    if (hist.length > this.maxHistory) hist.shift();
    this.conversationHistory.set(npcId, hist);
  }
}
