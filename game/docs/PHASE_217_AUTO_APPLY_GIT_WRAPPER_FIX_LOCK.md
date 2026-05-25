
# PHASE-229-POWER-DEPLOY-WATCHER-LOCK

## Purpose
Fixes the PowerShell updater failure where the apply script wrapper passed git arguments incorrectly and Git opened help instead of running the intended subcommand.

## Locked rules
- Public Matrix launch page untouched.
- Direct `/game` folder deployment preserved.
- `update/game.zip` kept only as backup artifact.
- Game remains under 25 MB.

## Correct user workflow
Download the newest `SVR_PHASE###_NEXT_PACKET.zip`, keep `SVR-AUTO-APPLY-NEXT.ps1` in Downloads, then run:

```powershell
cd C:\Users\ronal\SVR
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\SVR-AUTO-APPLY-NEXT.ps1"
```
