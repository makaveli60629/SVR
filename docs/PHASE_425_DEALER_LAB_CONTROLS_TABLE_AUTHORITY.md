# Phase 425 — Dealer Lab Controls + Table Authority

## Scope
Private Dealer Lab only. Public landing page and production lobby are untouched.

## Control-drawer rule
- Hide means minimize, never lose access to tuning controls.
- A persistent Adjustments action remains available in the quick bar and lower-right dock.
- Reopening Adjustments always opens the full drawer, not the compact drawer.
- Preview can hide the drawer, but Adjustments exits Preview and restores the full tuning surface.

## Table authority rule
- `table.glb` remains the hand-rest/rail geometry authority.
- Remove the lab-generated purple presentation rail and purple metallic trim.
- Keep only the lab synthetic felt overlay for visual/calibration work.
- Calibration guides are off by default and appear only when Guides is explicitly enabled.
- When enabled, the inner-wall guide uses a neutral/cyan diagnostic treatment rather than a purple tabletop-looking cover.

## Acceptance
1. User can always reopen full adjustments after Hide or Preview.
2. No lab-generated purple cover/ring appears around the tabletop during normal viewing.
3. Original table hand rest remains visible and unmodified.
4. Felt and collision/card surfaces remain independently tunable.
