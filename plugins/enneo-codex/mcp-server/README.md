# @enneo/mcp-server

MCP server bundled with the Enneo Codex plugin. Exposes Enneo platform tools with API-key/JWT-authenticated access, matching Enneo's Claude Code plugin flow.

## Architecture

- **Local stdio MCP server** — Codex spawns the bundled server and talks to it over stdio
- **Profile API key/JWT auth** — users copy the API key from Enneo Profile Settings and Codex stores it via `enneo_store_token`
- **Token cache** — stored in `~/.enneo/env`, a shell-sourceable file (mode 600). This is deliberately the same file the plugin's skills reference for ad-hoc curl, so the MCP server and raw shell usage share one source of truth. Format:
  ```
  export ENNEO_INSTANCE="demo.enneo.ai"
  export ENNEO_TOKEN="..."
  export ENNEO_TOKEN_EXPIRES_AT="1234567890"
  ```

## Setup

Users configure the plugin once, then all tool calls Just Work:

1. Install the plugin (adds `.mcp.json` pointing at `mcp-server/bundle/index.js`)
2. Run `enneo_configure` with the instance URL (e.g. `demo.enneo.ai`)
3. Open `https://<instance>/settings/profile` and copy the API key from the Login section
4. Run `enneo_store_token` with the copied API key/JWT
5. Run `enneo_profile_me` to verify identity

## Auth Flow

1. Tool call comes in → server loads `~/.enneo/env`
2. If `ENNEO_TOKEN` exists for the configured instance → use it as `Authorization: Bearer ...`
3. If no token is stored → return setup instructions pointing to Profile Settings and `enneo_store_token`

## Tools

Current bundle exposes five native tools:
- `enneo_configure` — set the instance URL (first-time setup)
- `enneo_store_token` — store the API key/JWT copied from Enneo Profile Settings
- `enneo_profile_me` — fetch current user profile
- `enneo_ticket_get` — fetch a ticket by ID
- `enneo_ticket_search` — search tickets with filters

More tools will be added, matching the capabilities documented in the plugin's skills.

## Development

```bash
cd mcp-server
npm install
npm run build
npm start   # runs on stdio — for manual testing, use an MCP client
```

## Distribution

The Codex plugin ships a bundled `mcp-server/bundle/index.js` so customer installations do not need `npm install`.
