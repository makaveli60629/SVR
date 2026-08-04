const LABEL = "UPDATE-3.0-PHASE-194-STABILIZER-PASSIVE-CLEANUP-LOCK";
window.SVR_OFFICIAL_LOBBY_ONLY = true;
window.SVR_DISABLE_LEGACY_SKYLINE = true;
window.SVR_REFINED_LOBBY_GEOMETRY = true;

const BAD = ["PHASE123","PHASE164","PHASE168","PHASE171","PHASE173","PHASE175","PHASE176_LOBBY_ARENA","PHASE176_JUMBOTRON","CENTER_SPECTATOR_RING","CENTER_FEATURED_TABLE_STAGE","PHASE188","PHASE189_HARD_VISIBLE_SECOND_FLOOR","PHASE189_REAL_STAIR","skyline","tower","city","building"];
const KEEP = ["PHASE194","PHASE193","PHASE192","PHASE191","PHASE190","PHASE185_OFFICIAL_POLISHED_MARBLE_FLOOR","PHASE185_FLOOR_INLAY","PHASE187","PHASE186","PHASE181","PHASE180","PHASE178","PHASE177","PGA","REIKI","WELLNESS","SPONSOR","STORE","SCORPION","LEGEND","Watch","Wrist","Teleport","Hand","Controller","Moon","Mars"];
function hasAny(name,list){ const n=String(name||"").toLowerCase(); return list.some(x=>n.includes(String(x).toLowerCase())); }
function scan(){
  const scene = window.__SVR_SCENE__;
  let hidden = 0;
  if(scene){
    scene.traverse(obj=>{
      const name = String(obj?.name || "");
      if(name && hasAny(name,BAD) && !hasAny(name,KEEP) && obj.visible !== false){ obj.visible = false; hidden++; }
    });
  }
  window.SVR_PHASE187_STABILIZER = { label: LABEL, active: true, passive: true, hiddenThisScan: hidden, legacySkylineDisabled: true, checkedAt: new Date().toISOString() };
}
scan();
setTimeout(scan,1);
setTimeout(scan,16);
setTimeout(scan,50);
setTimeout(scan,150);
setTimeout(scan,300);
setTimeout(scan,700);
setInterval(scan,400);
console.log("[Phase194] passive stabilizer active");
