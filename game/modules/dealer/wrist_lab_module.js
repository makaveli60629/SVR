import * as THREE from 'three';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';

function makeScreenTexture(lines = []) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#09050f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#9655dd';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  ctx.fillStyle = '#f5efff';
  ctx.font = '700 42px system-ui';
  ctx.fillText('SVR LAB', 30, 62);
  ctx.fillStyle = '#baa9cf';
  ctx.font = '30px system-ui';
  lines.slice(0, 4).forEach((line, index) => ctx.fillText(line, 30, 112 + index * 34));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export class WristLabModule extends EventTarget {
  constructor(renderer, scene) {
    super();
    this.renderer = renderer;
    this.scene = scene;
    this.watch = this.createWatch();
    this.mountedTo = null;
    this.controllerObjects = [];
    this.handObjects = [];
    this._initXRInputs();
  }

  createWatch() {
    const group = new THREE.Group();
    group.name = 'SVR_Lab_WristWatch';

    const strap = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.022, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x17101f, roughness: 0.82, metalness: 0.05 })
    );
    group.add(strap);

    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(0.092, 0.018, 0.074),
      new THREE.MeshStandardMaterial({ color: 0x30164c, roughness: 0.36, metalness: 0.52, emissive: 0x170724, emissiveIntensity: 0.35 })
    );
    bezel.position.y = 0.018;
    group.add(bezel);

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.078, 0.058),
      new THREE.MeshBasicMaterial({ map: makeScreenTexture(['IDLE', 'TRIGGER: DEAL', 'GRIP: GUIDES']) })
    );
    screen.rotation.x = -Math.PI / 2;
    screen.position.y = 0.028;
    group.add(screen);
    group.userData.screen = screen;
    group.visible = false;
    return group;
  }

  updateStatus(mode, guides) {
    const screen = this.watch.userData.screen;
    if (!screen) return;
    const old = screen.material.map;
    screen.material.map = makeScreenTexture([
      String(mode || 'IDLE').toUpperCase(),
      `GUIDES: ${guides ? 'ON' : 'OFF'}`,
      'TRIGGER: DEAL',
      'GRIP: GUIDES',
    ]);
    screen.material.needsUpdate = true;
    old?.dispose?.();
  }

  mountTo(object, source) {
    if (!object || this.mountedTo === object) return;
    object.add(this.watch);
    this.mountedTo = object;
    this.watch.visible = true;
    this.watch.position.set(0.025, -0.025, -0.075);
    this.watch.rotation.set(-0.25, 0.08, -0.12);
    this.dispatchEvent(new CustomEvent('mounted', { detail: { source } }));
  }

  _initXRInputs() {
    const handFactory = new XRHandModelFactory();
    for (let i = 0; i < 2; i++) {
      const controller = this.renderer.xr.getController(i);
      const grip = this.renderer.xr.getControllerGrip(i);
      const hand = this.renderer.xr.getHand(i);
      this.scene.add(controller, grip, hand);
      this.controllerObjects.push(controller, grip);
      this.handObjects.push(hand);

      controller.addEventListener('connected', (event) => {
        const handedness = event.data?.handedness;
        controller.userData.handedness = handedness;
        if (handedness === 'left') this.mountTo(grip, 'controller');
      });
      controller.addEventListener('selectstart', () => {
        this.dispatchEvent(new CustomEvent('action', { detail: { action: 'deal-toggle' } }));
      });
      controller.addEventListener('squeezestart', () => {
        this.dispatchEvent(new CustomEvent('action', { detail: { action: 'toggle-guides' } }));
      });

      hand.addEventListener('connected', (event) => {
        const handedness = event.data?.handedness;
        hand.userData.handedness = handedness;
        if (handedness === 'left') this.mountTo(hand, 'hand');
      });

      try {
        const handModel = handFactory.createHandModel(hand, 'mesh');
        hand.add(handModel);
      } catch (error) {
        console.warn('[SVR Dealer Lab] XR hand model fallback only', error);
      }
    }
  }
}
