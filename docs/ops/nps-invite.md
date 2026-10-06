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

## The token never stays in the URL (issue #1666)

The token is a bearer credential **and** reversible PII (the payload is
`base64url` JSON with the e-mail and first name, not encrypted). Zaraz's
automatic Pageview fires before any page code runs and sends the page URL —
query string included — to GA4 as `page_location`; the Cloudflare Web
Analytics beacon and Traks also record the page. A client-side
`history.replaceState` would be too late.

So the edge handles the link before any HTML is served:

1. `functions/[[path]].ts` → `lib/nps-invite-redirect.ts` intercepts
   `GET /nps?token=…` (also strips the legacy `firstname`/`email` params).
2. It verifies the token (signature + expiry, not replay) and answers
   **303 → `/nps/`** with the query removed (UTMs are kept), `Cache-Control:
   no-store` and `Referrer-Policy: no-referrer`. A redirect has no HTML, so no
   tag runs on it, and the next page's `document.referrer` is the mail client,
   not the tokenized URL.
3. The same response sets two cookies (`lib/nps-invite-cookie.ts`), both
   `SameSite=Strict`, `Secure` on HTTPS, `Max-Age` = 2h capped at the invite's
   expiry:
   - `nps_invite` — the token, `HttpOnly`, `Path=/api/submit-nps`. Page JS and
     tag scripts can't read it; it is only sent to the submit endpoint.
   - `nps_invite_name` — the first name **from the verified payload**, readable
     by the page for the greeting, `Path=/nps`. Its presence is how the page
     tells "has invite" from "invalid link".
4. `/api/submit-nps` reads the token **only** from the `nps_invite` cookie (a
   `token` in the body is ignored) and clears both cookies on success.

An invalid or expired link still redirects to a clean `/nps/`, clearing any
previous invite cookies, and the page shows "Link inválido". Reopening the
e-mail link after the 2h cookie window re-issues the cookies while the invite
itself is still valid.

`pnpm dev` mirrors the redirect through a Vite plugin (`vite.config.ts`,
`npsInviteDevPlugin`), so local testing and the e2e suite exercise the same flow.

What remains: the edge still receives the tokenized URL on that first request
— that is the hosting itself (Cloudflare, operator 2.1 of the transfer
matrix), and the Sentry request URL is scrubbed by `scrubEventUrls`. Making the
token opaque (random id, e-mail/name only server-side) would also stop it being
reversible PII for anyone who sees the link (e.g. the e-mail provider); not done
yet because it needs server-side invite storage.

## Generating a link

Run once a trip is completed (manually, or wired into whatever ops workflow
tracks trip completion):

```bash
pnpm tsx scripts/generate-nps-invite.ts --email cliente@example.com --firstname "Ana" [--days 30]
```

Prints the token and a ready-to-send URL, e.g.:

```
https://www.anhanga.tur.br/nps?token=<token>
```

Don't add `firstname` (or anything else identifying) to the link: the greeting
name comes from the verified token payload, and the edge strips identity params
from the URL anyway.

## Distribution

Send the link via the channel already used for post-trip follow-up (e-mail).
Each link is single-use and expires after 30 days by default — generate a
fresh one if a customer needs to resubmit or the link is reported lost.

## Configuration

`NPS_INVITE_SECRET` is required in production (`openssl rand -hex 32`). Without
it, `/api/submit-nps` returns `500 SERVER_CONFIG_ERROR` rather than accepting
unverifiable submissions.
