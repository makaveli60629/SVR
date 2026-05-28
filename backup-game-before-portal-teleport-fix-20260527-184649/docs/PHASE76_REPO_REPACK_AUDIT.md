# Phase 76 Repo Repack Audit

Source: user-uploaded `game_phase76_hotfix.zip`

## Findings
- The uploaded archive contains **two different builds**.
- The **root-level build** is the correct newer Phase 76 hotfix runtime.
- The nested `game/` folder is an **older Phase 42** package and should not be used as the restore source for the lobby.

## Why the lobby was missing
If the archive is deployed using the stale nested `game/` folder, or if the root-level build is copied without wrapping it into a repo `game/` directory, the repo can boot into the wrong scene or a stripped/blank room.

## What this repack does
- Takes the **root Phase 76 runtime** and places it inside a repo-ready `game/` directory.
- Excludes the stale nested Phase 42 package.
- Preserves the Phase 76 lobby features already present in the uploaded archive.

## Preserved content from the Phase 76 runtime
- skyline / branded lobby room
- watch module
- teleport module
- store wall
- Reiki area
- chairs / table / demo seat layout
- dealer / seated bots / poker demo path
- moon / mars / sprites / CAM3 preview files

## Limits
This repack does **not** automatically merge later stripped-build fixes from unrelated repo phases. It is meant to restore the uploaded lobby build cleanly first.
