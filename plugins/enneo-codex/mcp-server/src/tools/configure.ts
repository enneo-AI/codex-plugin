import { loadEnv, saveEnv, normalizeInstance } from "../storage.js";
import { text, type Tool } from "./index.js";

export const configure: Tool = {
  name: "enneo_configure",
  description:
    "Select the single active Enneo instance in ~/.enneo/env. Selecting the same instance reuses its key; switching instances clears the local key.",
  inputSchema: {
    type: "object",
    properties: {
      instance: {
        type: "string",
        description: "Enneo instance hostname, e.g. `demo.enneo.ai` or `customer.enneo.ai`.",
      },
      reset: {
        type: "boolean",
        description: "If true, clear the key from the shared ~/.enneo/env file. This does not revoke the key in Enneo.",
        default: false,
      },
    },
    required: ["instance"],
  },
  handler: async (args) => {
    if (typeof args.instance !== "string") {
      throw new Error("An Enneo instance hostname is required.");
    }
    const instance = normalizeInstance(args.instance);
    if (!/^[a-z0-9.-]+$/i.test(instance)) {
      throw new Error(`Invalid instance hostname: ${instance}`);
    }
    const current = await loadEnv();
    const instanceChanged = current.instance !== instance;
    const shouldClearToken = args.reset || instanceChanged;
    await saveEnv(shouldClearToken ? { instance } : { ...current, instance });
    const note = instanceChanged
      ? `Active instance: ${instance}; previous local key cleared.`
      : `Instance: ${instance}`;
    return text(
      `Configured. ${note}${args.reset ? " Local key cleared; the key in Enneo was not revoked." : ""}\n` +
      "Credentials are stored at ~/.enneo/env (mode 600), shared with REST usage and other Enneo plugins.\n\n" +
      `Reuse an existing key for ${instance}. If none is stored, add it to ENNEO_TOKEN in ~/.enneo/env using your local editor, then run enneo_profile_me. ` +
      `Only if you have no usable key, create one at https://${instance}/settings/profile under Login > API keys. Keep the key out of chat and tool arguments.`,
    );
  },
};
