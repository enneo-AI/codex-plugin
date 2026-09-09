---
name: browser-jwt
description: Reuse, set up, list or revoke an Enneo API key (JWT). Native tools and REST calls share one active instance in ~/.enneo/env.
---

# Enneo API Key

## Trigger

Use when:
- The user needs to connect to an Enneo instance or switch the active instance.
- An Enneo API call returns `401` / `403`, or the cached token is expired, revoked or missing.
- The user wants to list or withdraw the keys on their account.
- User phrases: "unauthorized", "token expired", "refresh jwt", "new api key", "how do I auth to `<instance>`".

## Prerequisites

1. **Codex** with this plugin loaded.
2. An existing API key for the target instance, or browser access to Profile Settings to create one if needed.

## What an Enneo API key is

A signed JWT whose payload carries `userId` and a per-token `jti`. Enneo keeps only a **hash** of it plus the last 6 characters, so:

- The full key is shown **exactly once**, at creation. It cannot be read back — a lost key is replaced, not recovered.
- Keys minted from the profile page expire after **1 year**. Some machine-issued keys carry no `exp` claim at all, so **never assume the payload has one**.
- Withdrawing a key takes effect immediately; every call with it fails from that moment.
- Keys are named, so a name that says where the key lives ("laptop — Codex") is worth asking for.

## Storage and reuse

Native MCP tools and REST examples read the same `~/.enneo/env` file (mode `600`):

```bash
export ENNEO_INSTANCE="demo.enneo.ai"
export ENNEO_TOKEN="<existing-api-key>"
```

There is **one active instance and key**, shared with other Enneo plugins using this file. The server reads it on each request and reuses the key across calls and restarts. It does not open a browser, perform OAuth, mint keys, or renew them automatically.

`ENNEO_TOKEN_EXPIRES_AT` is optional metadata in epoch seconds. Omit it when the key has no `exp`; remove any previous value when replacing such a key. The API checks expiry and revocation. Do not invent a future expiry or replace a working key proactively.

Never read the full file or key into assistant output. Show connection status using `enneo_profile_me`. Use `enneo_store_token` only when the user explicitly chooses to supply a secret through that tool; manual local entry is the primary setup path.

## Flow

1. Resolve the instance hostname from the user's request, then call `enneo_configure` without `reset`. Selecting the same instance preserves its stored key.
2. Call `enneo_profile_me` to reuse and verify the key already in `~/.enneo/env`. A successful call completes setup; do not ask for another key.
3. If the key is missing, ask the user to add an **existing key for that instance** to `~/.enneo/env` using their local editor, with the format above. The directory should have mode `700` and the file mode `600`. Keep the secret out of chat, assistant tool arguments, and shell history.
4. Only if no usable key is available, ask the user to open `https://<instance>/settings/profile`, then **Login → API keys**, and create a named key. They copy the value directly into their local file. If they are signed out, they sign in themselves. A missing create button may mean the `createApiToken` permission is unavailable; an administrator can issue the key instead.
5. After the user saves the file, call `enneo_profile_me` again. No restart is needed.

If a previous installation stored a usable key in `~/.enneo/browser-tokens.json`, the user can copy the matching origin's key into `~/.enneo/env` once with their local editor. Do not read that legacy file into the assistant or make the user issue a replacement solely to migrate it.

Selecting a different instance or passing `reset: true` clears the key and expiry from `~/.enneo/env`; it does not revoke the key in Enneo. Re-add an existing key for the selected instance locally. There is no native per-instance key cache. Never send a key belonging to another instance.

For REST calls, load the same file without printing its contents:

```bash
. ~/.enneo/env
curl -s "https://${ENNEO_INSTANCE}/api/mind/profile" -H "Authorization: Bearer ${ENNEO_TOKEN}"
```

## Managing keys over the API

Once a working token exists, the whole key lifecycle is reachable without the UI. `{profileId}` is the numeric profile id — your own, or someone else's with `updateSpecificProfile` (plus `manageServiceWorkers` when the target is a service-worker profile).

```bash
. ~/.enneo/env
BASE="https://${ENNEO_INSTANCE}/api/mind"
AUTH="Authorization: Bearer ${ENNEO_TOKEN}"

# List the keys on a profile — the key itself is never returned, only its last characters
curl -s "${BASE}/jwt/{profileId}/keys" -H "${AUTH}" \
  | jq '.keys[] | {id, name, tokenSuffix, createdAt, expiresAt, lastUsedAt, revokedAt, revokedBy, issuedBy}'

# Mint a named key (REQUIRES CONFIRMATION; USER RUNS LOCALLY) — output contains the secret
curl -s -X POST "${BASE}/jwt/{profileId}" \
  -H "${AUTH}" -H "Content-Type: application/json" \
  -d '{"name": "laptop — Codex"}' | jq -r '.token'

# Withdraw a key (REQUIRES CONFIRMATION) — effective immediately
curl -s -X DELETE "${BASE}/jwt/{profileId}/keys/{keyId}" -H "${AUTH}"
```

The create command above is for the user to run locally; do not run it through assistant tools, because it prints the new secret.

`lastUsedAt` and `revokedAt` are the two fields worth reading when debugging a `401`: a key that was never used points at a copy/paste error, one with `revokedAt` set was withdrawn.

## Acting on someone's behalf

Enneo honours `X-Enneo-On-Behalf-Of: {profileId}` on its API. Mind evaluates the request's permissions as that person; auth records them against the key. It grants nothing on its own — a caller naming a profile gains no access it did not already have — but it keeps a machine account's calls attributable instead of anonymous. Set it whenever a key issued for automation acts for a specific human.

## Edge cases

- **Switching accounts.** Replace the active key locally and verify the new profile. The previous key remains valid until revoked or expired.
- **Not signed in.** The user cannot reach Profile Settings without signing in — ask them to sign in first. Do not retry automatically.
- **`401`.** Confirm the intended instance and key were selected. If it is expired or revoked, the user can choose another existing valid key or create a replacement. Do not retry or mint keys automatically; use the UI to inspect keys if API authentication no longer works.
- **`403` where `401` was expected.** The token is valid but the profile lacks the permission for that endpoint — a different failure, and re-minting will not fix it.
