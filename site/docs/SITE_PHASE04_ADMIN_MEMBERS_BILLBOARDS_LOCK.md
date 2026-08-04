# SVR Site Phase 04 — Admin Members + Billboard Lock

## Scope

Site-only update. Public Matrix launch page and `/game` were not edited.

## Added

- Refined `/site/owner.html` admin online indicator with clean dot styling.
- Added owner-only tabs for:
  - Member Population
  - In-Game Billboards
  - Store Items
  - Game Events
  - Logs
- Added `/site/register.html` for member population intake.
- Added `/site/billboards.html` for in-game billboard and sponsor placement intake.
- Added SVG update images:
  - `/site/assets/images/member-population-update.svg`
  - `/site/assets/images/billboard-program-update.svg`

## Database Logic

This phase uses existing AWS API routes:

- `POST /api/leads`
- `GET /api/admin/leads`
- `POST /api/admin/leads/status`
- `GET /api/admin/analytics/summary`
- `GET /api/admin/store/items`
- `GET /api/admin/game/events`

Member registrations are saved as `leadType` values beginning with `member_`.
Billboard requests are saved as `leadType` values beginning with `billboard_`.

## Safety

- No SQL secrets added.
- No Stripe secrets added.
- No payment checkout enabled.
- Sponsor billboards remain review/approval only.
- Public counters remain hidden from public pages.
- Owner/admin panel is noindex/nofollow.

## Next Recommended Phase

Add a dedicated backend table for full members and approved billboards after the intake logic is stable:

- `members`
- `billboard_requests`
- `approved_ad_placements`
- `sponsor_campaigns`

Until then, `marketing_leads` is the safe population/intake table.
