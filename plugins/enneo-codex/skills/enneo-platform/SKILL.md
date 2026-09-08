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
| `enneo_store_token` | Store the API key/JWT minted in Enneo Profile Settings. |
| `enneo_profile_me` | Verify the current user/profile. |
| `enneo_ticket_search` | Search tickets with filters. |
| `enneo_ticket_get` | Fetch full ticket data. |

Authentication mirrors the Claude Code plugin: configure the instance, ask the user to mint an API key at `https://<instance>/settings/profile`, store it with `enneo_store_token`, then verify with `enneo_profile_me`. Credentials are stored in `~/.enneo/env`.

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

Ask the user to open `https://<instance>/settings/profile`, open **API keys** from the **Login** section, create a named key, and paste it into Codex only for the explicit setup step. Enneo shows the key **once** — afterwards only its last 6 characters are listed, so a key that is lost has to be replaced rather than recovered. Keys minted this way expire after a year.

Prefer `enneo_store_token`; if the MCP tool is unavailable, store it in `~/.enneo/env` without printing the token:

```bash
mkdir -p ~/.enneo
chmod 700 ~/.enneo
cat > ~/.enneo/env <<'EOF'
export ENNEO_INSTANCE="<instance-hostname>"
export ENNEO_TOKEN="<api-key>"
export ENNEO_TOKEN_EXPIRES_AT="<exp claim, or 4102444800 when the key has none>"
EOF
chmod 600 ~/.enneo/env
```

Never display the token. If you need to show connection status, show only the instance, user id/email from `enneo_profile_me`, and whether a token exists. Listing, minting and withdrawing keys over the API is covered by the `browser-jwt` skill.

## Safety

- Read-only operations are OK without extra confirmation.
- Before POST, PATCH, PUT, or DELETE, explain the exact change and ask for explicit confirmation.
- Summarize customer data instead of dumping raw PII unless the user asks for raw data.
- A `401` means the key is expired or was withdrawn — mint a new one. A `403` means the key is fine but the profile lacks that permission, or a feature flag has the endpoint switched off for the instance; re-authenticating will not help.
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
