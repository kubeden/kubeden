# smtpfa.st — the API surface this skill uses

Verified against the live OpenAPI spec (`https://smtpfa.st/api/v1/openapi.json`).
smtpfa.st is a transactional email API that tracks the full delivery lifecycle
(queued → accepted → delivered → opened) instead of going quiet after the 200.
This skill uses exactly one endpoint; the rest of the platform (webhooks, live
event tail, analytics, batch) is there when you want delivery observability.

## Send an email

```
POST https://smtpfa.st/api/v1/emails
Authorization: Bearer sf_live_xxxxxxxxx
Content-Type: application/json
```

Request body (`from`, `to`, `subject` required):

```json
{
  "from": "App <no-reply@yourdomain.com>",
  "to": ["user@example.com"],
  "subject": "482913 is your App sign-in code",
  "html": "<p>...</p>",
  "text": "Your App sign-in code: 482913"
}
```

- `to` is an **array**, even for one recipient.
- Send both `html` and `text`. The plain-text part is for spam filters and
  text-mode clients; auth mail deliverability matters more than most mail.
- Do NOT include `{{unsubscribe_url}}` in auth emails — that placeholder is for
  broadcast mail. Transactional sign-in codes are not subscription content.

Success — `200` with the queued email object:

```json
{ "id": "email_abc123", "status": "queued", "...": "..." }
```

Errors — `{ "error": "human-readable message" }` with:

| Status | Meaning | What to do in the auth flow |
|--------|---------|------------------------------|
| 400 | malformed payload | bug in the mailer — fix, don't retry |
| 401 | invalid or missing API key | check `SMTPFAST_API_KEY`; in dev, fall back to the console print |
| 403 | **domain not verified** or key lacks permission | verify the `MAIL_FROM` domain in the dashboard (DNS records); the code cannot fix this |
| 429 | rate limited | honor `Retry-After`; surface "try again in a moment" to the user |
| 500 | provider-side | treat as send failure; the user retries via "Resend code" |

## Failure posture for auth mail

The mailer must **return a boolean, not throw**. A failed send surfaces to the
user as "couldn't send the email — try again in a moment", and the retry is the
user pressing the button again (which mints a fresh code — old one dies by
upsert). Don't build automatic retry loops around a 6-digit secret; every send
is a new code, and silent retries can deliver two codes out of order.

## Dev fallback

When `SMTPFAST_API_KEY` is unset, print instead of send:

```
[mail:dev] to=user@example.com · "482913 is your App sign-in code"
Your App sign-in code: 482913
```

Also do this in non-production when the API answers non-2xx (real key, e.g.
unverified domain): warn with the provider's response body, then print the
code. Local auth keeps working while DNS propagates.

## Account facts worth knowing

- Keys look like `sf_live_...` and come from the dashboard.
- Sending domain must be added and DNS-verified before `from` works — this is
  the #1 first-run failure (403).
- Free tier: 3,000 emails/month, 1 domain. Each sign-in costs one email, so the
  free tier is ~3,000 logins/month. Overflow is $0.001/email on paid tiers.
- There is also `POST /v1/emails/batch` (up to 100 per call) and
  `GET /v1/emails/{id}` for delivery status — useful for ops dashboards, not
  needed for the auth flow.
