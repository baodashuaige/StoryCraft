import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createInitialState,
  executeCommand,
  getVisibleState
} from "../src/index";
import { frostmereAdventure } from "../src/content/frostmere";
import type {
  ClueId,
  CommandInput,
  CommandResult,
  ConsequenceId,
  NpcId,
  RoomId,
  WorldState,
  EvidenceStrength,
  ItemId,
  TrustLevel
} from "../../shared/src";

// ---------------------------------------------------------------------------
// Re-export for convenience
// ---------------------------------------------------------------------------
export { describe, it, assert };
export { createInitialState, executeCommand, getVisibleState, frostmereAdventure };
export type { CommandInput, CommandResult, WorldState };

// ---------------------------------------------------------------------------
// Basic command helpers
// ---------------------------------------------------------------------------

/** Construct a CommandInput with optional overrides. */
export function cmd(
  verb: CommandInput["verb"],
  overrides: Partial<Omit<CommandInput, "verb">> = {}
): CommandInput {
  return { verb, ...overrides };
}

/** Execute a command against state. */
export function run(state: WorldState, input: CommandInput): CommandResult {
  return executeCommand(state, input);
}

// ---------------------------------------------------------------------------
// State builders — each returns a fresh state derived from createInitialState()
// ---------------------------------------------------------------------------

/** Fresh initial state alias. */
export function s(): WorldState {
  return createInitialState();
}

/** State with player moved to a given room via free go commands. */
export function stateInRoom(roomId: RoomId): WorldState {
  let state = createInitialState();
  // Build a path from great hall to target room via BFS
  const path = findPath("room_great_hall", roomId);
  for (const step of path) {
    const result = executeCommand(state, cmd("go", { target: step }));
    if (!result.ok) {
      // If locked, try with towerUnlocked flag
      state = { ...state, flags: { ...state.flags, towerUnlocked: true } };
      const retry = executeCommand(state, cmd("go", { target: step }));
      assert.ok(retry.ok, `Failed to navigate to ${step}: ${retry.message}`);
      state = retry.state;
    } else {
      state = result.state;
    }
  }
  return state;
}

/** State with specified clues discovered at "standard" strength. */
export function stateWithClues(...clueIds: ClueId[]): WorldState {
  const discoveredCluesById: Record<ClueId, EvidenceStrength> = {};
  for (const id of clueIds) {
    discoveredCluesById[id] = "standard";
  }
  return { ...createInitialState(), discoveredCluesById };
}

/** State with items discovered AND in inventory. */
export function stateWithItems(...itemIds: ItemId[]): WorldState {
  return {
    ...createInitialState(),
    discoveredItemIds: [...itemIds],
    inventoryItemIds: [...itemIds]
  };
}

/** State with turnsRemaining set to n. */
export function stateWithTurns(n: number): WorldState {
  return { ...createInitialState(), turnsRemaining: n };
}

/** State with specific flags set. */
export function stateWithFlags(flags: Record<string, boolean>): WorldState {
  return { ...createInitialState(), flags: { ...flags } };
}

/** State with consequence IDs recorded. */
export function stateWithConsequences(...ids: ConsequenceId[]): WorldState {
  return { ...createInitialState(), consequenceIds: [...ids] };
}

/** State with trust set for a specific NPC. */
export function stateWithTrust(npcId: NpcId, level: TrustLevel): WorldState {
  return {
    ...createInitialState(),
    trustByNpcId: { ...createInitialState().trustByNpcId, [npcId]: level }
  };
}

// ---------------------------------------------------------------------------
// Multi-step convenience builders
// ---------------------------------------------------------------------------

/** State at bell tower with tower unlocked (via flag). */
export function stateAtBellTower(): WorldState {
  return {
    ...createInitialState(),
    currentRoomId: "room_bell_tower" as RoomId,
    visitedRoomIds: ["room_great_hall", "room_bell_tower"] as RoomId[],
    flags: { towerUnlocked: true }
  };
}

/** State at gatehouse with Theo tipped off. */
export function stateAtGatehouse(): WorldState {
  return {
    ...createInitialState(),
    currentRoomId: "room_great_hall" as RoomId,
    visitedRoomIds: [
      "room_great_hall",
      "room_winter_garden",
      "room_coach_yard",
      "room_great_hall"
    ] as RoomId[],
    consequenceIds: ["conseq_tipped_off_theo" as ConsequenceId],
    npcRoomById: {
      ...createInitialState().npcRoomById,
      npc_theo_rusk: "room_great_hall" as RoomId
    }
  };
}

