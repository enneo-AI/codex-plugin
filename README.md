# Enneo Codex Plugin Marketplace

Codex Marketplace package for Enneo's platform plugin.

## Install

```bash
codex plugin marketplace add https://github.com/enneo-AI/codex-plugin
codex plugin add enneo-codex@enneo
```

Restart Codex, then ask:

```text
Use the Enneo Codex plugin. Connect to <instance>.enneo.ai and show my profile.
```

The plugin itself lives in [`plugins/enneo-codex`](plugins/enneo-codex).

## Local ZIP Install

```bash
./install.sh
```

## Notes For Enneo

- The bundled MCP server is committed at `plugins/enneo-codex/mcp-server/bundle/index.js`.
- Rebuild it with `cd plugins/enneo-codex/mcp-server && npm install && npm run bundle`.
- Auth uses an existing profile API key/JWT in `~/.enneo/env`, shared with the Claude Code plugin. Users enter secrets locally; the same key is reused across calls and restarts. See [setup and migration](plugins/enneo-codex/README.md#auth).
- No OAuth client registration is required for this Codex variant.
