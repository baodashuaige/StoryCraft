import { Router } from "express";
import { randomUUID } from "crypto";
import { getDb, saveDb } from "../db/client.js";
import { encrypt, decrypt } from "../crypto.js";
import { authMiddleware, optionalAuth, type AuthPayload } from "../middleware/auth.js";

const router = Router();

/** Helper: query first row from sql.js */
function queryFirst(sql: string, params: any[]): Record<string, any> | null {
  const db = getDb();
  const result = db.exec(sql, params);
  if (result.length === 0 || result[0].values.length === 0) return null;
  const cols = result[0].columns;
  const vals = result[0].values[0];
  const obj: Record<string, any> = {};
  cols.forEach((c: string, i: number) => { obj[c] = vals[i]; });
  return obj;
}

// GET /api/keys — guest sees host key; logged-in sees own > host
router.get("/", optionalAuth, (_req, res) => {
  const user = (_req as any).user as AuthPayload | undefined;

  // Logged-in: try own key first
  if (user) {
    const own = queryFirst("SELECT base_url, model, provider FROM api_keys WHERE user_id = ? AND is_host = 0", [user.userId]);
    if (own) {
      res.json({ source: "custom", baseUrl: own.base_url, model: own.model, provider: own.provider });
      return;
    }
  }

  // Guest or fallback: host key
  const host = queryFirst("SELECT base_url, model, provider FROM api_keys WHERE is_host = 1 LIMIT 1", []);
  if (host) {
    res.json({ source: "host", baseUrl: host.base_url, model: host.model, provider: host.provider });
    return;
  }

  res.json(null);
});

// POST /api/keys — save key (auth required)
router.post("/", authMiddleware, (req, res) => {
  try {
    const user = (req as any).user as AuthPayload;
    const { apiKey, baseUrl, model, provider } = req.body;
    if (!apiKey || !baseUrl || !model) {
      res.status(400).json({ error: "apiKey, baseUrl, model required" });
      return;
    }

    const db = getDb();
    // Verify role from DB, not JWT
    const userRow = queryFirst("SELECT role FROM users WHERE id = ?", [user.userId]);
    const isHost = userRow?.role === "host" ? 1 : 0;
    const encryptedKey = encrypt(apiKey);

    const existing = queryFirst("SELECT id FROM api_keys WHERE user_id = ? AND is_host = ?", [user.userId, isHost]);
    if (existing) {
      db.run("UPDATE api_keys SET api_key = ?, base_url = ?, model = ?, provider = ? WHERE user_id = ? AND is_host = ?",
        [encryptedKey, baseUrl, model, provider || "deepseek", user.userId, isHost]);
    } else {
      db.run("INSERT INTO api_keys (id, user_id, provider, api_key, base_url, model, is_host) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [randomUUID(), user.userId, provider || "deepseek", encryptedKey, baseUrl, model, isHost]);
    }
    saveDb();

    res.json({ ok: true });
  } catch (err: any) {
    console.error("[POST /api/keys] Error:", err.message || err);
    res.status(500).json({ error: err.message || "Failed to save key" });
  }
});

// DELETE /api/keys — remove own key (auth required)
router.delete("/", authMiddleware, (req, res) => {
  const user = (req as any).user as AuthPayload;
  const db = getDb();
  db.run("DELETE FROM api_keys WHERE user_id = ? AND is_host = 0", [user.userId]);
  saveDb();
  res.json({ ok: true });
});

// POST /api/keys/test — guest tests host key; logged-in tests own > host
router.post("/test", optionalAuth, async (_req, res) => {
  const user = (_req as any).user as AuthPayload | undefined;

  let row: Record<string, any> | null = null;
  if (user) {
    row = queryFirst("SELECT api_key, base_url, model FROM api_keys WHERE user_id = ? AND is_host = 0", [user.userId]);
  }
  if (!row) {
    row = queryFirst("SELECT api_key, base_url, model FROM api_keys WHERE is_host = 1 LIMIT 1", []);
  }
  if (!row) {
    res.status(400).json({ ok: false, error: "No API key configured" });
    return;
  }

  const apiKey = decrypt(row.api_key as string);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(`${row.base_url}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: row.model, messages: [{ role: "user", content: "ping" }], max_tokens: 5 }),
      signal: controller.signal,
    });
    if (response.ok) {
      res.json({ ok: true, model: row.model });
    } else {
      // Don't expose upstream error details to client
      console.error(`[Key Test] Upstream ${response.status}`);
      res.json({ ok: false, error: `API returned ${response.status}` });
    }
  } catch (err: any) {
    res.json({ ok: false, error: "Connection failed" });
  } finally {
    clearTimeout(timeout);
  }
});

export default router;
