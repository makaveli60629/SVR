# SVR Poker — Scarlett VR Poker

> **Texas Hold'em VR Casino** — Real-time multiplayer poker in a cyberpunk rooftop setting.  
> Built with Three.js r170, Socket.IO, Express, and A-Frame.

---

## 🎮 Features

- ♠ **Full Texas Hold'em engine** — 52-card deck, shuffle, hand evaluation, side pots, showdown
- 🏆 **All hand rankings** — Royal Flush, Straight Flush, Four of a Kind, Full House, Flush, Straight, Three of a Kind, Two Pair, Pair, High Card (with tiebreaker logic)
- 🌐 **Multiplayer** — Socket.IO real-time backend; up to 6 players per table
- 🤖 **Offline AI bots** — Auto-starts with bot players if server is unreachable
- 🎰 **Daily slot machine** — Bonus chip reward system
- 🌙 **3D scene** — Three.js r170 scene: poker table, moon, city skyline, neon ring, stars, procedural lighting
- 🥽 **VR-ready** — A-Frame VR components, gesture controls, teleport system
- 📡 **Auto-deploy** — GitHub Actions CI/CD builds and deploys to GitHub Pages on every push

---

## 📁 Project Structure

```
SVR/
├── index.html              ← Public launch page
├── style.css               ← Launch page styles
├── matrix.js               ← Matrix rain animation
├── CNAME                   ← Custom domain: svrpoker.com
│
├── game/                   ← 🎮 3D Game
│   ├── index.html          ← Main game entry point (Three.js + Socket.IO)
│   ├── js/
│   │   └── game.js         ← Scene utilities (table, moon, stars)
│   ├── scripts/
│   │   ├── pokerEngine.js  ← ♠ Full Texas Hold'em engine (ES module)
│   │   ├── core.js         ← Three.js renderer / camera / lights setup
│   │   ├── table.js        ← Poker table geometry
│   │   ├── deck.js         ← Deck + shuffle utilities
│   │   ├── seatSystem.js   ← Seat assignment & teleport
│   │   ├── seatJoin.js     ← A-Frame seat click handler
│   │   ├── slotMachine.js  ← Daily bonus slot machine
│   │   ├── network/
│   │   │   └── vrSocketBridge.js  ← Socket.IO client API
│   │   └── vr/
│   │       ├── vrPokerTable.js    ← A-Frame table renderer
│   │       ├── vrCardDealer.js    ← 3D card placement
│   │       ├── vrChipStack.js     ← Chip stack renderer
│   │       ├── vrGestureControls.js ← VR controller → poker actions
│   │       └── VR_TABLE_EXAMPLE.html ← Standalone A-Frame demo
│   ├── systems/
│   │   ├── hands.js         ← A-Frame VR hands component
│   │   ├── poker.js         ← A-Frame poker component
│   │   ├── tablemanager.js  ← Table manager component
│   │   └── teleport.js      ← Raycasting teleport system
│   └── assets/
│       ├── models/          ← GLB/FBX 3D models (table, moon, player, NPCs)
│       ├── textures/        ← PBR textures (felt, leather, moon)
│       ├── texture/         ← Additional textures
│       ├── earth/           ← Earth globe assets
│       ├── skyline/         ← City skyline background
│       ├── locomotion/      ← Character animation FBX files
│       └── ui/              ← UI sprites (watch, logo)
│
├── backend/                ← 🖥 Node.js Server
│   ├── server.js           ← Express + Socket.IO server
│   ├── pokerTableServer.js ← CJS poker engine (server-side)
│   ├── package.json
│   └── .env.example
│
├── site/                   ← 🌐 Website preview
│   ├── index.html
│   ├── css/style.css
│   └── js/matrix.js
│
├── modules/
│   └── updater/
│       └── updater.js      ← Auto-reload when version changes
│
├── update/
│   ├── version.json        ← Current build version
│   ├── site.zip            ← Site build artifact
│   └── game.zip            ← Game build artifact
│
└── .github/
    └── workflows/
        └── deploy.yml      ← GitHub Actions: build → GitHub Pages
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm

### 1. Clone the repo
```bash
git clone https://github.com/makaveli60629/SVR.git
cd SVR
```

### 2. Set up the backend
```bash
cd backend
cp .env.example .env       # Fill in your values
npm install
npm start
```
Server starts at `http://localhost:8080`

### 3. Open the game
Open `http://localhost:8080/game` in your browser.

Or open `game/index.html` directly — it will auto-detect offline mode and start with AI bots.

---

## 🃏 Poker Engine

The engine (`game/scripts/pokerEngine.js` / `backend/pokerTableServer.js`) implements:

| Feature | Details |
|---|---|
| Deck | Full 52-card shuffled deck (Fisher-Yates) |
| Dealing | 2 hole cards per player |
| Rounds | Pre-Flop → Flop → Turn → River → Showdown |
| Blinds | Small blind + Big blind auto-posted |
| Actions | `fold`, `check`, `call`, `raise`, `allin` |
| Hand eval | All 9 hand ranks with full tiebreaker comparison |
| Winners | Split pot support for ties |
| Auto-restart | New round starts 3 seconds after showdown |

---

## 🌐 Multiplayer

The backend uses **Socket.IO** events:

| Event (client → server) | Payload |
|---|---|
| `registerPlayer` | `{ playerId, name }` |
| `joinTable` | `{ tableId, playerId, chips }` |
| `action` | `{ tableId, playerId, type, amount }` |
| `startRound` | `{ tableId }` |
| `getState` | `{ tableId, playerId }` |
| `leaveTable` | `{ tableId, playerId }` |

| Event (server → client) | Payload |
|---|---|
| `tableUpdate` | Full public table state |
| `roundStarted` | Table state at round start |
| `roundOver` | `{ winners, players }` |
| `stageChanged` | `{ stage, community }` |
| `actionRequired` | `{ playerId }` |
| `error` | `{ message }` |

---

## 🥽 VR Mode

The game supports **WebXR via A-Frame**. Use `game/scripts/vr/VR_TABLE_EXAMPLE.html` as a starting point.

VR Controls (with controllers):
- **Grip** → Raise
- **Trigger** → Fold
- **Thumbstick click** → Call
- **X / Square** → Check
- **A / Cross** → All-In

---

## 🤖 Offline Mode

If the backend is unreachable, the game automatically starts in **offline mode** with 3 AI bots. Bot logic randomly folds (15%), calls/checks (55%), or raises (30%).

---

## 📦 Deployment

The repo uses **GitHub Actions** to auto-deploy to **GitHub Pages** on every push to `main`:

1. Copies source files to `/build`
2. Applies `update/site.zip` and `update/game.zip` if present
3. Validates `build/index.html` exists
4. Deploys to GitHub Pages

Live at: **https://svrpoker.com**

---

## ⚙️ Environment Variables

Copy `backend/.env.example` to `backend/.env`:

```env
PORT=8080
DB_SERVER=localhost
DB_USER=sa
DB_PASSWORD=your_db_password_here
DB_NAME=SVRPoker
JWT_SECRET=your_jwt_secret_here
```

---

## 📋 18+ Notice

This project is intended for adults only. Scarlett VR Poker is a virtual casino experience for entertainment purposes.

---

© 2026 Scarlett Holding Company. All rights reserved.
