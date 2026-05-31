// PHASE-182-LOBBY-AUDIT-STOREFRONT-REBUILD-LOCK
// Re-audit pass: hides old duplicate lounge/PGA storefront clutter, adds Angel Wings south-wall art,
// rebuilds Lounge and PGA storefront hubs in a cleaner Reiki-style modular layout.
import * as THREE from "three";

const PHASE = "PHASE-182-LOBBY-AUDIT-STOREFRONT-REBUILD-LOCK";
const ANGEL_URI = "data:image/webp;base64,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";

if (!window.__SVR_PHASE182_LOBBY_AUDIT_REBUILD__) {
  window.__SVR_PHASE182_LOBBY_AUDIT_REBUILD__ = true;

  function canvasTexture(draw, w=1024, h=512) {
    const c=document.createElement('canvas'); c.width=w; c.height=h;
    const x=c.getContext('2d'); draw(x,c);
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t;
  }

  function signTexture(title, subtitle, lines=[], accent="#7ff5c7") {
    return canvasTexture((x,c)=>{
      const g=x.createLinearGradient(0,0,c.width,c.height);
      g.addColorStop(0,"#050711"); g.addColorStop(.55,"#130820"); g.addColorStop(1,"#061716");
      x.fillStyle=g; x.fillRect(0,0,c.width,c.height);
      x.strokeStyle=accent; x.lineWidth=10; x.strokeRect(20,20,c.width-40,c.height-40);
      x.strokeStyle="rgba(180,140,255,.70)"; x.lineWidth=4; x.strokeRect(50,50,c.width-100,c.height-100);
      x.textAlign="center"; x.textBaseline="middle";
      x.fillStyle="#fff"; x.font="900 64px system-ui,Segoe UI,Arial"; x.fillText(title.toUpperCase(),c.width/2,118);
      x.fillStyle="#bfffea"; x.font="800 34px system-ui,Segoe UI,Arial"; x.fillText(subtitle.toUpperCase(),c.width/2,186);
      x.fillStyle="rgba(255,255,255,.88)"; x.font="28px system-ui,Segoe UI,Arial";
      lines.slice(0,5).forEach((line,i)=>x.fillText(line,c.width/2,260+i*43));
      x.fillStyle="rgba(255,255,255,.52)"; x.font="22px system-ui,Segoe UI,Arial"; x.fillText(`SVR • ${PHASE}`,c.width/2,c.height-48);
    },1024,512);
  }

  function makePanel(w,h,texture) {
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));
    m.renderOrder=90; return m;
  }

  function neon(parent,x,y,z,w,h,color,opacity=.75) {
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));
    m.position.set(x,y,z); m.renderOrder=95; parent.add(m); return m;
  }

  function frame(parent,w,h,colorA=0xb48cff,colorB=0x7ff5c7,z=.05) {
    neon(parent,0,h/2+.045,z,w+.18,.035,colorA,.82); neon(parent,0,-h/2-.045,z,w+.18,.035,colorA,.58);
    neon(parent,-w/2-.045,0,z,.035,h+.18,colorB,.72); neon(parent,w/2+.045,0,z,.035,h+.18,colorB,.72);
    const glow=new THREE.Mesh(new THREE.PlaneGeometry(w+.42,h+.42),new THREE.MeshBasicMaterial({color:colorA,transparent:true,opacity:.08,side:THREE.DoubleSide,depthWrite:false}));
    glow.position.z=z-.018; glow.renderOrder=80; parent.add(glow); return glow;
  }

  function hideOldStuff(scene) {
    scene.traverse(o=>{
      const n=(o.name||"").toLowerCase();
      if (/phase177_smoker|phase181_smoker|lounge_storefront|pga_storefront_force|pga.*storefront|old.*lounge/.test(n)) {
        o.visible=false; o.userData.phase182HiddenAsDuplicate=true;
      }
      // Hide old floating labels that make the build look like it rolled backward.
      if ((o.isMesh || o.isSprite) && /phase\s*1(0[0-9]|[1-6][0-9])|one bot test|desktop-hub-position-table-fix/i.test(`${o.name||""} ${o.userData?.label||""}`)) {
        o.visible=false; o.userData.phase182HiddenOldPhaseTag=true;
      }
    });
  }

  function addSouthWallAngel(scene) {
    if (scene.getObjectByName("PHASE182_SOUTH_WALL_ANGEL_ART_ROOT")) return;
    const root=new THREE.Group(); root.name="PHASE182_SOUTH_WALL_ANGEL_ART_ROOT";
    // South wall: high center feature, facing back toward the lobby/table.
    root.position.set(0,3.24,8.78); root.rotation.y=Math.PI; scene.add(root);
    const back=new THREE.Mesh(new THREE.PlaneGeometry(6.1,5.2),new THREE.MeshBasicMaterial({color:0x010104,side:THREE.DoubleSide}));
    back.position.z=-.025; root.add(back);
    new THREE.TextureLoader().load(ANGEL_URI,(tex)=>{
      tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=8;
      const art=makePanel(5.55,4.55,tex); art.name="PHASE182_ANGEL_WINGS_SWORD_SOUTH_WALL_ART"; art.position.z=.03; root.add(art);
      frame(root,5.55,4.55,0xd9d9ff,0x7ff5c7,.065);
    });
    const caption=makePanel(5.2,.55,signTexture("SVR LEGENDS WALL","South wall feature art",["Angel Wings • Sword • Neon Frame"],"#d9d9ff"));
    caption.name="PHASE182_ANGEL_ART_CAPTION"; caption.position.set(0,-2.72,.08); root.add(caption);
  }

  function addStorefront(scene, cfg) {
    const root=new THREE.Group(); root.name=cfg.name; root.position.set(cfg.x,.02,cfg.z); root.rotation.y=THREE.MathUtils.degToRad(cfg.rot); root.scale.setScalar(cfg.scale||1); scene.add(root);
    const frameMat=new THREE.MeshStandardMaterial({color:0x05050a,roughness:.42,metalness:.30,emissive:cfg.emissive||0x111122,emissiveIntensity:.28});
    const back=new THREE.Mesh(new THREE.BoxGeometry(4.6,3.5,.16),frameMat); back.position.set(0,1.78,-.10); root.add(back);
    const main=makePanel(4.16,1.08,signTexture(cfg.title,cfg.subtitle,cfg.lines,cfg.accent)); main.position.set(0,2.78,.035); root.add(main); frame(main,4.16,1.08,cfg.c1,cfg.c2,.035);
    const left=makePanel(1.82,1.45,signTexture(cfg.leftTitle,cfg.leftSub,cfg.leftLines,cfg.accent)); left.position.set(-1.12,1.36,.04); root.add(left); frame(left,1.82,1.45,cfg.c1,cfg.c2,.032);
    const right=makePanel(1.82,1.45,signTexture(cfg.rightTitle,cfg.rightSub,cfg.rightLines,cfg.accent)); right.position.set(1.12,1.36,.04); root.add(right); frame(right,1.82,1.45,cfg.c2,cfg.c1,.032);
    neon(root,0,3.56,.075,4.9,.045,cfg.c1,.90); neon(root,0,.02,.075,4.9,.035,cfg.c1,.55); neon(root,-2.48,1.76,.075,.045,3.5,cfg.c2,.75); neon(root,2.48,1.76,.075,.045,3.5,cfg.c2,.75);
    const pad=new THREE.Mesh(new THREE.PlaneGeometry(3.5,1.05),new THREE.MeshBasicMaterial({color:cfg.c2,transparent:true,opacity:.18,side:THREE.DoubleSide,depthWrite:false})); pad.rotation.x=-Math.PI/2; pad.position.set(0,.01,1.05); root.add(pad);
    const zone=new THREE.Mesh(new THREE.RingGeometry(2.35,2.42,96),new THREE.MeshBasicMaterial({color:cfg.c2,transparent:true,opacity:.06,side:THREE.DoubleSide,depthWrite:false})); zone.rotation.x=-Math.PI/2; zone.position.set(0,.018,1.0); root.add(zone);
    const light=new THREE.PointLight(cfg.c1,1.0,6,2); light.position.set(0,2.3,.7); root.add(light);
    root.userData.phase182Storefront=true; root.userData.noOverlapRadius=2.5; root.userData.portal=cfg.portal;
    return root;
  }

  function addRebuiltHubs(scene) {
    if (!scene.getObjectByName("PHASE182_LOUNGE_HUB_REIKI_STYLE_ROOT")) {
      addStorefront(scene,{
        name:"PHASE182_LOUNGE_HUB_REIKI_STYLE_ROOT", portal:"PORTAL_smokerLounge",
        x:-19.84,z:5.17,rot:119,scale:.86,title:"Smoker Lounge",subtitle:"Private Social Hub",
        lines:["Position locked to PORTAL_smokerLounge","No product ads active","Relax • Talk • Watch • Return"],
        leftTitle:"Lounge",leftSub:"Entry",leftLines:["Private room route","Comfort seating planned","Media wall planned"],
        rightTitle:"Rules",rightSub:"Clean Build",rightLines:["No overlap zone","No nicotine ads","Portal preserved"],
        accent:"#ffb86b",c1:0xffb86b,c2:0xb48cff,emissive:0x24101d
      });
    }
    if (!scene.getObjectByName("PHASE182_PGA_HUB_REIKI_STYLE_ROOT")) {
      addStorefront(scene,{
        name:"PHASE182_PGA_HUB_REIKI_STYLE_ROOT", portal:"PORTAL_pgaDrive",
        x:8.18,z:-5.85,rot:-45,scale:.88,title:"PGA Golf Hub",subtitle:"Private Training Portal",
        lines:["Driving range portal","Chip/Putt training route","Clean professional storefront"],
        leftTitle:"Drive",leftSub:"Range",leftLines:["Stand mat","Ball tracer planned","Shot board planned"],
        rightTitle:"Chip/Putt",rightSub:"Short Game",rightLines:["Separate room","Training targets","Return portal"],
        accent:"#64eaff",c1:0x64eaff,c2:0xd3a13b,emissive:0x071824
      });
    }
  }

  function installPhaseLabel() {
    if (!document.getElementById("svrPhase182CleanLabel")) {
      const el=document.createElement("div"); el.id="svrPhase182CleanLabel";
      el.textContent="PHASE 182 • LOBBY AUDIT / STOREFRONT REBUILD LOCK";
      el.style.cssText="position:fixed;left:12px;top:52px;z-index:2000;padding:8px 12px;border:1px solid rgba(127,245,199,.55);border-radius:999px;background:rgba(2,6,10,.74);color:#eafff4;font:800 12px system-ui;letter-spacing:.04em;pointer-events:none;backdrop-filter:blur(8px)";
      document.body.appendChild(el);
    }
    const status=document.getElementById("status"); if(status) status.textContent="Hands ready • Phase 182 lobby audit storefront rebuild lock";
    document.querySelectorAll(".pill").forEach(p=>{ if(/phase\s*16[0-9]|phase\s*10[0-9]/i.test(p.textContent||"")) p.textContent="PHASE-182-LOBBY-AUDIT-STOREFRONT-REBUILD-LOCK"; });
  }

  function boot() {
    installPhaseLabel();
    const tryHook=()=>{ const scene=window.SVR_GAME?.scene; if(!scene) return false; hideOldStuff(scene); addSouthWallAngel(scene); addRebuiltHubs(scene); installPhaseLabel(); return true; };
    if(!tryHook()) { let n=0; const id=setInterval(()=>{n++; if(tryHook()||n>120) clearInterval(id);},250); }
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true}); else boot();
}
