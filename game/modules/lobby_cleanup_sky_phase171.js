import * as THREE from "three";

function tex(w,h,paint){
  const c=document.createElement("canvas"); c.width=w; c.height=h;
  const x=c.getContext("2d"); paint(x,w,h);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=1; return t;
}
function moonTex(){
  return tex(1024,1024,(x,w,h)=>{
    const g=x.createRadialGradient(w*.38,h*.34,20,w*.5,h*.5,w*.56);
    g.addColorStop(0,"#fff"); g.addColorStop(.5,"#d8d5ca"); g.addColorStop(.82,"#77736d"); g.addColorStop(1,"#2e2f35");
    x.fillStyle=g; x.fillRect(0,0,w,h);
    for(let i=0;i<120;i++){ const cx=Math.random()*w, cy=Math.random()*h, r=8+Math.random()*44; x.fillStyle=`rgba(38,38,44,${.08+Math.random()*.18})`; x.beginPath(); x.arc(cx,cy,r,0,Math.PI*2); x.fill(); }
  });
}
function marsTex(){
  return tex(1024,1024,(x,w,h)=>{
    const g=x.createRadialGradient(w*.36,h*.34,20,w*.5,h*.5,w*.56);
    g.addColorStop(0,"#ffb06e"); g.addColorStop(.42,"#c75f31"); g.addColorStop(.78,"#73301f"); g.addColorStop(1,"#241310");
    x.fillStyle=g; x.fillRect(0,0,w,h);
    for(let i=0;i<72;i++){ x.strokeStyle=`rgba(75,28,18,${.18+Math.random()*.24})`; x.lineWidth=8+Math.random()*22; const y=Math.random()*h; x.beginPath(); x.moveTo(-60,y); x.bezierCurveTo(w*.3,y-70+Math.random()*140,w*.7,y-70+Math.random()*140,w+60,y-50+Math.random()*100); x.stroke(); }
  });
}
function skyBody(name,r,pos,map,color){
  const g=new THREE.Group(); g.name=name; g.position.copy(pos);
  const body=new THREE.Mesh(new THREE.SphereGeometry(r,48,28),new THREE.MeshStandardMaterial({map,roughness:.92,metalness:0,emissive:color,emissiveIntensity:.08}));
  g.add(body);
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({color,transparent:true,opacity:.18,depthWrite:false,blending:THREE.AdditiveBlending}));
  glow.scale.set(r*3.6,r*3.6,1); g.add(glow);
  g.userData.tick=(t)=>{body.rotation.y=t*.045; glow.material.opacity=.15+Math.sin(t*.55)*.03;};
  return g;
}
function hideMatch(obj){
  const n=String(obj.name||"");
  if(/PHASE171|moon|mars/i.test(n)) return false;
  return /earth|globe|blue planet|building|skyline|tower|city|adbuilding|bannerbuilding|billboard|PHASE123_Eight/i.test(n);
}
export function installPhase171LobbyCleanupSky({scene,log=console.log,enabled=true}={}){
  if(!enabled||!scene) return null;
  let hidden=0, earth=0;
  scene.traverse((o)=>{ if(o!==scene && hideMatch(o)){ o.visible=false; hidden++; if(/earth|globe|blue planet/i.test(String(o.name||""))) earth++; } });
  if(scene.userData?._phase123AdBanners) scene.userData._phase123AdBanners.visible=false;
  const root=new THREE.Group(); root.name="PHASE171_CLEAN_INNER_OCTAGON_MOON_MARS_LOCK"; scene.add(root);
  const moon=skyBody("PHASE171_BIG_TEXTURED_MOON_NORTH_SKY",4.9,new THREE.Vector3(-10,34,-34),moonTex(),0xdedcff);
  const mars=skyBody("PHASE171_TEXTURED_MARS_HIGH_NORTH_SKY",2.35,new THREE.Vector3(13,31,-39),marsTex(),0xff7044);
  root.add(moon,mars);
  root.userData.tick=(t)=>{ moon.userData.tick(t); mars.userData.tick(t); mars.position.x=13+Math.sin(t*.035)*1.4; mars.position.z=-39+Math.cos(t*.035)*1.1; };
  window.SVR_PHASE171_CLEAN_LOBBY_SKY={locked:true,hiddenBackgroundObjects:hidden,earthHidden:earth,moon:"big textured north sky",mars:"textured high north sky"};
  log(`[Phase171] inner octagon cleanup: hidden=${hidden}, earthHidden=${earth}, moon/mars active.`);
  return root;
}
