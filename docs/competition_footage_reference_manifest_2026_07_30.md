# Competition Footage Reference Manifest — 2026-07-30

## Source
- Reference URL supplied by project owner: `https://youtu.be/YoYRjP_vFWo?is=3huR73Rype6w3iZI`
- Resolved video title visible through external page access: `The 8 2 incident VR Poker`
- Frame/transcript limitation: the accessible page did not expose playable frames, captions, transcript, or timecoded gameplay data to the assistant session. This manifest therefore separates confirmed source capture from implementation inference.

## What can be safely captured from the source right now
1. The reference is a VR poker competitor/gameplay reference.
2. The project owner wants SVR to learn from it for table presence, control feel, smoothness, social gameplay, and preview presentation.
3. No exact visual claim from the footage should be treated as confirmed until screenshots, frame grabs, a transcript, or timestamps are provided.

## SVR interpretation rules
- Do not copy competitor assets, names, branding, UI art, or proprietary designs.
- Use the footage only as a gameplay and UX reference.
- Convert observations into SVR-original systems: modular controls, platform performance tiers, cleaner poker table presentation, and readable play state.
- Keep approved SVR branding: SVR table logo, poker table surface, clean lobby lighting, stable Android route, and director preview.

## Modular platform plan

### Shared core modules
- Poker state engine: hand start, turn ownership, action validation, chip totals, pot, card state, winner/reset.
- Table surface authority: one calculated table plane for cards, chips, pot, logo, and hit areas.
- Seat authority: front/south user seat, player-facing cards, seated movement lock, camera facing table.
- Preview authority: director camera route with no debug overlays and no Android controls.
- Asset authority: one active table, one active player card root, one active chip root, one active UI layer per platform.

### Android tier
- Stable route: `/game/android.html?channel=stable`.
- One control overlay only.
- Left stick: walk/strafe.
- Right stick: look/turn.
- Buttons: Sit/Lobby, Deal, Check, Call, Raise, Clean/Center.
- Raise slider and amount validation.
- Seated play mode: movement limited; card tray visible; turn banner visible.
- Performance: reduced pixel ratio, simplified lighting, fewer transparent layers, limited post effects.

### Quest/Oculus tier
- XR entry remains separate from Android.
- Controller-hand proxy remains visible when physical controllers are used.
- Real hand tracking should not be overridden.
- Table hitboxes must be larger and controller friendly.
- Card/chip pickup can be added later after Android playable state is stable.

### Desktop / website preview tier
- Director camera only.
- No HUD/debug/joystick overlays.
- Slow orbit around table.
- SVR table logo centered and flush to surface.
- Lighting tuned for readability and sponsor/public preview.

## Performance fixes to prioritize
1. Remove duplicate DOM controls and duplicate scene roots every boot.
2. Centralize phase booting so Android does not load unnecessary Quest-only UI.
3. Use platform capability flags: Android, Quest, desktop preview.
4. Reduce recurring intervals; prefer one platform runtime controller per route.
5. Disable shadows or heavy point lights on Android.
6. Keep canvas resize recovery for Android black-screen cases.
7. Ensure card/chip roots are rebuilt only once per hand, not every frame.
8. Keep director preview camera and live play camera separated.

## Gameplay improvements inspired by the reference request
- Player must immediately understand: where they are seated, whose turn it is, what cards they hold, what actions are legal, and how much a raise will cost.
- Cards must face the seated player and never float above the table rail.
- Chips and pot must sit on the same table surface authority as the cards.
- Active turn should use both a table ring and a screen/UI banner on Android.
- Buttons should highlight only when valid.
- Raise should use a slider plus quick-step buttons.
- Seated mode should prevent accidental walking away during a hand.
- The preview camera should make the game obvious within three seconds: poker table, cards, chips, SVR logo, lobby atmosphere.

## Immediate next phase recommendation
`PHASE-329-ANDROID-TABLE-PLAYTEST-UX-LOCK`

### Phase 329 target work
1. Android single-control verification guard.
2. Android seated-state persistence across Deal/Action/Reset.
3. Turn banner linked to actual poker state instead of only local UI state.
4. Legal action highlighting: disable invalid actions.
5. Raise slider validation against chip stack and current bet.
6. Card tray update tied to dealt card state.
7. Button feedback: visual scale, short vibration where supported, and status text.
8. Preview route QA helper to confirm clean overlay-free director view.

## Evidence still needed from footage
- 3 to 5 screenshots or timestamps from the video.
- Screenshot of table view.
- Screenshot of action buttons/turn indicator.
- Screenshot of card/chip layout.
- Screenshot of player/hand/controller interaction.

With those screenshots, this manifest should be updated from reference-inference to frame-grounded implementation notes.