# Enneo Codex Plugin Installation

## Recommended

```bash
codex plugin marketplace add https://github.com/enneo-AI/codex-plugin
codex plugin add enneo-codex@enneo
```

Restart Codex, then ask:

```text
Use the Enneo Codex plugin. Connect to <instance>.enneo.ai and show my profile.
```

## Local ZIP Install

1. Unzip the package to a stable folder.
2. On macOS, double-click `install.command` or run:

```bash
./install.sh
```

## Auth

Run `enneo_configure` for the instance without `reset`, then `enneo_profile_me` to reuse an existing key. If none is stored, enter an existing API key for that instance directly in `~/.enneo/env` using your local editor, with mode `600`. Keep the secret out of chat and assistant tool arguments.

Only create a key in **Profile Settings → Login → API keys** if no usable key is available. The plugin has one active instance/key and never performs OAuth or automatic renewal. See the [full setup, switching and migration instructions](plugins/enneo-codex/README.md#auth).
