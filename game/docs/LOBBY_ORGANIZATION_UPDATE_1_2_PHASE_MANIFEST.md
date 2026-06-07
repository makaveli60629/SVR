# SVR Lobby Organization Update 1.2 — Phase Manifest

## Build Name
Lobby Organization Update 1.2

## Purpose
Prepare SVR Poker for a cleaner, smoother, more professional Quest-first lobby build. This phase locks the work into staged passes so stability, locomotion, interaction, Reiki storefront polish, skyline ads, and scene portals can be fixed without breaking the current game.

## Hard Rules
- Game-side first.
- Do not touch `/site` unless explicitly requested for Reiki storefront/service/shop presentation pages.
- Keep Reiki/Trueitive-related content marked AWAITING APPROVAL.
- Do not connect Reiki email, booking, database, checkout, pricing, or admin records until approval.
- Preserve the current playable lobby and poker table baseline.
- Keep Quest comfort, controller usability, and no-dizziness movement as the highest priority.
- Keep direct `/game` deployment workflow working.
- Keep `update/game.zip` packaging available for local PowerShell deploys.

---

# Phase 1 — Stability, Blink, and Quest Comfort Lock

## Goal
Stop dizziness, reduce blink/flicker, and make Quest performance feel smooth enough for live testing.

## Fix List
- Reduce excessive blinking/glow effects.
- Remove unnecessary animated transparent overlays.
- Slow down hologram glow pulsing.
- Reduce sprite brightness.
- Reduce or disable unnecessary lights and extra animation loops.
- Keep renderer Quest-friendly.
- Keep shadows disabled for Quest.
- Lower expensive transparency where possible.
- Verify no boot screen freeze.

## Acceptance Test
- Game boots past loading screen.
- Quest view is stable.
- No rapid flicker in Reiki hub or lobby.
- No heavy black edge/frame-rate feeling during movement.

---

# Phase 2 — Controller Locomotion and Pointer Lock

## Goal
Controller movement must feel natural: wherever the player is facing is forward.

## Fix List
- Quest right/left stick forward must move in headset-facing direction.
- No sideways drift after turning head/body.
- Snap turn pauses movement briefly to prevent dizziness.
- Controller pointer/ray must be visible and active.
- Controller trigger/grip/select must activate hologram buttons and portal buttons.
- Keep hands/fist teleport available but prioritize controller stability first.
- Add controller interaction bridge for Reiki hologram carousel.

## Acceptance Test
- Turn body/head, push forward, move forward where facing.
- Push forward does not move sideways.
- Trigger or select can activate buttons.
- Pointer is visible enough to aim.
- Movement is comfortable for at least 2 minutes.

---

# Phase 3 — Watch Orientation and Input Repair

## Goal
Fix watch usability and stop upside-down interface issues.

## Fix List
- Watch screen upright on inner forearm.
- Buttons readable.
- Teleport toggle works.
- Music toggle works.
- Sit/leave works.
- Larger hitboxes for Quest interaction.
- Desktop/Android fallback controls remain visible.

## Acceptance Test
- Watch text is not upside down.
- User can activate watch buttons with controller or hand pointer.
- Watch does not block movement.

---

# Phase 4 — Reiki Storefront Luxury Cleanup

## Goal
Make the Reiki storefront professional, luxury, and presentation-ready.

## Fix List
- Remove any plant blocking the red carpet.
- Remove the floor welcome strip.
- Remove gray raised threshold/floor track.
- Keep center walkway fully clear.
- Add gold/cyan floor edge trim only on sides.
- Keep plants behind glass or along sides only.
- Restore Reiki hologram MP4 inside the carousel/console.
- First card: About.
- Second card: interview/video hologram.
- Later cards: symbols, services, shop preview, VIP promo, private room, training room.
- Keep AWAITING APPROVAL visible.

## Acceptance Test
- Red carpet path is open.
- No plant in the middle.
- No gray threshold on the floor.
- Hologram video appears in the console, not off to the side.
- Left/right carousel navigation changes content.

---

# Phase 5 — Reiki Content and Tutorial Module

## Goal
Turn Reiki into a clean educational and sponsor presentation module.

## Fix List
- Add approval-safe About page card.
- Add approval-safe interview/video card.
- Add Reiki symbols/chakra education card.
- Add service preview card with no pricing.
- Add shop idea preview card with no checkout and no pricing.
- Add community/work profile card.
- Add private VR session room card.
- Add training/meditation room card.
- Store all content as packet/modular data where possible.

## Approval Rules
- No live pricing.
- No checkout.
- No email forwarding.
- No database insert.
- No official approval claim.
- Buttons should say AWAITING APPROVAL or PRESENTATION ONLY.

---

# Phase 6 — Meditation Forest Room

## Goal
Create a lightweight Reiki nature scene for meditation and future private/training rooms.

