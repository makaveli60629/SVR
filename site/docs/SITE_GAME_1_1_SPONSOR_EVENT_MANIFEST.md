# SVR Site/Game 1.1 — Sponsor Event + Billboard Template Lock

## Purpose

This phase turns the Espresso with Cream ad into the first polished sponsor-event template for SVR.

## Locked Rules

- Root public Matrix page stays untouched.
- Matrix rain stays untouched.
- Game core runtime stays untouched unless the optional bridge script is injected.
- No live cash-prize promotion is activated.
- Animal shelter partner remains `Animal Shelter Partner Pending` until approved.
- Sponsor/event/cause language remains review-only until final legal and partner approval.

## Added Files

- `/site/sponsor-event.html`
- `/site/data/sponsor-event-current.json`
- `/site/assets/sponsors/espresso/espresso-sponsor-photo.svg`
- `/site/assets/sponsors/espresso/espresso-sponsor-event-card.svg`
- `/site/assets/sponsors/espresso/espresso-building-wide-1536x512.svg`
- `/site/assets/sponsors/espresso/espresso-building-standard-1024x512.svg`
- `/game/modules/sponsor_billboard_bridge.js`
- `/site/docs/SITE_GAME_1_1_SPONSOR_EVENT_MANIFEST.md`
- `/game/docs/SITE_GAME_1_1_SPONSOR_EVENT_MANIFEST.md`

## Billboard Tier Sizes

- Mega lobby/building wall: `1536 × 512`
- Premium building wall: `1024 × 512`
- Poster/site card: `900 × 1400`

## Workflow

1. Sponsor/cause request enters through `/site/billboards.html`.
2. Owner reviews the request inside `/site/owner.html`.
3. Approved campaign updates `/site/data/sponsor-event-current.json`.
4. Site displays the event through `/site/sponsor-event.html`.
5. Game billboard bridge reads the same JSON and tracks sponsor impressions through `/api/game/events`.
6. Owner dashboard can use traffic and game events to show campaign growth.

## Next Backend Phase

Add dedicated database tables:

- `sponsor_campaigns`
- `sponsor_ad_placements`
- `sponsor_campaign_events`
- `cause_partners`
- `campaign_metrics`

The current JSON file is a safe template while the approval workflow is refined.
