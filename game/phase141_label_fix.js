import { autoInstallPhase173SingleWall } from "./modules/lobby_single_wall_phase173.js";
import { installPhase173LocomotionAudit } from "./modules/locomotion_audit_phase173.js";

const LABEL = "UPDATE-3.0-PHASE-173-SINGLE-OCTAGON-WALL-LOCOMOTION-AUDIT-LOCK";
function syncLabels(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE106.source = "Phase 173: single real octagon wall, old wall/building cleanup, storefront panel restore, and locomotion audit lock.";
  window.SVR_PHASE173 = { build: LABEL, purpose: "Single octagon wall and locomotion audit" };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach((el)=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
  const status = document.getElementById("status");
  if (status && /PHASE-|Phase /i.test(status.textContent || "")) status.textContent = `Ready. ${LABEL}`;
}
syncLabels();
setTimeout(syncLabels, 500);
setTimeout(syncLabels, 1500);
setInterval(syncLabels, 4000);
autoInstallPhase173SingleWall();
installPhase173LocomotionAudit();
