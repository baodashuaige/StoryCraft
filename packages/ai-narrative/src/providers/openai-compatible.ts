import type { NarrativeProvider } from "../provider";
import type {
  NarrativeRequest,
  ProviderRawResponse,
  ProviderState,
  ProviderStatus,
} from "../types";
import type { ProviderConfig } from "./config";

const MAX_CONSECUTIVE_FAILURES = 3;

/** Strip trailing slashes so concatenation with /chat/completions is always correct. */
function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export class OpenAICompatibleProvider implements NarrativeProvider {
  readonly id = "openai-compat";

  private state: ProviderState = "uninitialized";
  private consecutiveFailures = 0;
  private lastHealthCheck = 0;
  private lastError?: string;

  constructor(private config: ProviderConfig) {}

  async initialize(): Promise<void> {
    this.state = "initializing";
    try {
      // Validate config has required fields
      if (!this.config.apiKey) {
        throw new Error("API key is required");
      }
      if (!this.config.baseUrl) {
        throw new Error("Base URL is required");
      }

      // Quick connectivity check — send a minimal request
      // We don't fail initialization on network errors; the provider starts
      // in "ready" and will degrade on first actual failure.
      this.state = "ready";
      this.lastHealthCheck = Date.now();
    } catch (err) {
      this.state = "failed";
      this.lastError = err instanceof Error ? err.message : String(err);
      throw err;
    }
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
      configRedacted: {
        baseUrl: this.config.baseUrl,
        model: this.config.model,
      },
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Minimal request to verify connectivity
      const response = await fetch(`${normalizeBaseUrl(this.config.baseUrl)}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 1,
        }),
      });

      this.lastHealthCheck = Date.now();

      if (response.ok) {
        this.consecutiveFailures = 0;
        if (this.state === "degraded" || this.state === "failed") {
          this.state = "ready";
        }
        return true;
      }

      this.recordFailure(`Health check failed: ${response.status}`);
      return false;
    } catch (err) {
      this.recordFailure(
        `Health check error: ${err instanceof Error ? err.message : String(err)}`
      );
      return false;
    }
  }

  async call(
    _request: NarrativeRequest,
    systemPrompt: string,
    userPrompt: string
  ): Promise<ProviderRawResponse> {
    if (this.state === "disposed") {
      throw new Error("Provider is disposed");
    }

    // Prompt is already built by engine via prompts.ts — just forward to API
    const start = Date.now();

    // 12-second timeout to prevent indefinite hangs; the engine will
    // fall back to passthrough on timeout errors.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    let response: Response;
    try {
      response = await fetch(`${normalizeBaseUrl(this.config.baseUrl)}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      this.recordFailure(err instanceof Error ? err.message : String(err));
      if ((err as Error).name === "AbortError") {
        throw new Error("AI request timed out after 12 seconds");
      }
      throw err;
    }
    clearTimeout(timeout);

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      this.recordFailure(`API error ${response.status}: ${body.slice(0, 200)}`);
      throw new Error(`AI request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";

    if (!text) {
      this.recordFailure("Empty response from AI");
      throw new Error("AI returned empty response");
    }

    // Success — reset failure counter
    this.consecutiveFailures = 0;
    if (this.state === "degraded") {
      this.state = "ready";
    }
    this.lastHealthCheck = Date.now();

    return {
      text,
      model: this.config.model,
      latencyMs,
      promptTokenCount: data.usage?.prompt_tokens,
      completionTokenCount: data.usage?.completion_tokens,
    };
  }

  // ─── Internal ──────────────────────────────────────────────────────

  private recordFailure(error: string): void {
    this.consecutiveFailures++;
    this.lastError = error;
    if (this.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      this.state = "failed";
    } else {
      this.state = "degraded";
    }
  }
}
