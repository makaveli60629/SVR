# Phase 174A Audit Patch

## Audit findings

1. Phase 173 and Phase 174 cleanup rules were too broad around legacy phase names.
2. The old cleanup could accidentally hide locomotion visual helpers such as the purple hand glow.
3. The old cleanup preserved any object named moon or mars, which could allow duplicate old planets to remain.
4. Late-loaded wall or city objects could still appear after the first cleanup pass.

## Fix added

New file:

`game/modules/phase174_audit_patch.js`

This patch runs after boot and repeatedly hides late clutter while preserving controls and approved objects.

It preserves:
- Phase 173 single octagon wall
- Phase 171 approved Moon and Mars
- Phase 172 sponsor module
- teleport visuals
- purple hand glow
- watch
- controller objects

It hides:
- duplicate planets
- old wall layers
- background buildings
- skyline remnants
- towers and city objects
- billboard clutter
- far outside mesh clutter

## Updated

`game/phase141_label_fix.js`

Now loads:
- Phase 173 single wall
- Phase 173 locomotion audit
- Phase 174 wall guard
- Phase 174A audit patch

`game/version.json`

Now tracks:

`UPDATE-3.0-PHASE-174A-AUDIT-PATCH-LOCK`

## Test URL

`/game/?v=phase174a-audit-patch&phase173=1`

## Runtime marker

`window.SVR_PHASE174_AUDIT_PATCH`

## Commits

- b49140b1ce686faec59ddc87a70ead716e7cd491
- 79cf7a8c9c79affb9c2c8589217dd186f4bbdb65
- 184212b8f30226c38bf3090ed418285762a1d43d
