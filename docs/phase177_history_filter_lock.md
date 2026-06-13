# Phase 177 History Filter Lock

## Purpose

This phase adds the safe public replay filter for arena screens and future hand recording.

## Added

- game/modules/phase177_hand_history_public_filter.js
- game/data/broadcast/hand_history_schema_phase177.json

## Updated

- game/phase176_boot.js

## Runtime marker

window.SVR_PHASE177_HAND_HISTORY

## Logic

The private hand record contains full player hand data for admin review.

The public view removes private player hand data during active play.

Arena screens should use only the public view.

Admin tools can use the admin view for review and fraud checks.

## Database plan

Tables:

- events
- tables
- hands
- hand_players
- hand_actions
- public_replay_frames
- media_queue

## Test

Open the browser console and check:

window.SVR_PHASE177_HAND_HISTORY.publicView

The private card field should be hidden in the public view.
