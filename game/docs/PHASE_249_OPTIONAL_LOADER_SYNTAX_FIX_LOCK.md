# PHASE-249-OPTIONAL-LOADER-SYNTAX-FIX-LOCK

Fixes boot fallback:
SyntaxError: Unexpected string

Root cause:
- game/modules/optional_module_loader.js had a malformed module array.
- Missing comma after auto_apply_git_wrapper_fix.js.
- Literal backtick-r/backtick-n text was inserted into JavaScript.

Direct fixes:
- Rewrites optional_module_loader.js with a clean valid array.
- Bumps cache to phase249.
- Preserves Phase 248 recovery guard and earlier runtime fixes.
- Public Matrix page untouched.
