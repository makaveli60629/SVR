# SVR Repo Restore Bundle — Phase 61

This is the small repo-safe bundle.

1. Drop this bundle into the repo root.
2. Commit and push.
3. Keep the larger SVR-Vault folder outside the repo.
4. When a bad phase breaks the game, unpack the vault next to the repo and run:

```powershell
.\tools\Recover-SVRPack.ps1
```
