(function(){
  const BUILD = "PHASE-1.7.4-FULL-AUDIT-SITE-GAME-DATA-LOCK";
  window.SVR_BUILD_LABEL = BUILD;
  window.SVR_FULL_AUDIT_LOCK = {
    build: BUILD,
    generatedAt: new Date().toISOString(),
    scope: "repo/site/game/data audit guard",
    protectedSystems: ["poker","quest controls","android fallback","site APK route","RICI route","zip deployment"]
  };
  console.log("[SVR]", BUILD, "audit guard active");
})();
