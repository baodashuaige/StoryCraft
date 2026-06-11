import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { reviewDialogueCandidates } from "../src/services/dialogue-policy";

const greetingIntent = { kind: "greeting" as const, isGreeting: true, isShortInput: false };
const smalltalkIntent = { kind: "smalltalk" as const, isGreeting: false, isShortInput: false };
const unknownIntent = { kind: "unknown" as const, isGreeting: false, isShortInput: false };

const makeTopicGate = (id: string, npcId: string, grantsItemIds?: string[]) => ({
  id,
  npcId,
  topicAliases: [id],
  response: `Response for ${id}`,
  blockedResponse: `Blocked for ${id}`,
  repeatedResponse: `Repeated for ${id}`,
  grantsItemIds,
});

describe("DialoguePolicy — greeting/smalltalk", () => {
  it("greeting never triggers gate regardless of AI candidate", () => {
    const result = reviewDialogueCandidates({
      intent: greetingIntent,
      candidateGateId: "gate_a",
      gateConfidence: "high",
      validGateIds: ["gate_a"],
      npcId: "mina",
      topicGates: { gate_a: makeTopicGate("gate_a", "mina") },
      candidateActionHint: null,
    });
    assert.equal(result.acceptedGateId, null);
  });

  it("smalltalk never triggers gate", () => {
    const result = reviewDialogueCandidates({
      intent: smalltalkIntent,
      candidateGateId: "gate_a",
      gateConfidence: "high",
      validGateIds: ["gate_a"],
      npcId: "mina",
      topicGates: { gate_a: makeTopicGate("gate_a", "mina") },
      candidateActionHint: null,
    });
    assert.equal(result.acceptedGateId, null);
  });
});

describe("DialoguePolicy — gate acceptance", () => {
  it("accepts valid candidate gate for correct NPC", () => {
    const result = reviewDialogueCandidates({
      intent: unknownIntent,
      candidateGateId: "gate_a",
      gateConfidence: "high",
      validGateIds: ["gate_a"],
      npcId: "mina",
      topicGates: { gate_a: makeTopicGate("gate_a", "mina") },
      candidateActionHint: null,
    });
    assert.equal(result.acceptedGateId, "gate_a");
  });

  it("rejects candidate gate not in validGateIds", () => {
    const result = reviewDialogueCandidates({
      intent: unknownIntent,
      candidateGateId: "gate_a",
      gateConfidence: "high",
      validGateIds: [],
      npcId: "mina",
      topicGates: { gate_a: makeTopicGate("gate_a", "mina") },
      candidateActionHint: null,
    });
    assert.equal(result.acceptedGateId, null);
    assert.equal(result.suppressRuntimeBlockedLine, true);
  });

  it("rejects candidate gate for wrong NPC", () => {
    const result = reviewDialogueCandidates({
      intent: unknownIntent,
      candidateGateId: "gate_a",
      gateConfidence: "high",
      validGateIds: ["gate_a"],
      npcId: "theo",
      topicGates: { gate_a: makeTopicGate("gate_a", "mina") },
      candidateActionHint: null,
    });
    assert.equal(result.acceptedGateId, null);
    assert.equal(result.suppressRuntimeBlockedLine, true);
  });
});

describe("DialoguePolicy — state claim detection", () => {
  it("detects item_given from gate grantsItemIds", () => {
    const result = reviewDialogueCandidates({
      intent: unknownIntent,
      candidateGateId: "gate_key",
      gateConfidence: "high",
      validGateIds: ["gate_key"],
      npcId: "mina",
      topicGates: { gate_key: makeTopicGate("gate_key", "mina", ["item_brass_key"]) },
      candidateActionHint: null,
    });
    assert.equal(result.possibleStateClaim, "item_given");
  });

  it("detects item_given from candidateActionHint", () => {
    const result = reviewDialogueCandidates({
      intent: unknownIntent,
      candidateGateId: null,
      gateConfidence: "low",
      validGateIds: [],
      npcId: "mina",
      topicGates: {},
      candidateActionHint: "item_given",
    });
    assert.equal(result.possibleStateClaim, "item_given");
    assert.equal(result.runtimeConfirmed, false);
  });
});
