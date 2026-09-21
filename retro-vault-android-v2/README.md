# Retro Vault v2 Android Test

This is the second Android test package for Retro Vault.

## What changed from v1

- New package ID so it can install beside the broken test build.
- Targets Android 16 / API 36.
- Loads the emulator UI from the HTTPS production route instead of a local file:// origin.
- Uses Android's system file picker for ROM/BIOS selection.
- No broad storage permission.
- Native loading indicator, retry screen, and browser fallback.
- WebView Safe Browsing enabled.
- Mixed HTTP content disabled.
- Includes the Retro Vault v2 web self-test cartridge on the hosted page.

## Test order

1. Install Retro Vault v2.
2. Tap RUN BUILT-IN TEST ROM.
3. Confirm the emulator UI loads and the original NES test cartridge starts.
4. Return to the library.
5. Choose a small NES, GB, GBA, or SNES ROM you are authorized to use.
6. Test touch controls and audio.

No commercial ROMs or proprietary BIOS files are included.
