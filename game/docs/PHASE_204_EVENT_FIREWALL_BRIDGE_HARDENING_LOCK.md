# PHASE-204-EVENT-FIREWALL-BRIDGE-HARDENING-LOCK

## Purpose
Fixes the next class of runtime crashes after the missing recorder method issue by adding a runtime event firewall and hardening the enterprise bridge event listeners.

## Added
- `game/modules/event_firewall.js`
- Safe enterprise bridge listener wrapper
- Bridge error recorder
- Event-firewall capture for high-risk poker/watch/QA events
- Build/version markers updated to Phase 204

## Locked protections
- Public Matrix launch page untouched
- Dealer body disabled
- Invisible dealer/card logic preserved
- No unapproved Reiki/Trueitive/founder runtime references
- Package kept under 25 MB
