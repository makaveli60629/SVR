# Phase 184 Lobby Experience Polish Lock

## Purpose

Add the next lobby experience layer: first-time player guidance, bonus kiosk, Scorpion portal focus, Legends cleanup, hand tutorial, and Moon/Mars polish.

## Added

- game/modules/phase184_lobby_experience_polish.js

## Updated

- game/phase176_boot.js

## Features

- Start path from spawn to Play Game.
- Start Here sign.
- Daily Bonus kiosk.
- Scorpion Room premium portal sign and glow.
- Legends header.
- Legends pedestals.
- Floor-locked mannequin placeholders.
- Quest hands tutorial sign.
- Large rotating moon.
- Small Mars in the back sky.
- Soft moonlight driver for visual reflection direction.
- Auto-hide for old fake/picture sky planet objects by name.

## Runtime marker

window.SVR_PHASE184_EXPERIENCE

## Test

/game/?v=phase184-polish

## Checklist

1. Spawn path is visible.
2. Play direction is clear.
3. Daily Bonus kiosk appears.
4. Scorpion Room portal is obvious.
5. Legends area has pedestals and no floating mannequins from this phase.
6. Moon is large and high.
7. Mars is smaller and behind it.
8. Movement boundaries remain locked.
9. Table selector remains active.
10. Tier ads remain passive and sliding.

## Commits

- 32f71a4fe10c2fbc8e4bc558cd65729cc84ec5f6
- 4a9ff7bb49d42bb12ac5a22d9017c90d5a2fa31c
