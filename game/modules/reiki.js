import * as THREE from "three";
import { bootPrivateScene } from "./private_scene_common.js";

const PHASE165 = "PHASE-165-REIKI-PRIVATE-MEDITATION-SANCTUARY";

function canvasTexture(draw, w = 1024, h = 1024){
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  draw(ctx, c);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 3;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeBrickTexture(){
  return canvasTexture((x,c)=>{
    x.fillStyle = "#05050a";
    x.fillRect(0,0,c.width,c.height);
    for(let y=0;y<c.height;y+=58){
      const offset = (Math.floor(y/58)%2) * 68;
      for(let sx=-offset;sx<c.width;sx+=136){
        const g = x.createLinearGradient(sx,y,sx+136,y+58);
        g.addColorStop(0,"#05060c");
        g.addColorStop(.52,"#10111c");
        g.addColorStop(1,"#030409");
        x.fillStyle = g;
        x.fillRect(sx+3,y+3,130,52);
        x.strokeStyle = "rgba(145,115,255,.10)";
        x.lineWidth = 2;
        x.strokeRect(sx+3,y+3,130,52);
      }
    }
    x.fillStyle = "rgba(176,38,255,.10)";
    for(let i=0;i<44;i++) x.fillRect(Math.random()*c.width, Math.random()*c.height, 2+Math.random()*16, 1+Math.random()*4);
  });
}

function makeFloorTexture(){
  return canvasTexture((x,c)=>{
    const g = x.createRadialGradient(c.width*.48,c.height*.46,10,c.width*.5,c.height*.5,c.width*.72);
    g.addColorStop(0,"#13101b");
    g.addColorStop(.44,"#07070d");
    g.addColorStop(1,"#020207");
    x.fillStyle = g;
    x.fillRect(0,0,c.width,c.height);
    x.strokeStyle = "rgba(113,247,255,.16)";
    x.lineWidth = 2;
    for(let i=0;i<=c.width;i+=64){
      x.beginPath(); x.moveTo(i,0); x.lineTo(i,c.height); x.stroke();
      x.beginPath(); x.moveTo(0,i); x.lineTo(c.width,i); x.stroke();
    }
    x.strokeStyle = "rgba(176,38,255,.23)";
    x.lineWidth = 6;
    x.strokeRect(28,28,c.width-56,c.height-56);
  });
}

function makeCarpetTexture(){
  return canvasTexture((x,c)=>{
    const g = x.createRadialGradient(c.width/2,c.height/2,20,c.width/2,c.height/2,c.width*.52);
    g.addColorStop(0,"#35114c");
    g.addColorStop(.58,"#18091f");
    g.addColorStop(1,"#09040c");
    x.fillStyle = g;
    x.fillRect(0,0,c.width,c.height);
    x.strokeStyle = "#b026ff";
    x.lineWidth = 18;
    for(let r=110;r<470;r+=82){
      x.beginPath();
      x.arc(c.width/2,c.height/2,r,0,Math.PI*2);
      x.stroke();
    }
    x.strokeStyle = "rgba(113,247,255,.42)";
    x.lineWidth = 5;
    for(let i=0;i<24;i++){
      const a = i/24*Math.PI*2;
      x.beginPath();
      x.moveTo(c.width/2,c.height/2);
      x.lineTo(c.width/2+Math.cos(a)*455,c.height/2+Math.sin(a)*455);
      x.stroke();
    }
  });
}

function makeRainTexture(){
  return canvasTexture((x,c)=>{
    x.fillStyle = "rgba(5,8,15,.65)";
    x.fillRect(0,0,c.width,c.height);
    for(let i=0;i<260;i++){
      x.strokeStyle = i%4===0 ? "rgba(176,220,255,.45)" : "rgba(113,247,255,.20)";
      x.lineWidth = i%5===0 ? 2 : 1;
      const px = Math.random()*c.width;
      const py = Math.random()*c.height;
      x.beginPath();
      x.moveTo(px,py);
      x.lineTo(px-12-Math.random()*8, py+42+Math.random()*32);
      x.stroke();
    }
  }, 1024, 512);
}

function makeLabelTexture(title, sub, note){
  return canvasTexture((x,c)=>{
    x.fillStyle = "rgba(3,5,10,.94)";
    x.fillRect(0,0,c.width,c.height);
    x.strokeStyle = "#b026ff";
    x.lineWidth = 12;
    x.strokeRect(24,24,c.width-48,c.height-48);
    x.strokeStyle = "#71f7ff";
    x.lineWidth = 5;
    x.strokeRect(58,58,c.width-116,c.height-116);
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillStyle = "#fff7ff";
    x.font = "900 74px Arial";
    x.fillText(title,c.width/2,c.height*.34);
    x.fillStyle = "#71f7ff";
    x.font = "800 35px Arial";
    x.fillText(sub,c.width/2,c.height*.55);
    x.fillStyle = "#ff4058";
    x.font = "900 30px Arial";
    x.fillText(note,c.width/2,c.height*.72);
  }, 1200, 420);
}

function addBox(scene, name, size, pos, mat){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x,size.y,size.z), mat);
  mesh.name = name;
  mesh.position.set(pos.x,pos.y,pos.z);
  mesh.frustumCulled = false;
  scene.add(mesh);
  return mesh;
}

