# SVR POKER — MASTER CODEBASE MANIFEST
**Project:** Scarlett VR Poker (`svrpoker.com`)
**Repository:** `https://github.com/makaveli60629/SVR`
**Branch:** `main`
**Version:** 5.5
**Last Updated:** May 2026
**Stack:** A-Frame 1.4.2 · Three.js · Vanilla JS · Node.js · WebXR · GitHub Pages

---

## PURPOSE OF THIS DOCUMENT

This manifest is a complete structural and functional reference for the SVR Poker codebase. It is intended to give any AI assistant (ChatGPT, Claude, Copilot, etc.) full project context so it can assist with feature development, debugging, and code modifications **without ever over-editing or breaking existing modules.**

**Golden Rule:** Every module is self-contained. Do not modify a module unless it is the specific target of the task. Use the CustomEvent bus (`window.dispatchEvent`) to communicate between modules.

---

## 1. PROJECT OVERVIEW

Scarlett VR Poker is a WebXR poker platform playable in-browser on desktop or via Meta Quest headsets. It features:

- A-Frame-based immersive VR lobby with cinematic space environment
- Hand-tracking-first interaction model (gesture-based poker play)
- In-world wrist watch UI for game controls and information
- 6-seat private poker table with automated seating
- Real-time charity fundraising ticker
- Automated sponsorship injection (table felt textures, 3D billboards)
- Modular plugin architecture (`js/scarlett1/` — 14 modules)
- Node.js WebSocket multiplayer sync backend
- 18+ adult platform, private community access model

---

## 2. REPOSITORY STRUCTURE

```
SVR/
├── index.html                        # Public launch/landing page (18+ gate)
├── style.css                         # Launch page styling
├── launch.css                        # Launch override styles
├── launch-overrides.css
├── main.js                           # Entry JS for launch page
├── matrix.js                         # Matrix rain animation (background)
├── site-public-hooks.js              # Public site event hooks
├── manifest.json                     # PWA manifest
├── CNAME                             # Custom domain → svrpoker.com
│
├── game/                             # ★ PRIMARY VR GAME
│   ├── index.html                    # Game entry point (A-Frame scene)
│   ├── modules/                      # A-Frame custom components
│   │   ├── watch-ui.js               # Wrist watch face rendering
│   │   ├── forearm-device.js         # VR wrist-mounted device anchor
│   │   ├── meta-hand-materials.js    # Hand mesh appearance
│   │   ├── moon-upgrade.js           # Moon / celestial body rendering
│   │   ├── lobby-floor.js            # Procedural game floor
│   │   ├── lobby-skyline.js          # Background skyline environment
│   │   ├── lobby-sprites.js          # Ambient particle effects
│   │   ├── lobby-signage.js          # In-world neon signage
│   │   ├── real-table-stage.js       # ★ Poker table, seats, dealer zone
│   │   └── floating-logo.js          # Animated SVR logo
│   └── assets/
│       ├── models/
│       │   └── table.glb             # Poker table 3D model
│       └── textures/
│           ├── logo.png
│           ├── moon_final_diffuse.png
│           ├── moon_final_bump.png
│           └── tablefelt.png         # Sponsor-injectable felt texture
│
├── js/
│   └── scarlett1/                    # ★ MODULAR PLUGIN ARCHITECTURE (14 modules)
│       ├── mod_charity.js            # Charity tickers & post-hand winner showcase
│       ├── mod_private.js            # Auth, session, automated seating, Reiki points
│       ├── mod_sponsor.js            # Sponsor asset injection (textures, billboards)
│       ├── mod_commerce.js           # In-game commerce / chip economy
│       ├── mod_stream.js             # Live streaming integration hooks
│       ├── mod_audio.js              # Spatial audio management
│       ├── mod_watch.js              # Watch UI data bridge
│       ├── mod_router.js             # In-game scene/room router
│       ├── mod_scorpion_fx.js        # Visual FX (the "Scorpion Room" effects)
│       ├── mod_sportsbook.js         # Sports betting side feature
│       ├── mod_avatar.js             # Avatar lerp/slerp smooth positioning
│       ├── mod_profile_sync.js       # Player profile & progression sync
│       ├── mod_network.js            # WebXR hand-tracking data broadcaster (45ms throttle)
│       └── mod_security_bubble.js    # Spatial anti-cheat / reach-distance validator
│
├── backend/
│   └── routes/
│       └── multiplayer.js            # Node.js WebSocket room hub router
│
├── api/                              # API endpoint stubs
├── assets/                           # Shared static assets
├── audio/                            # Audio files
├── css/                              # Shared stylesheets
├── docs/                             # Documentation
│   ├── CONTRIBUTING.md
│   ├── DEVELOPMENT.md
│   └── DEPLOYMENT.md
├── game.zip                          # Packaged game build
├── manifests/                        # Previous manifest iterations
├── modules/                          # Shared/legacy module storage
├── scripts/                          # Build/utility scripts
├── setup/                            # Environment setup helpers
├── site/                             # Marketing website variant
├── tools/                            # Dev tools
├── update/                           # Patch/update scripts
└── .github/workflows/                # GitHub Actions CI/CD → GitHub Pages
```

