# SVR Game Next Phase v2.1.6 Audit

Built from the prior v2.1.5 game-only package and refined for these requests:

- restored visible hands without phone-like objects by adding simple controller-hand visuals and XR hand meshes when available
- reworked watch anchoring farther down the forearm with a more stable outward-facing basis
- increased earth/moon emissive intensity, halo size, and supporting light levels
- tightened floor and wall texture repeat so tiles/bricks read smaller
- added a looping dealing-demo card animation from the dealer side toward player seats
- reduced and repositioned Claudia to the dealer side
- kept matrix sponsor walls and logo setup

Known runtime-sensitive items:
- exact forearm watch angle in-headset may still need one more physical-fit pass
- Claudia FBX orientation depends on headset/runtime asset interpretation
