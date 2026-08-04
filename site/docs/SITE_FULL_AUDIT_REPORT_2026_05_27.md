# SVR Site Full Audit Report — 2026-05-27

Track: Website / site audit  
Game touched: false  
Public root touched: false  
Scope: repo site files, public root page, site routing, public hooks, Matrix layer, deploy workflow, and live page spot-checks

---

## Executive Summary

The site is functional, but there is a major deployment/content drift issue between the current repository files and what the live website is serving.

The repository currently contains a more advanced `/site/index.html` marketing page with Phase 93 visual direction, live iframe preview, profile/store/sponsor navigation, and premium site layout.

The live website, however, still shows an older one-page site preview when clicking `Preview Site` from the public launch page. This means the live deploy is stale, cached, or deploying from a different source than expected.

The public root page is still the simple launch shell with Matrix canvas, logo, status badges, Preview Site, Launch VR Room, and Leave Message links. That part is stable and should stay protected.

---

## Current Public Root Audit

Repo file: `index.html`

Confirmed present:
- Public launch title
- Matrix canvas
- logo reference
- admin/server/database status badge container
- Preview Site link
- Launch VR Room link
- Leave Message link
- official footer
- `matrix.js`
- `site-public-hooks.js`

Public root is intentionally simple and should remain protected unless explicitly editing the public launch page.

### Notes

The repo default status badge starts as online in static HTML, but the live page displayed Admin Offline during audit. That is acceptable if the API/fallback state is correctly painting the current admin state.

---

## Current `/site/` Repo Audit

Repo file: `site/index.html`

Confirmed present:
- Premium Social VR Poker title/meta
- Matrix canvas
- market navigation
- links to System, Profile, About, Sponsors, Advertising, Billboards, Store, Membership, Impact, Contact
- Phase 93 visual hero
- live director-camera iframe preview
- Open Full Game button
- Open Store button
- Profile and Contact actions
- Private room note
- footer links

This repo version is much stronger than the live `/site/index.html` observed in the browser. It should be treated as the intended current site baseline unless the user chooses the older one-page page.

---

## Store Page Audit

Repo file: `site/store.html`

Confirmed present:
- Store title/meta
- VR-friendly layout
- item category cards
- partner/sponsor product language
- event drop language
- future API note
- Open Game / Membership / Advertising links

### Status

The store page is professional and usable as a public store preview. It does not expose live checkout secrets.

### Remaining improvement

Add a clear `Preview Only / Checkout Not Live Yet` banner if Stripe remains disabled.

---

## Contact Page Audit

Repo file: `site/contact.html`

Confirmed present:
- Contact page route
- business contact card
- support handle `$SVRhelp`
- inquiry type copy
- game/site footer links

### Concern

There is no visible contact form in this route. The public message form exists on the older one-page live site, but this newer repo contact page is mostly static.

### Recommended fix

Add a contact/message form using the existing `visitor-message-form` IDs so `site-public-hooks.js` can submit to API or local fallback.

---

## System Verification Page Audit

Repo file: `site/system.html`

Confirmed present:
- front-end system verification page
- public route test links
- game/private route links
- store/sponsor/profile route checks
- copy stating backend details are not exposed

### Concern

The page still shows `Phase 88` labels while the main site page references newer Phase 93 visuals. This is not fatal, but it creates phase confusion.

### Recommended fix

Update public-facing phase wording to a generic `System Verification` or align all site pages under one current site label such as `SITE-PHASE-108-STABILITY-LOCK`.

---

## Profile Page Audit

Repo file: `site/profile.html`

Confirmed present:
- profile dashboard route
- wallet/rewards preview sections
- inventory preview sections
- room access section
- game/site bridge note

### Concern

Profile uses `site-phase09.css` and links to `phase09.html`, while the main site uses `site-market.css` and Phase 93 layout. This means multiple older site style systems are still present.

### Recommended fix

Unify profile navigation and stylesheet with the current `site-market.css` design or clearly mark it as a protected legacy dashboard preview.

---

## Public Hooks / Admin + Message System Audit

Repo file: `site-public-hooks.js`

Confirmed present:
- `API_BASE` defaults to `https://api.svrpoker.com`
- admin status polling
- local admin fallback state
- visitor message submission to `/api/messages`
- local message backup fallback
- analytics event posting
- click tracking for store/sponsor/support/game links

### Strengths

- Safe fallback behavior exists.
- Messages are not lost if API is down; they are stored locally.
- Admin status can dynamically change.

### Risks

- If `https://api.svrpoker.com` is not deployed or CORS is not configured, messages will remain local-only.
- Analytics calls may silently fail, which is acceptable, but the site should make clear that message submission is not guaranteed until backend is connected.

### Recommended fix

Add a small site config block or `window.SVR_API_BASE` assignment only after the real API endpoint is confirmed.

---

## Matrix Layer Audit

Repo file: `matrix.js`

Confirmed present:
- binary-only glyphs: `0` and `1`
- hidden phrase bursts:
  - `I LOVE SHY`
  - `I LOVE SCARLETT`
