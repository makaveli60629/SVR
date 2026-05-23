import * as THREE from "three";

const PHASE = "PHASE-130-ORBIT-SKY-PERFORMANCE-STABILITY-LOCK";

function makeFloorTexture(){
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(512,512,40,512,512,520);
  g.addColorStop(0,"#18203d");
  g.addColorStop(.45,"#0b1126");
  g.addColorStop(1,"#050610");
  x.fillStyle = g;
  x.fillRect(0,0,1024,1024);
  x.strokeStyle = "rgba(127,245,199,.26)";
  x.lineWidth = 3;
  for(let i=0;i<=1024;i+=64){
    x.beginPath(); x.moveTo(i,0); x.lineTo(i,1024); x.stroke();
    x.beginPath(); x.moveTo(0,i); x.lineTo(1024,i); x.stroke();
  }
  x.strokeStyle = "rgba(180,140,255,.36)";
  x.lineWidth = 8;
  x.beginPath();
  x.arc(512,512,405,0,Math.PI*2);
  x.stroke();
  x.strokeStyle = "rgba(246,226,127,.32)";
  x.lineWidth = 5;
  x.beginPath();
  x.arc(512,512,235,0,Math.PI*2);
  x.stroke();
  x.font = "900 58px system-ui, Arial";
  x.textAlign = "center";
  x.fillStyle = "rgba(246,226,127,.55)";
  x.fillText("SVR LOBBY FLOOR",512,535);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2,2);
  tex.anisotropy = 4;
  return tex;
}

export function installLobbyFloorRecovery({ worldRoot, scene, radius = 24 } = {}){
  const parent = worldRoot || scene;
  if (!parent) return null;
  const existing = parent.getObjectByName("SVR_PHASE130_VISIBLE_LOBBY_FLOOR_RECOVERY");
  if (existing) return existing.userData.api;

  const group = new THREE.Group();
  group.name = "SVR_PHASE130_VISIBLE_LOBBY_FLOOR_RECOVERY";
  parent.add(group);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 1.04, 144),
    new THREE.MeshBasicMaterial({
      map: makeFloorTexture(),
      color: 0xffffff,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
      fog: false,
      toneMapped: false
    })
  );
  floor.name = "SVR_VISIBLE_RECOVERY_FLOOR";
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.018;
  floor.renderOrder = -5;
  group.add(floor);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * .96, radius * 1.02, 144),
    new THREE.MeshBasicMaterial({ color:0x7ff5c7, side:THREE.DoubleSide, transparent:true, opacity:.42, depthWrite:false, fog:false, toneMapped:false })
  );
  ring.name = "SVR_VISIBLE_FLOOR_EDGE_RING";
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .006;
  ring.renderOrder = 2;
  group.add(ring);

  const tableSafe = new THREE.Mesh(
    new THREE.RingGeometry(5.8, 7.15, 96),
    new THREE.MeshBasicMaterial({ color:0xf6e27f, side:THREE.DoubleSide, transparent:true, opacity:.20, depthWrite:false, fog:false, toneMapped:false })
  );
  tableSafe.name = "SVR_SPAWN_EXCLUSION_RING_TABLE_SAFE";
  tableSafe.rotation.x = -Math.PI / 2;
  tableSafe.position.y = .012;
  tableSafe.renderOrder = 3;
  group.add(tableSafe);

  const api = {
    phase: PHASE,
    siteTouched:false,
    update(){
      floor.visible = true;
      ring.visible = true;
      tableSafe.visible = true;
    }
  };
  group.userData.api = api;
  window.SVR_PHASE130_LOBBY_FLOOR_RECOVERY = api;
  return api;
}
