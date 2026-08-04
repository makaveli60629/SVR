import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

const NATHAN_FBX_URL = "./assets/npc/nathan/rp_nathan_animated_003_walking_u3d.fbx";

function makeLabelTexture(text){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  g.addColorStop(0, "rgba(4,10,18,.92)");
  g.addColorStop(1, "rgba(18,6,30,.92)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(125,255,240,.92)";
  ctx.lineWidth = 10;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f7ffff";
  ctx.font = "900 72px system-ui, Arial";
  ctx.fillText(text, canvas.width / 2, 104);
  ctx.fillStyle = "#9fffe8";
  ctx.font = "700 34px system-ui, Arial";
  ctx.fillText("Walking NPC patrol test", canvas.width / 2, 178);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeNameplate(){
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(1.45, 0.36),
    new THREE.MeshBasicMaterial({ map: makeLabelTexture("NATHAN"), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  plate.name = "Nathan Walker Nameplate";
  plate.position.set(0, 2.12, 0);
  return plate;
}

function makeFallbackWalker(){
  const root = new THREE.Group();
  root.name = "Nathan Walker Fallback Pill";
  const matBody = new THREE.MeshStandardMaterial({ color: 0x2a2430, roughness: .72, metalness: .05, emissive: 0x100820, emissiveIntensity: .16 });
  const matTrim = new THREE.MeshStandardMaterial({ color: 0x7dfff0, roughness: .35, metalness: .28, emissive: 0x1aa090, emissiveIntensity: .55 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.28, .82, 8, 18), matBody);
  body.position.y = 1.02;
  root.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.22, 24, 16), matBody);
  head.position.y = 1.72;
  root.add(head);
  const chest = new THREE.Mesh(new THREE.TorusGeometry(.26, .018, 8, 40), matTrim);
  chest.position.y = 1.22;
  chest.rotation.x = Math.PI / 2;
  root.add(chest);
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(.045, .55, 6, 10), matTrim);
  const armR = armL.clone();
  armL.position.set(-.36, 1.18, 0);
  armR.position.set(.36, 1.18, 0);
  root.add(armL, armR);
  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(.055, .62, 6, 10), matTrim);
  const legR = legL.clone();
  legL.position.set(-.12, .38, 0);
  legR.position.set(.12, .38, 0);
  root.add(legL, legR);
  root.userData._limbs = { armL, armR, legL, legR };
  return root;
}

function fitToHeight(object, targetHeight = 1.78){
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  if (!Number.isFinite(size.y) || size.y <= 0.001) return;
  const scale = targetHeight / size.y;
  object.scale.multiplyScalar(scale);
  object.updateMatrixWorld(true);
  const box2 = new THREE.Box3().setFromObject(object);
  object.position.y -= box2.min.y;
}

function buildWaypoints(sceneTargets = {}){
  const pts = [];
  if (sceneTargets.reiki?.pos) pts.push(sceneTargets.reiki.pos.clone().add(new THREE.Vector3(1.6, 0, 2.2)));
  if (sceneTargets.store?.pos) pts.push(sceneTargets.store.pos.clone().add(new THREE.Vector3(-1.2, 0, 2.1)));
  if (sceneTargets.lounge?.pos) pts.push(sceneTargets.lounge.pos.clone().add(new THREE.Vector3(-1.4, 0, 1.7)));
  if (sceneTargets.scorpion?.pos) pts.push(sceneTargets.scorpion.pos.clone().add(new THREE.Vector3(1.3, 0, 1.7)));
  if (pts.length < 4){
    pts.length = 0;
    pts.push(
      new THREE.Vector3(-7.2, 0, 4.6),
      new THREE.Vector3(-7.0, 0, -4.4),
      new THREE.Vector3(0.0, 0, -7.1),
      new THREE.Vector3(7.0, 0, -4.4),
      new THREE.Vector3(7.2, 0, 4.6),
      new THREE.Vector3(0.0, 0, 6.2)
    );
  }
  return pts.map((p)=>new THREE.Vector3(p.x, 0, p.z));
}

