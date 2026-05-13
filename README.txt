Scarlett VR Poker — Site Hotfix

What this does (non-invasive):
- Stabilizes footer height so it stops “jumping” when banners change.
- Adds a red “COMING SOON • UNDER CONSTRUCTION” label next to LIVE STATUS.
- Adds a single live-status bulb:
  - Orange while booting
  - Green when the game preview iframe loads
  - Red if iframe errors
- Forces favicon/logo on pages that are missing the tab icon.

How to install (minimal touch):
1) Copy these files into your repo:
   - /css/site_hotfix.css
   - /js/site_hotfix.js

2) In your main site HTML (root index.html), add:
   <link rel="stylesheet" href="/css/site_hotfix.css?v=1">
   <script defer src="/js/site_hotfix.js?v=1"></script>

That’s it. No layout changes needed.
