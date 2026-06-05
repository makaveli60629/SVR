# SVR Lobby Organization Update 1.2 — Final QA + Deploy Manifest

## Build Name
Lobby Organization Update 1.2

## Purpose
This manifest locks the final QA route for the current game-side lobby update. The priority is to confirm that the lobby boots cleanly, loads through the splash screen, runs smoother on Quest, has controller-safe navigation, shows the luxury Reiki storefront, shows the skyline ads and moon/Mars, and provides a shorter CAM 3 live preview route for the website.

## Latest Patch Stack

1. Phase manifest created.
2. Controller pointer bridge added.
3. Renderer bridge exposed.
4. Watch orientation repair added.
5. Reiki luxury cleanup module added.
6. Reiki cleanup wired through the coffee phase.
7. Moon/Mars high-sky lock added.
8. Skyline 12-ad tier system added.
9. Portal plaza and lobby directory added.
10. Reiki meditation forest room added.
11. Private scene routes locked for Scorpion/Reiki/PGA.
12. Splash/loading screen added.
13. Staged module boot added.
14. CAM 3 live preview route shortened and improved.

---

# Hard Rules Still Active

- No Reiki pricing.
- No Reiki checkout.
- No Reiki email forwarding.
- No Reiki database writes.
- No claim of partner approval.
- Reiki remains approval-safe and presentation-only.
- Quest comfort stays higher priority than visual effects.
- Do not remove the current playable lobby baseline.
- Do not remove controller fallback.
- Do not remove desktop or Android preview controls.

---

# Required Test URLs

## Main Game

```text
https://svrpoker.com/game/?v=lobby-org-1-2-final-qa
```

## Splash/Staged Boot

```text
https://svrpoker.com/game/?v=splash-staged-boot-12
```

## CAM 3 Live Preview

```text
https://svrpoker.com/game/?cam=cam3&v=cam3-live-preview-route-12
```

## Website Preview Mode

```text
https://svrpoker.com/game/?preview=1&v=cam3-live-preview-route-12
```

## Scorpion Private Room

```text
https://svrpoker.com/game/private-scene.html?scene=scorpion&v=phase170-pokerjs-lock
```

## Private Reiki Preview

```text
https://svrpoker.com/game/private-scene.html?scene=reiki&v=phase158-private-rooms
```

## PGA Preview

```text
https://svrpoker.com/game/private-scene.html?scene=pga&v=phase158-private-rooms
```

---

# QA Checklist

## 1. Boot + Splash

- Splash screen appears immediately.
- Progress bar moves.
- Loading text updates.
- Core lobby appears without blank boot lock.
- Splash hides after core lobby is ready.
- Late modules can load after splash without blocking entry.
- Error handling shows logs instead of freezing black.

## 2. Quest Comfort

- Quest does not show hard black edge/frame-rate collapse during normal movement.
- Renderer pixel ratio remains Quest-safe.
- Heavy modules are staged instead of blocking initial boot.
- No rapid flicker from Reiki hologram overlays.
- Glow effects remain slow and tolerable.

## 3. Controller Movement

- Forward stick moves where the player/headset is facing.
- Turning does not make forward become sideways.
- Snap/turn does not create dizziness spikes.
- Player can move comfortably for at least 2 minutes.

## 4. Controller Pointer

- Controller ray appears.
- Pointer dot appears.
- Trigger/grip activates portal cards.
- Trigger/grip activates Reiki carousel controls.
- Trigger/grip can activate buttons without hand tracking.

## 5. Watch

- Watch text is readable.
- Watch is not upside down.
- Watch screen faces user.
- Buttons are larger.
- Teleport toggle remains available.
- Music toggle remains available.

## 6. Reiki Storefront

- Red carpet center path is clear.
- No plant blocks the walkway.
- Floor welcome strip is removed.
- Gray threshold/floor track is removed.
- Hologram video is in the console area.
- Carousel order starts with About.
- Second card is Interview Video.
- Approval notice remains visible.

## 7. Reiki Forest

- Forest loads without breaking lobby.
- Running water uses animated texture only.
- Trees and rocks are visible.
- Fireflies are soft, not bright/flickery.
- Forest is Quest-safe.

## 8. Moon and Mars

- Only one moon is visible.
- Only one Mars is visible.
- Moon is high in the sky.
- Mars is high and farther/smaller.
- Moon has visible glow.
- Orbit/rotation is very slow.
- Buildings do not block the main moon view.

## 9. Skyline Ads

- 12 ad buildings appear.
- 4 Tier 1 buildings are largest.
- 4 Tier 2 buildings are medium.
- 4 Tier 3 buildings are smaller.
- Building numbers are visible.
- Tier labels are visible.
- Ads face the lobby/player.
- No black untextured buildings dominate the main view.

## 10. Portal Plaza

- Directory board appears on west wall.
- Portal cards are visible.
- Portal cards do not block poker table path.
- Scorpion card routes to private Scorpion room.
- PGA card routes to PGA preview.
- Reiki card routes to Reiki preview.
- VR Store card routes to store page.

## 11. CAM 3 Live Preview

- CAM 3 launches with `?cam=cam3`.
- HUD is hidden in preview mode.
- Route is approximately 31 seconds.
- Route shows poker table first.
- Route shows seated gameplay angle.
- Route shows Reiki storefront.
- Route shows portal directory.
- Route shows PGA/sponsor wall.
- Route shows coffee/store corner.
- Route shows skyline ads and moon.
- Route ends with full lobby overview.

---

# Deploy Steps

1. Commit is already on `main`.
2. Open GitHub Actions.
3. Run Auto Deploy workflow on `main`.
4. Wait for deploy to finish.
5. Hard refresh the browser.
6. Test main game URL first.
7. Test CAM 3 preview URL second.
8. Test Quest VR after desktop boot succeeds.

---

# Acceptance Decision

The update can be considered accepted only if the following pass:

- No boot screen lock.
- Controller forward movement is comfortable.
- Controller pointer activates UI.
- Reiki storefront is clean.
- Moon/Mars duplicates are removed.
- CAM 3 preview route shows the full lobby quickly.
- Scorpion route opens.

---

# Next Phase Recommendation

After QA, the next working phase should be:

## Lobby Organization Update 1.3 — Performance + Asset Compression Pass

Priority items:

- Compress heavy textures.
- Reduce runtime-generated canvas texture count where possible.
- Convert large repeated canvas textures into reusable materials.
- Add loading timeout recovery per module.
- Add low/medium/high visual quality switch.
- Add Quest-only reduced skyline mode.
- Add direct in-game QA panel showing loaded modules and errors.
