# Phase 369 — Website APK Banner, Telemetry, App Security and Payout Profile Foundation

## Scope

This phase updates the interior `/site/` homepage, account registration and backend-ready contracts. It does not change the locked public Matrix launch page.

## Website banner

- All slider images are constrained with `object-fit: contain` so artwork fits inside the banner frame.
- The first slide becomes the SVR Android App Release Center.
- It includes the SVR logo, app version, download/download-center control, web-play control and a manual update-check button.
- The banner reads `/game/android-release.json` and `/update/app-version.json`.
- A `NEW UPDATE` badge appears only when a signed package is marked `releaseReady`, has a non-empty `apkUrl`, and has a higher version code than the locally recorded install.
- The current repository does not contain a signed APK URL and `releaseReady` remains false. The banner therefore opens the Download Center instead of falsely advertising a nonexistent signed package.

## Install and activity telemetry

The website creates a random installation ID and queues privacy-disclosed banner/download/update events locally. When `SVR_TELEMETRY_API_BASE` is configured, it sends the same event contract to:

`POST /api/v1/telemetry/events`

Production contracts are included for:

- installation registration
- app heartbeats
- Play Integrity token and request-hash verification
- aggregate admin metrics
- authorized installation search
- payout preference storage
- prize-claim compliance approval

Raw IP addresses are not collected in browser JavaScript and are not displayed in the admin page. The backend should derive the request IP, keep raw infrastructure logs briefly, and store a keyed hash plus coarse region for longer-term abuse research.

## App protection

A unique installation ID is an analytics identifier, not an anti-piracy secret. The production Android protection plan requires:

1. Play App Signing.
2. Play Integrity API verdicts checked by the backend.
3. `requestHash` binding for important game/account requests.
4. Package name, app version and signing-certificate SHA-256 verification.
5. Server-authoritative accounts, balances, tournament results and payouts.
6. Rate limiting, replay protection, audit logs and key rotation.
7. Code shrinking/obfuscation as delay—not as a guarantee against reverse engineering.

Direct sideloaded APKs cannot provide the same Google Play licensing and install metrics as a Play-distributed app.

## Admin analytics page

Private route:

`/site/admin-app-analytics.html`

It shows aggregate installs, active installations, download actions, update checks, integrity alerts, a 30-day graph and authorized recent-install records. Without a secure admin token/API it shows only the current browser’s local fallback queue.

## Registration payout profile

Registration now supports:

- set up later
- Cash App tag
- ACH pending identity verification

The form stores only a payout preference. It never collects bank routing or account numbers and never enables automatic payouts. The payout database remains on legal/provider/identity/tax hold.

## Cloud status

Infrastructure-as-code, OpenAPI and SQL migrations are committed, but no AWS resources, databases, APIs, KMS keys, payment accounts or secrets were provisioned from ChatGPT because no AWS deployment connector/credentials are available in this session.
