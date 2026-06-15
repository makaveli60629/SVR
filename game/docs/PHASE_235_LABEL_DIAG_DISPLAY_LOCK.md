# Phase 235 — Label + Diagnostic Display Lock

## Active build

```text
UPDATE-3.1-O-PHASE-235-LABEL-DIAG-DISPLAY-LOCK
```

## Scope

- Game-only.
- Site untouched.
- Safe entry remains active.
- Runtime modules remain paused until the next controlled repair pass.

## Locked rule

Every future game phase must include:

- visible phase label
- diagnostic display
- active build label
- route/status readout
- siteTouched status
- phase/build metadata

## Current display

- Top-right label: `PHASE 235 ACTIVE • LABEL + DIAG LOCK`
- Top-left diagnostic panel: phase, build, route, status, runtime state, site status, clock

## Purpose

This prevents phase confusion during recovery and makes it immediately obvious which game entry is live.