function addRoomShell(scene){
  const brick = makeBrickTexture();
  brick.repeat.set(3.3,1.45);
  const floorTex = makeFloorTexture();
  floorTex.repeat.set(4.8,4.8);
  const wallMat = new THREE.MeshStandardMaterial({ map: brick, roughness:.82, metalness:.03, emissive:0x090413, emissiveIntensity:.20 });
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness:.42, metalness:.15, emissive:0x020308, emissiveIntensity:.12 });
  const trimPurple = new THREE.MeshBasicMaterial({ color:0xb026ff, toneMapped:false });
  const trimCyan = new THREE.MeshBasicMaterial({ color:0x71f7ff, toneMapped:false });
  const ceilingMat = new THREE.MeshStandardMaterial({ color:0x07050f, roughness:.85, emissive:0x08020e, emissiveIntensity:.16 });

  addBox(scene,"REIKI_PHASE165_OBSIDIAN_FLOOR",{x:20,y:.16,z:20},{x:0,y:-.04,z:0},floorMat);
  addBox(scene,"REIKI_PHASE165_CEILING",{x:20,y:.14,z:20},{x:0,y:7.95,z:0},ceilingMat);
  addBox(scene,"REIKI_PHASE165_LEFT_WALL",{x:.22,y:8,z:20},{x:-10,y:4,z:0},wallMat);
  addBox(scene,"REIKI_PHASE165_RIGHT_WALL",{x:.22,y:8,z:20},{x:10,y:4,z:0},wallMat);
  addBox(scene,"REIKI_PHASE165_FRONT_WALL",{x:20,y:8,z:.22},{x:0,y:4,z:10},wallMat);

  // Window wall split around panoramic rain view.
  addBox(scene,"REIKI_PHASE165_BACK_WALL_LEFT",{x:3.2,y:8,z:.22},{x:-8.4,y:4,z:-10},wallMat);
  addBox(scene,"REIKI_PHASE165_BACK_WALL_RIGHT",{x:3.2,y:8,z:.22},{x:8.4,y:4,z:-10},wallMat);
  addBox(scene,"REIKI_PHASE165_BACK_WALL_ABOVE_WINDOW",{x:14,y:1.35,z:.22},{x:0,y:7.3,z:-10},wallMat);
  addBox(scene,"REIKI_PHASE165_BACK_WALL_BELOW_WINDOW",{x:14,y:1.1,z:.22},{x:0,y:.55,z:-10},wallMat);

  const columnMat = new THREE.MeshStandardMaterial({ color:0x201035, roughness:.28, metalness:.08, emissive:0x160021, emissiveIntensity:.25 });
  [[-9.72,-9.72],[9.72,-9.72],[-9.72,9.72],[9.72,9.72]].forEach(([x,z],idx)=>{
    const col = new THREE.Mesh(new THREE.CylinderGeometry(.36,.42,8,22), columnMat);
    col.name = `REIKI_PHASE165_PURPLE_CORNER_COLUMN_${idx}`;
    col.position.set(x,4,z);
    scene.add(col);
    addBox(scene,`REIKI_PHASE165_COLUMN_CYAN_LINE_${idx}`,{x:.045,y:7.5,z:.045},{x:x,z:z+(z<0?.39:-.39),y:4},idx%2?trimCyan:trimPurple);
  });

  const trimPieces = [
    {n:"BOTTOM_BACK",s:{x:14.2,y:.06,z:.08},p:{x:0,y:.12,z:-9.72},m:trimPurple},
    {n:"TOP_BACK",s:{x:14.2,y:.06,z:.08},p:{x:0,y:7.78,z:-9.72},m:trimPurple},
    {n:"BOTTOM_FRONT",s:{x:18.8,y:.06,z:.08},p:{x:0,y:.12,z:9.72},m:trimPurple},
    {n:"TOP_FRONT",s:{x:18.8,y:.06,z:.08},p:{x:0,y:7.78,z:9.72},m:trimPurple},
    {n:"BOTTOM_LEFT",s:{x:.08,y:.06,z:18.8},p:{x:-9.72,y:.12,z:0},m:trimCyan},
    {n:"BOTTOM_RIGHT",s:{x:.08,y:.06,z:18.8},p:{x:9.72,y:.12,z:0},m:trimCyan}
  ];
  trimPieces.forEach(t=>addBox(scene,`REIKI_PHASE165_NEON_TRIM_${t.n}`,t.s,t.p,t.m));
}

