import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ALGO = "aes-256-gcm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, "../../../.env");

let _key: Buffer | null = null;

function getKey(): Buffer {
  if (_key) return _key;

  const hex = process.env.ENCRYPTION_KEY;
  if (hex && hex.length === 64) {
    _key = Buffer.from(hex, "hex");
    return _key;
  }

  // Auto-generate and persist to .env
  const generated = randomBytes(32).toString("hex");
  console.log(`[Crypto] ENCRYPTION_KEY not set. Auto-generating and saving to .env`);

  let envContent = "";
  if (fs.existsSync(ENV_PATH)) {
    envContent = fs.readFileSync(ENV_PATH, "utf-8");
  }
  // Remove old line if present, then append
  envContent = envContent.replace(/^ENCRYPTION_KEY=.*\n?/m, "");
  if (!envContent.endsWith("\n") && envContent.length > 0) envContent += "\n";
  envContent += `ENCRYPTION_KEY=${generated}\n`;
  fs.writeFileSync(ENV_PATH, envContent, "utf-8");

  process.env.ENCRYPTION_KEY = generated;
  _key = Buffer.from(generated, "hex");
  return _key;
}

export function encrypt(text: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    iv: iv.toString("hex"),
    data: encrypted.toString("hex"),
    tag: tag.toString("hex"),
  });
}

export function decrypt(json: string): string {
  const { iv, data, tag } = JSON.parse(json);
  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(tag, "hex"));
  return decipher.update(Buffer.from(data, "hex"), undefined, "utf8") + decipher.final("utf8");
}
