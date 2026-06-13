import { applyReikiHologramPhase133 } from "./reiki_hologram_phase133.js";

// Compatibility wrapper: main.js still calls the older Phase 119/130 Reiki entry point.
// Phase 133 replaces the cluttered wall overlays with one interactive hologram display,
// left founder-info wall, right Shyona Royston photo wall, and chakra/Reiki slides.
export function applyPhase119ReikiTrueitiveStorefrontFinal(args = {}){
  return applyReikiHologramPhase133(args);
}
