# Phase 202

Game-side only.

Added module:
- `game/modules/phase202_fbx_asset_path_recovery_lock.js`

Boot change:
- restored the table loader before table alignment modules

Purpose:
- check table asset paths
- report reachable FBX candidates
- report loader status
- report table diagnostic status

Runtime audit:
```js
SVR_RUN_PHASE202_FBX_AUDIT()
```

Test URL:
`/game/?v=phase202-fbx-asset-path-recovery`
