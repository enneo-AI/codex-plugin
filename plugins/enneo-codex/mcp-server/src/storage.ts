import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Unified credential store at ~/.enneo/env — a shell-sourceable file shared
 * by the MCP server and ad-hoc bash/curl usage. One source of truth.
 *
 * Format:
 *   export ENNEO_INSTANCE="demo.enneo.ai"
 *   export ENNEO_TOKEN="..."
 *   export ENNEO_TOKEN_EXPIRES_AT="1234567890"   # epoch seconds
 *
 * Users can `. ~/.enneo/env` in any shell; skills' curl examples use this.
 */

export const ENNEO_DIR = join(homedir(), ".enneo");
export const ENV_FILE = join(ENNEO_DIR, "env");

export interface EnneoEnv {
  instance?: string;
  access_token?: string;
  expires_at?: number; // epoch seconds
}

const KEY_MAP = {
  instance: "ENNEO_INSTANCE",
  access_token: "ENNEO_TOKEN",
  expires_at: "ENNEO_TOKEN_EXPIRES_AT",
} as const;

export function normalizeInstance(instance: string): string {
  return instance.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "").toLowerCase();
}

export async function loadEnv(): Promise<EnneoEnv> {
  let raw: string;
  try {
    raw = await fs.readFile(ENV_FILE, "utf8");
  } catch (err: any) {
    if (err.code === "ENOENT") return {};
    throw err;
  }
  const values: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    // Match:  export KEY="value"   or   KEY="value"   or   KEY=value
    const m = line.match(/^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*))\s*$/);
    if (!m) continue;
    const key = m[1];
    const value = m[2] ?? m[3] ?? m[4] ?? "";
    values[key] = value;
  }
  const env: EnneoEnv = {
    instance: normalizeInstance(values[KEY_MAP.instance] ?? "") || undefined,
    access_token: values[KEY_MAP.access_token] || undefined,
  };
  const exp = values[KEY_MAP.expires_at];
  if (exp) env.expires_at = Number(exp);
  return env;
}

export async function saveEnv(env: EnneoEnv): Promise<void> {
  await fs.mkdir(ENNEO_DIR, { recursive: true, mode: 0o700 });
  const lines: string[] = [];
  if (env.instance) lines.push(`export ${KEY_MAP.instance}="${shellEscape(env.instance)}"`);
  if (env.access_token) lines.push(`export ${KEY_MAP.access_token}="${shellEscape(env.access_token)}"`);
  if (env.expires_at) lines.push(`export ${KEY_MAP.expires_at}="${env.expires_at}"`);
  const content = lines.join("\n") + "\n";

  const tmp = `${ENV_FILE}.tmp-${randomUUID()}`;
  try {
    await fs.writeFile(tmp, content, { mode: 0o600 });
    await fs.rename(tmp, ENV_FILE);
  } finally {
    await fs.rm(tmp, { force: true });
  }
}

export async function updateEnv(patch: Partial<EnneoEnv>): Promise<EnneoEnv> {
  const current = await loadEnv();
  const merged = { ...current, ...patch };
  await saveEnv(merged);
  return merged;
}

function shellEscape(value: string): string {
  // We wrap in double quotes — escape the chars that are special inside "..."
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/`/g, "\\`");
}
