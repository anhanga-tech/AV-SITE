# NPS Invitation Links

`/nps` (post-trip Net Promoter Score survey) requires a signed, expiring,
single-use invitation token (issue #1137). Before this, the page trusted a
caller-supplied `?firstname=&email=` — anyone who knew or guessed a
customer's e-mail could submit a score/comment that mutates their
`res.partner` record. The link is now `?token=...`, and the server derives
identity from the verified token, never from the request body.

## How it works

- `lib/nps-invite.ts` issues and verifies the token: `base64url(JSON payload)
  + "." + base64url(HMAC-SHA256 signature)`, signed with `NPS_INVITE_SECRET`.
- The payload carries `email`, `firstname`, an expiry (`exp`, default 30
  days), and a unique `jti`.
- `lib/nps-invite-replay.ts` marks the `jti` consumed (Upstash Redis
  `SET NX`) on the first successful submit — a captured/forwarded link can't
  be replayed even before it expires.
- `api/submit-nps.ts` verifies signature, expiry, and replay before any Odoo
  side effect, then uses the token's `email`/`firstname` — the request body
  only ever carries `score`/`reason`/`highlight`.

## Generating a link

Run once a trip is completed (manually, or wired into whatever ops workflow
tracks trip completion):

```bash
pnpm tsx scripts/generate-nps-invite.ts --email cliente@example.com --firstname "Ana" [--days 30]
```

Prints the token and a ready-to-send URL, e.g.:

```
https://www.anhanga.tur.br/nps?token=<token>&firstname=Ana
```

`firstname` in the URL is display-only (the page's greeting) — it is never
trusted as identity; only the verified token payload is.

## Distribution

Send the link via the channel already used for post-trip follow-up (e-mail).
Each link is single-use and expires after 30 days by default — generate a
fresh one if a customer needs to resubmit or the link is reported lost.

## Configuration

`NPS_INVITE_SECRET` is required in production (`openssl rand -hex 32`). Without
it, `/api/submit-nps` returns `500 SERVER_CONFIG_ERROR` rather than accepting
unverifiable submissions.
