import * as THREE from "three";

const BUILD = "PHASE-329-ANDROID-TABLE-PLAYTEST-UX-LOCK";
const ua = navigator.userAgent || "";
const active = (/Android/i.test(ua) && !/Quest|Oculus|Meta Quest/i.test(ua)) || /\/game\/android\.html$/i.test(location.pathname) || new URLSearchParams(location.search).get("channel") === "stable";
const KEY = "SVR_ANDROID_TABLE_UX_V1";
const ranks = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const suits = ["♠", "♥", "♦", "♣"];

let installed = false;
let observer = null;
let applyTimer = 0;
let monitorTimer = 0;
let state = { seated: false, turn: false, activeHand: false, amount: 1000, cards: ["--", "--"], last: "LOBBY", hand: 0 };

function load() {
  try { state = { ...state, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch {}
  return state;
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  return state;
}

function scene() { return window.__SVR_SCENE__ || null; }
function cam() { return window.__SVR_RENDERER__?.xr?.isPresenting ? window.__SVR_RENDERER__.xr.getCamera(window.__SVR_CAMERA__) : window.__SVR_CAMERA__; }
function rig() { return window.SVR_TELEPORT_RIG_REF || window.SVR_TELEPORT_RIG || null; }
function root() { const value = scene(); return value?.getObjectByName?.("PHASE200_ORDERED_GRAND_LOBBY_ROOT") || value; }
function table() {
  const value = root();
  return value?.getObjectByName?.("PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED") ||
    value?.getObjectByName?.("PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT") ||
    value?.getObjectByName?.("PHASE326_ANDROID_TABLE_FALLBACK") || null;
}

function box() {
  const object = table();
  if (!object) return null;
  object.visible = true;
  object.traverse?.((child) => { child.visible = true; });
  object.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(object);
  if (bounds.isEmpty()) return null;
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  bounds.getCenter(center);
  bounds.getSize(size);
  return { obj: object, box: bounds, center, size, top: bounds.max.y };
}

function css() {
  if (document.getElementById("svr-phase329-style")) return;
  const style = document.createElement("style");
  style.id = "svr-phase329-style";
  style.textContent = `
    #svrAndroidGamePad,#svrTapMovePanel,#svrAndroidSafeBadge153,#svrAndroidLiteHud,#svrAndroidRecoverView{display:none!important;opacity:0!important;pointer-events:none!important}
    body.svr-phase329-android .svr-stick:not(#svr326Move):not(#svr326Look){display:none!important;opacity:0!important;pointer-events:none!important}
    body.svr-phase329-android #svr326Root{z-index:999999!important}
    .svr329Invalid{opacity:.38!important;filter:grayscale(.8)!important}
    .svr329Valid{border-color:#7ffcff!important;box-shadow:0 0 18px rgba(127,252,255,.42)!important}
    .svr329Pulse{transform:scale(.92)!important}
    #svr329Toast{position:fixed;left:50%;top:58px;transform:translateX(-50%);z-index:1000000;padding:9px 14px;border:1px solid rgba(255,217,138,.72);border-radius:999px;background:rgba(0,0,0,.68);color:#fff;font:950 12px system-ui;letter-spacing:.08em;pointer-events:none}
    #svr329Info,#svr329QA{display:none!important}
    body:not(.svr-phase329-android) #svr329Toast{display:none!important}
  `;
  document.head.appendChild(style);
}

function purge() {
  ["#svrAndroidGamePad", "#svrTapMovePanel", "#svrAndroidSafeBadge153", "#svrAndroidLiteHud", "#svrAndroidRecoverView"].forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => element.remove());
  });
  [...document.querySelectorAll(".svr-stick")].forEach((element) => {
    if (element.id !== "svr326Move" && element.id !== "svr326Look") element.remove();
  });
  const roots = [...document.querySelectorAll("#svr326Root")];
  roots.slice(1).forEach((element) => element.remove());
  return {
    roots: document.querySelectorAll("#svr326Root").length,
    sticks: document.querySelectorAll("#svr326Move,#svr326Look").length
  };
}

function toast(text) {
  let element = document.getElementById("svr329Toast");
  if (!element) {
    element = document.createElement("div");
    element.id = "svr329Toast";
    document.body.appendChild(element);
  }
  element.textContent = text;
  clearTimeout(element._t);
  element.style.opacity = ".98";
  element._t = setTimeout(() => { element.style.opacity = ".28"; }, 1400);
  try { navigator.vibrate?.(24); } catch {}
}