function addRainWindow(scene){
  const frameMat = new THREE.MeshBasicMaterial({ color:0xb026ff, toneMapped:false });
  const cyanMat = new THREE.MeshBasicMaterial({ color:0x71f7ff, toneMapped:false });
  addBox(scene,"REIKI_PHASE165_WINDOW_TOP_FRAME",{x:14.5,y:.14,z:.26},{x:0,y:6.55,z:-9.76},frameMat);
  addBox(scene,"REIKI_PHASE165_WINDOW_BOTTOM_FRAME",{x:14.5,y:.14,z:.26},{x:0,y:1.12,z:-9.76},frameMat);
  addBox(scene,"REIKI_PHASE165_WINDOW_LEFT_FRAME",{x:.14,y:5.5,z:.26},{x:-7.25,y:3.84,z:-9.76},frameMat);
  addBox(scene,"REIKI_PHASE165_WINDOW_RIGHT_FRAME",{x:.14,y:5.5,z:.26},{x:7.25,y:3.84,z:-9.76},frameMat);
  addBox(scene,"REIKI_PHASE165_WINDOW_MIDDLE_CYAN_MULLION",{x:.08,y:5.15,z:.26},{x:0,y:3.84,z:-9.74},cyanMat);

  const rainTex = makeRainTexture();
  rainTex.repeat.set(1,1);
  const rainPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(13.6,5.0),
    new THREE.MeshBasicMaterial({ map:rainTex, transparent:true, opacity:.68, side:THREE.DoubleSide, depthWrite:false, toneMapped:false })
  );
  rainPlane.name = "REIKI_PHASE165_RAIN_WINDOW_ANIMATED_TEXTURE";
  rainPlane.position.set(0,3.82,-10.22);
  rainPlane.frustumCulled = false;
  scene.add(rainPlane);

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(13.8,5.05),
    new THREE.MeshBasicMaterial({ color:0x9adfff, transparent:true, opacity:.09, side:THREE.DoubleSide, depthWrite:false, toneMapped:false })
  );
  glass.name = "REIKI_PHASE165_PANORAMIC_WINDOW_GLASS";
  glass.position.set(0,3.82,-9.62);
  scene.add(glass);

  const outsideGlow = new THREE.PointLight(0x71f7ff,1.4,18,2);
  outsideGlow.position.set(0,4.2,-11.4);
  scene.add(outsideGlow);

  scene.userData.phase165Rain = { mesh: rainPlane, texture: rainTex };
}