- purple/pink/cyan glow styling
- responsive canvas resize

### Status

The Matrix layer is healthy and should remain locked.

---

## Deploy Workflow Audit

Repo file: `.github/workflows/deploy.yml`

Confirmed present:
- deploys on push to `main`
- manual workflow dispatch enabled
- Node 24 force variable present
- copies committed public site and game directly
- excludes ZIPs and `update/`
- excludes FBX files
- validates `build/index.html`, `build/site/index.html`, and `build/game/index.html`
- stamps `deploy-health.json` and `game/deploy-health.json`
- uploads Pages artifact and deploys to GitHub Pages

### Important deployment rule

The active workflow deploys committed direct files. It does not restore the website from root `site.zip`, and it excludes ZIP files. Therefore, future site fixes must edit direct repo files such as:

- `index.html`
- `matrix.js`
- `site-public-hooks.js`
- `site/index.html`
- `site/*.html`
- `site/*.css`
- `site/js/*.js`

Do not rely on `site.zip` for the current workflow.

---

## Live Site Spot-Check

Live root checked: `https://svrpoker.com/`

Observed:
- Admin Offline displayed
- Public Launch Page displayed
- SVR Poker title displayed
- Site under construction copy displayed
- Preview Site / Preview Game / Leave Message links displayed
- footer displayed

Live `/site/index.html` reached through Preview Site.

Observed:
- older One-Page Public Site content
- login shell
- waitlist form shell
- item shop preview
- payment entry preview
- SQL handoff copy
- visitor message drop
- admin offline status

### Critical mismatch

Live `/site/index.html` does not match the current repository `site/index.html` content. The repo version contains Phase 93 premium site layout and live iframe preview; the live version shows an older one-page public site.

This is the highest-priority issue.

---

## Completed / Done Manifest

### Public root completed
- Matrix launch page exists.
- Purple binary rain exists.
- Public logo exists.
- Preview Site link exists.
- Preview Game link exists.
- Leave Message link exists.
- Footer and company/team attribution exists.
- Admin status hook exists.

### Interior site completed in repo
- Premium `/site/index.html` exists.
- Store page exists.
- Contact page exists.
- Profile dashboard page exists.
- System verification page exists.
- Sponsor, advertising, billboard, impact, membership, FAQ, privacy, terms, update, cart, login, and register routes appear in repo search.
- Market styling exists.
- Live game preview iframe exists in repo page.

### Backend-ready hooks completed
- Admin online/offline polling hook exists.
- Public message form hook exists.
- Local message fallback exists.
- Analytics/event tracking hooks exist.
- Store/sponsor/support/game click tracking exists.

### Deploy completed
- GitHub Pages workflow exists.
- Direct committed file deploy is active.
- Deploy health stamping exists.
- Node 24 future-proofing is present.
- Permissions normalized during build.

---

## Still To Finish Manifest

### Highest priority
1. Resolve live `/site/index.html` mismatch.
2. Confirm Auto Deploy is deploying the latest `main` commit.
3. Confirm live `deploy-health.json` commit matches GitHub `main`.
4. Stop using root `site.zip` as the assumed deploy source unless workflow is intentionally changed back.

### Site cleanup
1. Choose one current interior site baseline:
   - current repo Phase 93 premium page, or
   - older one-page public site.
2. Unify page styles:
   - `site-market.css`
   - `site-phase09.css`
   - inline page styles.
3. Normalize navigation across all pages.
4. Update old public phase references such as Phase 88 / Phase 92 / Phase 93 to one site label.
5. Add contact form to `site/contact.html` using `visitor-message-form` IDs.
6. Add checkout-disabled / sandbox-only notice to store page if payments remain disabled.
7. Add privacy/terms review before public launch.

### Backend/API
1. Verify `https://api.svrpoker.com/api/health`.
2. Confirm CORS allows `https://svrpoker.com`.
3. Confirm `/api/admin/status` returns correct online/offline status.
4. Confirm `/api/messages` stores messages in Azure SQL.
5. Confirm analytics endpoint exists or disable analytics calls until ready.

### QA
1. Test root page on desktop.
2. Test `/site/index.html` on desktop.
3. Test `/site/store.html` on desktop and mobile.
4. Test `/site/contact.html` message form after it is added.
5. Test links to `/game` and private game routes.
6. Test iframe preview loading and fallback behavior.

---

## Recommended Next Patch

Name:

`SITE-PHASE-109-DEPLOY-DRIFT-RECONCILE-LOCK`

Scope:
- Do not touch `/game`.
- Decide whether repo `site/index.html` or live one-page site is the official baseline.
- Force direct committed files to match that baseline.
- Add `site/docs/SITE_BASELINE_LOCK.json`.
- Add `site/docs/SITE_QA_CHECKLIST.md`.
- Add deploy-health verification instructions.

---

## Final Audit Status

Site condition: functional but inconsistent.  
Public root: stable and protected.  
Interior site: repo and live deployment do not match.  
Highest risk: deployment drift / stale live content.  
Recommended action: reconcile direct files and deploy health before adding more pages or backend features.
