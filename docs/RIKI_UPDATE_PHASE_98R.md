# SVR Poker — Riki Update Phase 98R Checklist and Lock Manifest

## Phase Label

Riki Update — Phase 98R

## Purpose

This phase locks the current game-side priorities so future updates do not forget or backtrack on locomotion, teleport, Reiki showroom polish, hologram audio/video, watch orientation, Moon/Mars sky visuals, portal placement, and repo backup discipline.

## Non-Negotiable Lock Rules

- Keep work modular and phase-labeled.
- Keep website/site track separate unless explicitly requested.
- Preserve Quest controller fallback and hand-tracking coexistence.
- Preserve release-to-teleport behavior once fixed.
- Preserve right-stick locomotion once fixed.
- Preserve Reiki hologram volume/boost panel near the hologram.
- Preserve Reiki MP4 proximity behavior: loud inside the Reiki showroom, fades out outside.
- Preserve watch forearm baseline but fix inverted/upside-down display.
- Remove old unwanted teleport/portal floor connector lines.
- Keep portals in front of their correct hub areas.
- Keep Moon/Mars high in the sky and visually impressive.

## Phase 98R Implementation Checklist

### 1. Reiki Showroom Expansion

- [ ] Extend the Reiki storefront outward.
- [ ] Add glass on both sides, matching the first side.
- [ ] Align the expanded glass with the new wall/showroom footprint.
- [ ] Keep a clear walk-in entrance into the glass showroom.
- [ ] Extend the red carpet straight through the showroom.
- [ ] Extend red ropes along the carpet path.
- [ ] Add plants around the Reiki showroom without blocking the walkway.
- [ ] Keep the founder/info wall separate from the hologram wall.
- [ ] Keep all showroom pieces aligned and presentation-quality.

### 2. Reiki MP4 Hologram

- [ ] Ensure Reiki MP4 plays continuously.
- [ ] Keep hologram facing inside the Reiki carpet/showroom.
- [ ] Align hologram to the wall so it does not overlap founder/info content.
- [ ] Reduce graininess by reducing scanline haze and maximizing video clarity.
- [ ] Keep hologram visual style but prioritize readable video.
- [ ] If mirrored/reversed, flip orientation correctly.

### 3. Reiki Audio and Volume Control

- [ ] Reiki audio must be loud when user enters Reiki showroom.
- [ ] Reiki audio must fade out when user leaves.
- [ ] Volume must be high enough that user can lower it manually.
- [ ] Keep visible in-game volume/boost panel beside or near hologram.
- [ ] Keep WebAudio gain boost active.
- [ ] Keep click/tap/key audio unlock behavior documented.
- [ ] Controls: `]` or `=` increase boost; `[` or `-` decrease boost; `U` mute/unmute.

### 4. Quest Locomotion

- [ ] Right stick forward/back moves user forward/back.
- [ ] Right stick movement follows headset/camera direction.
- [ ] Right stick left/right snap-turns in 45-degree increments.
- [ ] Left stick remains backup strafe/move if available.
- [ ] Controller models should not be required or shown.

### 5. Teleport

- [ ] Quest grip/A/trigger hold aims teleport.
- [ ] Quest grip/A/trigger release teleports.
- [ ] Hand fist/pinch hold aims teleport.
- [ ] Hand fist/pinch release teleports.
- [ ] Teleport target marker appears while aiming.
- [ ] Hands glow purple/cyan/fire-like while teleport aiming.
- [ ] Teleport must move the user on release, not only aim.
- [ ] Remove old unwanted floor connector/teleport lines.

### 6. Watch

- [ ] Watch is no longer upside down.
- [ ] Watch screen faces user.
- [ ] Watch text/buttons are upright.
- [ ] Watch remains attached to forearm, not thumb.
- [ ] Preserve locked forearm baseline.
- [ ] Keep Quest controller fallback for watch interactions.

### 7. Hands / Textures

- [ ] Restore/apply provided hand or glove textures.
- [ ] Keep hands visually like hands, not controller objects.
- [ ] Preserve hand tracking and controller fallback coexistence.

### 8. Moon and Mars

- [ ] Raise Moon and Mars at least 50% higher than the prior high-sky position.
- [ ] Scale Moon and Mars approximately 2x visually.
- [ ] Moon should be the primary eye-candy sky feature.
- [ ] Moon texture must look realistic, cratered, and high contrast.
- [ ] Mars must look textured, darker, red/orange, and secondary to the Moon.
- [ ] Reduce fake glow; use controlled subtle halo only.
- [ ] Keep both well above all buildings.

### 9. Portals

- [ ] Reiki portal in front of Reiki hub.
- [ ] PGA portal in front of PGA hub.
- [ ] Smoker portal in front of Smoker Lounge.
- [ ] SVR Store portal in front of Store.
- [ ] Scorpion portal in front of Scorpion Room.
- [ ] Sponsor portal in front of sponsor/ad area.
- [ ] Keep glowing floor circles and hovering hologram logos.
- [ ] Remove old line connectors unless intentionally used as a designed pathway.

## Testing Checklist

### Must Pass Before Lock

- [ ] Open game successfully.
- [ ] Position panel still works.
- [ ] Reiki hologram visible.
- [ ] Reiki hologram audio is heard after click/tap/key unlock.
- [ ] Reiki volume panel visible and readable.
- [ ] Reiki audio fades in inside showroom.
- [ ] Reiki audio fades out outside showroom.
- [ ] Right stick locomotion works on Quest.
- [ ] Right stick snap-turn works on Quest.
- [ ] Grip/A/trigger teleport release works on Quest.
- [ ] Fist/pinch teleport release works on hand tracking.
- [ ] Watch orientation is corrected.
- [ ] Moon/Mars are visible high above buildings.
- [ ] No unwanted floor connector lines remain.

## Rollback Notes

If Reiki showroom breaks layout:

- Disable the expanded Reiki glass hub parent group.
- Keep core lobby and Reiki portal active.
- Keep prior hologram placement available.

If audio boost causes issues:

- Disable WebAudio gain node.
- Fall back to video.volume = 1.
- Keep volume panel visible and mark boost disabled.

If teleport breaks:

- Restore prior teleport module.
- Keep right-stick locomotion separate.
- Re-test release teleport independently.

If Moon/Mars hurt performance:

- Reduce sphere segments.
- Keep high placement and overall scale.
- Simplify procedural texture generation.

## PowerShell Backup / Commit Helper

Run from local repo root:

```powershell
$phase="98R-riki-update"; $stamp=Get-Date -Format "yyyyMMdd-HHmmss"; New-Item -ItemType Directory -Force -Path ".\backups" | Out-Null; Compress-Archive -Path ".\game\*" -DestinationPath ".\backups\game-$phase-$stamp.zip" -Force; git add game docs backups; git commit -m "Riki Update Phase 98R checklist and backup"; git push origin main
```

## Next Phase

Phase 98R should now implement the lock checklist above and avoid adding unrelated features until these items are stable.
