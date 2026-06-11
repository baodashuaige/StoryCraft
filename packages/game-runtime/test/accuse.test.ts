import { describe, it, assert, s, cmd, run, stateWithClues, stateWithConsequences, stateWithFullEvidence, assertOk, assertRejected, assertTurnSpent } from "./helpers";
import type { EvidenceStrength } from "../../shared/src";

// ===========================================================================
// accuse command — basic mechanics
// ===========================================================================
describe("accuse command — basic mechanics", () => {
  it("spends one investigation turn", () => {
    const result = run(s(), cmd("accuse", { npc: "mina" }));
    assertTurnSpent(result, 8);
  });

  it("records conseq_made_public_accusation for public mode", () => {
    const result = run(s(), cmd("accuse", { npc: "mina" }));
    assert.ok(result.state.consequenceIds.includes("conseq_made_public_accusation"));
  });

  it("records conseq_made_private_accusation for private mode", () => {
    const result = run(s(), cmd("accuse", { npc: "theo", mode: "private" }));
    assert.ok(result.state.consequenceIds.includes("conseq_made_private_accusation"));
  });

  it("sets accused flag to true", () => {
    const result = run(s(), cmd("accuse", { npc: "mina" }));
    assert.equal(result.state.flags.accused, true);
  });

  it("sets gameComplete flag to true", () => {
    const result = run(s(), cmd("accuse", { npc: "mina" }));
    assert.equal(result.state.flags.gameComplete, true);
  });

  it("sets isComplete to true on state", () => {
    const result = run(s(), cmd("accuse", { npc: "mina" }));
    assert.equal(result.state.isComplete, true);
  });

  it("records accusation_made, turn_spent, ending_resolved events", () => {
    const result = run(s(), cmd("accuse", { npc: "mina" }));
    const types = result.events.map(e => e.type);
    assert.ok(types.includes("accusation_made"));
    assert.ok(types.includes("turn_spent"));
    assert.ok(types.includes("ending_resolved"));
  });
});

// ===========================================================================
// accuse command — ending outcomes
// ===========================================================================
describe("accuse command — ending outcomes", () => {
  it("Ending A (Bell Rings True): public Theo with full evidence + Vale present", () => {
    const state = stateWithFullEvidence();
    const result = run(state, cmd("accuse", { npc: "theo" }));
    assert.equal(result.state.endingId, "ending_bell_rings_true");
  });

  it("Ending C (Apprentice Confession): mercy Theo at Gatehouse with 4+ clues + tipped off", () => {
    const state = {
      ...s(),
      currentRoomId: "room_great_hall",
      visitedRoomIds: ["room_great_hall", "room_winter_garden", "room_coach_yard", "room_great_hall"],
      discoveredCluesById: {
        clue_watch_stopped_1147: "standard",
        clue_stolen_design_motive: "standard",
        clue_tower_staged: "standard",
        clue_drugged_before_fall: "standard",
        clue_soot_marked_garden_route: "standard"
      } as Record<string, EvidenceStrength>,
      consequenceIds: ["conseq_tipped_off_theo"],
      npcRoomById: { ...s().npcRoomById, npc_theo_rusk: "room_great_hall" }
    };
    const result = run(state, cmd("accuse", { npc: "theo", mode: "mercy" }));
    assert.equal(result.state.endingId, "ending_apprentice_confession");
  });

  it("Ending D (Wrong Hand): public accusation of Mina", () => {
    const result = run(s(), cmd("accuse", { npc: "mina" }));
    assert.equal(result.state.endingId, "ending_false_accusation");
  });

  it("Ending E (Constable Fury): public accusation of Vale", () => {
    const result = run(s(), cmd("accuse", { npc: "vale" }));
    assert.equal(result.state.endingId, "ending_vale_accused");
  });

  it("Ending F (Whispers in Cold): private mode Theo without mercy", () => {
    const result = run(s(), cmd("accuse", { npc: "theo", mode: "private" }));
    assert.equal(result.state.endingId, "ending_private_dead_end");
  });

  it("Ending G (Hasty Verdict): public Theo with 2+ clues + motive but not full evidence", () => {
    const state = {
      ...s(),
      discoveredCluesById: {
        clue_stolen_design_motive: "standard",
        clue_watch_stopped_1147: "standard"
      } as Record<string, EvidenceStrength>
    };
    const result = run(state, cmd("accuse", { npc: "theo" }));
    // public accusation adds conseq_made_public_accusation
    // 2 clues + motive → ending_rushed_accusation (priority 3)
    assert.equal(result.state.endingId, "ending_rushed_accusation");
  });

  it("Ending H (Dawn Breaks): forced when turns reach 0 without accusation", () => {
    let state = { ...s(), turnsRemaining: 1 };
    // Spend the last turn via search
    state = run(state, cmd("search", { target: "body" })).state;
    assert.equal(state.endingId, "ending_dawn_breaks_unanswered");
    assert.equal(state.isComplete, true);
  });

  it("Ending I (Snow Covers Tracks): public Theo with no evidence", () => {
    // No conseq_made_public_accusation yet — the accuse handler adds it,
    // so evaluateAccusation sees it. But with only that consequence and no clues,
    // ending_rushed_accusation needs 2 clues + motive → fails.
    // ending_snow_covers_tracks has no conditions → matches.
    const state = { ...s(), discoveredCluesById: {} };
    const result = run(state, cmd("accuse", { npc: "theo" }));
    assert.equal(result.state.endingId, "ending_snow_covers_tracks");
  });
});

