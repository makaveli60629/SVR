# Phase 84I — R Seat Runtime Hotfix

Fixes the live boot error: `ReferenceError: R is not defined at makeSeat`.

Changes:
- Adds a local room-radius fallback inside `makeSeat`.
- Preserves Espresso building ad.
- Preserves site untouched rule.
- Preserves Reiki approval placeholder rule.
