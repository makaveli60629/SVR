/* Lightweight Quest-safe avatar prototype. Replace with licensed optimized GLB assets later. */
import * as THREE from 'three';
export function createQuestAvatar({ scene, name = 'Player', color = 0x5b6cff, bot = false } = {}) {
  if (!scene) return null;
  const root = new THREE.Group(); root.name = `SVR_AVATAR_${String(name).replace(/[^a-z0-9_-]/gi, '_')}`; root.userData.svrAvatar = true; root.userData.playerName = name; root.userData.bot = Boolean(bot);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.62, 4, 10), new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.08 })); body.position.y = 0.66;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 12), new THREE.MeshStandardMaterial({ color: 0xb98262, roughness: 0.78 })); head.position.y = 1.22;
  root.add(body, head); scene.add(root); window.SVR_QUEST_VERTICAL_SLICE?.registerAvatar?.(); return root;
}
export const QUEST_AVATAR_BUILD = 'SVR-QUEST-AVATAR-PROTOTYPE-1';
