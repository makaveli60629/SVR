# Phase 100 — Fist Unclench Release Teleport Lock

## Scope
Game/WebXR only. Website/site remains locked and untouched.

## Fixed
- Fist unclench/release now teleports to the last valid target.
- Quest hand tracking drop during unclench is treated as a release event instead of resetting teleport.
- Last good target is preserved while fist/pinch is held.
- Brief aim failure while clenching no longer erases the release target.

## Control behavior
```text
Hold fist or pinch -> aim -> unclench/release -> teleport leap
```

## Preserved
- Phase 99 floor-lower no-blink fix.
- Phase 98 watch orientation fix.
- North-sky Moon/Mars.
- Reiki portal hologram.
- Private scene routing.

## Test
Open:

```text
https://svrpoker.com/game/?v=phase100-fist-release-teleport
```

Verify on Quest:

- Make a fist or pinch.
- Aim until the purple target appears.
- Unclench/release the fist.
- Player should teleport to the last purple target immediately.
