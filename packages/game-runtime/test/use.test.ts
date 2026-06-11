import { describe, it, assert, s, cmd, run, stateWithItems, stateWithFlags, stateWithConsequences, assertOk, assertRejected, assertTurnSpent, assertEventTypes } from "./helpers";

// ===========================================================================
// use command — key on tower
// ===========================================================================
describe("use command — key on tower", () => {
  it("unlocks tower and sets towerUnlocked flag", () => {
    const state = stateWithItems("item_brass_service_key");
    const result = run(state, cmd("use", { item: "key", target: "tower door" }));
    assertOk(result);
    assert.equal(result.state.flags.towerUnlocked, true);
  });

  it("spends one investigation turn", () => {
    const state = stateWithItems("item_brass_service_key");
    const result = run(state, cmd("use", { item: "key", target: "tower door" }));
    assertTurnSpent(result, 8);
  });

  it("records conseq_used_private_key", () => {
    const state = stateWithItems("item_brass_service_key");
    const result = run(state, cmd("use", { item: "key", target: "tower door" }));
    assert.ok(result.state.consequenceIds.includes("conseq_used_private_key"));
  });

  it("records item_used, turn_spent, access_unlocked events", () => {
    const state = stateWithItems("item_brass_service_key");
    const result = run(state, cmd("use", { item: "key", target: "tower door" }));
    assertEventTypes(result, ["item_used", "turn_spent", "access_unlocked"]);
  });

  it("fails if key is not in inventory", () => {
    const result = run(s(), cmd("use", { item: "key", target: "tower door" }));
    assertRejected(result);
  });

  it("fails if target is not specified", () => {
    const state = stateWithItems("item_brass_service_key");
    const result = run(state, cmd("use", { item: "key" }));
    assertRejected(result);
  });

  it("already used shows alreadyUsedResponse and is free", () => {
    let state = stateWithItems("item_brass_service_key");
    state = run(state, cmd("use", { item: "key", target: "tower door" })).state;
    // Use again
    const result = run(state, cmd("use", { item: "key", target: "tower door" }));
    assert.equal(result.ok, true);
    assert.equal(result.turnSpent, false);
    assert.match(result.message, /already unlocked/i);
  });
});

// ===========================================================================
// use command — ledger on Theo
// ===========================================================================
describe("use command — ledger on Theo", () => {
  it("tips off Theo and records conseq_tipped_off_theo", () => {
    const state = stateWithItems("item_torn_ledger_page"); // Theo is in study
    let inStudy = run(s(), cmd("go", { target: "study" })).state;
    inStudy = {
      ...inStudy,
      discoveredItemIds: ["item_torn_ledger_page"],
      inventoryItemIds: ["item_torn_ledger_page"]
    };
    const result = run(inStudy, cmd("use", { item: "ledger page", target: "theo" }));
    assertOk(result);
    assert.ok(result.state.consequenceIds.includes("conseq_tipped_off_theo"));
  });

  it("moves Theo to Gatehouse", () => {
    let state = run(s(), cmd("go", { target: "study" })).state;
    state = {
      ...state,
      discoveredItemIds: ["item_torn_ledger_page"],
      inventoryItemIds: ["item_torn_ledger_page"]
    };
    const result = run(state, cmd("use", { item: "ledger page", target: "theo" }));
    assert.equal(result.state.npcRoomById.npc_theo_rusk, "room_great_hall");
  });

  it("fails if Theo is not in current room", () => {
    // Player is in great hall, Theo is in study
    const state = {
      ...stateWithItems("item_torn_ledger_page"),
      npcRoomById: { ...s().npcRoomById, npc_theo_rusk: "room_study" }
    };
    const result = run(state, cmd("use", { item: "ledger page", target: "theo" }));
    assertRejected(result);
    assert.match(result.message, /not here/i);
  });

  it("fails if already tipped off (condition not_has_consequence fails)", () => {
    let state = run(s(), cmd("go", { target: "study" })).state;
    state = {
      ...state,
      discoveredItemIds: ["item_torn_ledger_page"],
      inventoryItemIds: ["item_torn_ledger_page"],
      consequenceIds: ["conseq_tipped_off_theo"]
    };
    const result = run(state, cmd("use", { item: "ledger page", target: "theo" }));
    // Condition not_has_consequence fails → blockedResponse
    assert.equal(result.ok, true);
    assert.equal(result.turnSpent, false);
  });

  it("spends one turn", () => {
    let state = run(s(), cmd("go", { target: "study" })).state;
    state = {
      ...state,
      discoveredItemIds: ["item_torn_ledger_page"],
      inventoryItemIds: ["item_torn_ledger_page"]
    };
    const result = run(state, cmd("use", { item: "ledger page", target: "theo" }));
    assertTurnSpent(result, 8);
  });
});