export function addNathanWalkingNPCPhase131({ scene, sceneTargets = {}, setStatus = ()=>{}, log = ()=>{} } = {}){
  if (!scene || scene.userData._phase131NathanWalker) return scene?.userData?._phase131NathanWalker || null;

  const group = new THREE.Group();
  group.name = "PHASE131 NATHAN WALKING NPC";
  scene.add(group);

  const waypoints = buildWaypoints(sceneTargets);
  group.position.copy(waypoints[0]);

  let actor = makeFallbackWalker();
  group.add(actor);
  const label = makeNameplate();
  group.add(label);

  let mixer = null;
  let segment = 0;
  let segmentT = 0;
  const speed = 0.82;
  const modelYawOffset = Math.PI;

  function installActor(obj, clips = []){
    group.remove(actor);
    actor = obj;
    actor.name = "Nathan Walking FBX Actor";
    actor.rotation.y = modelYawOffset;
    actor.traverse((child)=>{
      if (!child.isMesh) return;
      child.castShadow = false;
      child.receiveShadow = false;
      child.frustumCulled = false;
      const base = child.material;
      child.material = new THREE.MeshStandardMaterial({
        map: base?.map || null,
        color: base?.map ? 0xffffff : 0xddddff,
        roughness: .78,
        metalness: .02,
        skinning: true
      });
    });
    fitToHeight(actor, 1.78);
    group.add(actor);
    group.add(label);
    if (clips?.length){
      mixer = new THREE.AnimationMixer(actor);
      const action = mixer.clipAction(clips[0]);
      action.reset();
      action.play();
      log?.(`[Nathan] loaded FBX walk animation: ${clips[0].name || "walk"}`);
      setStatus("Nathan walking NPC loaded", { force: true });
    }
  }

  const loader = new FBXLoader();
  loader.load(
    NATHAN_FBX_URL,
    (fbx)=>installActor(fbx, fbx.animations || []),
    undefined,
    (err)=>{
      log?.("[Nathan] FBX missing or failed; using fallback walker. Add asset at " + NATHAN_FBX_URL, err?.message || err);
      setStatus("Nathan fallback walker active; FBX asset still needs commit", { force: true });
    }
  );

  scene.userData._tickNathanWalkerPhase131 = (dt = 0)=>{
    if (mixer) mixer.update(dt);
    if (actor?.userData?._limbs){
      const t = performance.now() * 0.006;
      const { armL, armR, legL, legR } = actor.userData._limbs;
      armL.rotation.x = Math.sin(t) * .45;
      armR.rotation.x = -Math.sin(t) * .45;
      legL.rotation.x = -Math.sin(t) * .38;
      legR.rotation.x = Math.sin(t) * .38;
    }
    if (waypoints.length < 2) return;
    const a = waypoints[segment];
    const b = waypoints[(segment + 1) % waypoints.length];
    const dist = Math.max(0.001, a.distanceTo(b));
    segmentT += (dt * speed) / dist;
    if (segmentT >= 1){
      segmentT = 0;
      segment = (segment + 1) % waypoints.length;
    }
    const cur = waypoints[segment];
    const nxt = waypoints[(segment + 1) % waypoints.length];
    group.position.lerpVectors(cur, nxt, segmentT);
    const dir = new THREE.Vector3().subVectors(nxt, cur);
    if (dir.lengthSq() > 0.0001) group.rotation.y = Math.atan2(dir.x, dir.z);
    label.rotation.y = -group.rotation.y;
  };

  const prevTick = scene.userData._tickWorld;
  if (prevTick && !scene.userData._phase131NathanWalkerWrappedTick){
    scene.userData._tickWorld = (dt)=>{
      prevTick(dt);
      if (scene.userData._tickNathanWalkerPhase131) scene.userData._tickNathanWalkerPhase131(dt);
    };
    scene.userData._phase131NathanWalkerWrappedTick = true;
  }

  scene.userData._phase131NathanWalker = { group, waypoints, get actor(){ return actor; } };
  setStatus("Nathan walking NPC patrol added", { force: true });
  log?.("Phase 131 Nathan walking NPC patrol active");
  return scene.userData._phase131NathanWalker;
}
