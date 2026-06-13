# Phase 180 Table Selector Lock

## Purpose

Connect the hologram mini-table selector to a real table selection API.

## Added

- game/modules/phase180_table_selector.js

## Updated

- game/phase176_boot.js

## Features

- Six hologram table cards.
- Demo Table.
- Low Stakes.
- Mid Stakes.
- Freeroll.
- Final Table preview.
- Scorpion Room.
- Desktop click selection.
- Shared API for future hand/controller interaction.

## Runtime API

window.SVR_SELECT_TABLE(tableId)

Table ids:

- demo
- cash-low
- cash-mid
- freeroll
- final
- scorpion

## Runtime marker

window.SVR_PHASE180_TABLE_SELECTOR

## Current status

This phase connects the hologram table selector visually and functionally for desktop click and shared API. Next pass should bind Quest hand pinch ray and controller ray directly to these same table cards.

## Test

Open the game and click a hologram table card.

Console test:

window.SVR_SELECT_TABLE('freeroll')

## Commits

- 09bb2b4dd0ab2eb67ff3451141596b0f41699610
- 25b9ec87e6dc794ff55a48ecc0eb1544d2ce974b
