# SVR Poker — Phase 88 Refined Game Idea Manifest
**Working title:** Mission Wall + Portal Polish + Sky Refinement Lock  
**Scope:** Game-side planning and implementation guide  
**Baseline source:** Phase 87 South Mission + Sky Lock

---

## 1. Purpose

This manifest refines the uploaded architecture ideas into the current SVR Poker rules so future work does not break the lobby, website, portals, controls, or approval locks.

The strongest ideas from the uploaded material are kept:

- modular architecture
- charity / mission layer
- sponsor placeholder pipeline
- private-scene routing
- Reiki approval-safe hologram
- Espresso With Cream ad assets
- Moon / Mars sky improvement
- future avatar / rig pipeline

Conflicting items are corrected:

- no “hands-only / no controllers” rule
- no forced A-Frame rewrite
- no Unity-hybrid rewrite
- no sports/news / sports/news ticker language in the live build
- no unapproved Reiki sponsor/founder/domain branding
- no site edits in the game-side track
- no heavy FBX runtime payloads in `game.zip`

---

## 2. Locked Project Rules

### Game-side rule
This phase edits only `/game` and `update/game.zip`.

Do not touch:

```text
root index.html
/site
site.zip
site-public-hooks.js
matrix.js
style.css
```

### Lobby rule
The main lobby is a portal hub only.

Allowed in lobby:

- poker table
- south mission wall
- Reiki storefront / portal
- PGA storefront / portal
- Lounge storefront / portal
- Scorpion portal
- Store portal
- sponsor placeholder surfaces
- Moon / Mars / skyline

Not allowed in lobby:

- full Reiki meditation world
- full PGA range
- full Lounge room
- full Scorpion room
- full Store showroom

### Input rule
SVR supports:

- Meta hand tracking
- Quest/Oculus controller fallback
- hidden controller meshes
- natural hand visuals
- right-stick forward/back movement
- right-stick 45-degree snap turn
- hold A / grip / trigger to aim teleport
- release to teleport
- pinch/fist hold to aim teleport
- release to teleport

Do not write “hands-only / no controllers” as the live rule.

### Reiki approval rule
Blocked until approval:

```text
blocked Reiki sponsor name
blocked Reiki domain
blocked alternate Reiki brand spelling
blocked Reiki founder first name
blocked Reiki founder last name
founder photos
outside Reiki sponsor websites
unapproved sponsor logos
```

Approved placeholder wording:

```text
REIKI PORTAL
AWAITING APPROVAL
SVR PLACEHOLDER
ENTER PRIVATE REIKI ROOM
```

### Package rule
Every deployable `game.zip` must stay under 25 MB.

---

## 3. Phase 88 Feature Set

## Feature A — South Mission Wall v2

Replace the current rough south wall copy with polished, readable, professional mission wording.

### Wall title

```text
ABOUT SVR POKER
PLAY-MONEY POKER • SOCIAL VR • COMMUNITY GIVEBACK
```

### Main mission copy

```text
SVR Poker is a play-money VR poker and social destination built around entertainment, sponsorship, community, and charitable impact. Players gather in immersive rooms, explore sponsor hubs, join private experiences, and participate in future sponsor-funded events while SVR develops a responsible fundraising ecosystem.

The mission is to use virtual poker, advertising, stores, sponsorships, tournaments, and destination rooms to help support animal shelters, homelessness relief, poverty relief, and access to experiences for people who may be sick, immobile, isolated, or unable to easily go outside.
```

### Compliance copy

```text
SVR Poker is designed around play-money chips and sponsor-supported experiences. Future promotions, giveaways, donations, and tournament prizes must remain subject to rules, eligibility, platform policy, and legal review before public activation.
```

### Angel-wing placeholder panel

Use a procedural placeholder now:

```text
SVR CHARITY MISSION
ANGEL WING PLACEHOLDER
FINAL LOGO PENDING
```

Design direction:

- glowing wing outline
- purple / white / gold accent
- no final nonprofit claims until legal structure is ready
- no fake charity registration wording

### Espresso placeholder tile

Use Espresso With Cream as a placeholder sponsor tile only:

