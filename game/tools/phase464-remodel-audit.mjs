import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
const main=read("game/main.js"), index=read("game/index.html"), android=read("game/android-stable-phase405.html"), deploy=read(".github/workflows/deploy.yml");
for(const marker of ["phase464_grand_lobby_remodel.js","installPhase464GrandLobbyRemodel"]) if(!main.includes(marker)) throw new Error("missing lobby marker "+marker);
for(const marker of ["phase464_quest_remodel_finish.js","SVR_PHASE464_QUEST_READY_PROMISE"]) if(!index.includes(marker)) throw new Error("missing quest marker "+marker);
if(!android.includes("phase464_android_final_fit_guard.js")) throw new Error("Android final-fit guard not loaded");
for(const marker of ["PHASE-465-QUEST-LOBBY-AUTO-BOOT","PHASE-464-ANDROID-FINAL-FIT-GUARD"]) if(!deploy.includes(marker)) throw new Error("deploy missing "+marker);
console.log("Phase 464 remodel audit passed.");
