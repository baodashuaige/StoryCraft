import jwt from "jsonwebtoken";
import type express from "express";
import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, "../../../.env");

let _secret: string | null = null;

const JWT_SECRET = (): string => {
  if (_secret) return _secret;

  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) {
    _secret = secret;
    return secret;
  }

  // Auto-generate and persist
  const generated = randomBytes(32).toString("hex");
  console.log(`[Auth] JWT_SECRET not set. Auto-generating and saving to .env`);

  let envContent = "";
  if (fs.existsSync(ENV_PATH)) {
    envContent = fs.readFileSync(ENV_PATH, "utf-8");
  }
  envContent = envContent.replace(/^JWT_SECRET=.*\n?/m, "");
  if (!envContent.endsWith("\n") && envContent.length > 0) envContent += "\n";
  envContent += `JWT_SECRET=${generated}\n`;
  fs.writeFileSync(ENV_PATH, envContent, "utf-8");

  process.env.JWT_SECRET = generated;
  _secret = generated;
  return generated;
};

export interface AuthPayload {
  userId: string;
  username: string;
  role: "host" | "player";
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET(), { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET()) as AuthPayload;
}

/** Require auth — rejects if no valid token */
export function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing token" });
    return;
  }
  try {
    const payload = verifyToken(header.slice(7));
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/** Optional auth — extracts user if token present, but doesn't reject */
export function optionalAuth(req: express.Request, _res: express.Response, next: express.NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = verifyToken(header.slice(7));
      (req as any).user = payload;
    } catch { /* invalid token — treat as guest */ }
  }
  next();
}
