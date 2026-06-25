#!/usr/bin/env bash
set -euo pipefail

PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUNDLE="$PLUGIN_ROOT/mcp-server/bundle/index.js"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required for the Enneo MCP server."
  exit 1
fi

if [ ! -f "$BUNDLE" ]; then
  echo "Missing MCP bundle: $BUNDLE"
  echo "Run npm install && npm run bundle in mcp-server, or ask Enneo for a complete plugin package."
  exit 1
fi

mkdir -p "$HOME/.enneo"
chmod 700 "$HOME/.enneo"

if [ -n "${ENNEO_INSTANCE:-}" ] && [ -n "${ENNEO_TOKEN:-}" ]; then
  {
    printf 'export ENNEO_INSTANCE="%s"\n' "$ENNEO_INSTANCE"
    printf 'export ENNEO_TOKEN="%s"\n' "$ENNEO_TOKEN"
    printf 'export ENNEO_TOKEN_EXPIRES_AT="%s"\n' "${ENNEO_TOKEN_EXPIRES_AT:-4102444800}"
  } > "$HOME/.enneo/env"
  chmod 600 "$HOME/.enneo/env"
  echo "Wrote ~/.enneo/env for $ENNEO_INSTANCE"
else
  echo "MCP bundle OK."
  echo "No token written. In Codex, run enneo_configure first or set ENNEO_INSTANCE and ENNEO_TOKEN before this script."
fi

node "$BUNDLE" </dev/null >/dev/null
echo "Enneo Codex setup check passed."
