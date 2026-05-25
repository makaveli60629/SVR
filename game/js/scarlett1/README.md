# SVR Scarlett1 Enterprise Modules

Phase 175 adds the uploaded master manifest module catalog as safe, isolated JavaScript files.

These modules are **not automatically script-loaded into the game runtime**. The runtime loads `game/modules/enterprise_bridge.js` only. This keeps the current lobby and poker build safe while preserving the enterprise module code for controlled activation.

Default safety:

```js
window.SVR.config.backendEnabled = false;
window.SVR.config.multiplayerEnabled = false;
window.SVR.config.sponsorInjectionEnabled = false;
```

Enable only after API/backend health checks pass.
