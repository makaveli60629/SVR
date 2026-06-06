import * as THREE from "three";

export const SVR_PRIVATE_SCENE_VERSION = "phase92";

export function getPrivateSceneMap(){
  return {
    reikiRoom: `./reiki.html?v=${SVR_PRIVATE_SCENE_VERSION}`,
    pgaDrive: `./range.html?v=${SVR_PRIVATE_SCENE_VERSION}`,
    pgaChipPutt: `./chip-putt.html?v=${SVR_PRIVATE_SCENE_VERSION}`,
    chipPutt: `./chip-putt.html?v=${SVR_PRIVATE_SCENE_VERSION}`,
    storeRoom: `./store-room.html?v=${SVR_PRIVATE_SCENE_VERSION}`,
    smokerLounge: `./smoker-lounge.html?v=${SVR_PRIVATE_SCENE_VERSION}`,
    scorpion: `./scorpion.html?v=${SVR_PRIVATE_SCENE_VERSION}`
  };
}

function makeLabelTexture(label, sublabel, color = 0x7ff5c7){
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d'); const hex = '#' + color.toString(16).padStart(6,'0');
  x.fillStyle = 'rgba(2,8,14,0.92)'; x.fillRect(0,0,c.width,c.height); x.strokeStyle = hex; x.lineWidth = 16; x.strokeRect(24,24,c.width-48,c.height-48);
  x.shadowColor = hex; x.shadowBlur = 22; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.font = 'bold 82px system-ui, Arial'; x.fillText(label, c.width/2, 190);
  x.fillStyle = hex; x.font = 'bold 38px system-ui, Arial'; x.fillText(sublabel || 'PRIVATE SCENE', c.width/2, 300); x.shadowBlur = 0; x.fillStyle = 'rgba(255,255,255,0.75)'; x.font = '28px system-ui, Arial'; x.fillText('CLICK / TAP TO ENTER', c.width/2, 385);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; return tex;
}

export function openPrivateScene(key){
  const href = getPrivateSceneMap()[key];
  if (!href) return false;
  location.href = href;
  return true;
}

export function createPortal({ scene, label, sublabel, position, rotationY = 0, key, color = 0x7ff5c7 }){
  const group = new THREE.Group(); group.name = `PORTAL_${key}`; group.position.copy(position || new THREE.Vector3()); group.rotation.y = rotationY; group.userData.portalKey = key;
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.55,0.92,72), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.30, side:THREE.DoubleSide, depthWrite:false })); ring.rotation.x=-Math.PI/2; ring.position.y=0.035; group.add(ring);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.52,64), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.10, side:THREE.DoubleSide, depthWrite:false })); disc.rotation.x=-Math.PI/2; disc.position.y=0.032; group.add(disc);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.55,1.28), new THREE.MeshBasicMaterial({ map: makeLabelTexture(label, sublabel, color), transparent:true, side:THREE.DoubleSide })); sign.position.set(0,1.35,-0.08); group.add(sign);
  const light = new THREE.PointLight(color,1.8,4.2,2.0); light.position.set(0,0.45,0); group.add(light); scene.add(group); return group;
}

export function installPortalClickHandler({ camera, scene, domElement }){
  const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2();
  domElement.addEventListener('pointerdown', (event)=>{ const rect=domElement.getBoundingClientRect(); mouse.x=((event.clientX-rect.left)/rect.width)*2-1; mouse.y=-((event.clientY-rect.top)/rect.height)*2+1; raycaster.setFromCamera(mouse,camera); const targets=[]; scene.traverse(o=>{if(o.userData?.portalKey)targets.push(o);}); const hits=raycaster.intersectObjects(targets,true); if(!hits.length)return; let o=hits[0].object; while(o&&!o.userData?.portalKey)o=o.parent; if(o?.userData?.portalKey)openPrivateScene(o.userData.portalKey); }, { passive:true });
}
