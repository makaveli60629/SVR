# SVR Poker Master Manifest Checklist

## Build

- Build: `PHASE-174-MASTER-AUDIT-ROOM-WALKAROUND-LOCK`
- Game only: yes
- Site touched: no
- Under 25 MB target: yes

## Hard locks

- [x] Site/public Matrix page remains locked.
- [x] Game package stays modular.
- [x] Main lobby remains portal hub.
- [x] Private rooms are separate pages/routes.
- [x] Reiki unapproved sponsor/founder branding blocked.
- [x] Dealer body remains disabled while invisible card/deal logic stays.
- [x] Left-to-right dealing work preserved from poker phases.
- [x] Quest/controller fallback remains target behavior.

## Room boot checklist

- [x] Lobby: `game/index.html`
- [x] Reiki private room: `game/reiki.html`
- [x] PGA driving range shell: `game/pga-drive.html`
- [x] PGA chip/putt shell: `game/chip-putt.html`
- [x] Store showroom shell: `game/store-room.html`
- [x] Smoker Lounge shell: `game/smoker-lounge.html`
- [x] Scorpion private room shell: `game/scorpion.html`

## Manual QA required after deploy

- [ ] Live page shows `PHASE-174-MASTER-AUDIT-ROOM-WALKAROUND-LOCK`.
- [ ] Lobby does not black-screen.
- [ ] Logs show no runtime error.
- [ ] Enter VR button appears.
- [ ] Private scene pages open.
- [ ] Player can walk around in each private page.
- [ ] Poker controls still respond.
- [ ] Watch still mounts in lobby.
