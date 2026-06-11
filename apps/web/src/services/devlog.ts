// ─── DevLog — Dialogue Pipeline Debug Logger ──────────────────────────
// Records the complete dialogue pipeline for each AI dialogue turn.
// Accessible via window.__devlog in the browser console.
//
// Usage:
//   __devlog.dump()   — formatted console output of all entries
//   __devlog.query()  — returns all DevLogEntry[]
//   __devlog.clear()  — clears all entries
//   __devlog.last()   — returns the most recent entry

import type { DialogueIntent } from "./dialogue-intent";
import type { DialogueAiResponse } from "@wutiankai/npc-dialogue";

// ─── Types ──────────────────────────────────────────────────────────

export interface DevLogEntry {
  id: number;
  timestamp: number;
  npcId: string;
  playerInput: string;

  // Pipeline results
  intent: DialogueIntent;
  providerCall: {
    model: string;
    latencyMs: number;
    promptTokens?: number;
    completionTokens?: number;
  };
  aiRawText: string;
  aiParsed: DialogueAiResponse;
  gateReview: {
    accepted: boolean;
    reason: string;
  };
  policy: {
    acceptedGateId: string | null;
    notes: string[];
    possibleStateClaim: string | null;
  };
  runtime: {
    gateApplied: boolean;
    trustDelta: number;
    stateConfirmed: boolean;
  };

  // Full prompts (most valuable for debugging)
  systemPrompt: string;
  userPrompt: string;
}

// ─── DevLog Class ───────────────────────────────────────────────────

class DevLog {
  private entries: DevLogEntry[] = [];
  private nextId = 1;

  record(entry: Omit<DevLogEntry, "id">): void {
    this.entries.push({ ...entry, id: this.nextId++ });
  }

  query(): DevLogEntry[] {
    return [...this.entries];
  }

  last(): DevLogEntry | undefined {
    return this.entries[this.entries.length - 1];
  }

  clear(): void {
    this.entries = [];
    this.nextId = 1;
  }

  dump(): void {
    if (this.entries.length === 0) {
      console.log("[DevLog] No entries recorded yet.");
      return;
    }

    console.group(`[DevLog] ${this.entries.length} entries`);
    for (const e of this.entries) {
      console.group(`#${e.id} — ${e.npcId} @ ${new Date(e.timestamp).toLocaleTimeString()}`);
      console.log("playerInput:", e.playerInput);
      console.log("intent:", e.intent);
      console.log("provider:", `${e.providerCall.model} | ${e.providerCall.latencyMs}ms | ${e.providerCall.promptTokens ?? "?"}+${e.providerCall.completionTokens ?? "?"} tokens`);
      console.log("aiParsed:", e.aiParsed);
      console.log("gateReview:", e.gateReview);
      console.log("policy:", e.policy);
      console.log("runtime:", e.runtime);
      console.log("systemPrompt:", e.systemPrompt.slice(0, 200) + (e.systemPrompt.length > 200 ? "…" : ""));
      console.log("userPrompt:", e.userPrompt.slice(0, 200) + (e.userPrompt.length > 200 ? "…" : ""));
      console.log("aiRawText:", e.aiRawText.slice(0, 300) + (e.aiRawText.length > 300 ? "…" : ""));
      console.groupEnd();
    }
    console.groupEnd();
  }
}

// ─── Global Singleton ───────────────────────────────────────────────

export const devlog = new DevLog();

// Expose on window for F12 console access
if (typeof window !== "undefined") {
  (window as any).__devlog = devlog;
}
