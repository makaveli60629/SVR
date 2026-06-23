import * as THREE from "three";

const LABEL="PHASE-138-VR-ALIGNMENT-INPUT-SKY-WATCH-FINAL-LOCK";
const ROOT="PHASE138_VR_ALIGNMENT_INPUT_SKY_WATCH_ROOT";
const CYAN=0x7ffcff, GOLD=0xffd98a, RED=0xb20f24, PURPLE=0x9b4dff, GLASS=0x8fdcff;
const FLOOR_Y=3.42;
const MOON_POS=new THREE.Vector3(0,18.8,-54);
const MARS_BASE=new THREE.Vector3(7.5,18.1,-58);

const tmpA=new THREE.Vector3(), tmpB=new THREE.Vector3(), tmpQ=new THREE.Quaternion(), tmpDir=new THREE.Vector3();

const STORES=[
  {key:"reiki", label:"REIKI HUB", x:-14.2,z:-13.55,ry:0,color:PURPLE},
  {key:"pga", label:"PGA RANGE", x:14.2,z:-13.55,ry:0,color:CYAN},
  {key:"store", label:"SVR STORE", x:20.25,z:5.85,ry:-Math.PI/2,color:GOLD},
  {key:"scorpion", label:"SCORPION", x:20.25,z:-8.55,ry:-Math.PI/2,color:PURPLE},
  {key:"lounge", label:"LOUNGE", x:-20.25,z:5.85,ry:Math.PI/2,color:GOLD},
  {key:"theater", label:"VIBES", x:-20.25,z:-8.55,ry:Math.PI/2,color:RED}
];

function count(scene,re){let n=0;scene?.traverse?.(o=>{if(re.test(String(o.name||""))&&o.visible!==false)n++;});return n;}
function hide(scene,re,except=/PHASE138/){let n=0;scene?.traverse?.(o=>{const nm=String(o.name||"");if(except.test(nm))return;if(re.test(nm)){o.visible=false;o.userData.phase138Hidden=true;n++;}});return n;}
function mat(color,opacity=1,emi=.035){return new THREE.MeshStandardMaterial({color,roughness:.48,metalness:.1,transparent:opacity<1,opacity,emissive:color,emissiveIntensity:emi,side:THREE.DoubleSide,depthWrite:opacity>=.65});}
function basicText(lines,color="#7ffcff",bg="rgba(0,0,0,.74)"){
  const c=document.createElement("canvas");c.width=900;c.height=360;const x=c.getContext("2d");
  x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);x.strokeStyle=color;x.lineWidth=8;x.strokeRect(22,22,c.width-44,c.height-44);
  x.strokeStyle="rgba(255,217,138,.72)";x.lineWidth=4;x.strokeRect(50,50,c.width-100,c.height-100);
  x.textAlign="center";x.textBaseline="middle";x.shadowColor=color;x.shadowBlur=16;x.fillStyle="#fff8df";x.font="900 48px system-ui,Arial";x.fillText(lines[0]||"SVR",c.width/2,95,c.width-90);
  x.shadowBlur=5;x.fillStyle="#bffcff";x.font="800 30px system-ui,Arial";for(let i=1;i<lines.length;i++)x.fillText(lines[i],c.width/2,96+i*58,c.width-90);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
function removeOldRoot(scene){const old=scene?.getObjectByName?.(ROOT);if(old)old.parent?.remove(old);}

