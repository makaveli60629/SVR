# SVR Poker — Phase 88 Updated Game Manifest Lock

**Manifest phase:** `PHASE-88-UPDATED-GAME-MANIFEST-LOCK`  
**Current runtime build preserved:** `PHASE-87-DESKTOP-ANDROID-POKER-HUD-LOCK`  
**Scope:** Game documentation / manifest only  
**Website/site touched:** No  
**Repo track:** Game side only

---

## 1. Current hard locks

- Do not touch the public website or `/site` work in this game track.
- Preserve the current game lobby baseline.
- Do not replace the lobby with a different shell.
- Keep the lobby as a portal/storefront hub only.
- Keep private experiences separate from the lobby.
- Keep all sponsor/founder branding approval-safe.
- Keep game package targets under 25 MB where ZIP packaging is used.
- Preserve Quest/Oculus controller fallback and hand tracking support.
- Preserve controller meshes hidden or represented as natural hands.
- Preserve left-to-right dealing from the dealer button perspective.
- Preserve the open south/front player seat.
- Preserve five bot seats plus one player seat.
- Preserve invisible dealer/card logic; dealer body remains disabled.

---

## 2. Current runtime status

The current committed playable game runtime is Phase 87.

### Phase 85 — Playable Poker Lock

Added the first playable poker engine:

- deck creation and shuffle
- two-card hole cards
- community board cards
- preflop / flop / turn / river / showdown flow
- bot actions
- hand evaluation
- pot movement
- player stack and bot stack accounting
- table status panel
- desktop keyboard controls

Desktop keys:

```text
F = Fold
C = Check / Call
R = Raise
A = All-In
H = Next Hand
```

### Phase 86 — Watch Poker Control Lock

Upgraded the wrist watch to show poker information and direct poker buttons:

- Fold
- Check / Call
- Raise
- All-In
- Next Hand
- live pot
- active player
- board cards
- player cards
- current street
- quick route buttons
- teleport toggle

### Phase 87 — Desktop / Android Poker HUD Lock

Added the non-VR poker action HUD for desktop, Android browser, and public testing:

- touch-friendly poker buttons
- visible hand / board / pot state
- HUD auto-hides in VR / XR
- VR still uses the wrist watch as the primary control layer

---

## 3. Current locked files

### Runtime entry

```text
game/index.html
game/main.js
```

### Current poker files

```text
game/modules/playable_poker.js
game/modules/watch.js
game/modules/poker_action_hud.js
```

### Scene / VR files

```text
game/modules/world_skyline.js
game/modules/teleport.js
game/modules/hands.js
game/modules/npc_avatar_system.js
game/modules/webxr_enforcer.js
```

### Deploy / version support

```text
update/version.json
```

---

## 4. Lobby rule

The lobby is a portal hub only.

Allowed in the lobby:

- main poker table
- Reiki storefront / portal
- PGA storefront / portal
- Smoker Lounge portal
- Scorpion Room portal
- VR Store portal
- sponsor placeholders
- Moon and Mars in the sky

Not allowed inside the lobby:

- full Reiki meditation room
- full PGA driving range
- full PGA chip/putt area
- full Smoker Lounge room
- full Scorpion room
- full store showroom

---

## 5. Private scene routing lock

Private scenes must remain separate from the main lobby.

Expected destinations:

```text
game/reiki.html
game/range.html
game/pga-drive.html
game/chip-putt.html
game/store-room.html
game/smoker-lounge.html
game/scorpion.html
```

Main lobby route targets should gracefully fall back if a partial deploy temporarily misses a route. Missing route data must never black-screen the game.

---

## 6. Controls lock

### Hand tracking

- pinch/fist hold = aim teleport
- release = teleport
- wrist watch controls remain available
- no instant accidental teleport

### Quest/Oculus controller fallback

- right stick up/down = forward/back movement
- right stick left/right = 45-degree snap turn
- A / grip / trigger hold = aim teleport
- release = teleport
- controller meshes hidden or represented as natural hands

### Desktop / Android browser

- desktop keyboard poker controls preserved
- touch-friendly poker HUD preserved
- scene nav buttons preserved outside preview mode
- HUD hidden during XR sessions

---

## 7. Poker lock

Current poker state is playable but still early. Preserve and refine; do not rewrite blindly.

Must preserve:

- left-to-right dealing from dealer button
- one open player seat
- five bot seats
- fold / check / call / raise / all-in / next hand
- street progression
- hand evaluation
- pot payout
- player stack updates
- bot stack updates
- visible poker status panel
- watch poker controls
- desktop/mobile poker HUD

Next poker improvements:

1. Side-pot handling for all-in multiway hands.
2. Better raise amount controls.
3. Stronger bot decision tiers.
4. Visual cards/chips animation synchronized with game logic.
5. Turn glow around active seat.
6. Winner banner and winning hand reveal.
7. Persistent table/session state later when backend is ready.

---

## 8. Watch lock

The watch remains the VR control center.

Must preserve:

- forearm placement
- readable screen
- teleport toggle
- scene route buttons
- poker action buttons
- live pot/hand/board status
- audio controls
- no controller object display

Next watch improvements:

- slimmer layout for Quest readability
- larger poker hit targets
- controller proxy selection support
- haptic/audio feedback on action press
- action disabled states when not the player turn

---

## 9. Approval safety lock

Reiki / wellness sponsor content remains approval-locked.

Blocked until explicit approval:

```text
Trueitive
Truitive
trueitive.com
truitive.com
Shyona
Royston
founder photos
outside Reiki websites
unapproved Reiki logos
```

Allowed:

```text
SVR branding
AWAITING APPROVAL placeholders
WAITING FOR APPROVAL placeholders
```

---

## 10. Site protection lock

This game track must not edit:

```text
index.html at website root
/site
site.zip
style.css / matrix.js website files
website admin/contact/store pages
```

Website work is handled separately.

---

## 11. Next recommended phases

### Phase 89 — Poker Side-Pot + Betting Polish

- side-pot support
- better raise logic
- disable illegal actions
- cleaner player turn state
- winner hand reveal

### Phase 90 — Active Seat / Chip Animation Lock

- active player glow
- chip movement into pot
- pot sweep to winner
- readable table-side labels

### Phase 91 — Quest Performance Pass

- lower draw calls
- reduce duplicated canvas updates
- optimize glow/transparent materials
- cap runtime animation work
- check private scene load behavior

### Phase 92 — NPC Bot Animation Polish

- idle breathing
- card peek
- chip reach
- fold gesture
- winner reaction

---

## 12. Deployment checklist

Before every future game commit:

- confirm `/site` is untouched
- confirm public Matrix site is untouched
- confirm game boot label matches the intended phase
- confirm no stale phase labels return
- confirm route buttons do not crash if route target missing
- confirm poker buttons work on desktop
- confirm watch buttons work in VR
- confirm HUD hides in XR
- confirm package stays under 25 MB if producing ZIP

---

## 13. Current manifest conclusion

Phase 88 is a documentation/manifest lock. It does not replace the current runtime. The current playable runtime remains Phase 87 until the next gameplay code phase is built.
