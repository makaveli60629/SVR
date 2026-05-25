# PHASE-228-PILOT-FEEDBACK-EXPORT-LOCK

Phase 228 improves the phase update workflow so the user only needs one stable PowerShell script plus the latest all-in packet.

## Locked rules
- Public Matrix launch page untouched.
- Game deploy remains direct `/game` folder.
- `update/game.zip` is kept as a backup artifact.
- Package remains under 25 MB.

## User workflow
```powershell
cd C:\Users\ronal\SVR
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\SVR-AUTO-APPLY-NEXT.ps1"
```

The script finds the highest-numbered `SVR_PHASE*_NEXT_PACKET.zip` in Downloads, expands it, runs the internal apply script, commits, and pushes.
