# SVR Repo Restore Bundle — Phase 61

This is the small repo-safe bundle.

1. Drop this bundle into the repo root.
2. Commit and push.
3. Keep the larger SVR-Vault folder outside the repo.
4. When a bad phase breaks the game, unpack the vault next to the repo and run:

```powershell
.\tools\Recover-SVRPack.ps1
```


## Phase 62 note
- Quest-lite startup disables remote WebXR controller/hand profile fetches to reduce headset boot failures.
- The marketing HUD cycles through a scripted hand state for promo capture.
- Use `?lite=1` on desktop/mobile to force the smallest boot path.
