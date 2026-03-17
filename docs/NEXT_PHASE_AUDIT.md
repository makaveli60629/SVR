# SVR Poker Next Phase Audit — 2026-03-17

## Project audit highlights
- The modular game overlay is the cleanest current ship path.
- Repo workflow still overlays `update/site.zip` into the build root and `update/game.zip` into `/game`.
- No local audio assets (`.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`, `.flac`) were found in the checked-in repo during this audit.
- Two generated ambient WAV tracks were added to the phase package so the watch playlist can function immediately.

## This phase focuses on
- live site game preview window restoration
- room/world scale and atmosphere pass
- smoother teleport marker and logo landing pad
- real-table-only scene cleanup
- textured Eric placement and seat-state watch controls
