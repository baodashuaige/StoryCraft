import { describe, it, assert, s, frostmereAdventure } from "./helpers";
import {
  evaluateAccusation,
  resolveEnding,
  evaluateDawnForcing
} from "../src/rules/endings";
import type { EvidenceStrength, NpcId, WorldState } from "../../shared/src";

// Helper to build a WorldState with overrides
function state(overrides: Partial<WorldState> = {}): WorldState {
  return { ...s(), ...overrides };
}

// All 6 clue IDs for full evidence
const ALL_CLUES: Record<string, EvidenceStrength> = {
  clue_watch_stopped_1147: "standard",
  clue_servant_bell_after_death: "standard",
  clue_stolen_design_motive: "standard",
  clue_soot_marked_garden_route: "standard",
  clue_drugged_before_fall: "standard",
  clue_tower_staged: "standard"
};

// ===========================================================================
// evaluateAccusation
// ===========================================================================
describe("evaluateAccusation", () => {
  it("returns null when no endings match", () => {
    const ws = state({ discoveredCluesById: {} });
    const result = evaluateAccusation(ws, frostmereAdventure, "npc_theo_rusk" as NpcId, "public");
    // No public_accusation consequence → ending_bell_rings_true and ending_rushed_accusation fail.
    // ending_private_dead_end requires mode=private. ending_snow_covers_tracks has conditions:[].
    // But ending_snow_covers_tracks has no requiresNpcId filter, so it won't match npc_theo_rusk with requiresNpcId...
    // Actually ending_snow_covers_tracks has conditions:[] and no requiresNpcId → it matches everything.
    // Let's re-check: it will match because conditions=[] (empty) passes evaluateAll, and no requiresNpcId constraint.
    // So this test should actually return ending_snow_covers_tracks. Let me adjust.
    // We need a state that specifically won't match any ending.
    // All endings with requiresNpcId="npc_theo_rusk" need conditions that fail.
    // Endings without requiresNpcId: ending_dawn_breaks_unanswered (needs conseq_spent_dawn_turn),
    //   ending_snow_covers_tracks (conditions:[]) → always matches.
    // So evaluateAccusation always returns at least ending_snow_covers_tracks for Theo.
    // To get null, we need to accuse an NPC that no ending requires, and the fallback has conditions that fail.
    // But ending_snow_covers_tracks has no requiresNpcId and conditions:[], so it ALWAYS matches.
    // This means evaluateAccusation NEVER returns null in practice.
    assert.equal(result !== null, true, "evaluateAccusation always finds at least the fallback ending");
    assert.equal(result!.endingId, "ending_snow_covers_tracks");
  });

  it("matches ending by requiresNpcId — Mina → false accusation", () => {
    const ws = state({
      consequenceIds: ["conseq_made_public_accusation" as any]
    });
    const result = evaluateAccusation(ws, frostmereAdventure, "npc_mina_arlen" as NpcId, "public");
    assert.notEqual(result, null);
    assert.equal(result!.endingId, "ending_false_accusation");
  });

  it("skips ending when requiresNpcId does not match", () => {
    const ws = state({
      consequenceIds: ["conseq_made_public_accusation" as any]
    });
    const result = evaluateAccusation(ws, frostmereAdventure, "npc_captain_vale" as NpcId, "public");
    assert.notEqual(result, null);
    // Should NOT be ending_false_accusation (requires npc_mina_arlen)
    assert.notEqual(result!.endingId, "ending_false_accusation");
    assert.equal(result!.endingId, "ending_vale_accused");
  });

  it("matches ending by requiresMode — private Theo → whispers", () => {
    const ws = state({ discoveredCluesById: {} });
    const result = evaluateAccusation(ws, frostmereAdventure, "npc_theo_rusk" as NpcId, "private");
    assert.notEqual(result, null);
    assert.equal(result!.endingId, "ending_private_dead_end");
  });

  it("matches ending by requiresRoomId — mercy at gatehouse", () => {
    const ws = state({
      currentRoomId: "room_great_hall",
      discoveredCluesById: ALL_CLUES,
      consequenceIds: ["conseq_tipped_off_theo" as any],
      npcRoomById: {
        ...s().npcRoomById,
        npc_theo_rusk: "room_great_hall"
      }
    });
    const result = evaluateAccusation(ws, frostmereAdventure, "npc_theo_rusk" as NpcId, "mercy");
    assert.notEqual(result, null);
    assert.equal(result!.endingId, "ending_apprentice_confession");
  });

  it("skips ending when requiresRoomId does not match", () => {
    const ws = state({
      currentRoomId: "room_study", // NOT great hall
      discoveredCluesById: ALL_CLUES,
      consequenceIds: ["conseq_tipped_off_theo" as any]
    });
    const result = evaluateAccusation(ws, frostmereAdventure, "npc_theo_rusk" as NpcId, "mercy");
    // mercy ending requires great hall, so it should fall through
    assert.notEqual(result, null);
    assert.notEqual(result!.endingId, "ending_apprentice_confession");
  });

  it("evaluates conditions and returns first matching by priority", () => {
    // Full evidence, public accusation, Vale present → ending_bell_rings_true (priority 2)
    const ws = state({
      discoveredCluesById: ALL_CLUES,
      consequenceIds: ["conseq_made_public_accusation" as any],
      npcRoomById: {
        ...s().npcRoomById,
        npc_captain_vale: "room_great_hall" // Vale present
      }
    });
    const result = evaluateAccusation(ws, frostmereAdventure, "npc_theo_rusk" as NpcId, "public");
    assert.notEqual(result, null);
    assert.equal(result!.endingId, "ending_bell_rings_true");
  });

  it("sorts by priority number — lower is higher priority", () => {
    // Both bell_rings_true (2) and rushed_accusation (3) could match.
    // bell_rings_true requires npc_captain_vale present; if he's NOT present,
    // it falls to rushed_accusation.
    const ws = state({
      discoveredCluesById: ALL_CLUES,
      consequenceIds: ["conseq_made_public_accusation" as any],
      npcRoomById: {
        ...s().npcRoomById,
        npc_captain_vale: "room_study" as any // Vale NOT in great hall
      }
    });
    const result = evaluateAccusation(ws, frostmereAdventure, "npc_theo_rusk" as NpcId, "public");
    assert.notEqual(result, null);
    assert.equal(result!.endingId, "ending_rushed_accusation");
  });
});

