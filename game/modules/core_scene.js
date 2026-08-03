import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

export function createCore({ containerId = "app" } = {}){
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050508);

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.2, 1600);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    depth: true,
    stencil: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false
  });

  renderer.setClearColor(0x050508, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 0.9));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local-floor");
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  document.getElementById(containerId).appendChild(renderer.domElement);

  // Compatibility fallback only. Phase 364 replaces this with one monitored
  // Quest button after runtime initialization. local-floor is optional so a
  // recovering guardian/floor permission cannot reject the entire session.
  const vrButton = VRButton.createButton(renderer, {
    optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"]
  });
  vrButton.classList.add("svr-vr-button", "svr-vr-button-fallback");
  vrButton.dataset.svrXrFallback = "true";
  document.body.appendChild(vrButton);

  window.SVR_XR_CORE_STATE = {
    build: "PHASE-364-DEVICE-XR-GEOMETRY-SPAWN-LOCK",
    referenceSpaceType: "local-floor",
    localFloorRequired: false,
    localFloorOptional: true,
    boundedFloorOptional: true,
    handTrackingOptional: true,
    checkedAt: new Date().toISOString()
  };

  window.addEventListener("resize", ()=>{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}
