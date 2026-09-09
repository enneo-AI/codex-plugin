# Enneo Codex Plugin

Connect Codex to your Enneo customer-service platform. Investigate tickets, manage AI agents, debug processing pipelines, query reports, and administer Enneo instances through natural language.

This is the Codex Marketplace variant of Enneo's Claude Code plugin.

## Prerequisites

- Codex installed
- Access to an Enneo instance, for example `yourcompany.enneo.ai`
- An existing API key, or browser access to Profile Settings to create one
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

Native tools and REST examples reuse one active instance/key from `~/.enneo/env`. There is no OAuth setup or automatic key renewal.

1. Run `enneo_configure` with the instance hostname, without `reset`.
2. Run `enneo_profile_me`. If a working key is already stored, setup is complete.
3. If the key is missing, enter an **existing key for that instance** in `~/.enneo/env` using your local editor:

   ```bash
   export ENNEO_INSTANCE="demo.enneo.ai"
   export ENNEO_TOKEN="<existing-api-key>"
   ```

   Create the directory if needed and set permissions locally: `mkdir -p ~/.enneo && chmod 700 ~/.enneo`, then `chmod 600 ~/.enneo/env` after saving. `ENNEO_TOKEN_EXPIRES_AT` is optional; omit it for a key with no expiry and remove any old expiry value.
4. Only if you have no usable key, open `https://<instance>/settings/profile`, then **Login → API keys**, create a named key, and copy it directly into the local file. Enneo shows the value once.
5. Run `enneo_profile_me` again after saving. No restart is needed.

Keep secrets out of chat, assistant tool arguments and shell history. `enneo_store_token` remains available only if you explicitly choose to provide the key through that tool.

Selecting the same instance preserves its key. Switching instances or using `reset: true` clears the key and expiry in the shared file; it does not revoke the key in Enneo. Re-add an existing key for the selected instance. There is no native per-instance key cache.

If an older installation stored a usable key in `~/.enneo/browser-tokens.json`, copy the matching origin's key into `~/.enneo/env` with your local editor once. A new key is not required solely to migrate it.

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
