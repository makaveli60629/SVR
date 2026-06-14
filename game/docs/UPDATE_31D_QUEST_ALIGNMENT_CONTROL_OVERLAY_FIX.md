# Update 3.1-D — Quest Alignment / Control / Overlay Fix

## Scope
Game-side only. Site untouched.

## User-reported blockers addressed
- Top-tab phase/title flicker from old phase modules writing over each other.
- Missing upstairs floors in the active 3.1 runtime.
- Quest forward movement not following the 45-degree snap turn direction.
- Transparent dark squares stuck in front of the Oculus view.
- Teleport target distance feeling fixed.
- No near-target / magnetic selection assist near Play Game and portals.
- Moon needs to stay high in the sky, use a stronger crater texture, and rotate.
- Lobby floor colors too dark to read.

## Files changed
- `game/phase224_quest_alignment_control_overlay_fix.js`
- `game/modules/teleport_phase215.js`
- `game/index.html`
- `game/phase176_boot.js`
- `game/update31_version_sync_lock.js`
- `game/update31_moon_phase_hard_lock.js`
- `game/phase223_phase_diag_log.js`
- `game/phase219_scifi_obj_silhouette_lock.js`
- `game/phase220_upstairs_destination_flow.js`
- `game/docs/BUILD_VERSION.json`
- `update/version.json`

## Runtime label
`UPDATE-3.1-D-QUEST-ALIGNMENT-CONTROL-OVERLAY-FIX`

## Test URL
`https://svrpoker.com/game/?v=phase224-quest-alignment-control-overlay-fix`

## Oculus test checklist
- [ ] Top browser tab/title should stay on Update 3.1-D without flicker.
- [ ] Enter Oculus VR and confirm no transparent dark squares are stuck in front of the eyes.
- [ ] Snap turn 45 degrees and push forward. Forward should follow the turned/view direction.
- [ ] Hold grip/trigger to aim teleport.
- [ ] While aiming teleport, push stick up/down to move target closer/farther.
- [ ] Aim near Play Game / Wellness / PGA / Scorpion / Store / Sponsor targets and confirm magnetic assist catches nearby targets.
- [ ] Confirm upstairs floors are visible and colored.
- [ ] Confirm Moon remains high in the sky, textured, haloed, and rotating.
- [ ] Confirm Mars remains high near the Moon.

## Notes
This pass is an alignment and stability correction pass, not a redesign. The lobby remains the hub layout and private-room content stays outside the lobby.
