SVR Game Phase v2.1.5

Changes in this package:
- removed the synthetic felt cap overlay from the table
- added the claudia asset folder directly into the package for reliable loading
- switched the dealer to Claudia (static dealer placement at the table)
- rebuilt the four matrix wall panels with live rain and sponsor zones
- north wall is the main sponsor screen; south/east/west are reserved-for-sponsor screens
- updated the package logo to the latest provided site logo
- made the floor tiles and wall bricks tile more densely (smaller on-screen scale)
- brightened Earth and Moon and increased glow sprites
- removed visible XR hand mesh so the in-headset view stays hand-free
- refined the watch placement and removed the UI billboard auto-look behavior

Audit notes:
- I could not find an accessible `card.fbx` file in the uploaded assets, so this package keeps the demo cards already on the table instead of placing Claudia with a card FBX.
- This package was syntax-checked for the JavaScript modules, but not live-tested inside a Quest headset here.
