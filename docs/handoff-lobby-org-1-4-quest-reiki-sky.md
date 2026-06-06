# SVR Poker — Handoff Manifest

## Current update lane

**Update lane:** Lobby Organization 1.4

**Latest working label:** `LOBBY-ORG-1-4J-QUEST-RIGHT-STICK-HEAD-FORWARD-LOCK`

**Repo:** `makaveli60629/SVR`

**Primary target:** WebXR / Quest browser first. Android is currently considered locked for now. Desktop remains open and working.

---

## Core instruction for next chat

Continue from the current GitHub repo state. Do not rebuild the whole lobby from scratch. Patch the current modular files only.

The user’s highest-priority issue is **Quest controller locomotion**:

> On Oculus Quest controller, right stick forward must always move the player forward in the direction the headset/player is facing. If the user turns 45 degrees and presses forward, they must move forward in that 45-degree facing direction, not sideways.

Android controls should not be touched unless absolutely necessary. Desktop controls are acceptable and should remain working.

---

## Latest major work completed

### 1. Quest controller locomotion / teleport

File updated:

```text
game/modules/teleport.js
```

Latest intended behavior:

```text
Quest right stick Y = forward/back using headset/camera forward
Quest right stick X = snap turn 45 degrees
left stick X = optional strafe only
forward vector comes from XR camera matrix/world basis
movement velocity resets after snap turn
grip held = teleport aim mode
trigger while grip held = teleport jump
purple controller glow appears while teleport grip is active
raycast line draws from controller to floor teleport target
SVR logo floor target appears as teleport landing marker
```

Current build constant in that file should be:

```text
LOBBY-ORG-1-4J-QUEST-RIGHT-STICK-HEAD-FORWARD-LOCK
```

Important runtime debug object:

```js
window.SVR_QUEST_LOCOMOTION_14J
window.SVR_QUEST_LOCOMOTION_14J_LAST_SNAP
```

Test in Quest:

```text
1. Enter Quest browser/WebXR.
2. Turn head/body 45 degrees.
3. Push right stick forward.
4. Player should move exactly where headset is facing.
5. Push right stick left/right hard: snap turn 45 degrees.
6. After snap turn, push right stick forward again.
7. Player should move forward in the new facing direction, not sideways.
8. Hold grip: purple teleport ray + logo floor target should show.
9. While holding grip, press trigger: teleport jump.
```

If the sideways issue persists, inspect whether `playerYaw` reference-space rotation and XR camera forward are double-applying yaw. The likely next fix is to make smooth locomotion use **viewer pose/headset world direction only** and avoid mixing rig yaw into the movement vector.

---

### 2. Quest controller laser pointer for UI

File updated:

```text
game/modules/controller_pointer_bridge_1_2.js
```

Current behavior:

```text
controller laser is visible in Quest
ray can target Reiki carousel buttons
ray can target SVR Store buttons
ray can target PGA carousel buttons
ray can target portal cards
hover label appears near target
```

User’s desired final behavior:

```text
A button toggles laser pointer on/off for UI interaction
trigger selects the button being pointed at
laser should work from comfortable distance, not require walking directly into hologram
Reiki slider/video card must be controllable from Quest controller
```

Current fallback behavior already exists:

```text
left trigger = previous
right trigger = next
grip / A / B = action
```

But user wants cleaner behavior:

```text
A = laser pointer on/off
trigger = click/select
```

Next recommended patch:

```text
Update controller_pointer_bridge_1_2.js:
- Track A button edge press.
- Toggle window.SVR_QUEST_UI_LASER_ACTIVE.
- Only show UI laser when A toggle is on, or keep always visible but brighten when on.
- Use trigger as select only.
- Avoid grip triggering carousel action because grip is now reserved for teleport.
```

---

### 3. Reiki video hologram audio

File updated:

```text
game/modules/reiki_interaction_gate_1_2.js
```

Current intended behavior:

```text
Reiki video unmutes when video card is active
volume set to 1.0
WebAudio gain boost attempted at 1.65x
video stops/mutes outside video card
```

Build label:

```text
LOBBY-ORG-1-4H-REIKI-VIDEO-AUDIO-BOOST
```

Runtime debug objects:

```js
window.SVR_REIKI_VIDEO_STATE
window.SVR_REIKI_VIDEO_VOLUME_LOCK
window.SVR_REIKI_VIDEO_GAIN_NODE
window.SVR_REIKI_INTERACTION_GATE_12
```

User still wants video slightly louder if needed. Current gain is 1.65. Raise carefully if requested:

```js
const REIKI_GAIN = 1.85; // or 2.0 max for testing
```

Do not autoplay Reiki audio at spawn. Audio should activate only on the Reiki video card / user interaction.

---

### 4. Reiki storefront polish

Files involved:

```text
game/modules/reiki_update_101_1_1_mother_module.js
game/modules/reiki_interaction_gate_1_2.js
game/modules/reiki_scorpion_polish_1_4.js
game/modules/lobby_portal_store_layout_1_4.js
```

Latest polish module added:

```text
game/modules/reiki_scorpion_polish_1_4.js
```

Current intended behavior:

```text
screen-following Reiki control overlay hidden
small in-world control hint placed low near Reiki interaction area
large red sign should say REIKI HUB
AWAITING APPROVAL should be big and red
left/right signs angled slightly toward the approach/teleport circle
old rods/poles near carpet hidden
new red rope poles spread out
new sagging rope-style red ropes added
plant beds added on both sides of red carpet
hologram sightline should remain clear
```

User complaint that led to this:

```text
Reiki control was following screen and blocking the founder/video face.
Riki/RICI sign was misspelled.
Red banner needed to be brought forward and say REIKI HUB / AWAITING APPROVAL.
Rods on floor beside carpet needed removal.
Ropes/poles needed to look like real red rope staging.
Side signs needed to be more readable and slightly curved/angled toward user.
Plant bed should look neat and intentional.
```

Next check:

```text
1. Confirm no DOM overlay follows camera.
2. Confirm small controls are in-world and low.
3. Confirm red sign reads REIKI HUB and AWAITING APPROVAL.
4. Confirm left/right signs are readable from the approach circle.
5. Confirm hologram/video is not blocked.
```

---

### 5. Reiki / Scorpion connector

File added:

```text
game/modules/reiki_scorpion_polish_1_4.js
```

Current intended behavior:

```text
Scorpion portal table added near Reiki/Scorpion side
hologram panel sits on table
activating it routes to Scorpion Room / scorpion route
old directory moved away from the Scorpion/Reiki seam
soft floor seam added so buildings do not feel disconnected
```

User wants:

```text
Riki room smoothly connected to Scorpion room
no overlap
no crevices between the two buildings
Scorpion room should have a table with a hologram that routes to Scorpion rooms
old directory should move somewhere else
```

Next check:

```text
1. Scorpion hologram table exists.
2. Directory is not blocking the Scorpion/Reiki seam.
3. There is no overlap between Reiki and Scorpion area.
4. Portal table activation works.
```

---

### 6. Moon / Mars / stars

File updated:

```text
game/modules/phase121_sky_fix.js
```

Current build label:

```text
LOBBY-ORG-1-4G-ULTRA-HIGH-MOON-MARS-STARS-LOCK
```

Current intended behavior:

```text
remove duplicate moon/Mars objects by name
create one official ultra-high moon
create one official ultra-high Mars
moon larger
Mars larger
stars added
moon/Mars rotate slowly
```

Current approximate values:

```text
moonPos = [-132, 490, -560]
marsPos = [178, 456, -610]
moon radius = 24.0
mars radius = 11.5
```

User still reports:

```text
two moons visible
two Mars visible
one moon spins very fast and looks fake/geometry-generated
official moon/Mars need to be bigger and 3x higher
Mars should orbit the moon
use real OBJ/GLB if available, with textures
```

Next recommended patch:

```text
1. Strengthen duplicate cleanup to hide/remove any object name containing:
   moon, mars, planet, celestial, orb, sphere, fake, geometry
   unless it is inside SVR_PHASE121_HIGH_SKY_LOCK.

2. Increase official sky:
   moonPos roughly [-180, 900, -900]
   mars orbit center around moon, radius 110-160
   moon radius 42-55
   mars radius 18-24

3. Add Mars orbit around moon:
   mars.position.x = moon.position.x + cos(t) * orbitRadius
   mars.position.z = moon.position.z + sin(t) * orbitRadius
   mars.position.y = moon.position.y - 40 + sin(t * 0.7) * 12

4. If real OBJ/GLB assets exist, prefer those. Search assets for:
   moon, mars, planet, .glb, .gltf, .obj

5. If no model found, use high-quality textured sphere fallback.
```

Important: User says they supplied texture files and possibly OBJ/GLB. Search repo/assets before assuming unavailable.

---

### 7. Storefront / portal layout

Files involved:

```text
game/modules/lobby_portal_store_layout_1_4.js
game/modules/coffee_stand_phase112.js
game/modules/svr_storefront_module_1_2.js
game/modules/portal_plaza_directory_1_2.js
```

