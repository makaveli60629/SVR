import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';

// Hands-only visuals (safe no-op if unsupported)
export function initHands(renderer, scene) {
  try {
    const factory = new XRHandModelFactory();
    for (let i = 0; i < 2; i++) {
      const hand = renderer.xr.getHand(i);
      hand.add(factory.createHandModel(hand, 'mesh'));
      scene.add(hand);
    }
  } catch (e) {
    // ignore
  }
}
