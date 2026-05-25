# PHASE-250-BOOTJS-SYNTAX-HARDRESET-LOCK

Fixes boot fallback:
SyntaxError: Unexpected identifier 'r'
at /game/boot.js?v=phase249

Direct fixes:
- Rewrites game/boot.js with clean parser-safe code.
- Rewrites game/modules/optional_module_loader.js with clean parser-safe code.
- Bumps cache to phase250.
- Preserves earlier runtime/visible recovery fixes by keeping main.js markers current.
- Public Matrix page untouched.
