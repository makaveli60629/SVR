import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-191-SKY-ONLY-NO-DUPLICATE-FLOOR-LOCK";

function isOfficial(name){
  return /PHASE191|PHASE190|PHASE189|PHASE187|PHASE186|PHASE185|PHASE181|PHASE180|PHASE178|PHASE177|PGA|REIKI|WELLNESS|SPONSOR|STORE|SCORPION|LEGEND|Watch|Teleport|Hand|Controller/i.test(String(name||""));
}

function hideFlatSky(scene){
  let hidden = 0;
  scene.traverse(obj=>{
    if(!obj || obj.isScene || isOfficial(obj.name)) return;
    const name = String(obj.name || "");
    const y = obj.getWorldPosition ? obj.getWorldPosition(new THREE.Vector3()).y : (obj.position?.y || 0);
    const type = obj.geometry?.type || "";
    const matName = String(obj.material?.name || "");
    const flatSky = obj.isMesh && /Plane|Shape/.test(type) && y > 4.5;
    const oldPlanet = /moon|mars|planet|earth|sky|picture|billboard|background|city|tower|building|skyline/i.test(name + " " + matName);
    if((flatSky || oldPlanet) && obj.visible !== false){ obj.visible = false; hidden++; }
  });
  return hidden;
}

function hideLegacySecondFloor(scene){
  let hidden = 0;
  const patterns = [
    /PHASE188_SECOND_FLOOR/i,
    /PHASE188_VISIBLE_SECOND_FLOOR/i,
    /PHASE188_UPPER_FLOOR/i,
    /PHASE188_UPPER_STOREFRONT/i,
    /PHASE188_UPPER_ALCOVE/i,
    /PHASE188_COLUMN_CAP/i,
    /PHASE188_SECOND_FLOOR_SUPPORT_COLUMN/i,
    /PHASE189_HARD_VISIBLE_SECOND_FLOOR_DECK/i,
    /PHASE189_HARD_SECOND_FLOOR_RAIL/i,
    /PHASE189_SECOND_FLOOR_BRIGHT_UNDERGLOW/i,
    /PHASE189_REAL_STAIR_VISUAL/i,
    /PHASE189_UPPER_FLOOR_ACCESS_PAD/i,
    /PHASE189_UPPER_STORE/i,
    /PHASE189_ACCESS_PAD_SIGN/i
  ];
  scene.traverse(obj=>{
    const name = String(obj?.name || "");
    if(patterns.some(rx=>rx.test(name)) && obj.visible !== false){ obj.visible = false; hidden++; }
  });
  return hidden;
}

function addMoonMars(root){
  const moon=new THREE.Mesh(new THREE.SphereGeometry(1.45,48,32),new THREE.MeshStandardMaterial({color:0xe4e1d7,roughness:.62,metalness:.02,emissive:0x1a2133,emissiveIntensity:.24}));
  moon.name="PHASE189_ONLY_BIG_MOON"; moon.position.set(-3.6,12.2,-9.4); root.add(moon);
  const mars=new THREE.Mesh(new THREE.SphereGeometry(.50,36,24),new THREE.MeshStandardMaterial({color:0xc95734,roughness:.78,emissive:0x2d0904,emissiveIntensity:.26}));
  mars.name="PHASE189_ONLY_SMALL_MARS"; mars.position.set(4.6,10.8,-10.7); root.add(mars);
  root.userData.moon=moon; root.userData.mars=mars;
}

export function installPhase189SkyFloorHardlock(){
  const scene=window.__SVR_SCENE__; if(!scene) return null;
  let root=scene.getObjectByName("PHASE189_SKY_FLOOR_HARDLOCK_ROOT");
  if(!root){
    root=new THREE.Group(); root.name="PHASE189_SKY_FLOOR_HARDLOCK_ROOT";
    // Phase 191: this module now owns sky cleanup + moon/Mars only. It no longer creates an extra floor/deck.
    addMoonMars(root); scene.add(root);
  }
  const scan=()=>{
    const flatSkyHidden=hideFlatSky(scene);
    const duplicateFloorsHidden=hideLegacySecondFloor(scene);
    window.SVR_PHASE189_HARDLOCK={label:LABEL,active:true,flatSkyHidden,duplicateFloorsHidden,secondFloor:false,checkedAt:new Date().toISOString()};
  };
  scan(); setTimeout(scan,100); setTimeout(scan,500); setInterval(scan,900);
  const loop=(now)=>{ if(!root.parent) return; const t=now*.001; if(root.userData.moon) root.userData.moon.rotation.y=t*.12; if(root.userData.mars) root.userData.mars.rotation.y=t*.06; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  console.log("[Phase191] sky hardlock active; duplicate sky/second floor disabled");
  return root;
}
export function autoInstallPhase189SkyFloorHardlock(){
  const start=performance.now();
  const id=setInterval(()=>{ if(window.__SVR_SCENE__){ clearInterval(id); installPhase189SkyFloorHardlock(); } else if(performance.now()-start>16000) clearInterval(id); },400);
}
