const LABEL = "PHASE-292-ADMIN-PILL-USER-GROUP-LOCK";

function movePill(obj, x, z){
  if (!obj) return false;
  obj.visible = true;
  obj.position.x = x;
  obj.position.z = z;
  obj.userData.phase292UserGroup = true;
  obj.userData.phase292RemovedFromTable = true;
  obj.traverse?.((child)=>{
    child.visible = true;
    child.userData.phase292UserGroup = true;
  });
  obj.updateMatrix?.();
  obj.updateMatrixWorld?.(true);
  return true;
}
function apply(){
  const scene = window.__SVR_SCENE__;
  if (!scene) return false;
  const admin = scene.getObjectByName("PHASE287_ADMIN_PILL_AVATAR");
  const player = scene.getObjectByName("PHASE287_PLAYER_PILL_AVATAR");
  const android = scene.getObjectByName("PHASE287_ANDROID_PILL_AVATAR");
  const quest = scene.getObjectByName("PHASE287_QUEST_PILL_AVATAR");
  const moved = {
    admin: movePill(admin, -2.25, 7.15),
    player: movePill(player, -0.75, 7.15),
    android: movePill(android, 0.75, 7.15),
    quest: movePill(quest, 2.25, 7.15)
  };
  window.SVR_PHASE292_ADMIN_PILL_USER_GROUP_LOCK = {
    build: LABEL,
    active: true,
    siteTouched: false,
    userGroupZ: 7.15,
    adminRemovedFromTable: moved.admin,
    adminGroupedWithUsers: moved.admin && (moved.player || moved.android || moved.quest),
    moved,
    checkedAt: new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
apply();
let tries = 0;
const timer = setInterval(()=>{ tries += 1; if (apply() || tries > 160) clearInterval(timer); }, 150);
[500,1200,2400,4800,8000,12000,18000].forEach((delay)=>setTimeout(apply, delay));
