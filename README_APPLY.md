# Scorpion Room Table Integration — Local Apply Pack

## Files included

- `Manifest/room-update.scorpion-table.json`
- `Tools/SVR-ApplyRoomUpdate.ps1`
- placeholder folders for `GameData/` and `Reports/`

## Apply from repo root

```powershell
cd C:\Users\ronal\SVR
powershell -ExecutionPolicy Bypass -File .\Tools\SVR-ApplyRoomUpdate.ps1
```

## What the script does

- Reads the manifest.
- Backs up affected files under `Backups/scorpion-room-table-<timestamp>/`.
- Creates/updates room, card, chip, avatar, watch UI, sky, and feature-flag JSON files.
- Writes `Reports/scorpion-room-update-report.txt`.

## Scope lock

This pack prepares local data and validation scaffolding. It does not claim the runtime scene code has already been modified.
