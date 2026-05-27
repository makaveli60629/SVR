# SVR Poker — Game Update 2.0 Execution Checklist

**Build:** `PHASE-89-GAME-UPDATE-2-0-MANIFEST-LOCK`

Use this checklist before every Game Update 2.0 package is shipped.

---

## Pre-build checks

- [ ] Confirm `/game` is the only game target.
- [ ] Confirm `/site`, root website files, and Matrix public page are untouched.
- [ ] Confirm original lobby is still the only lobby shell.
- [ ] Confirm no second lobby, boxed duplicate room, or extra wall shell is active.
- [ ] Confirm full Reiki/PGA/Scorpion/Store rooms are not inside the main lobby.
- [ ] Confirm `game.zip` is under 25 MB.

---

## Runtime checks

- [ ] `game/index.html` loads without black screen.
- [ ] Build label matches package phase.
- [ ] `game/main.js` imports active modules without missing imports.
- [ ] `game/modules/teleport.js` is loaded and active.
- [ ] `game/modules/watch.js` is loaded and active.
- [ ] `game/modules/poker_demo.js` is loaded and active.
- [ ] No autoplay music starts in the lobby.

---

## Lobby checks

- [ ] Original lobby still visible.
- [ ] Main poker table remains in place.
- [ ] Watch remains usable.
- [ ] Moon and Mars are visible above skyline.
- [ ] Store portal points to `https://svrpoker.com/site/store.html`.
- [ ] Pathways are clear.
- [ ] No extra second-lobby walls or duplicated room shells.

---

## Locomotion checks

- [ ] Right stick up/down moves forward/back.
- [ ] Right stick left/right snap turns 45 degrees.
- [ ] Left stick fallback still works if available.
- [ ] Hold-to-aim teleport shows arc/marker.
- [ ] Release-to-teleport works.
- [ ] No instant accidental teleport.
- [ ] Seat jump places player at playable table distance.

---

## Poker checks

- [ ] Five bots are seated.
- [ ] One south/front seat remains open for user.
- [ ] Dealer body stays hidden/disabled.
- [ ] Dealer button remains visible.
- [ ] Cards deal left-to-right.
- [ ] Card ranks/suits are readable.
- [ ] Pass/bet line remains visible.
- [ ] Pot/chip movement remains visible.

---

## Private scene route checks

- [ ] Reiki route opens private Reiki scene.
- [ ] PGA Drive opens private driving range scene.
- [ ] Chip/Putt opens private short-game scene.
- [ ] Store opens private store/web portal scene.
- [ ] Smoker Lounge opens private lounge scene.
- [ ] Scorpion opens private poker room.

---

## Approval / branding checks

- [ ] No Trueitive text.
- [ ] No Truitive text.
- [ ] No trueitive.com.
- [ ] No founder names/photos.
- [ ] Reiki uses SVR or AWAITING APPROVAL placeholder only.
- [ ] Sponsor content remains modular/removable.

---

## Deploy checks

- [ ] `/game` folder updated.
- [ ] `/update/game.zip` updated.
- [ ] `/update/version.json` updated if present.
- [ ] Zip permissions normalized.
- [ ] PowerShell script uses unique ZIP filename.
- [ ] GitHub Actions Auto Deploy run manually after push.
- [ ] Test URL uses cache-busting `?v=`.
