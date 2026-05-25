# PHASE-247-BLACK-SCREEN-RENDER-LOOP-GUARD-LOCK

Fixes black-screen continuation after runtime shield.

Direct fixes:
- Adds safeLoopStep(source, fn) in main.js.
- Isolates world_tick, hands_update, hands_debug, teleport_update, watch_update, renderer_render.
- Adds emergencyRenderFrame() so a shielded animation-loop error still draws a frame.
- Adds window.SVR_MAIN_RUNTIME_STATE.subsystemErrors.
- Adds black_screen_render_loop_guard.js diagnostic panel.
- Public Matrix page untouched.
