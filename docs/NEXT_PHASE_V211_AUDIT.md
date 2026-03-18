# SVR Next Phase V2.1.1 Audit

Zip: `svr_game_next_phase_v211_20260317_under25mb.zip`
Size: 13.35 MB

## Changes in this drop
- removed the phone-like controller visuals and replaced them with rounded hand-style controller hands
- rebuilt the watch as a curved wrist-to-forearm bracelet and moved it onto the top/outside of the forearm
- switched the floor to the uploaded slate texture set:
  - `Poliigon_SlateFloorTile_7657_BaseColor.jpg`
  - `Poliigon_SlateFloorTile_7657_Normal.png`
  - `Poliigon_SlateFloorTile_7657_Roughness.jpg`
- generated a new dark stone-brick wall texture set from the uploaded slate texture so the walls are no longer plain leather
- improved city skyline variation and added billboard signage, including a matrix-code SVR billboard
- brightened the earth and moon and changed the moon path to orbit around the earth with a near/far pass
- removed the synthetic rail table ring and kept a thin `tablefelt.png` top on the real table path
- changed Claudia to use `claudia.fbx` as the visible character and `walking.fbx` as the preferred animation source
- changed Camera 3 preview to a floating show view

## Honest caveats
- I statically checked the JS/module syntax and packaged structure here, but I could not do a live Quest runtime test in this environment.
- Claudia walking depends on the walking FBX clip binding cleanly to the Claudia rig. If the clip names do not bind in runtime, she will still be visible and moving on the path, but the leg animation may need one more retarget pass.
