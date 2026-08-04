# Phase 213

Game-side only.

Added:
- `game/modules/phase213_active_module_audit_update_lock.js`

Purpose:
- full active module audit
- confirms current boot modules
- confirms removed fighting modules stay out of boot
- keeps stable labels/chips from Phase 212
- keeps movement/balcony from Phase 210
- keeps table loader/diagnostic modules active

Runtime audit:
```js
SVR_RUN_PHASE213_FULL_MODULE_AUDIT()
```

Active boot excludes old fighting visual modules:
- Phase 191, 192, 194, 196, 197, 198, 205, 206, 207, 208, 209

Test URL:
`/game/?v=phase213-active-module-audit-update`