function addMeditationCenter(scene){
  const carpetTex = makeCarpetTexture();
  carpetTex.repeat.set(1,1);
  const carpet = new THREE.Mesh(
    new THREE.CylinderGeometry(3.15,3.15,.11,96),
    new THREE.MeshStandardMaterial({ map:carpetTex, roughness:.86, metalness:0, emissive:0x12001f, emissiveIntensity:.18 })
  );
  carpet.name = "REIKI_PHASE165_CENTER_MEDITATION_CARPET";
  carpet.position.y = .055;
  scene.add(carpet);

  const cushionMat = new THREE.MeshStandardMaterial({ color:0x1c1624, roughness:.95, metalness:0, emissive:0x09020d, emissiveIntensity:.08 });
  const accentMat = new THREE.MeshBasicMaterial({ color:0xb026ff, transparent:true, opacity:.42, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
  const seats = [[0,0],[-1.55,1.55],[1.55,1.55],[-1.55,-1.55],[1.55,-1.55]];
  seats.forEach(([x,z],i)=>{
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(i===0?.92:.68,.22,i===0?.92:.68), cushionMat);
    cushion.name = `REIKI_PHASE165_MEDITATION_CUSHION_${i}`;
    cushion.position.set(x,.22,z);
    scene.add(cushion);
    const glow = new THREE.Mesh(new THREE.RingGeometry(i===0?.56:.42,i===0?.64:.50,64), accentMat);
    glow.name = `REIKI_PHASE165_CUSHION_SOFT_GLOW_${i}`;
    glow.rotation.x = -Math.PI/2;
    glow.position.set(x,.345,z);
    scene.add(glow);
  });

  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(.36,48,24),
    new THREE.MeshStandardMaterial({ color:0xffd7ff, emissive:0xb026ff, emissiveIntensity:1.1, roughness:.36 })
  );
  orb.name = "REIKI_PHASE165_BREATHING_CENTER_ORB";
  orb.position.set(0,1.32,0);
  scene.add(orb);
  scene.userData.phase165Orb = orb;

  const aura = new THREE.Mesh(
    new THREE.RingGeometry(3.35,3.48,128),
    new THREE.MeshBasicMaterial({ color:0x71f7ff, transparent:true, opacity:.30, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending })
  );
  aura.name = "REIKI_PHASE165_CENTER_AURA_RING";
  aura.rotation.x = -Math.PI/2;
  aura.position.y = .13;
  scene.add(aura);
  scene.userData.phase165Aura = aura;
}

function addSVRPlaceholderSign(scene){
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(6.6,2.3),
    new THREE.MeshBasicMaterial({ map:makeLabelTexture("REIKI ROOM","PRIVATE MEDITATION SANCTUARY","SVR PLACEHOLDER • AWAITING APPROVAL"), transparent:true, toneMapped:false })
  );
  sign.name = "REIKI_PHASE165_SVR_APPROVAL_PLACEHOLDER_SIGN";
  sign.position.set(0,4.18,-9.45);
  scene.add(sign);
}

function addPlants(scene){
  const trunkMat = new THREE.MeshStandardMaterial({ color:0x52301e, roughness:.8 });
  const leafMat = new THREE.MeshStandardMaterial({ color:0x123d2a, roughness:.76, emissive:0x031208, emissiveIntensity:.12 });
  const spots = [[-7.8,-7.4],[7.8,-7.4],[-7.4,6.8],[7.4,6.8],[-4.8,7.4],[4.8,7.4]];
  spots.forEach(([x,z],idx)=>{
    const root = new THREE.Group();
    root.name = `REIKI_PHASE165_EDGE_PLANT_${idx}`;
    root.position.set(x,0,z);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.07,.14,1.25,8), trunkMat);
    trunk.position.y = .62;
    root.add(trunk);
    for(let i=0;i<5;i++){
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(.34,12,8), leafMat);
      const a = i/5*Math.PI*2;
      leaf.scale.set(1.0,.55,.32);
      leaf.position.set(Math.cos(a)*.26,1.22+Math.sin(i)*.08,Math.sin(a)*.26);
      root.add(leaf);
    }
    scene.add(root);
  });
}

