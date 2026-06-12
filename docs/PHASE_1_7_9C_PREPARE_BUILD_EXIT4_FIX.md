# Phase 1.7.9C â€” Prepare Build Exit Code 4 Fix

## Problem

The deploy failed during:

```text
Prepare static Pages build
Error: Process completed with exit code 4.
```

The visible log stopped during the build file listing. The previous workflow used a pipeline ending in `head`, which can fail under `pipefail` when the output is longer than the limit.

## Fix

This workflow:

- avoids `rsync`
- avoids fragile `find | ... | head` pipefail behavior
- writes file listing to `/tmp/svr-build-files.txt`
- uses `sed -n` to show the first 220 lines safely
- keeps sparse checkout
- keeps disk cleanup
- creates guaranteed fallback routes:
  - `/reiki/`
  - `/android/`
  - `/downloads/`
  - `/site/presentations/reiki/`
  - `/site/android/`
  - `/site/downloads/`

## Test

```text
https://svrpoker.com/deploy-health.json?v=1-7-9c
https://svrpoker.com/reiki/?v=1-7-9c
https://svrpoker.com/android/?v=1-7-9c
https://svrpoker.com/site/presentations/reiki/?v=1-7-9c
https://svrpoker.com/site/android/?v=1-7-9c
```
