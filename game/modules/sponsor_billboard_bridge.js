// SVR Site/Game 1.1 — Sponsor Billboard Bridge
// Loads the current sponsor event JSON and exposes active billboard placement data to the game.
// Safe: no SQL credentials, no Stripe keys, no direct database access.

const SPONSOR_DATA_URL = window.SVR_SPONSOR_EVENT_DATA_URL || "/site/data/sponsor-event-current.json";
const API_BASE = window.SVR_API_BASE || "https://api.svrpoker.com";

async function trackSponsorEvent(eventType, payload = {}) {
  try {
    const body = JSON.stringify({
      eventType,
      room: "lobby",
      build: document.body?.dataset?.build || "SITE-GAME-1.1-SPONSOR-EVENT",
      sessionId: sessionStorage.getItem("svr_game_session_id") || "anonymous-game-session",
      source: "sponsor_billboard_bridge",
      payload
    });
    await fetch(`${API_BASE}/api/game/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: body.length < 60000
    });
  } catch (err) {
    console.warn("[SVR Sponsor Bridge] tracking skipped:", err.message);
  }
}

async function loadSponsorCampaign() {
  try {
    const res = await fetch(SPONSOR_DATA_URL, { cache: "no-store" });
    const data = await res.json();
    window.SVR_SPONSOR_CAMPAIGN = data.activeCampaign || null;
    window.dispatchEvent(new CustomEvent("SVR_SPONSOR_CAMPAIGN_READY", { detail: window.SVR_SPONSOR_CAMPAIGN }));
    await trackSponsorEvent("sponsor_campaign_loaded", {
      campaignId: window.SVR_SPONSOR_CAMPAIGN?.id,
      sponsorName: window.SVR_SPONSOR_CAMPAIGN?.sponsorName,
      status: window.SVR_SPONSOR_CAMPAIGN?.status
    });
    return window.SVR_SPONSOR_CAMPAIGN;
  } catch (err) {
    console.warn("[SVR Sponsor Bridge] campaign load failed:", err.message);
    return null;
  }
}

function wireBillboardPlaceholders() {
  window.addEventListener("SVR_SPONSOR_CAMPAIGN_READY", (event) => {
    const campaign = event.detail;
    if (!campaign) return;
    for (const placement of campaign.placements || []) {
      const selector = `[data-svr-billboard="${placement.key}"]`;
      document.querySelectorAll(selector).forEach((el) => {
        if (el.tagName === "IMG") el.src = placement.asset;
        else el.style.backgroundImage = `url("${placement.asset}")`;
        el.dataset.svrSponsor = campaign.sponsorName || "";
        el.dataset.svrCampaign = campaign.id || "";
      });
    }
  });
}

wireBillboardPlaceholders();
loadSponsorCampaign();
