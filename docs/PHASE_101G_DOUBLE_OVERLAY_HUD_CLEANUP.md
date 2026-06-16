# Phase 101G - Double Overlay HUD Cleanup

## Purpose

Fix the double overlays visible in the screenshot after the live route finally started serving the current Phase 260 game build.

## Screenshot issue observed

The screen showed multiple overlapping UI layers at once:

- Top-left status pills.
- Top-right phase label.
- Log and Joints buttons.
- Bottom scene navigation buttons.
- `VR NOT SUPPORTED` text overlapping the bottom nav.

This made the game look cluttered and unpolished for Webex/Desktop preview and Quest testing.

## Patch applied

### New file

```text
game/phase101g_hud_overlay_cleanup.js
```

This module:

- Hides duplicate HUD overlays by default.
- Hides bottom scene navigation by default.
- Hides top-right phase badge by default.
- Hides Log/Joints debug buttons by default.
- Suppresses the `VR NOT SUPPORTED` badge when not in debug mode.
- Keeps debug mode available with URL params:

```text
?debug
?hud
?showHud=1
```

### Phase 260 wire-in

`game/phase260_roman_canopy_archway_final_lock.js` now imports:

```text
./phase101g_hud_overlay_cleanup.js?v=phase101g-hud-overlay-cleanup
```

This makes the cleanup load after the current Phase 260 entry without rewriting the full `game/index.html` file.

## Locked rule

This is a HUD cleanup only.

- No lobby redesign.
- No geometry rebuild.
- No website rebuild.
- No Android movement change.
- No Unity-only logic.

## Validation checklist

- [ ] Game still loads Phase 260.
- [ ] Top-left HUD is compact or hidden.
- [ ] Top-right phase badge is hidden in clean mode.
- [ ] Bottom scene navigation is hidden in clean mode.
- [ ] Log/Joints debug buttons are hidden in clean mode.
- [ ] `VR NOT SUPPORTED` does not overlap the bottom nav.
- [ ] Debug overlays can still be shown with `?hud`.

## Commit name

```text
Phase 101G - Fix Double Overlays, Clean HUD, Keep Debug Optional
```