function addAmbientParticles(scene){
  const group = new THREE.Group();
  group.name = "REIKI_PHASE165_FLOATING_BREATH_PARTICLES";
  const geo = new THREE.SphereGeometry(.035,8,6);
  const mats = [
    new THREE.MeshBasicMaterial({ color:0xb026ff, transparent:true, opacity:.40, depthWrite:false, blending:THREE.AdditiveBlending }),
    new THREE.MeshBasicMaterial({ color:0x71f7ff, transparent:true, opacity:.34, depthWrite:false, blending:THREE.AdditiveBlending })
  ];
  for(let i=0;i<70;i++){
    const p = new THREE.Mesh(geo, mats[i%2]);
    const a = Math.random()*Math.PI*2;
    const r = 1.2+Math.random()*8.0;
    p.position.set(Math.cos(a)*r,.55+Math.random()*5.5,Math.sin(a)*r);
    p.userData.phase165Seed = Math.random()*1000;
    group.add(p);
  }
  scene.add(group);
  scene.userData.phase165Particles = group;
}

function addLighting(scene){
  scene.add(new THREE.AmbientLight(0x2c1a3d,.86));
  const center = new THREE.PointLight(0x8a2be2,1.65,12,2);
  center.name = "REIKI_PHASE165_CENTER_PURPLE_LIGHT";
  center.position.set(0,3.2,0);
  scene.add(center);
  const windowLight = new THREE.PointLight(0x71f7ff,.95,14,2);
  windowLight.name = "REIKI_PHASE165_RAIN_WINDOW_LIGHT";
  windowLight.position.set(0,4.0,-8.8);
  scene.add(windowLight);
}

bootPrivateScene({
  title:"REIKI ROOM",
  subtitle:"SVR PLACEHOLDER • AWAITING APPROVAL",
  accent:0xff4058,
  buildLabel:PHASE165,
  build:({scene,camera,renderer,backGate})=>{
    scene.background = new THREE.Color(0x04030a);
    addLighting(scene);
    addRoomShell(scene);
    addRainWindow(scene);
    addMeditationCenter(scene);
    addSVRPlaceholderSign(scene);
    addPlants(scene);
    addAmbientParticles(scene);
    if(backGate) backGate.visible = false;

    scene.userData._tickWorld = (dt)=>{
      const time = (scene.userData.phase165Time = (scene.userData.phase165Time || 0) + dt);
      const rain = scene.userData.phase165Rain;
      if(rain?.texture){
        rain.texture.offset.y -= dt * .34;
        rain.texture.offset.x += dt * .018;
      }
      if(scene.userData.phase165Orb){
        const s = 1 + Math.sin(time*1.15)*.08;
        scene.userData.phase165Orb.scale.setScalar(s);
        scene.userData.phase165Orb.rotation.y += dt*.22;
      }
      if(scene.userData.phase165Aura){
        scene.userData.phase165Aura.rotation.z += dt*.08;
        scene.userData.phase165Aura.material.opacity = .24 + Math.sin(time*.95)*.07;
      }
      const particles = scene.userData.phase165Particles;
      if(particles){
        particles.children.forEach((p,i)=>{
          const seed = p.userData.phase165Seed || i;
          p.position.y += dt*(.05 + (i%5)*.008);
          p.position.x += Math.sin(time*.35 + seed)*dt*.035;
          p.position.z += Math.cos(time*.31 + seed)*dt*.035;
          if(p.position.y > 6.8) p.position.y = .45;
        });
      }
    };
    console.log(`[${PHASE165}] Reiki private meditation sanctuary ready`);
  }
});
