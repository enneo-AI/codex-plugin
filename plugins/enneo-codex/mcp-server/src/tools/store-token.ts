import { loadEnv, updateEnv, normalizeInstance } from "../storage.js";
import { text, type Tool } from "./index.js";

function jwtExp(token: string): number | undefined {
  const parts = token.split(".");
  if (parts.length !== 3) return undefined;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return typeof payload.exp === "number" ? payload.exp : undefined;
  } catch {
    return undefined;
  }
}

function mask(token: string): string {
  if (token.length <= 12) return "<stored>";
  return `${token.slice(0, 4)}...${token.slice(-8)}`;
}

export const storeToken: Tool = {
  name: "enneo_store_token",
  description:
    "Store an Enneo API key/JWT only when the user explicitly asks to supply it through this tool. Prefer user entry in ~/.enneo/env so the secret stays out of chat and tool arguments. Never prints the full token back.",
  inputSchema: {
    type: "object",
    properties: {
      token: {
        type: "string",
        description: "The Enneo API key/JWT copied from the Profile Settings Login section.",
      },
      instance: {
        type: "string",
        description: "Optional Enneo instance hostname, e.g. demo.enneo.ai. Uses the configured instance when omitted.",
      },
      expiresAt: {
        type: "integer",
        description: "Optional token expiry as epoch seconds. If omitted, JWT exp is decoded when present.",
      },
    },
    required: ["token"],
  },
  handler: async (args) => {
    const token = String(args.token ?? "").trim();
    if (!token) throw new Error("Missing token.");

    const current = await loadEnv();
    const rawInstance = args.instance ? String(args.instance) : current.instance;
    const instance = rawInstance ? normalizeInstance(rawInstance) : undefined;
    if (!instance) {
      throw new Error("No Enneo instance configured. Run enneo_configure first or pass instance.");
    }
    if (!/^[a-z0-9.-]+$/i.test(instance)) {
      throw new Error(`Invalid instance hostname: ${instance}`);
    }

    const expires_at =
      typeof args.expiresAt === "number" ? args.expiresAt : jwtExp(token);
    await updateEnv({ instance, access_token: token, expires_at });
    return text(
      `Stored Enneo API key for ${instance} at ~/.enneo/env (mode 600). Token: ${mask(token)}${
        expires_at ? `, expiresAt: ${expires_at}` : ""
      }`,
    );
  },
};
