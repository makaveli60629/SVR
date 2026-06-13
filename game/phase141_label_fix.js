import { autoInstallPhase173SingleWall } from "./modules/lobby_single_wall_phase173.js";
import { installPhase173LocomotionAudit } from "./modules/locomotion_audit_phase173.js";
import { installPhase174WallGuard } from "./modules/phase174_wall_guard.js";
import { installPhase174AuditPatch } from "./modules/phase174_audit_patch.js";
import { installPhase175LobbyPolishAudit } from "./modules/phase175_lobby_polish_audit.js";

const LABEL = "UPDATE-3.0-PHASE-175-LOBBY-POLISH-AUDIT-LOCK";
function syncLabels(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE106.source = "Phase 175 lobby polish audit active.";
  window.SVR_PHASE175 = { build: LABEL };
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
installPhase174WallGuard();
installPhase174AuditPatch();
installPhase175LobbyPolishAudit();