// ===========================================================================
// use command — gloves on Theo
// ===========================================================================
describe("use command — gloves on Theo", () => {
  it("tips off Theo and records conseq_tipped_off_theo", () => {
    let state = run(s(), cmd("go", { target: "study" })).state;
    state = {
      ...state,
      discoveredItemIds: ["item_soot_stained_gloves"],
      inventoryItemIds: ["item_soot_stained_gloves"]
    };
    const result = run(state, cmd("use", { item: "gloves", target: "theo" }));
    assertOk(result);
    assert.ok(result.state.consequenceIds.includes("conseq_tipped_off_theo"));
  });

  it("moves Theo to Gatehouse", () => {
    let state = run(s(), cmd("go", { target: "study" })).state;
    state = {
      ...state,
      discoveredItemIds: ["item_soot_stained_gloves"],
      inventoryItemIds: ["item_soot_stained_gloves"]
    };
    const result = run(state, cmd("use", { item: "gloves", target: "theo" }));
    assert.equal(result.state.npcRoomById.npc_theo_rusk, "room_great_hall");
  });

  it("requires gloves in inventory", () => {
    let state = run(s(), cmd("go", { target: "study" })).state;
    const result = run(state, cmd("use", { item: "gloves", target: "theo" }));
    assertRejected(result);
  });

  it("requires Theo present in room", () => {
    const state = {
      ...stateWithItems("item_soot_stained_gloves"),
      currentRoomId: "room_study" as const,
      npcRoomById: { ...s().npcRoomById, npc_theo_rusk: "room_great_hall" }
    };
    const result = run(state, cmd("use", { item: "gloves", target: "theo" }));
    assertRejected(result);
    assert.match(result.message, /not here/i);
  });
});

// ===========================================================================
// use command — edge cases
// ===========================================================================
describe("use command — edge cases", () => {
  it("fails for unrecognized item", () => {
    const result = run(s(), cmd("use", { item: "banana", target: "door" }));
    assertRejected(result);
  });

  it("fails for item not in inventory", () => {
    const result = run(s(), cmd("use", { item: "key", target: "tower door" }));
    assertRejected(result);
  });

  it("fails for unrecognized target", () => {
    const state = stateWithItems("item_brass_service_key");
    const result = run(state, cmd("use", { item: "key", target: "banana" }));
    assertRejected(result);
  });

  it("is rejected after game is complete", () => {
    let state = stateWithItems("item_brass_service_key");
    state = run(state, cmd("accuse", { npc: "mina" })).state;
    const result = run(state, cmd("use", { item: "key", target: "tower door" }));
    assertRejected(result);
  });

  it("is rejected when turnsRemaining is 0", () => {
    const state = {
      ...stateWithItems("item_brass_service_key"),
      turnsRemaining: 0
    };
    const result = run(state, cmd("use", { item: "key", target: "tower door" }));
    assertRejected(result);
    assert.match(result.message, /no time/i);
  });

  it("use without item specified fails", () => {
    const result = run(s(), cmd("use", { target: "tower door" }));
    assertRejected(result);
  });
});
