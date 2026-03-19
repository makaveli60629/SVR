svr v2.3.6 stability table fix

what was patched
- unstable table model path removed from runtime and replaced with a procedural poker table
- claudia scale and dealer anchor corrected
- claudia arm motion reduced to stop raised-arm look
- moon moved higher, farther back, and with lower glow
- mars moved higher and farther back
- watch brace hidden and watch face pushed outward with no auto flip

why
- the screenshot showed the table surface was still unstable, so the safest fix was to stop using the broken live table mesh in this build
