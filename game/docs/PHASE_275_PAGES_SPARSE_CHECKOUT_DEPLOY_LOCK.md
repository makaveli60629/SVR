# Phase 275 Pages Sparse Checkout Deploy Lock

Build: `PHASE-275-PAGES-SPARSE-CHECKOUT-DEPLOY-LOCK`

## Summary

Phase 275 hardens the GitHub Pages deployment after the Phase 273/274 deploy failure.

## Fix

Updated:

```text
.github/workflows/pages.yml
```

The workflow now:

- checks out only public deploy paths
- uses `filter: blob:none`
- uses sparse checkout for `index.html`, `CNAME`, `404.html`, `game`, `site`, and `update`
- stages a lightweight `_pages` artifact
- excludes large source/binary files during copy

## Test

Open GitHub Actions and run:

```text
Deploy SVR to GitHub Pages
```

Then test:

```text
https://svrpoker.com/game/?v=phase275-pages-sparse-checkout-deploy
```
