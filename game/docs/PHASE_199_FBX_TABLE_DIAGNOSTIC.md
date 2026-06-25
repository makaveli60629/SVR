# Phase 199

Game-side only.

Added module:
- `game/modules/phase199_fbx_table_runtime_diagnostic_lock.js`

Summary:
- scans runtime for table object names
- selects best table candidate
- forces selected table visible
- exposes top candidates for debugging

Runtime audit:
```js
SVR_RUN_PHASE199_TABLE_AUDIT()
```

Test URL:
`/game/?v=phase199-fbx-table-runtime-diagnostic`
