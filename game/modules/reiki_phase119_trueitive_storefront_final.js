import { applyReikiPhase136FlipOrbit } from "./reiki_phase136_flip_orbit.js";

// Compatibility wrapper: main.js still calls the older Reiki entry point.
// Phase 136 flips the storefront so the user sees the front, beautifies the wall layout,
// keeps one interactive hologram screen, and adds the Earth lobby orbit system.
export function applyPhase119ReikiTrueitiveStorefrontFinal(args = {}){
  return applyReikiPhase136FlipOrbit(args);
}
