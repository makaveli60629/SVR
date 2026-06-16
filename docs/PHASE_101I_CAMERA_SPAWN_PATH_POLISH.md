# Phase 101I - Camera/Spawn Alignment and Canopy Path Polish

## Purpose

Improve the first visible desktop/Webex camera view and make the walking path feel cleaner after Phase 101G/H removed UI and duplicate geometry clutter.

## Issue addressed

The screenshot showed the player/camera starting too close to the side of the Roman canopy/table area. The first view felt crowded, angled, and not centered down the lobby lane.

## Patch applied

### New module

```text
game/phase101i_camera_spawn_path_polish.js
```

This module:

- Pulls the desktop/Webex camera slightly backward.
- Centers the view down the main aisle.
- Looks toward the lobby center instead of the canopy edge.
- Adds low transparent path guide lines that do not block walking.
- Adds a subtle center runner to clarify the walking path.
- Removes remaining stale near-view Phase 257/258/259 clutter if it reappears.

### Phase 260 wire-in

`game/phase260_roman_canopy_archway_final_lock.js` now imports:

```text
./phase101i_camera_spawn_path_polish.js?v=phase101i-camera-spawn-path-polish
```

## Desktop/Webex camera target

```text
Position: (0, 1.62, 9.45)
LookAt:   (0, 1.42, -3.65)
```

This is for desktop/Webex presentation view only. It does not override active Quest XR movement.

## Preserved

- Phase 260 Roman canopy.
- Quest/WebXR runtime.
- Teleport.
- Head-forward movement.
- Android compatibility.
- Watch module.
- Reiki/PGA/Sponsor route targets.

## Debug data

Available in browser console:

```text
window.SVR_PHASE101I_CAMERA_PATH
```

## Validation checklist

- [ ] First desktop/Webex view starts farther back.
- [ ] Camera faces cleanly down the main aisle.
- [ ] Canopy is still visible but not crowding the view.
- [ ] Walking path reads clearly.
- [ ] Phase 260 remains active.
- [ ] Quest XR camera is not forced after entering VR.
- [ ] No lobby redesign occurred.

## Locked rule

This is camera/path polish only. No website rebuild, no Android movement changes, no Unity-only logic, and no sponsor content changes.

## Commit name

```text
Phase 101I - Camera Spawn Alignment and Canopy Path Polish
```
