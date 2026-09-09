# @enneo/mcp-server

MCP server bundled with the Enneo Codex plugin. Exposes Enneo platform tools using an existing profile API key/JWT.

## Architecture

- **Local stdio MCP server** — Codex spawns the bundled server and talks to it over stdio
- **Profile API key/JWT auth** — users enter an existing key locally; create one in Profile Settings (Login → API keys) only if no usable key is available. No OAuth or automatic renewal.
- **Token cache** — stored in `~/.enneo/env`, a shell-sourceable file (mode 600). This is deliberately the same file the plugin's skills reference for ad-hoc curl, so the MCP server and raw shell usage share one source of truth. Format:
  ```
  export ENNEO_INSTANCE="demo.enneo.ai"
  export ENNEO_TOKEN="..."
  ```
  `ENNEO_TOKEN_EXPIRES_AT` is optional metadata; omit it for non-expiring keys. The API checks expiry and revocation.

## Setup

1. Install the plugin (`.mcp.json` launches `mcp-server/bundle/index.js`).
2. Run `enneo_configure` with the requested hostname without `reset`, then `enneo_profile_me` to reuse its existing key.
3. If no key exists, the user enters an existing key for that instance into `~/.enneo/env` using their local editor (directory mode `700`, file mode `600`). Keep the secret out of chat, tool arguments and shell history.
4. Only if no usable key is available, the user creates a named key in Profile Settings → Login → API keys and saves it directly to the local file.
5. Run `enneo_profile_me` again after saving; no restart is needed.

`enneo_store_token` remains available for explicit user-requested entry through that tool. See the [plugin setup instructions](../README.md#auth), including migration of an existing legacy key without reissuance.

## Auth Flow

1. Each request loads the instance and key together from `~/.enneo/env`.
2. A stored key is sent as `Authorization: Bearer ...`; repeated calls reuse it.
3. A missing instance or key returns local setup instructions without making an HTTP request.
4. Expiry, revocation and permission failures come from the API; the server never mints or renews keys automatically.

There is one active instance/key. Selecting the same instance preserves it. Switching instances or `reset: true` clears the key and expiry in the shared file without revoking the remote key. There is no native per-instance key cache.

## Tools

Current bundle exposes five native tools:
- `enneo_configure` — set the instance URL (first-time setup)
- `enneo_store_token` — store a key only when the user explicitly requests entry through the tool
- `enneo_profile_me` — fetch current user profile
- `enneo_ticket_get` — fetch a ticket by ID
- `enneo_ticket_search` — search tickets with filters

More tools will be added, matching the capabilities documented in the plugin's skills.

## Development

```bash
cd mcp-server
npm install          # `prepare` rebuilds the bundle for you
npm run bundle       # tsc -> dist/, then esbuild -> bundle/index.js
npm test             # rebuilds, then checks dist and an isolated copy of the shipped bundle
npm start            # runs on stdio — for manual testing, use an MCP client
```

`dist/` is a build intermediate and is gitignored. **`bundle/index.js` is the shipped
artifact and must be committed** — commit it whenever `src/` or a dependency changes.
`npm install` regenerates it, so a stale bundle shows up in `git status`.

## Distribution

The Codex plugin ships a bundled `mcp-server/bundle/index.js` so customer installations do
not need `npm install`. A plugin install is a plain checkout with no install step, so the
server cannot rely on `node_modules/` existing at runtime — everything it imports
(`@modelcontextprotocol/sdk`, `zod`) is inlined into the bundle by esbuild. That is also why
`.mcp.json` must never point at `dist/`.
