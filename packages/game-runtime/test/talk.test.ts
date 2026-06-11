import { describe, it, assert, s, cmd, run, stateWithItems, stateWithClues, stateWithConsequences, stateWithTurns, stateWithTrust, assertOk, assertRejected, assertTurnSpent, assertEventTypes } from "./helpers";
import type { EvidenceStrength } from "../../shared/src";

// ===========================================================================
// talk command — greeting (no topic)
// ===========================================================================
describe("talk command — greeting", () => {
  it("returns NPC greeting without spending a turn", () => {
    let state = run(s(), cmd("go", { target: "west" })).state; // servants hall
    const result = run(state, cmd("talk", { npc: "mina" }));
    assertOk(result);
    assert.equal(result.turnSpent, false);
    assert.ok(result.message.length > 0);
  });

  it("returns repeated greeting on second call", () => {
    let state = run(s(), cmd("go", { target: "west" })).state;
    state = run(state, cmd("talk", { npc: "mina" })).state;
    const result = run(state, cmd("talk", { npc: "mina" }));
    assert.equal(result.turnSpent, false);
    // Repeated greeting has different text
    assert.ok(result.message.length > 0);
  });

  it("fails if NPC is not in current room", () => {
    // Mina is in servants hall, we are in great hall
    const result = run(s(), cmd("talk", { npc: "mina" }));
    assertRejected(result);
  });

  it("fails if NPC name is unrecognized", () => {
    const result = run(s(), cmd("talk", { npc: "bob" }));
    assertRejected(result);
    assert.match(result.message, /do not see anyone/i);
  });

  it("fails with no NPC specified", () => {
    const result = run(s(), cmd("talk"));
    assertRejected(result);
  });
});

// ===========================================================================
// talk command — Mina topics
// ===========================================================================
describe("talk command — Mina topics", () => {
  it("topic alden raises trust from 0 to 1 and spends a turn", () => {
    let state = run(s(), cmd("go", { target: "west" })).state;
    const result = run(state, cmd("talk", { npc: "mina", topic: "alden" }));
    assertOk(result);
    assertTurnSpent(result, 8);
    assert.equal(result.state.trustByNpcId.npc_mina_arlen, 1);
  });

  it("topic bell at trust 0 is blocked (blockedResponse)", () => {
    let state = run(s(), cmd("go", { target: "west" })).state;
    const result = run(state, cmd("talk", { npc: "mina", topic: "bell" }));
    assert.equal(result.ok, true);
    assert.equal(result.turnSpent, false);
    assert.match(result.message, /do not discuss/i);
  });

  it("topic bell at trust 1 reveals servant bell clue and raises trust to 2", () => {
    let state = run(s(), cmd("go", { target: "west" })).state;
    state = run(state, cmd("talk", { npc: "mina", topic: "alden" })).state;
    assert.equal(state.trustByNpcId.npc_mina_arlen, 1);
    const result = run(state, cmd("talk", { npc: "mina", topic: "bell" }));
    assertOk(result);
    assertTurnSpent(result, 7);
    assert.equal(result.state.trustByNpcId.npc_mina_arlen, 2);
    assert.ok(result.state.discoveredCluesById.clue_servant_bell_after_death);
  });

  it("topic key at trust 2 grants minaGrantedAccess flag and obtains key", () => {
    let state = run(s(), cmd("go", { target: "west" })).state;
    state = run(state, cmd("talk", { npc: "mina", topic: "alden" })).state;
    state = run(state, cmd("talk", { npc: "mina", topic: "bell" })).state;
    assert.equal(state.trustByNpcId.npc_mina_arlen, 2);
    const result = run(state, cmd("talk", { npc: "mina", topic: "key" }));
    assertOk(result);
    assert.equal(result.state.flags.minaGrantedAccess, true);
    assert.ok(result.state.discoveredItemIds.includes("item_brass_service_key"));
    assert.ok(result.state.inventoryItemIds.includes("item_brass_service_key"));
    assertEventTypes(result, ["npc_talked", "item_obtained", "turn_spent"]);
  });

  it("repeated topic does not spend a turn and does not change trust", () => {
    let state = run(s(), cmd("go", { target: "west" })).state;
    state = run(state, cmd("talk", { npc: "mina", topic: "alden" })).state;
    assert.equal(state.trustByNpcId.npc_mina_arlen, 1);
    const result = run(state, cmd("talk", { npc: "mina", topic: "alden" }));
    assert.equal(result.turnSpent, false);
    assert.equal(result.state.trustByNpcId.npc_mina_arlen, 1);
  });

  it("topic key without prior trust 2 is blocked", () => {
    let state = run(s(), cmd("go", { target: "west" })).state;
    // trust is 0, key requires trust 2
    const result = run(state, cmd("talk", { npc: "mina", topic: "key" }));
    assert.equal(result.turnSpent, false);
    assert.match(result.message, /locked doors/i);
  });
});

