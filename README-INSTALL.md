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

Flow:

1. Run `enneo_configure` with the instance hostname.
2. Open `https://<instance>.enneo.ai/settings/profile`.
3. Open **API keys** from the **Login** section, create a named key, and copy it. Enneo shows the value only once.
4. Ask Codex to store it for the Enneo Codex plugin. Codex will use `enneo_store_token`.
5. Run `enneo_profile_me` to verify the connection.

Tokens are stored in `~/.enneo/env` with mode `600`. Never paste or print a token after setup.
