# Black Boot Diagnostic

## Root cause found
The current `game.zip` failed before the world could render because `main.js` was malformed:

- it opened with `async function init(){`
- then used static `import ...` statements **inside** that function body
- browser module parsing stops there before boot can continue

That leaves the HUD at **Booting...** with a black scene.

## Exact fix applied
- moved all static imports to top-level in `main.js`
- kept `async function init()` for runtime boot
- normalized the boot failure text line so a thrown error will display cleanly

## Next step
Deploy the new `game.zip` and verify the build progresses past **Booting...**.
