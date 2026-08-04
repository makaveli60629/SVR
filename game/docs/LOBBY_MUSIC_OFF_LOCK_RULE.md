# Lobby Music Off Lock Rule

## Status
LOCKED: lobby music must stay disabled.

## Rule
No lobby music may autoplay, start on XR session entry, start from the watch, start on page load, or restart after teleport.

## Runtime expectation
The runtime must expose:

```js
window.SVR_AUDIO_DISABLED = true;
```

The watch music button may remain visible only as a harmless disabled/no-op control, or it may be relabeled as disabled.

## Blocked
Do not add or restore:

- lobby MP3 autoplay
- `07.mp3` autoplay
- ambient music autoplay
- Reiki music autoplay
- automatic audio on XR session start
- background track restart from watch controls

## Allowed
Only explicitly approved non-music sound effects may be added later.

## Date
2026-06-06
