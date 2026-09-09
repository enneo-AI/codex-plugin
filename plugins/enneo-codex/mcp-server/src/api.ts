import { loadEnv } from "./storage.js";

interface ApiOptions {
  method?: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

export async function enneoApi<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { instance, access_token: token } = await loadEnv();
  if (!instance) {
    throw new Error(
      "Enneo instance not configured. Call the `enneo_configure` tool first with e.g. {\"instance\": \"demo.enneo.ai\"}.",
    );
  }
  if (!/^[a-z0-9.-]+$/.test(instance)) {
    throw new Error("Invalid instance hostname in ~/.enneo/env. Run enneo_configure with the intended hostname.");
  }
  if (!token) {
    throw new Error(
      "Enneo API key is missing. Add an existing key for " +
        instance +
        " to ENNEO_TOKEN in ~/.enneo/env using your local editor (mode 600), then retry. " +
        "If you have no usable key, create one at https://" + instance +
        "/settings/profile under Login > API keys. Keep the key out of chat and tool arguments.",
    );
  }

  const url = new URL(`https://${instance}/api/mind${path}`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  const init: RequestInit = { method: opts.method ?? "GET", headers };
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${init.method} ${path} -> ${res.status}: ${text.slice(0, 500)}`);
  }
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}
