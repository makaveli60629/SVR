# SVR Poker — Update 3.0 Lockdown Handoff Manifest
Date: 2026-06-06
Track: GAME-SIDE ONLY
Status: Recovery / Lockdown required

## 0. Emergency Rule
Do not roll back again until the current repo, live deploy label, and ZIP contents are compared.
Rollback is what keeps reintroducing Phase 92 / Phase 100 / Phase 101 fragments and losing the newer Reiki mother-module work.

## 1. Current Problem
The project has drifted across multiple update lines:

- Phase 85 brought back the wrong / old Reiki store layer.
- Phase 100 restored part of the Update 3.0 route but did not fully restore the finished Reiki mother module.
- Phase 101 removed music and fixed sky but still did not restore the correct hologram carousel.
- Phase 102 was intended to restore the Reiki hologram carousel, but the current repo still needs verification before becoming the locked master.
- Current repo `game/docs/BUILD_VERSION.json` shows Phase 101.
- Current repo `game/index.html` still shows the Phase 101 build label.
- The deploy workflow pulls `update/game.zip` into `build/game`, so `/update/game.zip` and `/game` must both be synchronized.

## 2. True Target Baseline
The correct next stable baseline should be:

UPDATE-3.0-LOCKDOWN-REIKI-MOTHER-MODULE-QUEST-SKY-STORE

This must include:
- Correct current lobby baseline.
- No music.
- Quest/Oculus locomotion fixed.
- Controller teleport ray fixed in front of the player.
- Right stick forward/back = headset-facing forward/back.
- Right stick left/right = 45-degree snap turn.
- Moon and Mars high, larger, textured.
- Mars orbiting Moon.
- Reiki mother module restored.
- Reiki hologram/video carousel restored.
- Reiki private room restored.
- New Reiki storefront restored.
- PGA module copied from Reiki mother-module pattern.
- SVR Store module copied from mother-module pattern.
- Smoker Lounge module copied from mother-module pattern.
- Building glass/ads/textures restored.
- Rising sprites restored.
- Site untouched.

## 3. Reiki Mother Module — Required Structure
The Reiki area must not be the old flat storefront only.

Required visible pieces:
- Main Reiki storefront frame.
- Large REIKI HUB sign.
- AWAITING APPROVAL / WAITING APPROVAL text.
- Red carpet / rope / plant presentation.
- Portal ring.
- Hologram/video carousel.
- Carousel cards:
  - Video / Hologram
  - Reiki Store
  - Meditation / Reiki Room
  - About / Info
  - Approval Status
- Green rising sprites around Reiki.
- More plants around Reiki.
- Private Reiki room route.
- Private Reiki room must also contain the hologram carousel.

Approval safety:
- No Trueitive text.
- No trueitive.com.
- No Truitive.
- No founder names/photos.
- No outside Reiki branding unless approved.
- Use SVR logo and approval placeholders only.

## 4. PGA / Juan Espejo Golf Academy Module
PGA should be rebuilt by duplicating the Reiki mother-module concept, not as scattered standalone signs.

Required visible name:
Juan Espejo Golf Academy
(Maryville)
WAITING APPROVAL

Required carousel cards:
- Drive Range
- Chip + Putt
- Academy Info
- Approval Status

Placement:
- Keep in Juan Espejo / golf storefront area.
- Put Drive Range and Chip/Putt as cards inside the one golf academy module, not random signs.
- Private scene routes:
  - pgaDrive
  - pgaChipPutt

## 5. SVR Store Mother Module
SVR Store must become a full building/storefront structure.

Required:
- Full storefront facade.
- Store wall / portal.
- Carousel cards:
  - VR Gear
  - Watches
  - Gloves
  - Avatar Items
  - Website Store Portal
- Do not block the spotlight ad.
- Shift/size the store so it does not overlay the TrueTip/spotlight ad zone.
- Store portal URL should remain configurable:
  https://svrpoker.com/site/store.html

## 6. Smoker Lounge Module
Smoker Lounge should be southwest / near the golf area unless the current repo route requires a safer placement.

Required:
- Use same mother-module/carousel pattern.
- Private scene route.
- Do not block golf, store, or main walking lanes.

## 7. Quest Locomotion Lock
This is critical.

