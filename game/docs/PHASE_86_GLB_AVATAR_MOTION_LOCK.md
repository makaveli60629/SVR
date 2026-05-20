# Phase 86 — GLB Avatar Motion Lock

## Scope

Game-side only. Do not touch the website/site track.

## Goal

Add a seated avatar motion controller for Scorpion poker table bots.

## Locks

- Use optimized GLB/VRM-style avatars when available.
- Do not depend on heavy raw FBX runtime payloads.
- Never show a T-pose fallback.
- If GLB loading fails, use a procedural seated fallback bot.
- Preserve five bots plus one open south/front user seat.
- Preserve invisible dealer logic.
- Preserve left-to-right dealing.
- Keep package under 25 MB.
- No website files modified.

## Added module

```text
game/modules/avatar_seated_controller.js
```

## Motion states

- idle
- waiting
- active
- check
- call
- raise
- fold
- peek
- win
- lose
- showdown

## Event hooks

The module listens for safe poker events:

```text
svr:poker:turn
svr:poker:action
svr:poker:showdown
svr:poker:winner
```

## Validation

- Load Scorpion Room.
- Confirm bots appear seated.
- Confirm no T-pose appears.
- Confirm fallback works if GLB missing.
- Confirm active bot moves on turn event.
- Confirm fold/call/raise/win actions change posture.
- Confirm no site files changed.
