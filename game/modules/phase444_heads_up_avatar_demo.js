/* PHASE-444-HEADS-UP-AVATAR-DEMO */
import * as THREE from 'three';
import { SVRPlayerAvatar } from './avatar/player_avatar_module.js?v=phase444';

export const BUILD = 'PHASE-444-ONE-PLAYER-ERIC-HEADS-UP-DEMO';
let installed = false, avatar = null, runtime = null, cards = null, chips = null, deals = 0, lastTime = 0;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function cardMesh(index) {
  const face = new THREE.MeshPhysicalMaterial({ color: index ? 0xfff8ef : 0xf8fbff, roughness: .42, clearcoat: .12 });
  const back = new THREE.MeshPhysicalMaterial({ color: 0x36104f, roughness: .36, clearcoat: .18 });
  const card = new THREE.Mesh(new THREE.BoxGeometry(.063, .0025, .089), [face, face, face, face, face, back]);
  card.name = `PHASE444_PLAYER_HOLE_CARD_${index + 1}`; card.castShadow = true; return card;
}
function buildProps(scene, surfaceY, centerZ) {
  cards = new THREE.Group(); cards.name = 'PHASE444_PLAYER_CARDS'; scene.add(cards);
  for (let i = 0; i < 2; i++) { const card = cardMesh(i); card.userData.target = new THREE.Vector3((i - .5) * .075, surfaceY + .003, centerZ - .23); card.position.copy(card.userData.target); card.rotation.y = (i - .5) * .11; card.visible = false; cards.add(card); }
  chips = new THREE.Group(); chips.name = 'PHASE444_PLAYER_CHIPS'; scene.add(chips);
  for (let i = 0; i < 8; i++) { const chip = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .006, 28), new THREE.MeshPhysicalMaterial({ color: i % 2 ? 0x9c48ff : 0xffffff, roughness: .38, metalness: .04 })); chip.position.set(.18, surfaceY + .003 + i * .0062, centerZ - .27); chip.castShadow = true; chips.add(chip); }
}
function receiveCard() {
  const card = cards?.children[deals % 2]; if (!card) return;
  const target = card.userData.target.clone(), feltY = runtime.table.getSurfaceY?.(.0025) ?? .62, origin = runtime.dealer.getDealOrigin?.() || new THREE.Vector3(0, feltY + .25, .55); card.position.copy(origin); card.visible = true; card.scale.setScalar(1); const started = performance.now();
  const animate = now => { const p = Math.min(1, (now - started) / 430), s = p * p * (3 - 2 * p); card.position.lerpVectors(origin, target, s); card.position.y += Math.sin(Math.PI * s) * .08; if (p < 1) requestAnimationFrame(animate); else card.position.copy(target); }; requestAnimationFrame(animate);
  deals++; if (deals % 2 === 0) setTimeout(() => { for (const c of cards.children) c.visible = false; }, 6200);
}
function posePlayer(t) {
  if (!avatar) return; avatar.update(Math.min(.05, t - lastTime)); lastTime = t;
  const r = avatar.rig, breathe = Math.sin(t * 2.1), glance = Math.sin(t * .55), act = Math.max(0, Math.sin(t * .72));
  r.hips.position.y = .57 + breathe * .006; r.chest.rotation.set(-.08 + breathe * .012, glance * .055, 0); r.head.rotation.set(.03, -glance * .12, 0);
  r.leftUpperArm.rotation.set(.15, 0, .78); r.leftForeArm.rotation.set(0, 0, -.92);
  r.rightUpperArm.rotation.set(.18 + act * .10, 0, -.78); r.rightForeArm.rotation.set(0, 0, .90 - act * .28);
  r.leftThigh.rotation.x = r.rightThigh.rotation.x = -1.35; r.leftCalf.rotation.x = r.rightCalf.rotation.x = 1.25;
}

export async function install() {
  if (installed) return true;
  const started = performance.now(); while (performance.now() - started < 30000) { runtime = window.SVR_LOBBY_DEALER_MODULE || window.SVR_APPROVED_DEALER_TABLE_MODULE; if (runtime?.scene && runtime?.table?.table && runtime?.dealer?.loaded) break; await wait(100); }
  if (!runtime?.scene || !runtime?.table?.table) throw new Error('PHASE444_MASTER_TABLE_NOT_READY');
  const felt = new THREE.Box3(); for (const rec of runtime.table.nativeFeltRecords || []) felt.expandByObject(rec.mesh); const center = felt.getCenter(new THREE.Vector3());
  const surfaceY = runtime.table.getSurfaceY?.(.0025) ?? .62; avatar = new SVRPlayerAvatar(runtime.scene, { body: 'athletic', skin: 'deep', palette: 'royal', top: 'jacket', shoes: 'sneakers', accessory: 'watch' });
  avatar.root.name = 'PHASE444_SINGLE_HEADS_UP_PLAYER'; avatar.root.position.set(center.x, 0, felt.min.z - .34); avatar.root.rotation.y = 0; avatar.root.scale.setScalar(.92); avatar.setMotion('sitting');
  buildProps(runtime.scene, surfaceY, center.z); runtime.dealer.addEventListener('deal', receiveCard);
  const previous = runtime.scene.onBeforeRender; runtime.scene.onBeforeRender = (...args) => { previous?.(...args); const now = performance.now() * .001; posePlayer(now); };
  setTimeout(() => runtime.dealer.setMode('deal-loop'), 900); installed = true;
  window.SVR_PHASE444_HEADS_UP = { BUILD, avatar, cards, chips, runtime, qa };
  return true;
}
export function qa() { return { build: BUILD, installed, onePlayer: runtime?.scene?.getObjectsByProperty('name', 'PHASE444_SINGLE_HEADS_UP_PLAYER')?.length === 1, dealerOnlyEric: avatar?.root?.userData?.avatarRole === 'player', cards: cards?.children?.length || 0, chips: chips?.children?.length || 0, pass: Boolean(installed && avatar && cards?.children?.length === 2) }; }
window.SVR_PHASE444_INSTALL = install; window.SVR_PHASE444_QA = qa;
