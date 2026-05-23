import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

export function createCore({ containerId = "app" } = {}){
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050508);

  // Phase 104: lower near plane for Quest/WebXR so close watch, hand-fire, and teleport markers
  // do not clip differently between eyes.
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 1600);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    depth: true,
    stencil: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false
  });

  renderer.setClearColor(0x050508, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 0.82));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  if (renderer.xr.setFramebufferScaleFactor) renderer.xr.setFramebufferScaleFactor(0.82);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.sortObjects = true;

  document.getElementById(containerId).appendChild(renderer.domElement);
  const vrButton = VRButton.createButton(renderer, {
    requiredFeatures: ["local-floor"],
    optionalFeatures: ["bounded-floor", "hand-tracking"]
  });
  vrButton.classList.add("svr-vr-button");
  document.body.appendChild(vrButton);

  window.addEventListener("resize", ()=>{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  window.SVR_XR_RENDERER_LOCK = {
    phase: "PHASE-104-XR-EYE-STABILITY-LOCK",
    nearPlane: 0.05,
    pixelRatioMax: 0.82,
    framebufferScale: 0.82,
    shadows: false
  };

  return { scene, camera, renderer };
}