// ===========================================================================
// talk command — Theo topics
// ===========================================================================
describe("talk command — Theo topics", () => {
  it("topic designs raises trust from 0 to 1", () => {
    let state = run(s(), cmd("go", { target: "east" })).state; // study
    const result = run(state, cmd("talk", { npc: "theo", topic: "designs" }));
    assertOk(result);
    assertTurnSpent(result, 8);
    assert.equal(result.state.trustByNpcId.npc_theo_rusk, 1);
  });

  it("topic gloves when carrying gloves and not tipped off moves Theo to Gatehouse", () => {
    let state = run(s(), cmd("go", { target: "east" })).state;
    state = {
      ...state,
      discoveredItemIds: ["item_soot_stained_gloves"],
      inventoryItemIds: ["item_soot_stained_gloves"]
    };
    const result = run(state, cmd("talk", { npc: "theo", topic: "gloves" }));
    assertOk(result);
    assert.equal(result.state.npcRoomById.npc_theo_rusk, "room_great_hall");
    assert.ok(result.state.consequenceIds.includes("conseq_tipped_off_theo"));
  });

  it("topic gloves without gloves item is blocked", () => {
    let state = run(s(), cmd("go", { target: "east" })).state;
    const result = run(state, cmd("talk", { npc: "theo", topic: "gloves" }));
    assert.equal(result.turnSpent, false);
    assert.match(result.message, /do not know what you mean/i);
  });

  it("topic gloves after already tipped off is blocked", () => {
    let state = run(s(), cmd("go", { target: "east" })).state;
    state = {
      ...state,
      discoveredItemIds: ["item_soot_stained_gloves"],
      inventoryItemIds: ["item_soot_stained_gloves"],
      consequenceIds: ["conseq_tipped_off_theo"]
    };
    const result = run(state, cmd("talk", { npc: "theo", topic: "gloves" }));
    // Condition not_has_consequence fails → blockedResponse
    assert.equal(result.turnSpent, false);
    assert.match(result.message, /do not know what you mean/i);
  });

  it("topic ledger when carrying ledger and not tipped off moves Theo to Gatehouse", () => {
    let state = run(s(), cmd("go", { target: "east" })).state;
    state = {
      ...state,
      discoveredItemIds: ["item_torn_ledger_page"],
      inventoryItemIds: ["item_torn_ledger_page"]
    };
    const result = run(state, cmd("talk", { npc: "theo", topic: "ledger" }));
    assertOk(result);
    assert.equal(result.state.npcRoomById.npc_theo_rusk, "room_great_hall");
    assert.ok(result.state.consequenceIds.includes("conseq_tipped_off_theo"));
  });

  it("topic ledger without ledger item is blocked", () => {
    let state = run(s(), cmd("go", { target: "east" })).state;
    const result = run(state, cmd("talk", { npc: "theo", topic: "ledger" }));
    assert.equal(result.turnSpent, false);
  });

  it("topic mercy at Gatehouse with 4+ clues and tipped off sets theo_confessed flag", () => {
    // Theo is at gatehouse, player is at gatehouse, 4+ clues, tipped off
    const state = {
      ...s(),
      currentRoomId: "room_great_hall",
      visitedRoomIds: ["room_great_hall", "room_winter_garden", "room_coach_yard", "room_great_hall"],
      discoveredCluesById: {
        clue_watch_stopped_1147: "standard",
        clue_stolen_design_motive: "standard",
        clue_tower_staged: "standard",
        clue_drugged_before_fall: "standard"
      } as Record<string, EvidenceStrength>,
      consequenceIds: ["conseq_tipped_off_theo"],
      npcRoomById: { ...s().npcRoomById, npc_theo_rusk: "room_great_hall" }
    };
    const result = run(state, cmd("talk", { npc: "theo", topic: "mercy" }));
    assertOk(result);
    assert.equal(result.state.flags.theo_confessed, true);
  });

  it("topic mercy without enough clues is blocked", () => {
    const state = {
      ...s(),
      currentRoomId: "room_great_hall",
      visitedRoomIds: ["room_great_hall", "room_winter_garden", "room_coach_yard", "room_great_hall"],
      discoveredCluesById: {
        clue_watch_stopped_1147: "standard" // only 1 clue
      } as Record<string, EvidenceStrength>,
      consequenceIds: ["conseq_tipped_off_theo"],
      npcRoomById: { ...s().npcRoomById, npc_theo_rusk: "room_great_hall" }
    };
    const result = run(state, cmd("talk", { npc: "theo", topic: "mercy" }));
    assert.equal(result.turnSpent, false);
    assert.match(result.message, /do not know what you want/i);
  });

  it("topic mercy without tipped_off_theo consequence is blocked", () => {
    const state = {
      ...s(),
      currentRoomId: "room_great_hall",
      visitedRoomIds: ["room_great_hall", "room_winter_garden", "room_coach_yard", "room_great_hall"],
      discoveredCluesById: {
        clue_watch_stopped_1147: "standard",
        clue_stolen_design_motive: "standard",
        clue_tower_staged: "standard",
        clue_drugged_before_fall: "standard"
      } as Record<string, EvidenceStrength>,
      npcRoomById: { ...s().npcRoomById, npc_theo_rusk: "room_great_hall" }
    };
    const result = run(state, cmd("talk", { npc: "theo", topic: "mercy" }));
    assert.equal(result.turnSpent, false);
    assert.match(result.message, /do not know what you want/i);
  });
});

