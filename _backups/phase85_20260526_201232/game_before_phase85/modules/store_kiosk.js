import * as THREE from "three";

export const SVR_STORE_PORTAL_URL = "https://svrpoker.com/site/store.html";
export const STORE_KIOSK_LOCK_VERSION = "PHASE-85-TRUE-LOBBY-KIOSK-SCORPION-CELESTIAL-LOCK";

function makeTexture(){
  const c = document.createElement('canvas');
  c.width = 1400; c.height = 900;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0,'#090015'); g.addColorStop(0.52,'#130020'); g.addColorStop(1,'#020005');
  x.fillStyle = g; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = 'rgba(185,110,255,0.95)'; x.lineWidth = 18; x.strokeRect(24,24,c.width-48,c.height-48);
  x.strokeStyle = 'rgba(126,255,207,0.72)'; x.lineWidth = 6; x.strokeRect(54,54,c.width-108,c.height-108);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = '#ffffff'; x.font = '900 108px system-ui, Arial'; x.fillText('SVR STORE KIOSK', c.width/2, 155);
  x.fillStyle = '#b98cff'; x.font = '800 58px system-ui, Arial'; x.fillText('In-game access to site store', c.width/2, 255);
  x.fillStyle = '#dfffee'; x.font = '700 44px system-ui, Arial'; x.fillText('Browse merchandise • preview gear • test portal routing', c.width/2, 345);
  x.fillStyle = 'rgba(255,255,255,0.10)'; x.fillRect(170,440,1060,150);
  x.strokeStyle = 'rgba(126,255,207,0.82)'; x.lineWidth = 8; x.strokeRect(170,440,1060,150);
  x.fillStyle = '#7effcf'; x.font = '900 56px system-ui, Arial'; x.fillText('OPEN STORE', 700, 515);
  x.fillStyle = '#f4eaff'; x.font = '600 34px system-ui, Arial'; x.fillText(SVR_STORE_PORTAL_URL, 700, 650);
  x.fillStyle = '#ffd36b'; x.font = '700 32px system-ui, Arial'; x.fillText('Desktop opens page • VR uses large kiosk/route target', 700, 745);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}

export function addStoreKiosk(scene, { radius = 18, wallHeight = 7 } = {}){
  const group = new THREE.Group();
  const angle = -Math.PI * 0.46;
  const pos = new THREE.Vector3(Math.cos(angle)*(radius-3.6), 0, Math.sin(angle)*(radius-3.6));
  group.position.copy(pos);
  group.lookAt(new THREE.Vector3(0,1.4,0));
  scene.add(group);

  const stand = new THREE.Mesh(new THREE.BoxGeometry(4.4,0.22,1.0), new THREE.MeshStandardMaterial({ color:0x151021, roughness:0.58, metalness:0.18, emissive:0x1b0731, emissiveIntensity:0.35 }));
  stand.position.set(0,0.18,0); group.add(stand);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.11,1.55,18), new THREE.MeshStandardMaterial({ color:0x3a2457, roughness:0.42, metalness:0.42, emissive:0x19072e, emissiveIntensity:0.25 }));
  pole.position.set(0,0.92,0); group.add(pole);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(4.8,3.05), new THREE.MeshBasicMaterial({ map: makeTexture(), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  panel.position.set(0,2.55,0.08); panel.renderOrder = 38; group.add(panel);
  const glow = new THREE.PointLight(0xb36bff,1.15,7,1.8); glow.position.set(0,2.4,0.8); group.add(glow);

  const inward = new THREE.Vector3().copy(pos).multiplyScalar(-1).normalize();
  const target = pos.clone().add(inward.multiplyScalar(2.5)).setY(0);
  const look = pos.clone().setY(1.65);
  scene.userData.SVR_STORE_KIOSK = { phase: STORE_KIOSK_LOCK_VERSION, url: SVR_STORE_PORTAL_URL, target, look };
  return { group, target, look, url: SVR_STORE_PORTAL_URL };
}
