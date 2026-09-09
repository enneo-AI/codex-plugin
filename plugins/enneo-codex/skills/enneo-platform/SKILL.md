---
name: enneo-platform
description: Use when working with an Enneo instance in Codex, including setup, auth, tickets, AI agents, customers, events, settings, reports, telephony, templates, tags, users, tools, UDFs, and troubleshooting.
---

# Enneo Platform In Codex

Use this skill whenever the user wants Codex to work with an Enneo instance.

## First Choice: MCP Tools

Prefer the bundled Enneo MCP tools whenever they cover the task:

| Tool | Purpose |
|------|---------|
| `enneo_configure` | Select the instance hostname, e.g. `demo.enneo.ai`. |
| `enneo_store_token` | Store a key only when the user explicitly chooses to provide it through this tool. |
| `enneo_profile_me` | Verify the current user/profile. |
| `enneo_ticket_search` | Search tickets with filters. |
| `enneo_ticket_get` | Fetch full ticket data. |

Authentication uses an existing profile API key/JWT in `~/.enneo/env`. Configure the requested instance without `reset`, then call `enneo_profile_me` to reuse the stored key. A successful call completes setup. There is no OAuth flow or automatic key renewal.

`enneo_ticket_get` sends neither `includeCustomer` nor `includeIntents`, so its result omits both regardless of what its description says — fall back to curl when you need them.

## REST Fallback

For all areas not yet wrapped as MCP tools, use the matching skill in this plugin and call the Enneo REST API with the token from `~/.enneo/env`:

```bash
. ~/.enneo/env
BASE="https://${ENNEO_INSTANCE}/api/mind"
AUTH="Authorization: Bearer ${ENNEO_TOKEN}"
```

If you need an endpoint not documented in the skills, inspect the live OpenAPI spec. Mind's is public; the other services' are not:

```bash
# Mind — public, no auth, YAML
curl -s "https://${ENNEO_INSTANCE}/api/mind/docs/open-api"

# Cortex — JSON
curl -s "https://${ENNEO_INSTANCE}/api/cortex/openapi.json" -H "${AUTH}"

# Auth — Swagger UI HTML, behind a session
curl -s "https://${ENNEO_INSTANCE}/api/auth/docs" -H "${AUTH}"
```

Mind's published spec lags the code in places — where they disagree, the running API is what the code says, not what the YAML says.

## API Key Setup

Use the `browser-jwt` skill for setup and key lifecycle details. Reuse the key already in `~/.enneo/env` before requesting any setup action.

If it is missing, the user enters an existing key for the target instance in their **local editor**, keeping the secret out of chat and assistant tool arguments:

```bash
export ENNEO_INSTANCE="<instance-hostname>"
export ENNEO_TOKEN="<existing-api-key>"
```

The directory should have mode `700` and the file mode `600`. The user can prepare it locally with `mkdir -p ~/.enneo && chmod 700 ~/.enneo`, edit the file, then run `chmod 600 ~/.enneo/env`. `ENNEO_TOKEN_EXPIRES_AT` is optional; omit it for a key without an expiry, including any old value from a previous key.

Only if no usable key exists should the user create a named key at `https://<instance>/settings/profile` under **Login → API keys** and save it directly into the local file. The value is shown once. Verify with `enneo_profile_me` after saving; no restart is needed. `enneo_store_token` remains available if the user explicitly asks to supply the secret through that tool.

There is one active instance/key, shared by native tools, REST examples and other Enneo plugins using `~/.enneo/env`. Configuring the same hostname preserves it. Switching the hostname or using `reset: true` clears the local key and expiry without revoking it in Enneo. Reuse an existing key for the selected instance; there is no native per-instance cache.

Never display the token or read the full credential file into assistant output. Show connection status using `enneo_profile_me` and its profile id. The `browser-jwt` skill also covers migrating an existing key from the legacy `browser-tokens.json` file without reissuing it.

## Safety

- Read-only operations are OK without extra confirmation.
- Before POST, PATCH, PUT, or DELETE, explain the exact change and ask for explicit confirmation.
- Summarize customer data instead of dumping raw PII unless the user asks for raw data.
- For `401`, check that the intended instance and key are selected. An expired or revoked key needs another valid key, chosen or created by the user; do not mint one automatically. A `403` indicates a permission or feature restriction; reissuing a key will not help.
- `X-Enneo-On-Behalf-Of: {profileId}` names the human a machine account is acting for. Mind evaluates permissions as that person and auth records them against the key; it grants nothing on its own.

## Routing

Use the specific skill for the requested area:

| Skill | Use for |
|-------|---------|
| `tickets` | Ticket search, conversations, replies, status changes |
| `ai-agents` | AI agent creation, rule-based agents, testing, response cases |
| `customers` | Customers, contracts, legitimation, customer history |
| `events` | Event traces and processing pipeline debugging |
| `knowledge` | Knowledge base articles, file and website connectors |
| `settings-config` | Settings, subchannels, UDFs, event hooks, feature flags |
| `reports` | Metrics, KPIs, AI performance, telephony reports |
| `exports` | Ticket/message/worklog/survey exports |
| `quality` | Quality management, scorecards, live coach |
| `tags` | Tag trees and tag detection |
| `templates` | Response templates |
| `users` | Users, teams, roles, routing status, absences |
| `telephony` | Lines, voicebots, queues, call metrics |
| `tools` | AI tools, UDFs, custom tool execution |
| `troubleshooting` | Step-by-step debugging |
| `browser-jwt` | Minting, listing and withdrawing API keys |