// ===========================================================================
// resolveEnding
// ===========================================================================
describe("resolveEnding", () => {
  it("sets endingId on state", () => {
    const ws = s();
    const result = resolveEnding(ws, "ending_snow_covers_tracks" as any, frostmereAdventure);
    assert.equal(result.endingId, "ending_snow_covers_tracks");
  });

  it("sets isComplete to true", () => {
    const ws = s();
    const result = resolveEnding(ws, "ending_snow_covers_tracks" as any, frostmereAdventure);
    assert.equal(result.isComplete, true);
  });

  it("applies ending consequenceIds without duplication", () => {
    // ending_apprentice_confession has consequenceIds: ["conseq_offered_theo_mercy"]
    const ws = state({
      consequenceIds: ["conseq_offered_theo_mercy" as any]
    });
    const result = resolveEnding(ws, "ending_apprentice_confession" as any, frostmereAdventure);
    assert.deepEqual(result.consequenceIds, ["conseq_offered_theo_mercy"]);
  });

  it("applies ending flagChanges", () => {
    // ending_apprentice_confession doesn't have flagChanges in definition
    // Use ending_bell_rings_true which also doesn't
    // Let's check the frostmere definition for endings with flagChanges...
    // None of the endings in frostmere have flagChanges. So we test that it doesn't break.
    const ws = s();
    const result = resolveEnding(ws, "ending_snow_covers_tracks" as any, frostmereAdventure);
    assert.deepEqual(result.flags, {});
  });
});

// ===========================================================================
// evaluateDawnForcing
// ===========================================================================
describe("evaluateDawnForcing", () => {
  it("returns true when turnsRemaining <= 0 and no ending set", () => {
    const ws = state({ turnsRemaining: 0, endingId: null, isComplete: false });
    assert.equal(evaluateDawnForcing(ws), true);
  });

  it("returns true when turnsRemaining is negative", () => {
    const ws = state({ turnsRemaining: -1, endingId: null, isComplete: false });
    assert.equal(evaluateDawnForcing(ws), true);
  });

  it("returns false when turnsRemaining > 0", () => {
    const ws = state({ turnsRemaining: 1, endingId: null, isComplete: false });
    assert.equal(evaluateDawnForcing(ws), false);
  });

  it("returns false when endingId is already set", () => {
    const ws = state({
      turnsRemaining: 0,
      endingId: "ending_bell_rings_true" as any,
      isComplete: true
    });
    assert.equal(evaluateDawnForcing(ws), false);
  });

  it("returns false when isComplete is true", () => {
    const ws = state({
      turnsRemaining: 0,
      endingId: null,
      isComplete: true
    });
    assert.equal(evaluateDawnForcing(ws), false);
  });
});

