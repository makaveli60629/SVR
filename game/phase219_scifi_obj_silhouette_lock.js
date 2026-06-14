import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-219-SCIFI-OBJ-SILHOUETTE-SKYLINE-LOCK";
const CYAN = 0x7ffcff;
const GOLD = 0xffd98a;
const PURPLE = 0xa77cff;
const GREEN = 0x8dffb4;

const OBJ_BINS = [[-19.5,1.4,0.61,0.45,-31.21],[-18.5,1.4,0.64,0.69,-30.89],[-17.5,1.75,0.63,0.93,-30.77],[-16.5,3.07,0.59,0.57,-30.78],[-15.5,4.33,0.73,0.81,-31.25],[-14.5,4.34,0.9,0.45,-31.15],[-13.5,4.84,1.1,0.69,-31.52],[-12.5,4.94,0.94,0.93,-32.11],[-11.5,6.74,1.11,0.57,-31.34],[-10.5,7.55,1.04,0.81,-30.14],[-9.5,6.46,0.62,0.45,-30.87],[-8.5,4.99,0.79,0.69,-32],[-7.5,6.51,0.89,0.93,-31.56],[-6.5,6.5,0.69,0.57,-31.35],[-5.5,7.27,0.7,0.81,-31.26],[-4.5,7.27,1.65,0.45,-31.66],[-3.5,7.68,1.65,0.69,-31.72],[-2.5,8.82,1.65,0.93,-31.72],[-1.5,7.36,1.49,0.57,-31.42],[-0.5,7.63,0.92,0.81,-30.71],[0.5,7.63,0.68,0.45,-30.69],[1.5,4.37,0.58,0.69,-31.66],[2.5,4.37,0.58,0.93,-31.71],[3.5,7.39,0.62,0.57,-31.2],[4.5,6.58,0.63,0.81,-30.93],[5.5,4.49,0.63,0.45,-31.44],[6.5,3.76,0.69,0.69,-30.99],[7.5,3.92,0.95,0.93,-30.6],[8.5,5.17,1.65,0.57,-30.33],[9.5,6.89,1.65,0.81,-30.39],[10.5,6.11,1.65,0.45,-30.45],[11.5,7.35,0.73,0.69,-30.64],[12.5,6.5,1.65,0.93,-29.94],[13.5,6.29,1.65,0.57,-29.91],[14.5,3.75,1.13,0.81,-30.66],[15.5,3.75,0.72,0.45,-32.42],[16.5,3.75,0.67,0.69,-31.58],[17.5,3.75,0.7,0.93,-30.48],[18.5,1.56,0.64,0.57,-30.18]];

function stamp(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_DISABLE_LEGACY_SKYLINE = true;
  window.SVR_BACKGROUND_BUILDINGS_REMOVED = true;
  window.SVR_PHASE219 = {
    build: LABEL,
    active: true,
    objDerivedSilhouette: true,
    source: "uploaded scifi city.zip / Scifi downtown city.obj",
    reducedFromVertices: 71002,
    silhouetteBins: OBJ_BINS.length,
    keepsPhase218Overlook: true,
    checkedAt: new Date().toISOString()
  };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{ if ((el.textContent||"").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`; });
}

function glow(color, opacity=.38){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide });
}
function solid(color, opacity=1){
  return new THREE.MeshBasicMaterial({ color, transparent:opacity<1, opacity, depthWrite:opacity>=1 });
}
function addBox(root,name,sx,sy,sz,x,y,z,material){
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), material);
  m.name = name; m.position.set(x,y,z); root.add(m); return m;
}
function addLine(root,name,x1,y1,z1,x2,y2,z2,color=CYAN){
  const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1,y1,z1), new THREE.Vector3(x2,y2,z2)]);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent:true, opacity:.58 }));
  line.name = name; root.add(line); return line;
}
function labelTexture(){
  const c=document.createElement("canvas"); c.width=900; c.height=250;
  const ctx=c.getContext("2d");
  ctx.fillStyle="rgba(2,4,13,.86)"; ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle="#7ffcff"; ctx.lineWidth=12; ctx.strokeRect(18,18,c.width-36,c.height-36);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#fff"; ctx.font="900 58px system-ui,Arial"; ctx.fillText("REAL CITY OBJ SILHOUETTE",c.width/2,88);
  ctx.fillStyle="#ffd98a"; ctx.font="800 28px system-ui,Arial"; ctx.fillText("derived from uploaded sci-fi downtown model",c.width/2,150);
  ctx.fillStyle="#bfefff"; ctx.font="700 22px system-ui,Arial"; ctx.fillText("Quest-safe reduced skyline • second-floor view",c.width/2,196);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function addPlaque(root){
  const p = new THREE.Mesh(new THREE.PlaneGeometry(4.8,1.34), new THREE.MeshBasicMaterial({ map:labelTexture(), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  p.name = "PHASE219_OBJ_SILHOUETTE_PLAQUE";
  p.position.set(0,6.18,-15.03);
  p.renderOrder = 40;
  root.add(p);
}

function install(){
  stamp();
  const scene = window.__SVR_SCENE__;
  if(!scene || window.SVR_PHASE219_OBJ_SILHOUETTE_INSTALLED) return !!scene;
  const old = scene.getObjectByName("PHASE219_OBJ_SILHOUETTE_ROOT");
  if(old) old.parent?.remove(old);
  const root = new THREE.Group();
  root.name = "PHASE219_OBJ_SILHOUETTE_ROOT";
  scene.add(root);

  const haze = new THREE.Mesh(new THREE.PlaneGeometry(46,12), glow(0x1b2d5c,.11));
  haze.name = "PHASE219_OBJ_SILHOUETTE_BACK_HAZE";
  haze.position.set(0,9.1,-33.7);
  root.add(haze);

  OBJ_BINS.forEach((b,i)=>{
    const [x,h,w,d,z] = b;
    const baseY = 4.18;
    const color = i%4===0 ? 0x0c1632 : i%4===1 ? 0x07111f : i%4===2 ? 0x0a1026 : 0x050914;
    const body = addBox(root,`PHASE219_OBJ_REDUCED_STACK_${i+1}`,w,h,d,x,baseY+h/2,z,solid(color,.92));
    body.userData.sourceObjBin = true;
    addBox(root,`PHASE219_OBJ_REDUCED_STACK_${i+1}_ROOF_LINE`,w+.08,.055,d+.06,x,baseY+h+.05,z,glow(i%3?CYAN:GOLD,.36));
    if(i>0){
      const px = OBJ_BINS[i-1][0], ph = OBJ_BINS[i-1][1], pz = OBJ_BINS[i-1][4];
      addLine(root,`PHASE219_OBJ_SILHOUETTE_TOP_TRACE_${i}`,px,baseY+ph+.16,pz,x,baseY+h+.16,z,i%2?CYAN:PURPLE);
    }
    if(i%5===0){
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(.025,.035,.78,10), glow(PURPLE,.44));
      mast.name = `PHASE219_OBJ_REDUCED_STACK_${i+1}_ANTENNA`;
      mast.position.set(x,baseY+h+.46,z);
      root.add(mast);
    }
  });

  addPlaque(root);
  window.SVR_PHASE219_OBJ_SILHOUETTE_INSTALLED = true;
  return true;
}

stamp();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>100) clearInterval(timer); },200);
[600,1400,2800,5200,9000].forEach(ms=>setTimeout(install,ms));
setInterval(stamp,1100);