## Scene Concept
- Spacious low-poly night forest.
- Running water using animated texture, not heavy fluid simulation.
- Moon visible high in sky.
- Mars visible high and smaller/farther.
- Soft nighttime/sunset gradient.
- Gentle low-poly trees and rocks.
- Calm activation circle.
- Performance-safe water effect.

## Acceptance Test
- Scene loads from Reiki portal/card.
- Running water effect does not hurt Quest FPS.
- Moon/Mars are high and not blocked.
- Room feels calm and spacious.

---

# Phase 7 — Moon and Mars Celestial Lock

## Goal
Remove duplicates and make the real moon/Mars models the sky attraction.

## Fix List
- Remove programmed duplicate moon/Mars placeholders.
- Use real OBJ/GLB celestial assets when available.
- Place moon and Mars high in every scene.
- Add moon glow/halo.
- Keep Mars smaller and farther.
- Slow orbit/rotation dramatically.
- Per-scene celestial placement so buildings do not block them.
- Lock celestial scene button/test marker.

## Acceptance Test
- Only one moon visible.
- Only one Mars visible.
- Moon is high, textured, glowing, and not blocked.
- Mars is high and not blocking moon.

---

# Phase 8 — Skyline Building and 12-Ad Tier System

## Goal
Organize skyline buildings for ads and fix tilted/black/untextured buildings.

## Fix List
- Decide final approach: OBJ buildings or geometry buildings.
- Align all ad buildings upright.
- Apply visible textures.
- Remove black untextured building placeholders.
- Add 12 ad-capable buildings.
- 4 Tier 1 buildings: largest/widest/most visible.
- 4 Tier 2 buildings: medium size.
- 4 Tier 3 buildings: smaller support ads.
- Add building number labels.
- Add tier labels.
- Ads face the lobby/player viewpoint.
- Walls/buildings must not block ads.

## Ad Slots
- Espresso ad.
- Reiki ad.
- All-In / SVR Poker ad.
- Future sponsor placeholders.

## Acceptance Test
- Standing in lobby, looking up, ads are visible.
- Buildings are upright.
- No black textureless buildings remain in main view.
- Tier labels are readable.

---

# Phase 9 — Portal Plaza and Lobby Organization

## Goal
Make the lobby feel like a professional luxury VR hub.

## Fix List
- Add main directory board near spawn.
- Create clean portal plaza.
- Organize portals in a readable row/arc.
- Add short descriptions and status labels.
- Add floor path lights by category.
- Keep poker table sightline clear.
- Remove random clutter around central path.

## Directory Entries
- Poker Table.
- Reiki Hub.
- Reiki Private Room.
- Reiki Training Forest.
- PGA Drive.
- Chip/Putt.
- VR Store.
- Scorpion Room.
- Sponsor Lounge.
- Hall of Fame.

---

# Phase 10 — Scene Audit: Scorpion, Golf, Reiki, Copilot Modules

## Goal
Find and evaluate existing scene modules, including any Copilot-generated work.

## Fix List
- Search repo for Scorpion room scene/module.
- Search repo for Copilot-generated Scorpion/Golf/Reiki modules.
- Identify entry points and buttons.
- Connect working portal/button routes.
- Keep broken modules quarantined until safe.
- Add docs listing each scene status.

## Acceptance Test
- Scorpion room button/portal works if module exists.
- Golf drive/chip-putt buttons work.
- Reiki room/training room buttons work or show safe placeholder.

---

# Phase 11 — Multiplayer/Admin Future Hooks

## Goal
Prepare architecture for future partner/admin rooms without turning on database/email/checkout.

## Future Rules
- User retains full God-mode admin for all hubs.
- Each partner hub can later have its own admin console.
- Reiki partner admin remains disabled until approval.
- Analytics hooks remain placeholders only.
- Private VR session room remains prepared but not live multiplayer until backend is ready.

## Acceptance Test
- No database writes.
- No email sends.
- No live checkout.
- Future hooks documented but disabled.

---

# Phase 12 — Final QA, Manifest, Zip, Deploy

## Goal
Package and deploy after stability passes.

## Steps
- Run boot test.
- Run Quest controller movement test.
- Run desktop test.
- Run Android test.
- Verify Reiki carousel.
- Verify portals.
- Verify moon/Mars.
- Verify ads/buildings.
- Update build version.
- Build `update/game.zip` locally if needed.
- Push to `main`.
- Run Auto Deploy.

## Test URL
`https://svrpoker.com/game/?v=lobby-org-1-2`

---

# Current Top Priority
1. Controller locomotion and pointer interaction.
2. Reiki carpet cleanup and hologram carousel video placement.
3. Blink/stability pass.
4. Watch orientation.
5. Lobby organization and skyline ad tiers.