function draw(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 360;
  const context = canvas.getContext("2d");
  context.fillStyle = "#f8f0dc";
  context.fillRect(0, 0, 256, 360);
  context.strokeStyle = "#111";
  context.lineWidth = 10;
  context.strokeRect(10, 10, 236, 340);
  context.fillStyle = /[♥♦]/.test(text) ? "#a00018" : "#111";
  context.font = "900 72px system-ui";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 128, 180);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function cards() {
  const base = root();
  const tableBounds = box();
  if (!base || !tableBounds) return;
  const old = base.getObjectByName("PHASE329_ANDROID_PLAYER_CARD_ROOT");
  if (old) old.parent.remove(old);
  const group = new THREE.Group();
  group.name = "PHASE329_ANDROID_PLAYER_CARD_ROOT";
  base.add(group);
  state.cards.forEach((text, index) => {
    if (text === "--") return;
    const material = new THREE.MeshBasicMaterial({ map: draw(text), side: THREE.DoubleSide, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(.34, .47), material);
    mesh.position.set(tableBounds.center.x + (index ? .2 : -.2), tableBounds.top + .04, tableBounds.center.z + Math.max(.72, tableBounds.size.z * .31));
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 3290;
    group.add(mesh);
  });
}

function ring() {
  const base = root();
  const tableBounds = box();
  if (!base || !tableBounds) return;
  let object = base.getObjectByName("PHASE329_ANDROID_TURN_RING");
  if (!object) {
    object = new THREE.Mesh(
      new THREE.TorusGeometry(2.28, .025, 8, 112),
      new THREE.MeshBasicMaterial({ color: 0x7ffcff, transparent: true, opacity: .35, depthWrite: false })
    );
    object.name = "PHASE329_ANDROID_TURN_RING";
    object.rotation.x = Math.PI / 2;
    base.add(object);
  }
  object.position.set(tableBounds.center.x, tableBounds.top + .055, tableBounds.center.z);
  object.scale.set(Math.max(.75, tableBounds.size.x / 4.5), Math.max(.55, tableBounds.size.z / 3.1), 1);
  object.visible = state.seated && state.turn;
}

function dealCards() {
  const deck = [];
  for (const rank of ranks) for (const suit of suits) deck.push(rank + suit);
  deck.sort(() => Math.random() - .5);
  return [deck[0], deck[1]];
}

function sit() {
  const tableBounds = box();
  const activeCamera = cam();
  const activeRig = rig();
  if (!tableBounds) return false;
  state.seated = true;
  state.turn = state.activeHand ? state.turn : true;
  state.last = "SEATED";
  try {
    const x = tableBounds.center.x;
    const z = tableBounds.center.z + Math.max(2.12, tableBounds.size.z * .78);
    if (activeRig?.setPlayerPose) activeRig.setPlayerPose(x, 0, z);
    else if (activeCamera) activeCamera.position.set(x, 1.55, z);
    activeCamera?.lookAt?.(tableBounds.center.x, tableBounds.top + .18, tableBounds.center.z);
  } catch {}
  save();
  cards();
  apply();
  toast("SEATED AT TABLE");
  return true;
}

function lobby() {
  state.seated = false;
  state.turn = false;
  state.last = "LOBBY";
  save();
  try { window.SVR_ANDROID_LOBBY_MODE?.(); } catch {}
  apply();
  toast("LOBBY MOVEMENT ON");
}

function allowed(action) {
  if (action === "sit" || action === "clean") return true;
  if (!state.seated) return action === "deal";
  if (!state.activeHand) return action === "deal";
  return state.turn && (action === "check" || action === "call" || action === "raise");
}

function act(action) {
  if (action === "sit") return state.seated ? lobby() : sit();
  if (action === "clean") { purge(); cards(); return toast("CONTROL CLEANUP DONE"); }
  if (action === "deal") {
    if (!state.seated) sit();
    state.activeHand = true;
    state.turn = true;
    state.hand += 1;
    state.cards = dealCards();
    state.last = "CARDS DEALT";
    save();
    cards();
    try { window.SVR_PRESS_DEAL?.() || window.SVR_PLAY_LEFT_TO_RIGHT_DEAL?.(); } catch {}
    apply();
    return toast("CARDS DEALT • YOUR TURN");
  }
  if (!allowed(action)) return toast("ACTION NOT AVAILABLE");
  state.turn = false;
  state.last = action.toUpperCase() + " • WAITING";
  try {
    if (action === "check") window.SVR_SELECT_ACTION?.("Check");
    if (action === "call") window.SVR_SELECT_ACTION?.("Call");
    if (action === "raise") window.SVR_SELECT_ACTION?.("Raise");
  } catch {}
  save();
  apply();
  toast(state.last);
}

function apply() {
  document.body.classList.add("svr-phase329-android");
  const controls = purge();
  const turn = document.getElementById("svr326Turn");
  if (turn) turn.textContent = state.seated ? (state.turn ? "YOUR TURN" : "SEATED • WAITING") : "LOBBY MODE";
  const status = document.getElementById("svr326Status");
  if (status) status.textContent = state.last;
  const cardElements = [...document.querySelectorAll("#svr326Cards .svr326Card")];
  state.cards.forEach((value, index) => {
    if (!cardElements[index]) return;
    cardElements[index].textContent = value;
    cardElements[index].classList.toggle("red", /[♥♦]/.test(value));
  });
  const slider = document.getElementById("svr326RaiseSlider");
  if (slider) {
    slider.min = "500";
    slider.max = "10000";
    slider.step = "500";
    slider.value = String(state.amount);
    slider.oninput = () => {
      state.amount = Number(slider.value) || 1000;
      save();
      apply();
    };
  }
  const amount = document.getElementById("svr326RaiseText");
  if (amount) amount.textContent = Number(state.amount || 0).toLocaleString();
  document.querySelectorAll("#svr326Root button[data-act]").forEach((button) => {
    const ok = allowed(button.dataset.act);
    button.classList.toggle("svr329Valid", ok);
    button.classList.toggle("svr329Invalid", !ok);
    if (button.dataset.act === "sit") button.textContent = state.seated ? "LOBBY" : "SIT";
  });
  ring();
  window.SVR_PHASE329_ANDROID_UX_STATE = {
    build: BUILD,
    active: true,
    state: { ...state },
    controls,
    forceUpdate: false,
    showUpdatePrompt: false,
    checkedAt: new Date().toISOString()
  };
  return window.SVR_PHASE329_ANDROID_UX_STATE;
}

function hooks() {
  document.addEventListener("pointerdown", (event) => {
    const button = event.target?.closest?.("#svr326Root button[data-act]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    button.classList.add("svr329Pulse");
    setTimeout(() => button.classList.remove("svr329Pulse"), 130);
    act(button.dataset.act);
  }, true);

  document.addEventListener("pointerdown", (event) => {
    const button = event.target?.closest?.("#svr326Root button[data-small]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    if (button.dataset.small === "up") state.amount += 500;
    if (button.dataset.small === "down") state.amount -= 500;
    if (button.dataset.small === "center") return sit();
    state.amount = Math.max(500, Math.min(10000, state.amount));
    save();
    apply();
    toast("AMOUNT " + state.amount.toLocaleString());
  }, true);
}

function perf() {
  const renderer = window.__SVR_RENDERER__;
  try {
    renderer?.setPixelRatio?.(Math.min(window.devicePixelRatio || 1, 1.15));
    if (renderer?.shadowMap) renderer.shadowMap.enabled = false;
  } catch {}
}

function qa() {
  return {
    build: BUILD,
    active,
    controls: purge(),
    root: !!document.getElementById("svr326Root"),
    state: { ...state },
    release: { forceUpdate: false, showUpdatePrompt: false }
  };
}

function scheduleApply() {
  clearTimeout(applyTimer);
  applyTimer = setTimeout(apply, 90);
}

function install() {
  if (!active || installed) return;
  installed = true;
  load();
  css();
  hooks();
  perf();
  window.SVR_ANDROID_ACTION = act;
  window.SVR_ANDROID_DEAL_HAND = () => act("deal");
  window.SVR_ANDROID_SIT_TO_TABLE = sit;
  window.SVR_ANDROID_TABLE_PLAYTEST_QA = qa;
  window.SVR_PHASE329 = {
    build: BUILD,
    active: true,
    siteTouched: false,
    helpers: ["SVR_ANDROID_ACTION", "SVR_ANDROID_DEAL_HAND", "SVR_ANDROID_TABLE_PLAYTEST_QA"]
  };
  observer = new MutationObserver(scheduleApply);
  observer.observe(document.body, { childList: true, subtree: true });
  clearInterval(monitorTimer);
  monitorTimer = setInterval(apply, 1000);
  setTimeout(() => { cards(); apply(); toast("ANDROID TABLE UX READY"); }, 700);
}

setTimeout(install, 260);
setTimeout(install, 1200);
setTimeout(install, 3200);
