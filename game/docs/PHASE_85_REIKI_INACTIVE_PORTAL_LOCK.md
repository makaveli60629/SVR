# Phase 85 — Reiki Inactive Portal Lock

Game-side only patch. Moves the MP4 into an inactive standalone Reiki video portal so it cannot block main lobby boot. Adds a boot fallback link if the Three.js runtime stalls. Site untouched.

Package-size note: kept Lobby 07 audio and removed optional duplicate/secondary music tracks to preserve the under-25MB deployment rule with the MP4 portal included.

Optimization note: removed optional raw FBX seated-bot payload from web package; procedural fallback remains safer for boot and package size.
