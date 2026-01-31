// Simple card system: creates visible card planes + deals from a shuffled deck.

const SUITS = ["♠","♥","♦","♣"];
const RANKS = ["A","K","Q","J","10","9","8","7","6","5","4","3","2"];

function makeDeck() {
  const deck = [];
  for (const s of SUITS) for (const r of RANKS) deck.push({ r, s });
  return deck;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

AFRAME.registerComponent("scarlett-card-dealer", {
  schema: {
    players: { default: 6 }, // 5 bots + you
  },
  init() {
    this.deck = shuffle(makeDeck());
    this.hands = Array.from({ length: this.data.players }, () => []);
  },

  dealHoleCards(targetRootEl) {
    // 2 cards each
    for (let c = 0; c < 2; c++) {
      for (let p = 0; p < this.data.players; p++) {
        const card = this.deck.pop();
        this.hands[p].push(card);
      }
    }
    // Render cards
    renderHands(targetRootEl, this.hands);
    if (window.hudLog) hudLog("Dealt hole cards ✅ (2 each)");
  }
});

function renderHands(root, hands) {
  // remove old cards
  const old = root.querySelectorAll(".card");
  old.forEach((n) => n.remove());

  // Layout: 6 “seat piles” around table center, slightly above felt
  const seatPiles = [
    { x: 0.0, z: 3.1, r: 180 }, // seat 0 = YOU (front)
    { x: 0.0, z: -3.1, r: 0 },
    { x: -2.6, z: 1.1, r: 90 },
    { x: -2.6, z: -1.1, r: 90 },
    { x: 2.6, z: 1.1, r: -90 },
    { x: 2.6, z: -1.1, r: -90 },
  ];

  hands.forEach((h, i) => {
    const pile = seatPiles[i] || seatPiles[0];

    const card1 = makeCardPlane(h[0], pile, 0);
    const card2 = makeCardPlane(h[1], pile, 1);

    root.appendChild(card1);
    root.appendChild(card2);
  });
}

function makeCardPlane(card, pile, offsetIdx) {
  const p = document.createElement("a-plane");
  p.classList.add("card");
  p.setAttribute("width", "0.28");
  p.setAttribute("height", "0.40");
  p.setAttribute("rotation", "-90 0 0");
  p.setAttribute("position", `${pile.x + (offsetIdx * 0.16)} 1.345 ${pile.z + (offsetIdx * 0.04)}`);
  p.setAttribute("material", "color:#f3f6ff; roughness:0.9; metalness:0.0; opacity:0.98; transparent:true");
  p.setAttribute("rotation", `-90 ${pile.r} 0`);

  const t = document.createElement("a-text");
  t.setAttribute("value", `${card.r}${card.s}`);
  t.setAttribute("align", "center");
  t.setAttribute("color", (card.s === "♥" || card.s === "♦") ? "#d11" : "#111");
  t.setAttribute("width", "2");
  t.setAttribute("position", "0 0 0.01");
  t.setAttribute("rotation", "0 0 0");
  p.appendChild(t);

  return p;
}
