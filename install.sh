#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v codex >/dev/null 2>&1; then
  echo "Codex CLI was not found. Install or open Codex first, then run this installer again."
  exit 1
fi

codex plugin marketplace add "$ROOT"
codex plugin add enneo-codex@enneo

"$ROOT/plugins/enneo-codex/scripts/setup-enneo-codex.sh"

echo
echo "Enneo Codex plugin installed."
echo "Restart Codex, then ask: Use the Enneo Codex plugin. Connect to <instance>.enneo.ai and show my profile."
