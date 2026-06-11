/**
 * API client for StoryCraft backend.
 * Handles both guest (no token) and logged-in (JWT) modes.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// ─── Token management ───────────────────────────────────────────────

const TOKEN_KEY = "storycraft_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// ─── Types ──────────────────────────────────────────────────────────

export interface KeyConfig {
  source: "host" | "custom";
  baseUrl: string;
  model: string;
  provider: string;
}

export interface UserInfo {
  id: string;
  username: string;
  role: "host" | "player";
}

export interface AuthResult {
  token: string;
  user: UserInfo;
}

// ─── Fetch helper ───────────────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    if (res.status === 401) clearToken();
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json();
}

// ─── Auth ───────────────────────────────────────────────────────────

export async function register(username: string, password: string): Promise<AuthResult> {
  const result = await apiFetch<AuthResult>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setToken(result.token);
  return result;
}

export async function login(username: string, password: string): Promise<AuthResult> {
  const result = await apiFetch<AuthResult>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setToken(result.token);
  return result;
}

export async function getMe(): Promise<UserInfo> {
  return apiFetch<UserInfo>("/api/auth/me");
}

// ─── Keys ───────────────────────────────────────────────────────────

/** Get effective key config (guest sees host key) */
export async function getKeyConfig(): Promise<KeyConfig | null> {
  return apiFetch<KeyConfig | null>("/api/keys");
}

/** Save own key (requires login) */
export async function saveKeyConfig(config: { apiKey: string; baseUrl: string; model: string }): Promise<void> {
  await apiFetch<{ ok: boolean }>("/api/keys", {
    method: "POST",
    body: JSON.stringify({ ...config, provider: "deepseek" }),
  });
}

/** Delete own key, fall back to host key (requires login) */
export async function deleteKeyConfig(): Promise<void> {
  await apiFetch<{ ok: boolean }>("/api/keys", { method: "DELETE" });
}

/** Test connectivity */
export async function testKeyConfig(): Promise<{ ok: boolean; model?: string; error?: string }> {
  return apiFetch<{ ok: boolean; model?: string; error?: string }>("/api/keys/test", { method: "POST" });
}

// ─── AI proxy ───────────────────────────────────────────────────────

/** Send chat request through backend proxy (no API key on frontend) */
export async function aiChat(body: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  signal?: AbortSignal;
}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return fetch(`${API_BASE}/api/ai/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: body.signal,
  });
}
