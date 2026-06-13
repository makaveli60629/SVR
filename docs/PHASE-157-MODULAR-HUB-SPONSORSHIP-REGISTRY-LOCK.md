# UPDATE-3.0-PHASE-157-MODULAR-HUB-SPONSORSHIP-REGISTRY-LOCK

## Scope
Phase 157 removes the retired Reiki sponsor module behavior, removes Reiki video media from active Reiki placeholder surfaces, and adds a reusable sponsor registry for the hub system.

## Completed
- Kept the Reiki store/hub structure active as a generic placeholder.
- Removed Reiki video media from the active site Reiki preview page.
- Removed Reiki video media from the active site About hub section.
- Removed video playback from the active game Reiki storefront/hologram module.
- Kept the game Reiki hub as a slide/card placeholder instead of a video module.
- Added `game/modules/hub_sponsorship_registry_phase157.js`.
- Added `site/js/hub-sponsorship-registry.js`.
- Added `config/retired_sponsors_blocklist.json`.
- Wired the game registry into the active lobby flow through the current wrapper.
- Updated `game/index.html`, `game/phase141_label_fix.js`, and `game/version.json` to Phase 157.

## Hub sponsor registry design
All hub sponsors should now be controlled by a registry record instead of hard-coded page or scene text.

Each sponsor record should include:
- `hubKey`
- `enabled`
- `title`
- `slot`
- `route`
- `color`
- approved logo/media path, only after approval
- approved website link, only after approval
- approved copy, only after approval

## Included hubs
- Reiki Hub
- PGA Hub
- SVR Store
- Smoker Hub
- Scorpion Room
- Legends
- Sponsor Hub
- Charity Hub

## Excluded hub
- Vibes Theater

## Sponsor return rule
No retired sponsor name, company name, profile name, website link, logo, photo, founder biography, booking link, pricing, video, or service copy can be restored to active game/site surfaces without explicit owner approval in a new phase request.

## Files changed
- `site/reiki-about.html`
- `site/about.html`
- `game/modules/reiki_hologram_phase133.js`
- `game/modules/hub_sponsorship_registry_phase157.js`
- `site/js/hub-sponsorship-registry.js`
- `config/retired_sponsors_blocklist.json`
- `game/modules/reiki_phase119_trueitive_storefront_final.js`
- `game/index.html`
- `game/phase141_label_fix.js`
- `game/version.json`
- `docs/PHASE-157-MODULAR-HUB-SPONSORSHIP-REGISTRY-LOCK.md`

## Verification checklist
1. Open the Reiki site preview and confirm there is no video player.
2. Open the About page and confirm the hub section has no video player.
3. Enter the game lobby and confirm the Reiki hub still exists.
4. Confirm the Reiki hub display is slide/card placeholder content, not video playback.
5. Confirm sponsor slots appear as placeholders through the registry.
6. Confirm Vibes Theater is excluded from the sponsor registry.
7. Confirm prior skyline ring, moving moon glow, Quest hands, teleport, watch, and poker baseline remain intact.

## Locked label
`UPDATE-3.0-PHASE-157-MODULAR-HUB-SPONSORSHIP-REGISTRY-LOCK`
