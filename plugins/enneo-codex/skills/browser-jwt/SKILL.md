---
name: browser-jwt
description: Obtain or refresh a JWT from a logged-in browser session — required before any curl-based Enneo API call; supports multiple instances.
---

# Enneo Browser JWT

## Trigger

Use when:
- The user wants a JWT for an Enneo instance they are signed into in their browser.
- Juggling tokens for **multiple** Enneo instances.
- An Enneo API call returns `401` / `403`, or the cached token is expired / missing.
- User phrases: "unauthorized", "token expired", "refresh jwt", "new token", "how do I auth to `<instance>`".

## Prerequisites

1. **Codex** with this plugin loaded.
2. A browser where the user is signed in to the target Enneo instance.

## Storage

Primary storage is `~/.enneo/env`, mode `600`, because the bundled MCP server and REST examples both read it:

```bash
export ENNEO_INSTANCE="demo.enneo.ai"
export ENNEO_TOKEN="eyJ..."
export ENNEO_TOKEN_EXPIRES_AT="1793923200"
```

Optional multi-instance cache: `~/.enneo/browser-tokens.json`, mode `600`, keyed by origin:

```json
{
  "https://demo.enneo.ai": {
    "token": "eyJ...",
    "exp": 1793923200,
    "userId": 1,
    "issuedAt": "2026-04-23T10:00:00Z"
  },
  "https://another-instance.enneo.ai": { "...": "..." }
}
```

- `exp` is the `exp` claim decoded from the JWT payload (base64url middle segment).
- Refresh proactively when `exp - now < 86400` (24 h).
- Atomic write (tmp + rename), mode `600`.
- Never `cat` or print the file / full token. Mask as `eyJ…<last-8>` in responses.

## Flow

1. **Resolve origin** from the user's request (e.g. `demo.enneo.ai` → `https://demo.enneo.ai`).
2. **Cache check.** Read `~/.enneo/browser-tokens.json` (create `{}` if missing). If the origin record has `exp - now > 86400`, skip to step 4.
3. **Ask the user to copy the JWT from the Enneo UI** and paste it here:

   > Open `<origin>/settings/profile` in your already-authenticated browser. In the **Login** section, find the **API key** field — copy the value and paste it here.

   If they're not signed in, ask them to sign in to `<origin>` first; do not attempt to log them in yourself.
4. **Decode and store.** Decode the pasted JWT's payload (base64url middle segment) for `exp` and `userId`, then write `~/.enneo/env` for the active instance and merge into `~/.enneo/browser-tokens.json`, preserving other origins:

   ```bash
   ORIGIN="https://demo.enneo.ai"
   INSTANCE="demo.enneo.ai"
   TOKEN="eyJ..."        # the JWT the user pasted
   EXP=$(node -p "JSON.parse(Buffer.from(process.argv[1].split('.')[1],'base64url')).exp" "$TOKEN")
   USERID=$(node -p "JSON.parse(Buffer.from(process.argv[1].split('.')[1],'base64url')).userId ?? null" "$TOKEN")
   IAT=$(date -u +%FT%TZ)

   mkdir -p ~/.enneo
   chmod 700 ~/.enneo
   {
     printf 'export ENNEO_INSTANCE="%s"\n' "$INSTANCE"
     printf 'export ENNEO_TOKEN="%s"\n' "$TOKEN"
     printf 'export ENNEO_TOKEN_EXPIRES_AT="%s"\n' "$EXP"
   } > ~/.enneo/env
   chmod 600 ~/.enneo/env

   [ -f ~/.enneo/browser-tokens.json ] || { echo '{}' > ~/.enneo/browser-tokens.json && chmod 600 ~/.enneo/browser-tokens.json; }
   jq --arg o "$ORIGIN" --arg t "$TOKEN" --argjson exp $EXP --argjson uid $USERID --arg iat "$IAT" \
      '.[$o] = {token: $t, exp: $exp, userId: $uid, issuedAt: $iat}' \
      ~/.enneo/browser-tokens.json > ~/.enneo/browser-tokens.json.tmp-$$ \
      && mv ~/.enneo/browser-tokens.json.tmp-$$ ~/.enneo/browser-tokens.json
   chmod 600 ~/.enneo/browser-tokens.json
   ```

5. **Use the token:**

   ```bash
   . ~/.enneo/env
   curl -s "https://${ENNEO_INSTANCE}/api/auth/v1/session" -H "Authorization: Bearer ${ENNEO_TOKEN}"
   ```

## Edge cases

- **Multiple accounts per origin.** One token per origin; switching overwrites. Cached `userId` reflects the current account.
- **Not signed in.** The user can't reach Profile Settings without signing in — ask them to sign in first. Do not retry automatically.
