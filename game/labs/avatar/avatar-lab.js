import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SVRPlayerAvatar } from '../../modules/avatar/player_avatar_module.js?v=phase444';

export const BUILD = 'PHASE-443-PLAYER-ONLY-ARTICULATED-AVATAR-LAB';
const canvas = document.getElementById('avatarCanvas'), status = document.getElementById('status');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12; renderer.shadowMap.enabled = true;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x03050d); scene.fog = new THREE.FogExp2(0x090713, .035);
const camera = new THREE.PerspectiveCamera(42, 1, .01, 50); camera.position.set(1.7, 1.25, 3.2);
const controls = new OrbitControls(camera, canvas); controls.target.set(0, .92, 0); controls.enableDamping = true; controls.minDistance = 1.2; controls.maxDistance = 5;
scene.add(new THREE.HemisphereLight(0xcdbdff, 0x100716, 2.5));
const key = new THREE.DirectionalLight(0xfff4ea, 4); key.position.set(3, 5, 4); key.castShadow = true; scene.add(key);
const rim = new THREE.PointLight(0x8a4cff, 16, 8, 2); rim.position.set(-2, 2.5, -2); scene.add(rim);
const floor = new THREE.Mesh(new THREE.CircleGeometry(3, 96), new THREE.MeshPhysicalMaterial({ color: 0x0c0813, roughness: .48, metalness: .12, clearcoat: .2 })); floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);
const avatar = new SVRPlayerAvatar(scene); const ids = ['body','skin','palette','top','headwear','eyewear','shoes','accessory'];
const read = () => Object.fromEntries(ids.map(id => [id, document.getElementById(id).value]));
function report(extra = '') { const q = avatar.audit(); status.textContent = `${BUILD}\nPLAYER AVATAR • ${q.motion.toUpperCase()}\n${q.boneCount} articulated joints • ${q.meshCount} curved meshes\nwardrobe=${q.wardrobeCount} placeholders=${q.placeholderBoxes}\n${q.pass ? 'QA PASS' : 'QA CHECK'} ${extra}`; }
for (const id of ids) document.getElementById(id).addEventListener('change', () => { avatar.applyOutfit(read()); report('outfit fitted'); });
document.querySelectorAll('[data-motion]').forEach(button => button.addEventListener('click', () => { avatar.setMotion(button.dataset.motion); document.querySelectorAll('[data-motion]').forEach(b => b.classList.toggle('active', b === button)); report('motion active'); }));
document.getElementById('reset').addEventListener('click', () => { camera.position.set(1.7, 1.25, 3.2); controls.target.set(0, .92, 0); controls.update(); });
document.getElementById('save').addEventListener('click', () => { const outfit = { schemaVersion: 3, modelId: 'svr-player', ...read() }; localStorage.setItem('svrPlayerAvatarV3', JSON.stringify(outfit)); window.dispatchEvent(new CustomEvent('svr:avatar-saved', { detail: outfit })); report('saved locally'); });
const saved = JSON.parse(localStorage.getItem('svrPlayerAvatarV3') || 'null'); if (saved) for (const id of ids) if (saved[id]) document.getElementById(id).value = saved[id]; avatar.applyOutfit(read()); avatar.setMotion('walking'); document.querySelector('[data-motion="walking"]')?.classList.add('active');
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); } addEventListener('resize', resize); resize();
let previous = performance.now() * .001; renderer.setAnimationLoop(() => { const now = performance.now() * .001, dt = Math.min(.05, now - previous); previous = now; avatar.update(dt); controls.update(); renderer.render(scene, camera); });
window.SVR_AVATAR_LAB = { build: BUILD, avatar, qa: () => ({ ...avatar.audit(), outfit: read() }) }; report('ready');