---

## 3. MODULE ARCHITECTURE (`js/scarlett1/`)

All 14 modules are loaded via `index.html` in this exact order. **Do not reorder.**

```html
<script src="js/scarlett1/mod_charity.js" defer></script>
<script src="js/scarlett1/mod_private.js" defer></script>
<script src="js/scarlett1/mod_sponsor.js" defer></script>
<script src="js/scarlett1/mod_commerce.js" defer></script>
<script src="js/scarlett1/mod_stream.js" defer></script>
<script src="js/scarlett1/mod_audio.js" defer></script>
<script src="js/scarlett1/mod_watch.js" defer></script>
<script src="js/scarlett1/mod_router.js" defer></script>
<script src="js/scarlett1/mod_scorpion_fx.js" defer></script>
<script src="js/scarlett1/mod_sportsbook.js" defer></script>
<script src="js/scarlett1/mod_avatar.js" defer></script>
<script src="js/scarlett1/mod_profile_sync.js" defer></script>
<script src="js/scarlett1/mod_network.js" defer></script>
<script src="js/scarlett1/mod_security_bubble.js" defer></script>
```

### Module-to-Module Communication

Modules communicate **exclusively** via the global `CustomEvent` bus. Never import or directly call another module's methods.

| Event Name | Direction | Payload | Purpose |
|---|---|---|---|
| `svr_update_ticker` | charity → UI | `{ text: string }` | Updates charity ticker display |
| `svr_show_banner` | charity → UI | `{ message, duration }` | Shows post-hand winner overlay |
| `svr_highlight_player` | charity → avatar | `{ username, highlight: bool }` | Highlights/unhighlights winner seat |
| `svr_user_authenticated` | private → all | `playerProfile` object | Fires on successful login/session |
| `svr_request_seat` | private → table | `{ userId, username, chips, maxSeats: 6 }` | Triggers automated seating |
| `svr_network_packet` | network → avatar | XR hand-tracking payload | Smooth avatar hand movement |

---

## 4. KEY MODULES — FUNCTIONAL SPEC

### 4.1 `mod_charity.js` — Philanthropy Module
- **Purpose:** Real-time charity fundraising tickers + post-hand winner showcase
- **API dependency:** `GET /api/charity/metrics` → returns active campaign array
- **Core behavior:**
  - Fetches live fundraising targets on init
  - Dispatches `svr_update_ticker` for each active campaign
  - `triggerWinnerDisplay(winnerUsername, handName, communityCards, winningCards)` shows a **10-second** post-hand banner with: winner username, hand name, winning cards. **No dealer text during this window.**
  - Auto-clears player highlight after 10,000ms

### 4.2 `mod_private.js` — Private Community & Auth Module
- **Purpose:** Session management, automated seating, progression points
- **API dependencies:**
  - `GET /api/auth/verify` (Bearer token validation)
  - `POST /api/user/progression` (point type + increment)
