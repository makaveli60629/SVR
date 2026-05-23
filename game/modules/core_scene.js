import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

export function createCore({ containerId = "app" } = {}){
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050508);

  const camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.08, 180);

  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: false,
    depth: true,
    stencil: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false
  });

  const ua = navigator.userAgent || "";
  const quest = /Quest|OculusBrowser|Meta Quest|VR/i.test(ua);
  const startScale = quest ? 0.38 : 0.46;

  renderer.setClearColor(0x050508, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, startScale));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  if (renderer.xr.setFramebufferScaleFactor) renderer.xr.setFramebufferScaleFactor(startScale);
  try { renderer.xr.setFoveation?.(1.0); } catch {}
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.74;
  renderer.shadowMap.enabled = false;
  renderer.sortObjects = false;

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
    phase: "PHASE-141-QUEST-FPS-EMERGENCY-STABILITY-LOCK",
    nearPlane: 0.08,
    farPlane: 180,
    pixelRatioMax: startScale,
    framebufferScale: startScale,
    foveation: 1.0,
    antialias: false,
    shadows: false,
    sortObjects: false,
    questDetected: quest
  };
  window.SVR_CORE_SCENE = scene;
  window.SVR_CORE_CAMERA = camera;
  window.SVR_CORE_RENDERER = renderer;

  return { scene, camera, renderer };
}
