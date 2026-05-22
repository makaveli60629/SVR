# SVR Site Phase 04 â€” Hidden Admin Analytics Lock

## Scope

This phase adds a private traffic and marketing-statistics dashboard to the owner/admin panel only.

## Protected

- Root public Matrix launch page is not edited.
- Matrix rain is not edited.
- `/game` is not edited.
- No SQL secrets, Stripe secrets, passwords, or keys are added to frontend code.

## Added

- Hidden admin traffic counters.
- Site page-view tracking through the existing public hook script.
- Admin-only analytics summary endpoint.
- Admin-only latest analytics events endpoint.
- Owner dashboard cards for traffic, sessions, page views, messages, leads, game activity, and store item count.
- Top pages, referrers, event type breakdown, and 14-day trend output.

## Backend table

The API creates `site_analytics_events` automatically on first write/read.

## Public behavior

The public site does not show traffic counters. Analytics are visible only after owner login at `/site/owner.html`.