function hardDeclutter(scene){
  let hidden=0;
  hidden+=hide(scene,/LIVE.*SEQUENCE|SEQUENCE.*CARD|CARD.*DEAL.*SCREEN|DEAL.*SCREEN|WAITING.*CARD|LEFT.*RIGHT.*CARD|RIGHT.*SEQUENCE|WELCOME.*SIGN|PRESS.*DEMO|DEMO.*TEST|HOTKEY|PRESS_R|PRESS R|DIAGNOSTIC|DEBUG|QA_CHECK|PACKAGE|ARTIFACT|WORKFLOW|CHECKLIST|READY STATUS|MANUAL QUEST/i);
  hidden+=hide(scene,/PHASE13[0-7].*(BOARD|RING|PANEL|CHECKLIST|WORKFLOW|PACKAGE|ARTIFACT|READY|MANUAL|FLOOR_RING|TUTORIAL)|PHASE129_STOREFRONT_PREVIEW_PANEL|PHASE137_SVR_GRAND_LOBBY_FORWARD_SIGN|PHASE137_TABLE_TUTORIAL_PANEL/i);
  hidden+=hide(scene,/PHASE137_FORWARD_STOREFRONT|PHASE137_.*STOREFRONT_FRAME|PHASE137_.*GLASS_|PHASE137_STOREFRONT_LABEL/i);
  hidden+=hide(scene,/PHASE136.*STAIR|PHASE136.*UPSTAIRS|PHASE137_CONNECTED_RED_STAIR|PHASE137_RED_STAIR|PHASE137_CONTINUOUS_RED_STAIR_RAMP|PHASE137_CONNECTED_SECOND_FLOOR|PHASE137_SINGLE_CLEAN_GLASS|BLACK.*STAIR|STAIR.*BLACK|DUPLICATE.*STAIR|RAMP/i);
  hidden+=hide(scene,/MOON|MARS|ORBIT|PLANET.*RING|CELESTIAL.*RING/i);
  hidden+=hide(scene,/TAG.*FACE|FACE.*TAG|PILL.*FACE|NAME_LABEL_NEAR|FLOATING_NAME_TAG/i);
  return hidden;
}

function cameraOverlayCleanup(scene){
  const cam=window.__SVR_CAMERA__;
  let hidden=0;
  scene?.traverse?.(o=>{
    if(!o?.isMesh || !o.material || o.userData.phase138Keep) return;
    const n=String(o.name||"");
    const mats=Array.isArray(o.material)?o.material:[o.material];
    const blackish=mats.some(m=>{
      const c=m.color; const dark=c && c.r<.08 && c.g<.08 && c.b<.08; return (m.transparent && Number(m.opacity)<.8 && dark) || /BLACK|OVERLAY|FACE|HUD|SCREEN/i.test(n);
    });
    if(!blackish) return;
    o.updateWorldMatrix?.(true,false);o.getWorldPosition(tmpA);
    let near=false;
    if(cam){cam.updateWorldMatrix?.(true,false);cam.getWorldPosition(tmpB);near=tmpA.distanceTo(tmpB)<1.25;}
    const large=(o.geometry?.parameters?.width||0)>1.2 || (o.geometry?.boundingSphere?.radius||0)>1.2;
    if(near || large || /OVERLAY|BLACK_SQUARE|XR_BLACK|CAMERA_OVERLAY|FACE_OVERLAY|TRANSPARENT_OVERLAY/i.test(n)){o.visible=false;o.userData.phase138HiddenFaceOverlay=true;hidden++;}
  });
  return hidden;
}

function fixCards(scene){
  let adjusted=0;
  scene?.traverse?.(o=>{
    const n=String(o.name||"");
    if(!o.isMesh || !/CARD|COMMUNITY|HOLE|POKER_CARD/i.test(n) || /SCREEN|PANEL|SIGN|TEXT|LABEL|BOARD/i.test(n)) return;
    o.updateWorldMatrix?.(true,false);o.getWorldPosition(tmpA);
    if(tmpA.y<.48 || tmpA.y>1.02){
      const dy=.68-tmpA.y;
      o.position.y+=dy;
      adjusted++;
    }
    if(o.rotation.x>-1.25)o.rotation.x=-Math.PI/2;
    o.renderOrder=Math.max(o.renderOrder||0,360);
    o.userData.phase138CardsTableLocked=true;
  });
  return adjusted;
}

function forceWatchVisible(scene,root){
  let watchCount=0;
  scene?.traverse?.(o=>{const n=String(o.name||"");if(/WATCH|FOREARM|WRIST|CUFF/i.test(n)){o.visible=true;o.userData.phase138WatchRestored=true;watchCount++;}});
  if(watchCount>0)return watchCount;
  const renderer=window.__SVR_RENDERER__;
  for(let i=0;i<2;i++){
    try{
      const grip=renderer?.xr?.getControllerGrip?.(i)||renderer?.xr?.getController?.(i);
      if(grip && !grip.getObjectByName?.("PHASE138_CONTROLLER_WATCH_FALLBACK")){
        const g=new THREE.Group();g.name="PHASE138_CONTROLLER_WATCH_FALLBACK";g.position.set(-.055,-.035,-.09);g.rotation.set(-.55,0,0);grip.add(g);
        const body=new THREE.Mesh(new THREE.BoxGeometry(.16,.06,.035),mat(0x05070f,.94,.02));body.name="PHASE138_WATCH_FALLBACK_BODY";g.add(body);
        const face=new THREE.Mesh(new THREE.PlaneGeometry(.14,.045),new THREE.MeshBasicMaterial({map:basicText(["WATCH","TP ON/OFF"],"#7ffcff"),transparent:true,side:THREE.DoubleSide,depthWrite:false}));face.name="PHASE138_WATCH_FALLBACK_FACE";face.position.z=.021;face.renderOrder=999;g.add(face);
        watchCount++;
      }
    }catch{}
  }
  return watchCount;
}

