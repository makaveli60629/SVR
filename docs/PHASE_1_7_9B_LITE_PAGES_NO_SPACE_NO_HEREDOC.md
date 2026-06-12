# Phase 1.7.9B â€” Lite Pages No-Space No-Heredoc Deploy Fix

## Why this exists

The previous GitHub Actions failure was:

```text
No space left on device
```

The local PowerShell errors showing `Boolean` / `String[]` happened because GitHub runner stack-trace lines were pasted into the local PowerShell prompt. Those lines are not commands.

## What changed

- Frees GitHub runner disk before checkout.
- Uses sparse checkout and blob filtering.
- Avoids ZIP extraction.
- Avoids Bash heredoc blocks.
- Uses safe `printf` fallback pages.
- Deploys only public static folders.
- Adds `/deploy-health.json`.

## Test after deploy

```text
https://svrpoker.com/deploy-health.json?v=1-7-9b
https://svrpoker.com/reiki/?v=1-7-9b
https://svrpoker.com/android/?v=1-7-9b
https://svrpoker.com/site/presentations/reiki/?v=1-7-9b
https://svrpoker.com/site/android/?v=1-7-9b
```