```text
PLACEHOLDER SPONSOR TILE
ESPRESSO WITH CREAM
AD SLOT / BRAND PREVIEW
```

Do not describe Espresso With Cream as the charity logo.

---

## Feature B — Moon / Mars Sky v2

Goal: Moon and Mars high in the sky, clearly above the skyline, visible from the lobby and private rooms.

### Implementation rules

- Use low-cost Three.js spheres.
- Keep planets high and behind the skyline.
- Avoid wall/building intersection.
- Avoid huge texture payloads.
- Use emissive halo shells rather than heavy post-processing.
- Keep slow orbit / rotation.

### Recommended positions

```js
moon.position.set(-95, 145, -360);
mars.position.set(115, 165, -440);
```

### Visual targets

- Moon: bright, readable, larger than Mars
- Mars: farther back, warmer red/orange
- Both: slow rotation, subtle halo
- No floor-level or building-height planets

---

## Feature C — Portal + Hologram Registry v2

All portal names and destinations should be controlled from one registry.

```js
window.SVR_PORTALS = {
  lobby: { label: "Lobby", url: "./index.html" },
  seat: { label: "Seat", action: "seat" },
  reikiHub: { label: "Reiki Hub", action: "portal", target: "reikiHub" },
  reikiRoom: { label: "Reiki Room", url: "./reiki.html" },
  pgaHub: { label: "PGA Hub", action: "portal", target: "pgaHub" },
  pgaDrive: { label: "PGA Drive", url: "./pga-drive.html" },
  chipPutt: { label: "Chip/Putt", url: "./chip-putt.html" },
  store: { label: "VR Store", url: "./store-room.html" },
  lounge: { label: "SVR Lounge", url: "./smoker-lounge.html" },
  scorpion: { label: "Scorpion", url: "./scorpion.html" },
  sponsor: { label: "Sponsor", action: "portal", target: "sponsor" }
};
```

### Required hologram tags

Every storefront needs a readable floating tag:

- REIKI PORTAL / AWAITING APPROVAL
- PGA GOLF HUB / DRIVE + CHIP/PUTT
- SVR LOUNGE / PRIVATE SOCIAL ROOM
- VR STORE / STORE PORTAL
- SCORPION ROOM / PRIVATE POKER ROOM
- SPONSOR SPACE / FUTURE PARTNER MODULE

---

## Feature D — Lounge Storefront v2

Create a clearer storefront for the Lounge.

### Name

```text
SVR LOUNGE
PRIVATE SOCIAL ROOM
```

### Purpose

A private social destination for:

- hand replays
- jumbotron highlights
- community hangout
- future live stream / event watch parties
- discussion boards

### Safety wording

Do not use restricted product sales language. Keep it as a social lounge.

---

## Feature E — Espresso With Cream Ad Assets

The Phase 91 Espresso package contains:

```text
game/assets/ads/espresso_lobby_wall_ad_1080x1600.png
game/assets/ads/espresso_game_banner_2048x1024.png
game/assets/ads/espresso_square_billboard_1024.png
```

Use these game-side placements:

| Asset | Placement |
|---|---|
| `espresso_lobby_wall_ad_1080x1600.png` | tall building / south-wall placeholder ad |
| `espresso_game_banner_2048x1024.png` | wide wall billboard / lounge screen |
| `espresso_square_billboard_1024.png` | compact sponsor tile / mission wall placeholder |

Do not touch the site copy of the assets in this game-side track.

---

## Feature F — Modular Event Bus

The uploaded architecture correctly pushes toward modular event-driven systems. Keep that concept, but route it through a small safe bridge instead of loading many backend-dependent modules at once.

### Add

```text
game/modules/svr_event_bus.js
```

### Purpose

A safe local dispatch bridge:

```js
window.SVR_BUS = {
  emit(name, detail = {}) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  },
  on(name, handler) {
    window.addEventListener(name, handler);
  }
};
```

### Allowed local events

```text
svr_show_banner
svr_portal_focus
svr_update_mission_wall
svr_reiki_room_state
svr_lounge_screen_update
svr_poker_winner_showcase
svr_sponsor_placeholder_update
```