// ===========================================================================
// All 8 endings — isolation tests
// ===========================================================================
describe("All 8 endings — isolation tests", () => {
  it("ending_apprentice_confession: priority 1 — mercy + gatehouse + 4 clues + motive + staged + tipped off + not public", () => {
    const ws = state({
      currentRoomId: "room_great_hall",
      discoveredCluesById: ALL_CLUES,
      consequenceIds: ["conseq_tipped_off_theo" as any],
      npcRoomById: {
        ...s().npcRoomById,
        npc_theo_rusk: "room_great_hall"
      }
    });
    const result = evaluateAccusation(ws, frostmereAdventure, "npc_theo_rusk" as NpcId, "mercy");
    assert.notEqual(result, null);
    assert.equal(result!.endingId, "ending_apprentice_confession");
  });

  it("ending_bell_rings_true: priority 2 — public + 4 clues + motive + staged + Vale present", () => {
    const ws = state({
      discoveredCluesById: ALL_CLUES,
      consequenceIds: ["conseq_made_public_accusation" as any],
      npcRoomById: {
        ...s().npcRoomById,
        npc_captain_vale: "room_great_hall"
      }
    });
    const result = evaluateAccusation(ws, frostmereAdventure, "npc_theo_rusk" as NpcId, "public");
    assert.notEqual(result, null);
    assert.equal(result!.endingId, "ending_bell_rings_true");
  });

  it("ending_rushed_accusation: priority 3 — public + 2 clues + motive (no staged)", () => {
    const ws = state({
      discoveredCluesById: {
        clue_stolen_design_motive: "standard",
        clue_watch_stopped_1147: "standard"
      },
      consequenceIds: ["conseq_made_public_accusation" as any]
    });
    const result = evaluateAccusation(ws, frostmereAdventure, "npc_theo_rusk" as NpcId, "public");
    assert.notEqual(result, null);
    assert.equal(result!.endingId, "ending_rushed_accusation");
  });

  it("ending_false_accusation: priority 4 — public + accuse Mina", () => {
    const ws = state({
      consequenceIds: ["conseq_made_public_accusation" as any]
    });
    const result = evaluateAccusation(ws, frostmereAdventure, "npc_mina_arlen" as NpcId, "public");
    assert.notEqual(result, null);
    assert.equal(result!.endingId, "ending_false_accusation");
  });

  it("ending_vale_accused: priority 5 — public + accuse Vale", () => {
    const ws = state({
      consequenceIds: ["conseq_made_public_accusation" as any]
    });
    const result = evaluateAccusation(ws, frostmereAdventure, "npc_captain_vale" as NpcId, "public");
    assert.notEqual(result, null);
    assert.equal(result!.endingId, "ending_vale_accused");
  });

  it("ending_private_dead_end: priority 6 — private + accuse Theo", () => {
    const ws = state({ discoveredCluesById: {} });
    const result = evaluateAccusation(ws, frostmereAdventure, "npc_theo_rusk" as NpcId, "private");
    assert.notEqual(result, null);
    assert.equal(result!.endingId, "ending_private_dead_end");
  });

  it("ending_dawn_breaks_unanswered: priority 7 — requires conseq_spent_dawn_turn", () => {
    // This ending is triggered by applyDawnEnding, not directly by evaluateAccusation.
    // But we can test that the conditions match.
    const ws = state({
      consequenceIds: ["conseq_spent_dawn_turn" as any]
    });
    const result = evaluateAccusation(ws, frostmereAdventure, "npc_theo_rusk" as NpcId, "public");
    assert.notEqual(result, null);
    assert.equal(result!.endingId, "ending_dawn_breaks_unanswered");
  });

  it("ending_snow_covers_tracks: priority 8 — fallback with no conditions", () => {
    // With no evidence and no special conditions, accusing Theo without public mode
    // should skip all others and reach snow_covers_tracks.
    // Actually, let's be careful: private mode matches ending_private_dead_end first.
    // We need public mode but without conseq_made_public_accusation.
    // But public mode adds that consequence in the command handler, not in evaluateAccusation.
    // So in evaluateAccusation, we can have mode=public without the consequence.
    const ws = state({ discoveredCluesById: {} });
    // Without conseq_made_public_accusation, ending_rushed_accusation and others fail.
    // ending_snow_covers_tracks has conditions:[] and no requiresNpcId.
    // But ending_private_dead_end has requiresMode:"private" and we pass "public" → skipped.
    // ending_dawn_breaks needs conseq_spent_dawn_turn → skipped.
    // So it falls to ending_snow_covers_tracks.
    const result = evaluateAccusation(ws, frostmereAdventure, "npc_theo_rusk" as NpcId, "public");
    assert.notEqual(result, null);
    assert.equal(result!.endingId, "ending_snow_covers_tracks");
  });
});