- **Core behaviors:**
  - Reads `localStorage.getItem('svr_auth_token')` on init
  - `evaluateSeatingProximity(playerPosition)` checks if player is within `radius: 2.5` of play zone origin — if so, calls `executeAutoSeat()`
  - Auto-seat dispatches `svr_request_seat` with `maxSeats: 6` (hard cap, never change)
  - `updateUserPoints(pointType, numericalValue)` syncs Reiki points or golf range milestones to server

### 4.3 `mod_sponsor.js` — Automated Sponsorship Engine
- **Purpose:** Database-driven sponsor asset injection
- **API dependency:** `GET /api/sponsors/active` → compliance-verified campaign assets
- **Core behavior:**
  - Loads active sponsor textures on init
  - Injects logo textures onto `tablefelt.png` material or 3D billboard entities in the A-Frame scene
  - Dispatches `svr_sponsor_texture_ready` with asset URL when loaded

### 4.4 `mod_network.js` — Multiplayer Hand-Tracking Broadcaster
- **Purpose:** Sends WebXR hand/head position data to other players at the same table
- **Throttle:** 45ms (≈22 packets/sec)
- **WebSocket endpoint:** `wss://[host]/api/multiplayer/sync`
- **Packet format:**
  ```json
  { "u_id": "userId", "t_id": "tableId", "headPos": {x,y,z}, "leftHandPos": {x,y,z}, "rightHandPos": {x,y,z} }
  ```
- **Receives** other players' packets and dispatches `svr_network_packet` for `mod_avatar.js` to consume

### 4.5 `mod_avatar.js` — Avatar Positioning
- **Purpose:** Receives network packets and smoothly interpolates remote player hand/head positions
- **Method:** THREE.js `lerp()` for position, `slerp()` for rotation
- **Listens for:** `svr_network_packet`

### 4.6 `mod_security_bubble.js` — Anti-Cheat Spatial Validator
- **Purpose:** Validates that player hand positions don't exceed physically possible reach distances
- **Max reach distance:** configurable (default ~0.8m from head)
- **On anomaly:** `console.warn` + `clampLength(0, maxReachDistance)` on offending vectors

---

## 5. BACKEND — `backend/routes/multiplayer.js`

Node.js WebSocket room router. Manages player table sessions with zero persistent storage.

```
Upgrade handshake → /api/multiplayer/sync
→ Groups players by t_id (table ID)
→ Broadcasts each packet to all OTHER players at the same table
→ On disconnect: removes player from table array, deletes empty table objects
```

**activeTables structure:**
```javascript
{ "table_id_string": [ { userId: string, wsInstance: WebSocket } ] }
```

---

## 6. DATA FLOW — SINGLE PLAYER MOVEMENT

```
[User Hands Move in WebXR]
         │
         ▼
[mod_network.js] → throttles to 45ms intervals → sends WS packet
         │
         ▼
[backend/routes/multiplayer.js] → identifies table cluster → broadcasts to peers
         │
         ▼
[mod_security_bubble.js] → validates geometric reach limits → clamps if anomalous
         │
         ▼
[mod_avatar.js] → lerp/slerp smooth coordinates onto remote player avatar
```

---

## 7. API ENDPOINTS REFERENCE

| Method | Endpoint | Module | Description |
|---|---|---|---|
| GET | `/api/charity/metrics` | mod_charity | Fetch active fundraising campaigns |
| GET | `/api/auth/verify` | mod_private | Validate Bearer token session |
| POST | `/api/user/progression` | mod_private | Increment user points (Reiki / golf) |
| GET | `/api/sponsors/active` | mod_sponsor | Fetch compliance-verified sponsor assets |
| WS | `/api/multiplayer/sync` | mod_network + backend | Real-time hand-tracking data stream |

---

## 8. DESIGN SYSTEM

### Color Palette
```css
--bg:        #050505;                        /* Deep black */
--panel:     rgba(14, 14, 18, 0.94);         /* Semi-transparent panels */
--border:    rgba(185, 90, 255, 0.28);       /* Purple borders */
--text:      #f3ecff;                        /* Light purple text */
--muted:     #b9a9d6;                        /* Muted text */
--accent:    #b95aff;                        /* Purple accent */
--accent-2:  #7a2cff;                        /* Deep purple */
--glow:      rgba(185, 90, 255, 0.35);       /* Glow effects */
--danger:    #ff9f9f;                        /* Error/alert */
```

