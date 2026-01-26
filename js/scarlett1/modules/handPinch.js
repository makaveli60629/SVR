import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';

export function initHands(renderer, scene) {
  try {
    const handModelFactory = new XRHandModelFactory();
    for (let i = 0; i < 2; i++) {
      const hand = renderer.xr.getHand(i);
      hand.add(handModelFactory.createHandModel(hand, 'mesh'));
      scene.add(hand);
    }
  } catch (e) {
    // no-op on non-hand browsers
  }
}
