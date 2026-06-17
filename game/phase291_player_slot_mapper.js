const LABEL = "PHASE-291-PLAYER-SLOT-MAPPER-LOCK";
const SLOTS = [
  "PHASE287_REMOTE_A_PILL_AVATAR",
  "PHASE287_REMOTE_B_PILL_AVATAR",
  "PHASE287_ANDROID_PILL_AVATAR",
  "PHASE287_QUEST_PILL_AVATAR"
];
function localId(){ return window.SVR_PRESENCE_CLIENT?.playerId || null; }
function sourceList(){
  const data = window.SVR_REMOTE_PRESENCE_STATE;
  if (!data) return [];
  if (Array.isArray(data.players)) return data.players;
  if (data.players && typeof data.players === "object") return Object.values(data.players);
  if (data.pose) return [data];
  return [];
}
function poseOf(item){
  const p = item?.pose || item;
  const x = Number(p?.x), z = Number(p?.z);
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
  return { x, z };
}
function run(){
  const scene = window.__SVR_SCENE__;
  if (!scene) return false;
  const mine = localId();
  const list = sourceList().filter((p)=>p?.playerId !== mine).slice(0, SLOTS.length);
  const mapped = [];
  SLOTS.forEach((name, i)=>{
    const obj = scene.getObjectByName(name);
    const pose = poseOf(list[i]);
    if (!obj || !pose) return;
    obj.visible = true;
    obj.position.x = pose.x;
    obj.position.z = pose.z;
    obj.userData.phase291SlotMapped = true;
    mapped.push({ name, x:Number(pose.x.toFixed(2)), z:Number(pose.z.toFixed(2)) });
  });
  window.SVR_PHASE291_PLAYER_SLOT_MAPPER_LOCK = { build:LABEL, active:true, siteTouched:false, mapped, checkedAt:new Date().toISOString() };
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
run();
setInterval(run, 700);
[500,1500,3000,6000,10000].forEach((delay)=>setTimeout(run, delay));
