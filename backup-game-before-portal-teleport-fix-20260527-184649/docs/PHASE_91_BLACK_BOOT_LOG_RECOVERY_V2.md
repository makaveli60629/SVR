# Phase 91 Black Boot Log Recovery V2

Date: 2026-05-27 18:10:58
Track: Game-side only
Build: PHASE-91-BLACK-BOOT-LOG-RECOVERY-V2

## Problem
The game could show a black Booting screen with no useful log when the module graph or a top-level await failed before visible error reporting was active.

## Fix
- Added game/boot-failsafe.js as a dependency-free early boot guard.
- Changed game/index.html to dynamically import main.js and catch module import failure visibly.
- Added visible recovery overlay with copyable logs, version link, deploy-health link, and no-cache reload.
- Added ready markers from game/main.js once the real lobby reaches the final runtime state.
- Updated game/version.json and update/version.json.
- Site/public Matrix page untouched.

## Test URLs
- https://svrpoker.com/game/?v=phase91-black-boot-log-recovery-v2
- https://svrpoker.com/game/version.json?v=phase91-black-boot-log-recovery-v2
- https://svrpoker.com/game/deploy-health.json?v=phase91-black-boot-log-recovery-v2

## Expected result
If the lobby loads, the recovery overlay disappears. If it fails, the recovery overlay stays visible and shows the actual boot reason instead of a silent black screen.