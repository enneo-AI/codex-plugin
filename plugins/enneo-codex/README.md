# Enneo Codex Plugin

Connect Codex to your Enneo customer-service platform. Investigate tickets, manage AI agents, debug processing pipelines, query reports, and administer Enneo instances through natural language.

This is the Codex Marketplace variant of Enneo's Claude Code plugin.

## Prerequisites

- Codex installed
- Access to an Enneo instance, for example `yourcompany.enneo.ai`
- A browser where you can sign in to that Enneo instance
- Node.js 18 or newer

## Installation

```bash
codex plugin marketplace add https://github.com/enneo-AI/codex-plugin
codex plugin add enneo-codex@enneo
```

Restart Codex after installing or updating the plugin.

## First Use

Ask Codex:

```text
Use the Enneo Codex plugin. Connect to <instance>.enneo.ai and show my profile.
```

The bundled MCP server exposes native tools for:

- configuring the target Enneo instance
- verifying the current profile
- searching tickets
- fetching full ticket data

The broader platform coverage is provided by Codex skills and REST examples for tickets, AI agents, customers, events, knowledge, quality, reports, settings, tags, telephony, templates, users, tools, exports, and troubleshooting.

## Auth

Flow:

1. Run `enneo_configure` with the instance hostname.
2. Open `https://<instance>/settings/profile`.
3. Copy the API key from the Login section.
4. Ask Codex to store it for the Enneo Codex plugin. Codex will use `enneo_store_token`.
5. Run `enneo_profile_me` to verify the connection.

Credentials are stored in `~/.enneo/env` with mode `600`. Tokens must not be printed or pasted into normal chat after setup.

## Usage Examples

```text
Search open tickets from the last 24 hours.
```

```text
Why did the AI agent not process ticket #12345?
```

```text
Create a rule-based agent for return requests.
```

```text
Show the event trace for ticket #12345.
```

## Security

- Tokens are stored locally in `~/.enneo/env` with owner-only permissions.
- The plugin never asks for an Enneo password.
- Read-only operations are safe to run directly.
- Write operations such as POST, PATCH, PUT, and DELETE require explicit confirmation.
- Customer data should be summarized by default unless raw data is explicitly needed.

## License

Proprietary. Use is restricted to authorized customers and partners of Enneo GmbH. See [LICENSE](LICENSE).
