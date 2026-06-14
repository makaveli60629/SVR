const LABEL = "UPDATE-3.0-PHASE-216-SCIFI-CITY-SECOND-FLOOR-BACKGROUND-LOCK";
function stamp(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE216 = {
    build: LABEL,
    active: true,
    scifiCityBackground: true,
    secondFloorVisible: true,
    usesUploadedScifiCityZip: true,
    keepsPhase215MoonMars: true,
    noFaceOverlay: true,
    checkedAt: new Date().toISOString()
  };
  window.SVR_NO_FACE_OVERLAY = true;
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{ if ((el.textContent||"").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`; });
}
stamp();
setTimeout(stamp,100);
setTimeout(stamp,500);
setTimeout(stamp,1500);
setTimeout(stamp,4000);
setInterval(stamp,1800);