Latest layout changes:

```text
SVR Store moved to old coffee/ad zone
Espresso / whipped cream / coffee stand hidden
Reiki intended to align back with original red-carpet section
PGA duplicate portal objects hidden by name where detected
portal directory moved away from Scorpion/Reiki seam
```

User requested:

```text
Store should be where the coffee ad was.
Remove Espresso With Cream completely.
Keep portal/store areas neat, organized, user-friendly.
There should not be duplicate PGA hubs.
```

Next check:

```text
1. Confirm Espresso objects are not visible.
2. Confirm SVR Store appears in old coffee/ad zone.
3. Confirm only one PGA hub/portal is visible.
4. Confirm portal directory is placed cleanly and does not block Scorpion/Reiki.
```

---

### 8. Performance / contrast / grain

File involved:

```text
game/modules/performance_stability_1_3.js
```

Current intended behavior:

```text
Quest clarity mode active
pixel ratio and framebuffer raised from the earlier too-blurry settings
foveation reduced for less edge grain
sprite/dust opacity reduced
transparent material flicker mitigated
```

User still says:

```text
game contrast looks horrible
game looks grainy/choppy
frame rate may need check
```

Next recommended patch:

```text
1. Add a Quest clarity preset switch:
   ?quality=fast
   ?quality=clear
   ?quality=full

2. For default Quest, prefer clarity-safe values:
   renderer pixel ratio around 0.82
   framebuffer scale around 0.80
   foveation around 0.55-0.65

3. Reduce high-opacity additive glow/fog/dust.
4. Avoid too many transparent sprites in front of camera.
5. Confirm loading chain is not adding duplicate objects over time.
```

---

## Important files to inspect first in next chat

```text
game/modules/teleport.js
game/modules/controller_pointer_bridge_1_2.js
game/modules/phase121_sky_fix.js
game/modules/reiki_interaction_gate_1_2.js
game/modules/reiki_scorpion_polish_1_4.js
game/modules/lobby_portal_store_layout_1_4.js
game/modules/coffee_stand_phase112.js
game/main.js
game/index.html
```

---

## Runtime test URL pattern

Use cache-bust query strings when testing:

```text
https://svrpoker.com/game/?v=quest-locomotion-sky-reiki-next
```

For forced full showroom testing:

```text
https://svrpoker.com/game/?v=quest-locomotion-sky-reiki-next&full=1
```

---

## Must-not-break locks

```text
Do not modify Android controls unless the user explicitly asks.
Do not remove desktop controls.
Do not remove Reiki approval warnings.
Do not enable Reiki checkout/database/email forwarding.
Do not autoplay Reiki audio at spawn.
Do not bring back Espresso With Cream unless user asks.
Do not create duplicate moon/Mars fallback objects.
Do not shift Reiki off its red carpet alignment again.
Do not use grip as carousel action; grip is reserved for Quest teleport.
```

---

## Current user priorities for next chat

### Priority 1 — Quest locomotion

```text
Right controller stick forward must always move forward in headset-facing direction.
No sideways drift after 45-degree turn.
```

### Priority 2 — Quest controller UI laser

```text
A button toggles laser pointer.
Trigger selects/clicks.
Grip starts teleport only.
Trigger jumps while teleport is active.
```

### Priority 3 — Moon/Mars cleanup

```text
Remove fake duplicate moons/Mars.
Use official one moon and one Mars.
Place much higher.
Scale larger.
Mars orbits moon.
Use real models/textures if available.
```

### Priority 4 — Reiki polish check

```text
Reiki screen overlay should not follow camera.
Video face should be visible.
Audio should be louder.
Signs should be correct and readable.
Red carpet/ropes/plants should be polished.
```

### Priority 5 — Scorpion/Reiki seam

```text
Scorpion table portal should exist.
Reiki and Scorpion should connect cleanly with no overlap/crevice.
```

---

## Suggested next update name

```text
Update 1.4K — Quest Locomotion Final Lock + Official Sky Cleanup
```

Suggested scope:

```text
1. Finalize Quest right-stick head-forward movement.
2. Split Quest controls cleanly:
   - grip = teleport aim
   - trigger = teleport jump or UI click depending mode
   - A = UI laser toggle
3. Search and remove all duplicate/fake moon/Mars sources.
4. Use official model/texture assets if found.
5. Raise moon/Mars 3x higher and make Mars orbit moon.
6. Verify Reiki polish module is loaded after Reiki mother module.
7. Confirm no floating screen-follow control panel blocks Reiki video.
```
