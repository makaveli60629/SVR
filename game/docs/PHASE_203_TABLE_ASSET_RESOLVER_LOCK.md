# Phase 203

Game-side only.

Added:
- `game/modules/phase203_table_asset_resolver_lock.js`

Evidence:
- Prior table patch expected the real uploaded table at `game/assets/table.fbx`.

Purpose:
- verify the primary table FBX asset path
- verify all known table candidate paths
- report whether the asset is reachable
- report whether the loader completed
- report whether the runtime table diagnostic found the table

Runtime audit:
```js
SVR_RUN_PHASE203_TABLE_ASSET_AUDIT()
```

Test URL:
`/game/?v=phase203-table-asset-resolver`
