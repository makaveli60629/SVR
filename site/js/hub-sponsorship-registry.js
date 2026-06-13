window.SVR_HUB_SPONSORSHIP_REGISTRY = Object.freeze({
  version: "UPDATE-3.0-PHASE-157-MODULAR-HUB-SPONSORSHIP-REGISTRY-LOCK",
  rule: "All hub sponsor details must come from this registry or an approved server record. Do not hard-code sponsor names, websites, logos, profile copy, booking links, pricing, or media into pages.",
  excluded: ["vibes", "vibesTheater", "theater"],
  hubs: {
    reiki: { enabled: false, title: "Reiki Hub", slot: "wellness sponsor placeholder", page: "store-reiki.html" },
    pga: { enabled: false, title: "PGA Hub", slot: "golf sponsor placeholder", page: "store-pga.html" },
    store: { enabled: false, title: "SVR Store", slot: "store sponsor placeholder", page: "store.html" },
    smoker: { enabled: false, title: "Smoker Hub", slot: "lounge sponsor placeholder", page: "store-smoker.html" },
    scorpion: { enabled: false, title: "Scorpion Room", slot: "room sponsor placeholder", page: "../game/index.html?scene=scorpion" },
    legends: { enabled: false, title: "Legends", slot: "hall sponsor placeholder", page: "../game/index.html?scene=legends" },
    sponsor: { enabled: false, title: "Sponsor Hub", slot: "general sponsor placeholder", page: "sponsorship.html" },
    charity: { enabled: false, title: "Charity Hub", slot: "community sponsor placeholder", page: "impact.html" }
  }
});

(function(){
  const registry = window.SVR_HUB_SPONSORSHIP_REGISTRY;
  document.querySelectorAll("[data-hub-sponsor]").forEach((el)=>{
    const key = el.getAttribute("data-hub-sponsor");
    if (registry.excluded.includes(key)) return;
    const rec = registry.hubs[key];
    if (!rec) return;
    el.setAttribute("data-sponsor-enabled", String(!!rec.enabled));
    el.querySelectorAll("[data-sponsor-title]").forEach(t=>{ t.textContent = rec.title; });
    el.querySelectorAll("[data-sponsor-slot]").forEach(t=>{ t.textContent = rec.slot; });
    el.querySelectorAll("a[data-sponsor-page]").forEach(a=>{ a.href = rec.page; });
  });
})();
