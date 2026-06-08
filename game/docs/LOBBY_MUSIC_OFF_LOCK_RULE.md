# Lobby Music Off Lock Rule

## Status
LOCKED: lobby music must stay disabled.

No lobby music may autoplay, start on XR session entry, start from the watch, or start from page load.

Runtime expectation:

```js
window.SVR_AUDIO_DISABLED = true;
```

Blocked:
- `07.mp3` autoplay
- lobby MP3 autoplay
- Reiki music autoplay
- audio start on XR session
- watch music restart

Date: 2026-06-06
