import * as THREE from "three";
import { installPhase203CarouselInteractions } from "./modules/phase203_carousel_interactions.js";

const LABEL = "UPDATE-3.0-PHASE-203-CAROUSEL-INTERACTION-ROUTE-LOCK";

function setStatus(text, opts = {}){
  const status = document.getElementById("status");
  if (status) status.textContent = text;
}
function setBuildLabel(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE203 = {
    build: LABEL,
    active: true,
    carouselInteractions: true,
    meditationRoute: true,
    desktopPointer: true,
    xrSelect: true,
    approvalSafe: true
  };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}
function moveDesktopCamera(camera, x, z, lx = 0, lz = -2){
  if (!camera) return false;
  camera.position.set(x,1.6,z);
  camera.lookAt(lx,1.45,lz);
  return true;
}
function installWhenReady(){
  setBuildLabel();
  const scene = window.__SVR_SCENE__;
  const renderer = window.__SVR_RENDERER__;
  const camera = window.__SVR_CAMERA__;
  if (!scene || !renderer || !camera) return false;
  if (window.SVR_PHASE203_INSTALLED) return true;
  const gotoScene = (key)=>{
    if (key === "reikiRoom"){
      window.location.href = "./reiki.html?v=phase203-meditation-route";
      return true;
    }
    if (key === "reiki") return moveDesktopCamera(camera,-12,-11.8,-12,-16);
    if (key === "pga") return moveDesktopCamera(camera,-6,-11.8,-6,-16);
    if (key === "scorpion") return moveDesktopCamera(camera,12,-11.8,12,-16);
    if (key === "store") return moveDesktopCamera(camera,6,-11.8,6,-16);
    return moveDesktopCamera(camera,0,7.2,0,-2);
  };
  const openStorePortal = ()=>{
    window.open("https://svrpoker.com/site/store.html", "_blank", "noopener,noreferrer");
    setStatus("SVR Store portal opened.");
    return true;
  };
  const phase203 = installPhase203CarouselInteractions({ scene, camera, renderer, gotoScene, openStorePortal, setStatus, log:console.log });
  window.SVR_PHASE203_INSTALLED = true;
  window.SVR_PHASE203_UPDATE = phase203;
  const prevTick = scene.userData._tickWorld;
  scene.userData._tickWorld = (dt)=>{
    if (typeof prevTick === "function") prevTick(dt);
    phase203?.update?.(dt || 0.016);
  };
  setStatus(`Ready. ${LABEL}`);
  return true;
}
setBuildLabel();
let attempts = 0;
const timer = setInterval(()=>{
  attempts++;
  if (installWhenReady() || attempts > 80) clearInterval(timer);
},250);
setTimeout(installWhenReady,1000);
setTimeout(installWhenReady,2500);
