# Phase 181 Hand Ray Table Selector Lock

## Purpose

Bind the hologram table selector to Quest-style select input and controller select input while keeping desktop click support.

## Updated

- game/modules/phase180_table_selector.js
- game/phase176_boot.js

## Features

- Gaze/center-ray focus highlight.
- Quest select event selects the focused table card.
- Controller trigger/select event selects the focused table card.
- Desktop pointer click remains available.
- Shared API remains available.

## Runtime API

window.SVR_SELECT_TABLE(tableId)

window.SVR_SELECT_FOCUSED_TABLE()

## Runtime marker

window.SVR_PHASE181_TABLE_SELECTOR

## Test checklist

1. Desktop: click a table card.
2. Desktop: use console window.SVR_SELECT_TABLE('final').
3. Quest: look/aim at a hologram card.
4. Quest: use select/pinch gesture.
5. Controller: aim at a hologram card and press trigger/select.
6. Confirm the selected card highlights.
7. Confirm no wall boundary break occurs.

## Commits

- 89aac3ac8567cf1ac0b03c46aa973549c8be4b69
- 0764e92b2b79e09c15732175d5437567fc4c0c5e