Oculus/Quest controller:
- Right stick up/down = forward/back movement.
- Forward must follow headset/camera yaw.
- If player turns 45 degrees and pushes forward, the player moves forward in the new view direction.
- Right stick left/right = 45-degree snap turn.
- Grip/A/trigger hold = aim teleport.
- Release = teleport.
- Teleport ray must be in front of the player, never behind.
- SVR logo marker/raycast marker must be visible.
- No accidental instant teleport.
- Controller meshes can stay hidden or appear as natural hands.

Android:
- Do not break Android. User says Android is fine.

## 8. Moon / Mars Lock
Required:
- Moon higher than buildings.
- Moon about 2x bigger than current small version.
- Mars higher and bigger.
- Mars orbits Moon.
- Both rotate.
- Full textures applied.
- Do not leave the old geometry-only placeholder.
- If texture paths are missing, use the existing uploaded moon/Mars texture assets before asking for new files.

## 9. Graphics / Performance Lock
Current issue: choppy graphics and jagged edges.

Required cleanup:
- Improve pixel ratio on Quest without overloading GPU.
- Reduce bad shimmer / hard edges.
- Avoid heavy post-processing.
- Cap/emissive brightness.
- Keep shadows disabled or highly limited on Quest.
- Remove unused/duplicate heavy assets.
- Lazy-load private scenes.
- Remove unused music/audio.
- Keep game zip under 25 MB.
- Use low-cost glass/building materials and ad planes.

## 10. Building Ads / Texture Lock
Required:
- Black/plain buildings need glass/color treatment.
- Add ad tiers on building faces.
- Restore building ads where possible.
- Use existing OBJ/texture assets if present.
- Do not leave flat black skyline blocks as final.

Ad tiers:
- Tier 1: large building/megaboard ads.
- Tier 2: storefront/sponsor panels.
- Tier 3: small wall/card ads.

## 11. Sprites / Atmosphere Lock
Required:
- Green rising sprites around Reiki.
- Purple rising sprites around table/lobby.
- Motion should feel like rising snow / elegant particles going upward.
- Avoid over-bright sprites near spawn.
- Keep particle counts Quest-safe.

## 12. Private Scene Routing
Lobby = storefront/portal hub only.

Private scenes:
- Reiki Room
- PGA Drive
- PGA Chip/Putt
- Smoker Lounge
- SVR Store
- Scorpion Room

The lobby should not contain entire private rooms.

## 13. Deployment Lock
The workflow deploys:
- root public site files directly
- `/update/game.zip` into `/build/game`
- committed `/game` is fallback only if `update/game.zip` is missing

Therefore every real game deploy must update BOTH:
- `/game`
- `/update/game.zip`

Required version files:
- `game/docs/BUILD_VERSION.json`
- `update/version.json`
- `game/index.html` visible build label

The labels must match.

## 14. Do Not Touch
- Root public website.
- `/site` pages.
- Matrix public page.
- Cash App site changes.
- Admin/backend work.
- SQL/API/Stripe secrets.
- Legal docs.

## 15. Next Correct Phase Name
Use:

Update 3.0 Lockdown — Phase 103
Reiki Mother Module + Quest Locomotion + Sky Storefront Lock

Visible build label:
BUILD: UPDATE-3.0-PHASE-103-REIKI-MOTHER-QUEST-SKY-STOREFRONT-LOCK

## 16. Preflight Audit Required Before Patch
Before generating another build:
1. Check current `game/docs/BUILD_VERSION.json`.
2. Check `game/index.html` visible build label.
3. Check `update/version.json`.
4. Inspect `update/game.zip` label.
5. Confirm whether Phase 102 hologram module files exist.
6. Confirm whether `game/reiki.html` contains hologram carousel.
7. Confirm whether no music/audio files remain.
8. Confirm teleport module uses headset yaw and forward-facing ray guard.
9. Confirm moon/Mars textures exist and are referenced.
10. Confirm old Reiki store assets/strings are not present.

## 17. Recovery Instruction
Do not apply Phase 85 again.
Do not apply old Phase 92/100 packages without overlaying the missing Reiki mother module.
Do not use generic `game.zip` from Downloads unless checksum and label are verified.
Always use uniquely named ZIPs and scripts.