/** State with all 6 clues discovered, in the great hall with Vale present. */
export function stateWithFullEvidence(): WorldState {
  const allClueIds: ClueId[] = [
    "clue_watch_stopped_1147",
    "clue_servant_bell_after_death",
    "clue_stolen_design_motive",
    "clue_soot_marked_garden_route",
    "clue_drugged_before_fall",
    "clue_tower_staged"
  ];
  const discoveredCluesById: Record<ClueId, EvidenceStrength> = {};
  for (const id of allClueIds) {
    discoveredCluesById[id] = "standard";
  }
  return {
    ...createInitialState(),
    discoveredCluesById,
    consequenceIds: ["conseq_made_public_accusation" as ConsequenceId]
  };
}

/** State in servants' hall with Mina trust at 2 (via flags). */
export function stateWithMinaTrust2(): WorldState {
  let state = stateInRoom("room_servants_hall");
  state = {
    ...state,
    trustByNpcId: {
      ...state.trustByNpcId,
      npc_mina_arlen: 2 as TrustLevel
    }
  };
  return state;
}

// ---------------------------------------------------------------------------
// Assertion helpers
// ---------------------------------------------------------------------------

/** Assert result succeeded (ok === true). */
export function assertOk(result: CommandResult): void {
  assert.equal(result.ok, true, `Expected ok=true, got: ${result.message}`);
}

/** Assert result was rejected (ok === false, turnSpent === false). */
export function assertRejected(result: CommandResult): void {
  assert.equal(result.ok, false, `Expected ok=false, but command succeeded: ${result.message}`);
  assert.equal(result.turnSpent, false, "Rejected command should not spend a turn");
}

/** Assert a turn was spent and check remaining turns. */
export function assertTurnSpent(
  result: CommandResult,
  expectedRemaining: number
): void {
  assert.equal(result.turnSpent, true, "Expected a turn to be spent");
  assert.equal(
    result.state.turnsRemaining,
    expectedRemaining,
    `Expected turnsRemaining=${expectedRemaining}, got ${result.state.turnsRemaining}`
  );
}

/** Assert the event types in result.events match the expected sequence. */
export function assertEventTypes(
  result: CommandResult,
  types: string[]
): void {
  const actual = result.events.map((e) => e.type);
  assert.deepEqual(actual, types, `Event type mismatch`);
}

// ---------------------------------------------------------------------------
// Internal path-finding helper
// ---------------------------------------------------------------------------

/** BFS path from one room to another using adventure exits. */
function findPath(from: RoomId, to: RoomId): string[] {
  if (from === to) return [];

  const exits = Object.values(frostmereAdventure.exits);
  const adj = new Map<RoomId, { dir: string; locked: boolean }[]>();
  for (const exit of exits) {
    if (exit.fromRoomId !== from) {
      if (!adj.has(exit.fromRoomId)) adj.set(exit.fromRoomId, []);
      // not used as start
    }
    const list = adj.get(exit.fromRoomId) ?? [];
    list.push({ dir: exit.aliases[0], locked: exit.locked ?? false });
    adj.set(exit.fromRoomId, list);
  }

  // Build adjacency: fromRoomId → [{alias, toRoomId}]
  const graph = new Map<RoomId, { alias: string; toRoomId: RoomId }[]>();
  for (const exit of exits) {
    const list = graph.get(exit.fromRoomId) ?? [];
    list.push({ alias: exit.aliases[0], toRoomId: exit.toRoomId });
    graph.set(exit.fromRoomId, list);
  }

  const visited = new Set<RoomId>([from]);
  const queue: { roomId: RoomId; path: string[] }[] = [{ roomId: from, path: [] }];

  while (queue.length > 0) {
    const { roomId, path } = queue.shift()!;
    const neighbors = graph.get(roomId) ?? [];
    for (const { alias, toRoomId } of neighbors) {
      if (visited.has(toRoomId)) continue;
      visited.add(toRoomId);
      const newPath = [...path, alias];
      if (toRoomId === to) return newPath;
      queue.push({ roomId: toRoomId, path: newPath });
    }
  }

  throw new Error(`No path found from ${from} to ${to}`);
}
