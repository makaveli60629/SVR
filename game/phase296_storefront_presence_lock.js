const LABEL = "PHASE-296-STOREFRONT-PRESENCE-LOCK";
const DATA = [
  ["REIKI HUB", -12, -16.04],
  ["PGA GOLF", -6, -16.04],
  ["PLAY GAME", 0, -16.04],
  ["SVR STORE", 6, -16.04],
  ["SCORPION", 12, -16.04],
  ["THEATER", 15.85, 5.8]
];
function apply(){
  window.SVR_PHASE296_STOREFRONT_PRESENCE_LOCK = {
    build: LABEL,
    active: true,
    siteTouched: false,
    publicRootTouched: false,
    storefronts: DATA.map(([name,x,z]) => ({ name, x, z })),
    checkedAt: new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
apply();
setInterval(apply, 2000);
