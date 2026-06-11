import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { getDb, saveDb } from "./client.js";

export function runMigrations(): void {
  const db = getDb();

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id         TEXT PRIMARY KEY,
      username   TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      role       TEXT NOT NULL DEFAULT 'player',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      provider   TEXT NOT NULL DEFAULT 'deepseek',
      api_key    TEXT NOT NULL,
      base_url   TEXT NOT NULL,
      model      TEXT NOT NULL,
      is_host    INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Seed fixed host account: tb / 123456
  const hostResult = db.exec("SELECT id, role FROM users WHERE username = ?", ["tb"]);
  if (hostResult.length === 0 || hostResult[0].values.length === 0) {
    const hostId = randomUUID();
    const hostHash = bcrypt.hashSync("123456", 10);
    // Downgrade all existing host users to player
    db.run("UPDATE users SET role = 'player' WHERE role = 'host'");
    // Remove old host keys
    db.run("DELETE FROM api_keys WHERE is_host = 1");
    db.run("INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)", [
      hostId,
      "tb",
      hostHash,
      "host",
    ]);
    console.log("[DB] Seeded host account: tb / 123456");
  } else {
    // Ensure existing tb user has host role
    const row = hostResult[0].values[0];
    const cols = hostResult[0].columns;
    const existingId = row[cols.indexOf("id")] as string;
    const existingRole = row[cols.indexOf("role")] as string;
    if (existingRole !== "host") {
      db.run("UPDATE users SET role = 'player' WHERE role = 'host'");
      db.run("DELETE FROM api_keys WHERE is_host = 1");
      db.run("UPDATE users SET role = 'host' WHERE id = ?", [existingId]);
      console.log("[DB] Upgraded tb to host role");
    }
  }

  saveDb();
  console.log("[DB] Migrations applied");
}