function installLasers(scene){
  const renderer=window.__SVR_RENDERER__;
  if(!renderer?.xr)return 0;
  let made=0;
  for(let i=0;i<2;i++){
    try{
      const c=renderer.xr.getController?.(i);
      if(!c)continue;
      let laser=c.getObjectByName?.("PHASE138_VISIBLE_CONTROLLER_LASER");
      if(!laser){
        const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-7.5)]);
        laser=new THREE.Line(geo,new THREE.LineBasicMaterial({color:CYAN,transparent:true,opacity:.92,depthTest:false,depthWrite:false}));
        laser.name="PHASE138_VISIBLE_CONTROLLER_LASER";laser.renderOrder=1200;c.add(laser);made++;
        const tip=new THREE.Mesh(new THREE.SphereGeometry(.035,18,18),new THREE.MeshBasicMaterial({color:GOLD,transparent:true,opacity:.95,depthTest:false,depthWrite:false}));tip.name="PHASE138_CONTROLLER_LASER_TIP";tip.position.z=-7.5;tip.renderOrder=1201;c.add(tip);
      }
      laser.visible=true;
    }catch{}
  }
  return made;
}

function addCleanStairs(root){
  const stairMat=mat(RED,.98,.06), gold=mat(GOLD,.95,.04), glass=mat(GLASS,.24,.12);
  [-14.8,14.8].forEach((x,idx)=>{
    const side=idx?"RIGHT":"LEFT";const g=new THREE.Group();g.name=`PHASE138_SINGLE_RED_STAIR_${side}`;g.position.set(x,0,0);root.add(g);
    for(let i=0;i<18;i++){
      const u=i/17,z=7.5+(-17.0*u),y=.055+FLOOR_Y*u;
      const s=new THREE.Mesh(new THREE.BoxGeometry(4.15,.11,.72),stairMat);s.name=`PHASE138_RED_ONLY_STEP_${side}_${i}`;s.position.set(0,y,z);s.userData.phase138Walkable=true;g.add(s);
      const n=new THREE.Mesh(new THREE.BoxGeometry(4.2,.04,.05),gold);n.name=`PHASE138_STAIR_GOLD_EDGE_${side}_${i}`;n.position.set(0,y+.085,z-.36);g.add(n);
    }
    [-2.18,2.18].forEach(rx=>{const r=new THREE.Mesh(new THREE.BoxGeometry(.075,.72,17.8),gold);r.name=`PHASE138_STAIR_ALIGNED_RAIL_${side}`;r.position.set(rx,2.05,-1.0);r.rotation.x=-.20;g.add(r);});
  });
  const deck=new THREE.Mesh(new THREE.BoxGeometry(33.6,.09,6.6),stairMat);deck.name="PHASE138_ALIGNED_UPSTAIRS_RED_WALKWAY";deck.position.set(0,FLOOR_Y+.045,-13.55);deck.userData.phase138Walkable=true;root.add(deck);
  const rail=new THREE.Mesh(new THREE.BoxGeometry(34.2,.86,.075),glass);rail.name="PHASE138_SINGLE_ALIGNED_GLASS_RAIL";rail.position.set(0,FLOOR_Y+.66,-10.05);root.add(rail);
}

