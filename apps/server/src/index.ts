import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from project root first, then fallback to local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.resolve(__dirname, "../../../.env");
dotenv.config({ path: rootEnv });
dotenv.config(); // fallback: apps/server/.env

import express from "express";
import { initDb } from "./db/client.js";
import { runMigrations } from "./db/migrate.js";
import authRoutes from "./routes/auth.js";
import keysRoutes from "./routes/keys.js";
import aiProxyRoutes from "./routes/ai-proxy.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

// Middleware
app.use(express.json({ limit: "1mb" }));

// CORS (dev)
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/keys", keysRoutes);
app.use("/api/ai", aiProxyRoutes);

// Global error handler — prevent stack trace leakage
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Server] Unhandled error:", err.message || err);
  res.status(500).json({ error: "Internal server error" });
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Init and start
async function main() {
  await initDb();
  runMigrations();

  app.listen(PORT, () => {
    console.log(`[StoryCraft Server] Running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
