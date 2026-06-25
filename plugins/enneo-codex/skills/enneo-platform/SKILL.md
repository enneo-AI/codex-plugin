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
| `enneo_store_token` | Store the API key/JWT copied from Enneo Profile Settings. |
| `enneo_profile_me` | Verify the current user/profile. |
| `enneo_ticket_search` | Search tickets with filters. |
| `enneo_ticket_get` | Fetch full ticket data. |

Authentication mirrors the Claude Code plugin: configure the instance, ask the user to copy the API key/JWT from `https://<instance>/settings/profile`, store it with `enneo_store_token`, then verify with `enneo_profile_me`. Credentials are stored in `~/.enneo/env`.

## REST Fallback

For all areas not yet wrapped as MCP tools, use the matching skill in this plugin and call the Enneo REST API with the token from `~/.enneo/env`:

```bash
. ~/.enneo/env
BASE="https://${ENNEO_INSTANCE}/api/mind"
AUTH="Authorization: Bearer ${ENNEO_TOKEN}"
```

If you need an endpoint not documented in the skills, inspect the live OpenAPI spec:

```bash
curl -s "https://${ENNEO_INSTANCE}/api/mind/docs/open-api"
```

Other useful specs:

- Cortex: `/api/cortex/openapi.json`
- Auth: `/api/auth/docs`

## API Key/JWT Setup

Ask the user to open `https://<instance>/settings/profile`, copy the API key from the Login section, and paste it into Codex only for the explicit setup step. Prefer `enneo_store_token`; if the MCP tool is unavailable, store it in `~/.enneo/env` without printing the token:

```bash
mkdir -p ~/.enneo
chmod 700 ~/.enneo
cat > ~/.enneo/env <<'EOF'
export ENNEO_INSTANCE="<instance-hostname>"
export ENNEO_TOKEN="<api-key-or-jwt>"
export ENNEO_TOKEN_EXPIRES_AT="4102444800"
EOF
chmod 600 ~/.enneo/env
```

Never display the token. If you need to show connection status, show only the instance, user id/email from `enneo_profile_me`, and whether a token exists.

## Safety

- Read-only operations are OK without extra confirmation.
- Before POST, PATCH, PUT, or DELETE, explain the exact change and ask for explicit confirmation.
- Summarize customer data instead of dumping raw PII unless the user asks for raw data.
- If an API call returns 401/403, refresh auth before retrying.

## Routing

Use the specific skill for the requested area:

| Skill | Use for |
|-------|---------|
| `tickets` | Ticket search, conversations, replies, status changes |
| `ai-agents` | AI agent creation, rule-based agents, testing, response cases |
| `customers` | Customers, contracts, legitimation, customer history |
| `events` | Event traces and processing pipeline debugging |
| `knowledge` | Knowledge base articles |
| `settings-config` | Settings, subchannels, UDFs, event hooks |
| `reports` | Metrics, KPIs, AI performance, telephony reports |
| `exports` | Ticket/message/worklog/survey exports |
| `quality` | Quality management and scorecards |
| `tags` | Tag trees and tag detection |
| `templates` | Response templates |
| `users` | Users, teams, roles, routing status, absences |
| `telephony` | Lines, voicebots, queues, call metrics |
| `tools` | AI tools, UDFs, custom tool execution |
| `troubleshooting` | Step-by-step debugging |
| `browser-jwt` | Manual browser/API-key token capture |