function addStorefronts(root){
  const frame=mat(GOLD,.96,.06), glass=new THREE.MeshStandardMaterial({color:GLASS,transparent:true,opacity:.20,roughness:.18,metalness:.02,emissive:GLASS,emissiveIntensity:.08,side:THREE.DoubleSide,depthWrite:false});
  STORES.forEach(s=>{
    const g=new THREE.Group();g.name=`PHASE138_STOREFRONT_UNDER_WALKWAY_${s.key.toUpperCase()}`;g.position.set(s.x,0,s.z);g.rotation.y=s.ry;root.add(g);
    for(const level of [0,1]){
      const cy=level?FLOOR_Y+1.0:1.28,w=level?3.15:3.8,h=level?1.42:2.05;
      const name=level?"UPSTAIRS":"DOWNSTAIRS";
      const fg=new THREE.Group();fg.name=`PHASE138_${name}_STORE_FRAME_${s.key.toUpperCase()}`;fg.position.y=cy;g.add(fg);
      [[0,h/2,w,.08], [0,-h/2,w,.08], [-w/2,0,.08,h], [w/2,0,.08,h]].forEach(([x,y,wid,hei])=>{const b=new THREE.Mesh(new THREE.BoxGeometry(wid,hei,.11),frame);b.position.set(x,y,0);fg.add(b);});
      const win=new THREE.Mesh(new THREE.PlaneGeometry(w-.2,h-.2),glass);win.name=`PHASE138_${name}_STORE_GLASS_${s.key.toUpperCase()}`;win.position.z=.04;fg.add(win);
      const label=new THREE.Mesh(new THREE.PlaneGeometry(1.48,.46),new THREE.MeshBasicMaterial({map:basicText([level?"UPPER SHOP":s.label, level?"COMING NEXT":"PORTAL"],`#${s.color.toString(16).padStart(6,"0")}`),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
      label.name=`PHASE138_${name}_STORE_LABEL_${s.key.toUpperCase()}`;label.position.set(0,h/2+.35,.06);label.renderOrder=980;fg.add(label);
    }
  });
  const wall=new THREE.Mesh(new THREE.PlaneGeometry(5.2,.68),new THREE.MeshBasicMaterial({map:basicText(["SVR LOBBY DIRECTORY","Storefronts aligned under balcony"],"#ffd98a"),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  wall.name="PHASE138_WALL_DIRECTORY_NOT_IN_FACE";wall.position.set(0,3.05,-18.9);wall.renderOrder=975;root.add(wall);
}

function addSky(root){
  const loader=new THREE.TextureLoader();
  const moonMat=new THREE.MeshBasicMaterial({color:0xffffff});
  const tryPaths=["./assets/textures/moon.jpg","./assets/moon.jpg","./textures/moon.jpg","./moon.jpg","./assets/textures/moon.png","./assets/planets/moon.jpg"];
  let loaded=false;
  tryPaths.forEach(p=>loader.load(p,t=>{if(loaded)return;loaded=true;t.colorSpace=THREE.SRGBColorSpace;moonMat.map=t;moonMat.color.set(0xffffff);moonMat.needsUpdate=true;window.SVR_PHASE138_MOON_TEXTURE_SOURCE=p;},undefined,()=>{}));
  const moon=new THREE.Mesh(new THREE.SphereGeometry(3.15,64,64),moonMat);moon.name="PHASE138_SINGLE_REAL_TEXTURE_MOON";moon.position.copy(MOON_POS);root.add(moon);
  const glow=new THREE.Mesh(new THREE.SphereGeometry(3.7,48,48),new THREE.MeshBasicMaterial({color:0xbfd9ff,transparent:true,opacity:.12,side:THREE.BackSide,depthWrite:false,blending:THREE.AdditiveBlending}));glow.name="PHASE138_MOON_SOFT_GLOW";glow.position.copy(MOON_POS);root.add(glow);
  const marsMat=new THREE.MeshBasicMaterial({color:0xff7040});
  ["./assets/textures/mars.jpg","./assets/mars.jpg","./textures/mars.jpg","./mars.jpg","./assets/planets/mars.jpg"].forEach(p=>loader.load(p,t=>{t.colorSpace=THREE.SRGBColorSpace;marsMat.map=t;marsMat.color.set(0xffffff);marsMat.needsUpdate=true;window.SVR_PHASE138_MARS_TEXTURE_SOURCE=p;},undefined,()=>{}));
  const mars=new THREE.Mesh(new THREE.SphereGeometry(1.05,48,48),marsMat);mars.name="PHASE138_SINGLE_MARS_HIGH_SKY";mars.position.copy(MARS_BASE);root.add(mars);
  const light=new THREE.PointLight(0xdbe9ff,.7,35,2);light.name="PHASE138_MOON_LIGHT";light.position.copy(MOON_POS);root.add(light);
  const prev=window.SVR_PHASE138_SKY_TICK || null;
  window.SVR_PHASE138_SKY_TICK=()=>{const t=performance.now()*0.00014;moon.rotation.y+=.0015;mars.position.set(MOON_POS.x+Math.sin(t)*8.2,MOON_POS.y+Math.sin(t*1.7)*.95,MOON_POS.z+Math.cos(t)*8.2-4);mars.rotation.y+=.006;};
  const scene=window.__SVR_SCENE__;
  if(scene && !scene.userData.phase138SkyTickInstalled){scene.userData.phase138SkyTickInstalled=true;const old=scene.userData._tickWorld;scene.userData._tickWorld=(dt)=>{try{old?.(dt);}catch{};try{window.SVR_PHASE138_SKY_TICK?.();}catch{}};}
}

function installFloorLock(){
  const stair=(x,z)=>{const ax=Math.abs(x);if(ax>=12.6&&ax<=17.4&&z<=7.8&&z>=-9.5){return THREE.MathUtils.clamp((7.8-z)/17.3,0,1)*FLOOR_Y;}if(z<=-10.25&&z>=-16.9&&ax<=18.0)return FLOOR_Y;return 0;};
  window.SVR_PHASE227_FLOOR_HEIGHT=stair;window.SVR_PHASE137_FLOOR_HEIGHT=stair;window.SVR_PHASE138_FLOOR_HEIGHT=stair;
}

function qa(scene){return{build:LABEL,root:!!scene?.getObjectByName?.(ROOT),laser:count(scene,/PHASE138_VISIBLE_CONTROLLER_LASER/),cardsAdjusted:window.SVR_PHASE138_CARDS_ADJUSTED||0,watchRestored:window.SVR_PHASE138_WATCH_RESTORED||0,faceOverlayHidden:window.SVR_PHASE138_FACE_OVERLAY_HIDDEN||0,oneMoon:count(scene,/PHASE138_SINGLE_REAL_TEXTURE_MOON/),oldMoonsVisible:count(scene,/MOON|MARS|ORBIT/)-count(scene,/PHASE138_(SINGLE_REAL_TEXTURE_MOON|MOON_SOFT_GLOW|SINGLE_MARS_HIGH_SKY|MOON_LIGHT)/),redSteps:count(scene,/PHASE138_RED_ONLY_STEP/),rampsVisible:count(scene,/RAMP|BLACK.*STAIR|STAIR.*BLACK/),storefronts:count(scene,/PHASE138_.*STORE_FRAME/),siteTouched:false,checkedAt:new Date().toISOString()};}

function install(){
  const scene=window.__SVR_SCENE__;if(!scene)return false;removeOldRoot(scene);const root=new THREE.Group();root.name=ROOT;scene.add(root);
  const hidden=hardDeclutter(scene);const overlayHidden=cameraOverlayCleanup(scene);const cardFix=fixCards(scene);installFloorLock();addCleanStairs(root);addStorefronts(root);addSky(root);const laserCount=installLasers(scene);const watchCount=forceWatchVisible(scene,root);
  window.SVR_PHASE138_FACE_OVERLAY_HIDDEN=overlayHidden;window.SVR_PHASE138_CARDS_ADJUSTED=cardFix;window.SVR_PHASE138_WATCH_RESTORED=watchCount;
  window.SVR_PHASE138_VR_ALIGNMENT_INPUT_SKY_WATCH_FINAL_LOCK={build:LABEL,active:true,hidden,overlayHidden,cardFix,laserCount,watchCount,headForwardMovement:"forced in movement wrapper",rampsRemoved:true,blackStairRemoved:true,oneMoonOnly:true,storefrontsUnderWalkway:true,siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_RUN_PHASE138_VR_FINAL_QA=()=>qa(scene);window.SVR_LIVE_BUILD_POINTER=LABEL;window.SVR_LOCKED_FINAL_BUILD=LABEL;return true;
}
install();let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>48)clearInterval(timer);},300);[800,1800,3200,6000,9500,14000].forEach(d=>setTimeout(install,d));
