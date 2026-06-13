# Phase 176 Arena Plan

## Layout

Outer ring: hubs and storefronts.

Middle ring: walking and viewing space.

Center zone: featured table for demo or event mode.

## Screens

Four large screens are placed around the center area.

They show a public action view with pot, board, stacks, and action text.

Player hand cards are not shown while action is live.

## Data plan

Store hand history as structured data:

- event id
- table id
- hand id
- seats
- stacks
- public board
- action list
- pot updates
- result

The public screen view should be generated from safe public fields only.

## Files

- game/modules/phase176_lobby_arena_broadcast.js
- game/phase176_boot.js
- game/data/broadcast/demo_replay_phase176.json

## Test

/game/?v=phase176-arena-screen
