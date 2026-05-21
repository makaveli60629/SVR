export const PHASE_99_BUILD = "PHASE-99-SCORPION-ROOM-TABLE-LOCK";

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


export const PHASE_99_SCENE_ADD_LOCK = Object.freeze({
  lock: "all private rooms are VR-routable scenes",
  controls: "Meta hand tracking plus hidden Quest/Oculus controller fallback",
  safety: "each scene has safe spawn mat, guard ring, and back-to-lobby route",
  siteTouched: false
});
