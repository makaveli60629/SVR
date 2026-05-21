export const PHASE_111_BUILD = "PHASE-111-SKY-ESPRESSO-FACE-CENTER-LOCK";
export const PHASE_110_BUILD = PHASE_111_BUILD;
export const PHASE_109_BUILD = PHASE_110_BUILD;
export const PHASE_108_BUILD = PHASE_110_BUILD;
export const PHASE_107_BUILD = PHASE_110_BUILD;
export const PHASE_106_BUILD = PHASE_110_BUILD;
export const PHASE_105_BUILD = PHASE_110_BUILD;
export const PHASE_104_BUILD = PHASE_110_BUILD;
export const PHASE_103_BUILD = PHASE_110_BUILD;
export const PHASE_102_BUILD = PHASE_110_BUILD;
export const PHASE_101_BUILD = PHASE_110_BUILD;
export const PHASE_100_BUILD = PHASE_110_BUILD;

// Compatibility named exports for older mixed-phase runtimes.
// These prevent boot failure when a cached or stale module imports a phase-specific object name.
export const PHASE_101_VR_RUNTIME_CORRECTION_LOCK = Object.freeze({
  phase: PHASE_111_BUILD,
  lock: "Three.js/WebXR runtime; A-Frame snippets are quarantined and not loaded",
  controls: "Meta hand tracking plus hidden Quest/Oculus controller fallback",
  safety: "watch hologram defaults off; teleport, fist glow, and locomotion have explicit controls",
  siteTouched: false
});
export const PHASE_102_VR_VISUAL_ALIGNMENT_LOCK = PHASE_101_VR_RUNTIME_CORRECTION_LOCK;
export const PHASE_103_BOOT_RESCUE_LOCK = PHASE_101_VR_RUNTIME_CORRECTION_LOCK;
export const PHASE_104_BOOT_CONSTANT_AFRAME_GUARD = PHASE_101_VR_RUNTIME_CORRECTION_LOCK;
export const PHASE_105_BOOT_SAFE_RUNTIME_LOCK = PHASE_101_VR_RUNTIME_CORRECTION_LOCK;
export const PHASE_106_HOLOCTX_BOOT_FIX_LOCK = PHASE_101_VR_RUNTIME_CORRECTION_LOCK;
export const PHASE_107_VISUAL_TABLE_FLOW_LOCK = PHASE_101_VR_RUNTIME_CORRECTION_LOCK;
export const PHASE_108_WATCH_TELEPORT_LOCOMOTION_LOCK = PHASE_101_VR_RUNTIME_CORRECTION_LOCK;
export const PHASE_109_REGISTRY_EXPORT_BOOT_LOCK = PHASE_101_VR_RUNTIME_CORRECTION_LOCK;
export const PHASE_110_BOOT_VERIFIED_WATCH_STABILITY_LOCK = PHASE_101_VR_RUNTIME_CORRECTION_LOCK;
export const PHASE_111_SKY_ESPRESSO_FACE_CENTER_LOCK = PHASE_101_VR_RUNTIME_CORRECTION_LOCK;

export const PRIVATE_ROOM_REGISTRY = Object.freeze([
  { key: "scorpion", label: "Scorpion Poker VR", type: "private-vr-room", status: "active", entry: "Scorpion storefront", exit: "Back to Lobby portal", branding: "SVR / modular sponsor-ready", vrReady: true, safeBounds: true },
  { key: "reikiRoom", label: "Reiki Room VR", type: "private-vr-room", status: "approval-placeholder", entry: "Reiki storefront", exit: "Back to Lobby portal", branding: "SVR placeholder only until written approval", vrReady: true, safeBounds: true },
  { key: "pgaRange", label: "PGA Range VR", type: "private-vr-scene", status: "scaffold", entry: "PGA storefront", exit: "Back to Lobby portal", branding: "PGA module-ready", vrReady: true, safeBounds: true },
  { key: "vrStore", label: "VR Store", type: "private-vr-store", status: "scaffold", entry: "Storefront portal", exit: "Back to Lobby portal", branding: "store inventory / sponsor-ready", vrReady: true, safeBounds: true },
  { key: "smokerLounge", label: "Smoker Lounge VR", type: "private-vr-lounge", status: "scaffold", entry: "Lounge portal", exit: "Back to Lobby portal", branding: "social lounge sponsor-ready", vrReady: true, safeBounds: true },
  { key: "spaceRoom", label: "Space Room VR", type: "private-vr-scene", status: "scaffold", entry: "Space deck portal", exit: "Back to Lobby portal", branding: "moon / Mars / skyline-safe", vrReady: true, safeBounds: true }
]);

export function routeLabel(key){
  return PRIVATE_ROOM_REGISTRY.find((room)=>room.key === key)?.label || key;
}

