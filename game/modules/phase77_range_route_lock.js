const BUILD = "PHASE-80-PGA-TARGET-BOUNTY-LOCAL-SCORE-LOCK";
const RANGE_URL = "./range.html?v=phase80-pga-target-bounty";
const STORE_URL = "https://svrpoker.com/site/store.html";

function openPhase77Range(){
  if (typeof window === "undefined") return false;
  window.location.href = RANGE_URL;
  return true;
}

function openPhase77Lobby(){
  if (typeof window === "undefined") return false;
  window.location.href = "./index.html?v=phase80-return-lobby";
  return true;
}

export { BUILD as PHASE77_BUILD, RANGE_URL as PHASE77_RANGE_URL, STORE_URL as PHASE77_STORE_URL, openPhase77Range, openPhase77Lobby };