// ===========================================================================
// talk command — Vale topics
// ===========================================================================
describe("talk command — Vale topics", () => {
  it("topic report with 3+ clues passes and raises trust to 1", () => {
    const state = {
      ...s(),
      discoveredCluesById: {
        clue_watch_stopped_1147: "standard",
        clue_stolen_design_motive: "standard",
        clue_tower_staged: "standard"
      } as Record<string, EvidenceStrength>
    };
    const result = run(state, cmd("talk", { npc: "vale", topic: "report" }));
    assertOk(result);
    assertTurnSpent(result, 8);
    assert.equal(result.state.trustByNpcId.npc_captain_vale, 1);
  });

  it("topic report with fewer than 3 clues is blocked", () => {
    const state = {
      ...s(),
      discoveredCluesById: {
        clue_watch_stopped_1147: "standard"
      } as Record<string, EvidenceStrength>
    };
    const result = run(state, cmd("talk", { npc: "vale", topic: "report" }));
    assert.equal(result.turnSpent, false);
    assert.match(result.message, /something solid/i);
  });

  it("topic rush always passes and records conseq_captain_rushed_case", () => {
    const result = run(s(), cmd("talk", { npc: "vale", topic: "rush" }));
    assertOk(result);
    assertTurnSpent(result, 8);
    assert.ok(result.state.consequenceIds.includes("conseq_captain_rushed_case"));
  });

  it("topic rush repeated is free and shows repeated response", () => {
    let state = run(s(), cmd("talk", { npc: "vale", topic: "rush" })).state;
    const result = run(state, cmd("talk", { npc: "vale", topic: "rush" }));
    assert.equal(result.turnSpent, false);
    assert.match(result.message, /Time is running out/i);
  });
});

// ===========================================================================
// talk command — edge cases
// ===========================================================================
describe("talk command — edge cases", () => {
  it("is rejected after game is complete", () => {
    let state = run(s(), cmd("accuse", { npc: "mina" })).state;
    const result = run(state, cmd("talk", { npc: "vale" }));
    assertRejected(result);
    assert.match(result.message, /investigation is over/i);
  });

  it("is rejected when turnsRemaining is 0", () => {
    let state = run(s(), cmd("go", { target: "west" })).state;
    state = { ...state, turnsRemaining: 0 };
    const result = run(state, cmd("talk", { npc: "mina", topic: "alden" }));
    assertRejected(result);
    assert.match(result.message, /no time/i);
  });

  it("trust clamps at maximum 2", () => {
    let state = run(s(), cmd("go", { target: "west" })).state;
    state = run(state, cmd("talk", { npc: "mina", topic: "alden" })).state; // 0→1
    state = run(state, cmd("talk", { npc: "mina", topic: "bell" })).state;  // 1→2
    assert.equal(state.trustByNpcId.npc_mina_arlen, 2);
    // Now try to raise trust beyond 2 — there's no topic that does this directly
    // But trustDelta on key topic is 0, so trust stays at 2
    state = run(state, cmd("talk", { npc: "mina", topic: "key" })).state;
    assert.equal(state.trustByNpcId.npc_mina_arlen, 2);
  });

  it("adjust_trust command changes trust only through runtime and clamps at 0..2", () => {
    let state = run(s(), cmd("adjust_trust", {
      npcId: "npc_mina_arlen",
      trustDelta: 5
    })).state;
    assert.equal(state.trustByNpcId.npc_mina_arlen, 2);

    state = run(state, cmd("adjust_trust", {
      npcId: "npc_mina_arlen",
      trustDelta: -5
    })).state;
    assert.equal(state.trustByNpcId.npc_mina_arlen, 0);
  });

  it("topic exhaustion tracked via talked_{gateId} flag", () => {
    let state = run(s(), cmd("go", { target: "west" })).state;
    state = run(state, cmd("talk", { npc: "mina", topic: "alden" })).state;
    assert.equal(state.flags["talked_topic_mina_alden"], true);
  });
});
