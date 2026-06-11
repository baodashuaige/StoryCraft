import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { reviewGateTrigger, expandKeywordsBilingually } from "../src/dialogue/gate-review";
import type { DialogueAiResponse, DialogueContext, NpcScript } from "../src/dialogue/types";

// ─── Test fixtures ───────────────────────────────────────────────────

const TEST_KEYWORD_MAP: Record<string, string[]> = {
  "bell": ["钟", "铃", "钟声", "铃声"],
  "tower": ["塔", "塔楼", "钟楼"],
};

const makeNpcScript = (gateId: string, description: string, conditions: string): NpcScript => ({
  npcId: "mina",
  name: "Mina",
  role: "maid",
  persona: { personality: "quiet", background: "servant", speechPatterns: "soft-spoken" },
  publicKnowledge: [],
  privateKnowledge: [],
  gatedSecrets: [{
    id: `secret_${gateId}`,
    topicGateId: gateId,
    description,
    revealConditions: conditions,
    reactionWhenPressed: "defensive",
    triggerKeywords: ["bell", "钟", "钟声"],
  }],
  ignorance: [],
  relationships: [],
});

const ctx: DialogueContext = {
  currentRoom: "Servants' Hall",
  currentTurn: 3,
  turnsRemaining: 5,
  playerInventory: [],
  discoveredClues: [],
  currentTrust: 1,
  exhaustedTopicGateIds: [],
  recentExchanges: [],
  validTopicGateIds: ["gate_bell"],
};

// ===========================================================================
// gate-review — greeting/short-input rules REMOVED (moved to dialogue-intent.ts)
// ===========================================================================
describe("gate-review — greeting/short input NOT filtered here", () => {
  const script = makeNpcScript("gate_bell", "servant bell ringing", "player asks about the bell");

  it("does NOT null gate for short input (< 5 chars)", () => {
    const validated: DialogueAiResponse = {
      dialogue: "Yes?",
      candidateGateId: "gate_bell",
      gateEvidence: "bell",
      gateConfidence: "high",
      candidateActionHint: null,
    };
    // Short input would previously null the gate — now it passes through
    // because greeting/short-input filtering moved to dialogue-intent.ts
    const result = reviewGateTrigger(validated, "hi", script, ctx, { bilingualKeywordMap: TEST_KEYWORD_MAP });
    // Keyword "hi" doesn't match bell keywords, so gate is nulled for relevance
    // But it's NOT nulled for being short — that check is gone
    assert.equal(result.candidateGateId, null); // nulled for relevance, not length
  });

  it("does NOT null gate for greeting pattern", () => {
    const validated: DialogueAiResponse = {
      dialogue: "Good evening.",
      candidateGateId: "gate_bell",
      gateEvidence: "you mentioned the bell",
      gateConfidence: "high",
      candidateActionHint: null,
    };
    // "good evening, can you tell me about the bell"
    // contains "bell" keyword, so relevance passes
    const result = reviewGateTrigger(validated, "good evening, what about the bell?", script, ctx, { bilingualKeywordMap: TEST_KEYWORD_MAP });
    assert.equal(result.candidateGateId, "gate_bell");
  });
});

describe("gate-review — keyword relevance check (kept)", () => {
  const script = makeNpcScript("gate_bell", "servant bell ringing at night", "player asks about the bell");

  it("nulls gate when player input has no keyword overlap", () => {
    const validated: DialogueAiResponse = {
      dialogue: "Hmm?",
      candidateGateId: "gate_bell",
      gateEvidence: "something",
      gateConfidence: "high",
      candidateActionHint: null,
    };
    const result = reviewGateTrigger(validated, "what is your favorite color?", script, ctx, { bilingualKeywordMap: TEST_KEYWORD_MAP });
    assert.equal(result.candidateGateId, null);
  });

  it("accepts gate when player input has keyword overlap", () => {
    const validated: DialogueAiResponse = {
      dialogue: "The bell...",
      candidateGateId: "gate_bell",
      gateEvidence: "you asked about the bell",
      gateConfidence: "high",
      candidateActionHint: null,
    };
    const result = reviewGateTrigger(validated, "tell me about the bell", script, ctx, { bilingualKeywordMap: TEST_KEYWORD_MAP });
    assert.equal(result.candidateGateId, "gate_bell");
  });

  it("matches Chinese keywords via bilingual map", () => {
    const validated: DialogueAiResponse = {
      dialogue: "那口钟...",
      candidateGateId: "gate_bell",
      gateEvidence: "钟声",
      gateConfidence: "high",
      candidateActionHint: null,
    };
    const result = reviewGateTrigger(validated, "你听到钟声了吗", script, ctx, { bilingualKeywordMap: TEST_KEYWORD_MAP });
    assert.equal(result.candidateGateId, "gate_bell");
  });
});

describe("gate-review — AI evidence quality check (kept)", () => {
  const script = makeNpcScript("gate_bell", "servant bell ringing", "player asks about the bell");

  it("nulls gate when no evidence AND low confidence", () => {
    const validated: DialogueAiResponse = {
      dialogue: "Maybe...",
      candidateGateId: "gate_bell",
      gateEvidence: "",
      gateConfidence: "low",
      candidateActionHint: null,
    };
    const result = reviewGateTrigger(validated, "what about the bell?", script, ctx, { bilingualKeywordMap: TEST_KEYWORD_MAP });
    assert.equal(result.candidateGateId, null);
  });

  it("accepts gate with non-empty gateEvidence even at low confidence", () => {
    const validated: DialogueAiResponse = {
      dialogue: "The bell...",
      candidateGateId: "gate_bell",
      gateEvidence: "player asked about the bell",
      gateConfidence: "low",
      candidateActionHint: null,
    };
    const result = reviewGateTrigger(validated, "what about the bell?", script, ctx, { bilingualKeywordMap: TEST_KEYWORD_MAP });
    assert.equal(result.candidateGateId, "gate_bell");
  });

  it("accepts gate with medium confidence even without gateEvidence", () => {
    const validated: DialogueAiResponse = {
      dialogue: "The bell...",
      candidateGateId: "gate_bell",
      gateEvidence: "",
      gateConfidence: "medium",
      candidateActionHint: null,
    };
    const result = reviewGateTrigger(validated, "what about the bell?", script, ctx, { bilingualKeywordMap: TEST_KEYWORD_MAP });
    assert.equal(result.candidateGateId, "gate_bell");
  });
});

describe("gate-review — returns unchanged when candidateGateId is null", () => {
  it("short-circuits when no gate to review", () => {
    const script = makeNpcScript("gate_bell", "bell", "bell");
    const validated: DialogueAiResponse = {
      dialogue: "Hello.",
      candidateGateId: null,
      gateEvidence: "",
      gateConfidence: "low",
      candidateActionHint: null,
    };
    const result = reviewGateTrigger(validated, "hi", script, ctx, { bilingualKeywordMap: TEST_KEYWORD_MAP });
    assert.equal(result.candidateGateId, null);
    assert.equal(result.dialogue, "Hello.");
  });
});

describe("expandKeywordsBilingually", () => {
  it("expands English keywords with Chinese equivalents when map provided", () => {
    const result = expandKeywordsBilingually(["bell", "tower"], TEST_KEYWORD_MAP);
    assert.ok(result.includes("bell"));
    assert.ok(result.includes("钟"));
    assert.ok(result.includes("tower"));
    assert.ok(result.includes("塔"));
  });

  it("returns original keywords when no map provided", () => {
    const result = expandKeywordsBilingually(["bell", "tower"]);
    assert.deepEqual(result, ["bell", "tower"]);
  });
});
