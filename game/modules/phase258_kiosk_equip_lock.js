/*
 * SVR Phase 258 — Kiosk VR Equip Items Lock
 * Adds sandbox-only equip test state for VR store kiosk.
 * No checkout, no Stripe, no backend keys, no website edits.
 */
(function(){
  const BUILD = "PHASE-258-KIOSK-VR-EQUIP-ITEMS-LOCK";

  const items = [
    {
      id: "svr-gloves-purple",
      name: "SVR Purple Gloves",
      type: "gloves",
      status: "preview",
      description: "Test glove skin for VR hand visual polish."
    },
    {
      id: "svr-watch-gold",
      name: "SVR Gold Watch",
      type: "watch",
      status: "preview",
      description: "Test watch trim for wrist UI readability."
    },
    {
      id: "svr-banner-founder",
      name: "SVR Avatar Banner",
      type: "banner",
      status: "preview",
      description: "Test wearable banner/card for avatar identity."
    },
    {
      id: "svr-table-skin-purple",
      name: "SVR Purple Table Skin",
      type: "table",
      status: "preview",
      description: "Sample cosmetic table felt preview."
    }
  ];

  const state = {
    build: BUILD,
    opened: false,
    equipped: {
      gloves: null,
      watch: null,
      banner: null,
      table: null
    },
    items,
    siteTouched: false,
    checkoutEnabled: false,
    storeUrl: "https://svrpoker.com/site/store.html",
    loadedAt: new Date().toISOString()
  };

  window.SVR_STORE_EQUIP = state;

  function emit(name, detail){
    try {
      window.dispatchEvent(new CustomEvent(name, { detail: Object.assign({ build: BUILD }, detail || {}) }));
    } catch(_) {}
  }

  function esc(value){
    return String(value == null ? "" : value).replace(/[<>&"]/g, s => ({
      "<":"&lt;",
      ">":"&gt;",
      "&":"&amp;",
      '"':"&quot;"
    }[s]));
  }

  function equip(itemId){
    const item = items.find(x => x.id === itemId);
    if (!item) return false;

    state.equipped[item.type] = item.id;

    emit("svr_store_item_equipped", {
      itemId: item.id,
      type: item.type,
      name: item.name,
      sandboxOnly: true
    });

    renderPanel();
    return true;
  }

  function unequip(type){
    if (!(type in state.equipped)) return false;
    state.equipped[type] = null;
    emit("svr_store_item_unequipped", { type });
    renderPanel();
    return true;
  }

  function openStoreRoom(){
    window.location.href = "./store-room.html";
  }

  function openWebsiteStore(){
    window.open(state.storeUrl, "_blank", "noopener,noreferrer");
  }

  function getPanel(){
    let panel = document.getElementById("svrStoreEquipPanel");
    if (panel) return panel;

    panel = document.createElement("div");
    panel.id = "svrStoreEquipPanel";
    panel.style.cssText = [
      "position:fixed",
      "left:50%",
      "top:50%",
      "transform:translate(-50%,-50%)",
      "z-index:100020",
      "width:min(920px,calc(100vw - 28px))",
      "max-height:86vh",
      "overflow:auto",
      "padding:18px",
      "border-radius:22px",
      "background:linear-gradient(180deg,rgba(7,8,18,.97),rgba(18,6,30,.97))",
      "color:#f5f2ff",
      "border:1px solid rgba(190,150,255,.62)",
      "box-shadow:0 26px 90px rgba(0,0,0,.78)",
      "font:14px/1.45 system-ui,Segoe UI,Arial,sans-serif",
      "display:none"
    ].join(";");

    document.body.appendChild(panel);
    return panel;
  }

  function itemButton(item){
    const active = state.equipped[item.type] === item.id;
    return `
      <article style="border:1px solid rgba(170,135,255,.36);border-radius:16px;padding:14px;background:rgba(255,255,255,.045)">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
          <strong style="font-size:15px">${esc(item.name)}</strong>
          <span style="font-size:11px;border:1px solid rgba(120,255,190,.5);border-radius:999px;padding:3px 8px;color:#baffde">${esc(item.status)}</span>
        </div>
        <p style="margin:8px 0 12px;color:#d7ccff">${esc(item.description)}</p>
        <button data-equip="${esc(item.id)}" style="min-height:44px;padding:10px 14px;border-radius:999px;border:1px solid ${active ? "#8cffdc" : "rgba(190,150,255,.65)"};background:${active ? "rgba(40,120,85,.45)" : "rgba(55,25,90,.72)"};color:white;cursor:pointer;width:100%">
          ${active ? "Equipped" : "Equip Test"}
        </button>
      </article>
    `;
  }

  function renderPanel(show=true){
    const panel = getPanel();
    if (show) {
      panel.style.display = "block";
      state.opened = true;
    }

    const equippedRows = Object.entries(state.equipped).map(([type, id]) => {
      const item = items.find(x => x.id === id);
      return `<div><b>${esc(type)}:</b> ${item ? esc(item.name) : "None"}</div>`;
    }).join("");

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
        <div>
          <div style="font-size:12px;color:#baffde;letter-spacing:.08em;text-transform:uppercase">SVR VR Store Kiosk</div>
          <h2 style="margin:4px 0 6px;font-size:28px">Sandbox Equip Preview</h2>
          <p style="margin:0;color:#d9d2ff">Preview-only items for VR testing. No live checkout. No Stripe. No backend secrets.</p>
        </div>
        <button id="svrStoreEquipClose" style="min-height:42px;padding:9px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.35);color:white;cursor:pointer">Close</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin-top:16px">
        ${items.map(itemButton).join("")}
      </div>

      <section style="margin-top:16px;border:1px solid rgba(120,255,190,.34);border-radius:16px;padding:14px;background:rgba(0,20,12,.26)">
        <h3 style="margin:0 0 8px">Equipped Test State</h3>
        <div style="color:#eafff6">${equippedRows}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
          <button id="svrOpenStoreRoom" style="min-height:44px;padding:10px 14px;border-radius:999px;border:1px solid #8cffdc;background:rgba(20,80,58,.55);color:white;cursor:pointer">Enter VR Store Room</button>
          <button id="svrOpenWebsiteStore" style="min-height:44px;padding:10px 14px;border-radius:999px;border:1px solid #caa8ff;background:rgba(55,25,90,.72);color:white;cursor:pointer">Open Website Store</button>
          <button id="svrUnequipAll" style="min-height:44px;padding:10px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.35);color:white;cursor:pointer">Clear Test Equip</button>
        </div>
      </section>

      <p style="margin:12px 0 0;color:#aaa1cf;font-size:12px">Desktop shortcut: press O to open the kiosk panel. VR kiosk/select hooks can call window.SVR_STORE_EQUIP_API.open().</p>
    `;

    panel.querySelector("#svrStoreEquipClose").onclick = closePanel;
    panel.querySelector("#svrOpenStoreRoom").onclick = openStoreRoom;
    panel.querySelector("#svrOpenWebsiteStore").onclick = openWebsiteStore;
    panel.querySelector("#svrUnequipAll").onclick = () => {
      Object.keys(state.equipped).forEach(type => state.equipped[type] = null);
      emit("svr_store_equip_cleared", {});
      renderPanel();
    };

    panel.querySelectorAll("[data-equip]").forEach(btn => {
      btn.onclick = () => equip(btn.getAttribute("data-equip"));
    });

    emit("svr_store_kiosk_panel_rendered", {
      opened: state.opened,
      equipped: state.equipped
    });
  }

  function openPanel(){
    renderPanel(true);
    emit("svr_store_kiosk_opened", { sandboxOnly: true });
  }

  function closePanel(){
    const panel = getPanel();
    panel.style.display = "none";
    state.opened = false;
    emit("svr_store_kiosk_closed", {});
  }

  const api = {
    state,
    items,
    open: openPanel,
    close: closePanel,
    equip,
    unequip,
    openStoreRoom,
    openWebsiteStore
  };

  window.SVR_STORE_EQUIP_API = api;

  window.addEventListener("keydown", ev => {
    if (ev.key && ev.key.toLowerCase() === "o" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      openPanel();
    }
  });

  window.addEventListener("svr_store_kiosk_select", () => openPanel());
  window.addEventListener("svr_game_ready", () => emit("svr_store_equip_ready", state));

  emit("svr_phase258_kiosk_equip_ready", state);
})();
