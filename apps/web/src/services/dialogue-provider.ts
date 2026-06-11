import { PassthroughProvider, DialogueEngine } from "@wutiankai/npc-dialogue";
import type { Lang } from "../i18n";
import { getKeyConfig, aiChat } from "./api-client";
import { FROSTMERE_KEYWORDS } from "../worlds/frostmere/keywords";

// ─── Narration mode ─────────────────────────────────────────────────
export type NarrationMode = "normal" | "smart";

const MODE_KEY = "storycraft_mode";

export function getNarrationMode(): NarrationMode {
  return (localStorage.getItem(MODE_KEY) as NarrationMode) || "smart";
}

export function setNarrationMode(mode: NarrationMode): void {
  if (mode === "normal") localStorage.setItem(MODE_KEY, "normal");
  else localStorage.setItem(MODE_KEY, "smart");
}

/** Whether a host key is available via backend. */
export async function hasAvailableKey(): Promise<boolean> {
  try {
    const config = await getKeyConfig();
    return !!config;
  } catch {
    return false;
  }
}

/** Describe the current key source for UI feedback. */
export function getKeySource(): "custom" | "env" | "none" {
  // Now determined by backend, but we keep the type for UI compatibility
  // Logged-in users with custom key: "custom"; otherwise: "env" (host key)
  const token = localStorage.getItem("storycraft_token");
  if (token) {
    // Logged-in user — could have custom key or use host key
    // For UI simplicity: if logged in, show as potentially custom
    return "env"; // Will be refined after getKeyConfig call
  }
  return "env"; // Guest always uses host key
}

/**
 * Create and initialize a DialogueEngine based on backend config.
 * - normal mode: always PassthroughProvider (no AI)
 * - smart mode: read key config from backend, proxy through backend
 */
export async function createDialogueEngine(lang: Lang): Promise<DialogueEngineSetup> {
  const mode = getNarrationMode();

  // Normal mode: no AI, topic buttons only
  if (mode === "normal") {
    const provider = new PassthroughProvider();
    await provider.initialize();
    const engine = new DialogueEngine(provider, { lang, bilingualKeywordMap: FROSTMERE_KEYWORDS });
    await engine.initialize();
    return { engine };
  }

  // Smart mode: read config from backend
  let keyConfig;
  try {
    keyConfig = await getKeyConfig();
  } catch {
    keyConfig = null;
  }

  let provider: NarrativeProvider;
  if (keyConfig) {
    // Use backend proxy provider — API key never touches frontend
    provider = new ProxyProvider(keyConfig.baseUrl, keyConfig.model);
  } else {
    provider = new PassthroughProvider();
  }

  await provider.initialize();

  const engine = new DialogueEngine(provider, { lang, bilingualKeywordMap: FROSTMERE_KEYWORDS });
  await engine.initialize();

  return { engine, getProviderStatus: () => provider.getStatus() };
}

// ─── ProxyProvider ──────────────────────────────────────────────────
// Calls AI through backend proxy — no API key on frontend.

import type { NarrativeProvider } from "@wutiankai/npc-dialogue";
import type { ProviderRawResponse, ProviderState, ProviderStatus } from "@wutiankai/npc-dialogue";

/** Return type of createDialogueEngine — engine + optional provider diagnostics. */
export interface DialogueEngineSetup {
  engine: DialogueEngine;
  /** Returns live provider status; undefined in normal (non-AI) mode. */
  getProviderStatus?: () => ProviderStatus;
}

class ProxyProvider implements NarrativeProvider {
  readonly id = "proxy";

  private state: ProviderState = "uninitialized";
  private consecutiveFailures = 0;
  private lastHealthCheck = 0;
  private lastError?: string;

  constructor(private baseUrl: string, private model: string) {}

  async initialize(): Promise<void> {
    this.state = "ready";
    this.lastHealthCheck = Date.now();
  }

  async dispose(): Promise<void> {
    this.state = "disposed";
  }

  getStatus(): ProviderStatus {
    return {
      state: this.state,
      providerId: this.id,
      lastHealthCheck: this.lastHealthCheck,
      consecutiveFailures: this.consecutiveFailures,
      lastError: this.lastError,
      configRedacted: { baseUrl: this.baseUrl, model: this.model },
    };
  }

  async healthCheck(): Promise<boolean> {
    // Quick check via backend test endpoint
    try {
      const res = await fetch(`${this.baseUrl.replace(/\/+$/, "")}/../keys/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      this.lastHealthCheck = Date.now();
      if (res.ok) {
        this.consecutiveFailures = 0;
        if (this.state === "degraded" || this.state === "failed") this.state = "ready";
        return true;
      }
      this.consecutiveFailures++;
      this.state = "degraded";
      return false;
    } catch {
      this.consecutiveFailures++;
      this.state = "degraded";
      return false;
    }
  }

  async call(
    _request: any,
    systemPrompt: string,
    userPrompt: string
  ): Promise<ProviderRawResponse> {
    if (this.state === "disposed") throw new Error("Provider is disposed");

    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    let response: Response;
    try {
      response = await aiChat({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      this.consecutiveFailures++;
      this.lastError = err instanceof Error ? err.message : String(err);
      if (this.consecutiveFailures >= 3) this.state = "failed";
      else this.state = "degraded";
      if ((err as Error).name === "AbortError") {
        throw new Error("AI request timed out after 12 seconds");
      }
      throw err;
    }
    clearTimeout(timeout);

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      this.consecutiveFailures++;
      this.lastError = `API error ${response.status}: ${body.slice(0, 200)}`;
      if (this.consecutiveFailures >= 3) this.state = "failed";
      else this.state = "degraded";
      throw new Error(`AI request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";

    if (!text) {
      this.consecutiveFailures++;
      this.lastError = "Empty response from AI";
      throw new Error("AI returned empty response");
    }

    this.consecutiveFailures = 0;
    if (this.state === "degraded" || this.state === "failed") this.state = "ready";
    this.lastHealthCheck = Date.now();

    return {
      text,
      model: this.model,
      latencyMs,
      promptTokenCount: data.usage?.prompt_tokens,
      completionTokenCount: data.usage?.completion_tokens,
    };
  }
}