### Typography
- Font family: `Arial, Helvetica, sans-serif`
- Sizes: Responsive `clamp()` for fluid scaling
- Weights: 400 (regular) · 700 (bold) · 800 (extra bold)

---

## 9. TECHNOLOGY STACK

| Layer | Technology |
|---|---|
| VR Framework | A-Frame 1.4.2 |
| 3D Engine | Three.js (via A-Frame) |
| Frontend Logic | Vanilla JavaScript (ES6+) |
| Styling | CSS3 (glassmorphism + neon) |
| Backend | Node.js + `ws` WebSocket library |
| Hosting | GitHub Pages (static) + CNAME → `svrpoker.com` |
| CI/CD | GitHub Actions → auto-deploy on push to `main` |
| VR Target | Meta Quest 2/3/Pro · Chrome/Firefox desktop |

---

## 10. BROWSER & DEVICE COMPATIBILITY

| Feature | Chrome | Firefox | Safari | Meta Quest |
|---|---|---|---|---|
| Desktop | ✅ | ✅ | ⚠️ | — |
| VR Mode | ✅ | ✅ | ❌ | ✅ |
| Hand Tracking | ✅ | ✅ | ❌ | ✅ |
| Performance | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

> VR requires HTTPS or localhost. Chrome is recommended.

---

## 11. GAME RULES & CONSTRAINTS (NEVER CHANGE)

| Rule | Value |
|---|---|
| Max table seats | **6 — hard cap, never modify** |
| Post-hand winner showcase duration | **10 seconds exactly** |
| Dealer text during showcase window | **None — completely suppressed** |
| Network throttle rate | **45ms per packet** |
| Auto-seating trigger radius | **2.5 units from play zone origin** |
| Age restriction | **18+ only** |

---

## 12. DEVELOPMENT RULES FOR AI ASSISTANTS

1. **Read before writing.** Always ask for the current file content before proposing changes.
2. **One module at a time.** Never rewrite multiple modules in a single response.
3. **Use the event bus.** Cross-module communication goes through `window.dispatchEvent` / `window.addEventListener` only.
4. **Preserve version comments.** Keep `// Version: X.X` header comments in every module.
5. **Never reorder the script load order** in `index.html`.
6. **The 6-seat cap and 10-second showcase are product requirements** — do not alter them for any reason.
7. **localStorage key:** `svr_auth_token` — this is the session token key, do not rename it.
8. **A-Frame components** live in `game/modules/` and follow `AFRAME.registerComponent()` pattern.
9. **Scarlett1 modules** in `js/scarlett1/` are self-initializing — each calls its own `init()` at the bottom of the file.
10. **Backend multiplayer.js** uses `const activeTables = {}` as in-memory state — no database writes for movement packets.

---

## 13. ROADMAP STATUS

| Phase | Status | Description |
|---|---|---|
| Phase 1: Foundation | ✅ Complete | VR lobby, hand tracking, public launch page |
| Phase 2: Gameplay | 🔄 In Progress | Multiplayer poker mechanics, hand ranking, betting, dealer AI |
| Phase 3: Backend | 📋 Planned | Node.js API server, MongoDB/PostgreSQL, auth, player profiles |
| Phase 4: Social | 🎯 Planned | Tournaments, leaderboards, chat, achievements |
| Phase 5: Monetization | 💰 Planned | Payment integration, cashier, deposits/withdrawals, bonuses |

---

## 14. QUICK REFERENCE — LOCAL DEVELOPMENT

```bash
# Clone
git clone https://github.com/makaveli60629/SVR.git
cd SVR

# Serve (Python — recommended)
python -m http.server 8000

# Serve (Node)
npm install -g http-server && http-server SVR -p 8000
```

| Route | URL |
|---|---|
| Public launch page | `http://localhost:8000` |
| VR game | `http://localhost:8000/game` |
| Site preview | `http://localhost:8000/site` |

---

*This manifest reflects the live state of the `main` branch at `github.com/makaveli60629/SVR`. Always cross-reference against the live repo before proposing architectural changes.*