// ===========================================================================
// accuse command — ending priority
// ===========================================================================
describe("accuse command — ending priority", () => {
  it("Bell Rings True beats Hasty Verdict when Vale is present", () => {
    const state = stateWithFullEvidence();
    const result = run(state, cmd("accuse", { npc: "theo" }));
    assert.equal(result.state.endingId, "ending_bell_rings_true");
    assert.notEqual(result.state.endingId, "ending_rushed_accusation");
  });

  it("full evidence without Vale falls to Hasty Verdict", () => {
    const state = {
      ...stateWithFullEvidence(),
      npcRoomById: {
        ...s().npcRoomById,
        npc_captain_vale: "room_study" // Vale NOT in current room
      }
    };
    const result = run(state, cmd("accuse", { npc: "theo" }));
    assert.equal(result.state.endingId, "ending_rushed_accusation");
  });
});

// ===========================================================================
// accuse command — edge cases
// ===========================================================================
describe("accuse command — edge cases", () => {
  it("fails without specifying an NPC", () => {
    const result = run(s(), cmd("accuse"));
    assertRejected(result);
    assert.match(result.message, /do not know anyone/i);
  });

  it("fails with unrecognized NPC name", () => {
    const result = run(s(), cmd("accuse", { npc: "bob" }));
    assertRejected(result);
  });

  it("is rejected after game is already complete", () => {
    let state = run(s(), cmd("accuse", { npc: "mina" })).state;
    const result = run(state, cmd("accuse", { npc: "theo" }));
    assertRejected(result);
    assert.match(result.message, /investigation is over/i);
  });

  it("is rejected when turnsRemaining is 0", () => {
    const state = { ...s(), turnsRemaining: 0 };
    const result = run(state, cmd("accuse", { npc: "mina" }));
    assertRejected(result);
    assert.match(result.message, /too late/i);
  });

  it("double accusation is rejected (game already complete)", () => {
    let state = run(s(), cmd("accuse", { npc: "mina" })).state;
    const result = run(state, cmd("accuse", { npc: "theo" }));
    assertRejected(result);
  });

  it("mercy mode in wrong room does not reach Apprentice Confession", () => {
    // Mercy at study (not Great Hall) → falls through
    const state = {
      ...s(),
      currentRoomId: "room_study",
      discoveredCluesById: {
        clue_watch_stopped_1147: "standard",
        clue_stolen_design_motive: "standard",
        clue_tower_staged: "standard",
        clue_drugged_before_fall: "standard"
      } as Record<string, EvidenceStrength>,
      consequenceIds: ["conseq_tipped_off_theo"]
    };
    const result = run(state, cmd("accuse", { npc: "theo", mode: "mercy" }));
    // mercy requires great hall, so it won't match. Falls to snow_covers_tracks
    // (no public accusation consequence since mode is mercy)
    assert.notEqual(result.state.endingId, "ending_apprentice_confession");
  });
});