Do not call live APIs from game modules until backend credentials and CORS are fully ready.

---

## Feature G — Future Modules, But Disabled by Default

The uploaded module ideas are useful as a roadmap, not all as immediate runtime code.

### Keep as future roadmap docs

```text
charity module
private user module
sponsor module
commerce module
stream module
audio module
hologram watch module
router module
avatar module
scorpion FX module
```

### Do not activate yet

- live commerce
- live sponsor upload
- live user auth in game
- sports/news ticker
- live stream player
- custom audio upload
- multiplayer avatar sync
- FBX dealer/NPC runtime loading

These need backend/API review, legal review, and performance testing.

---

## Feature H — Rigged Human Male Asset Handling

The uploaded rigged human ZIP contains a rigged `.blend` and `.fbx`, but the archive is too heavy for the normal `game.zip` path.

### Rule

Do not include raw FBX in the live `game.zip`.

### Correct future pipeline

1. Convert to optimized GLB or VRM.
2. Reduce texture size.
3. Create seated idle pose.
4. Create card peek / chip reach / fold poses.
5. Test file size.
6. Add only after package remains under 25 MB.

### Use case

- future male NPC base
- future Scorpion room seated bot
- future dealer/body test only after invisible dealer logic remains stable

---

## 4. Corrected Architecture Copy

Use this wording instead of the older “Unity hybrid / hands-only” text.

```text
SVR Poker is a browser-based WebXR / Three.js immersive poker and social hub. The architecture is modular: poker gameplay, private-room routing, sponsorship placeholders, mission displays, watch controls, portal tags, and future backend bridges are separated into removable modules.

The current live build supports Meta hand tracking first, with Quest/Oculus controller fallback. Controller objects should remain hidden or represented as natural hands, but controller input must continue to work for movement, snap turn, teleport, and watch/portal selection.
```

---

## 5. Corrected Mission Statement

```text
SVR Poker is a play-money VR poker and social hub built to connect entertainment, sponsorship, community, and charitable impact. The platform is designed to support future sponsor-funded events, advertising placements, digital stores, destination rooms, and community campaigns that can help fund causes such as animal welfare, homelessness relief, poverty relief, and access to immersive experiences for people who may be isolated, sick, immobile, or unable to go outside.

SVR Poker is not positioned as a real-money gambling product. Public promotions, donations, prizes, and sponsor-funded tournaments must be reviewed for rules, eligibility, platform compliance, and legal safety before activation.
```

---

## 6. Phase 88 File Plan

### New / updated game files

```text
game/index.html
game/main.js
game/modules/svr_event_bus.js
game/modules/mission_wall.js
game/modules/sky_planets.js
game/modules/portal_registry.js
game/modules/lounge_storefront.js
game/docs/PHASE_88_REFINED_MISSION_PORTAL_SKY_LOCK.md
game/docs/PHASE_88_REFINED_MISSION_PORTAL_SKY_MANIFEST.json
```

### Asset files to include

```text
game/assets/ads/espresso_lobby_wall_ad_1080x1600.png
game/assets/ads/espresso_game_banner_2048x1024.png
game/assets/ads/espresso_square_billboard_1024.png
```

### Protected files

```text
root index.html
/site
site.zip
update/site.zip
```

---

## 7. Implementation Order

1. Brand audit first.
2. Copy Espresso ad assets into `/game/assets/ads/`.
3. Update south mission wall copy and placeholder emblem.
4. Raise Moon and Mars.
5. Add portal registry checks.
6. Add/fix Lounge storefront.
7. Add docs and build labels.
8. Validate no blocked Reiki branding.
9. Validate under 25 MB.
10. Package `game.zip`.

---

## 8. Deferred / Not Approved For Runtime Yet

Do not implement these in the live game without explicit approval:

- real sports/news odds or sports/news ticker
- live Stripe / real-money checkout
- live sponsor upload activation
- raw FBX NPC payload
- external Reiki brand/founder content
- Unity/A-Frame rewrite
- direct SQL secrets in frontend
- direct API secrets in frontend
