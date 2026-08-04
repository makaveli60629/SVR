const LABEL = "UPDATE-3.0-PHASE-177-HAND-HISTORY-PUBLIC-FILTER-LOCK";

const samplePrivateHand = {
  eventId: "demo-event-001",
  tableId: "lobby-final-table",
  handId: "demo-hand-001",
  startedAt: "2026-06-14T02:45:00Z",
  blinds: { small: 100, big: 200 },
  players: [
    { seat: 1, playerId: "seat-1", name: "Seat 1", stackStart: 50000, privateCards: ["Ah", "Qh"] },
    { seat: 2, playerId: "seat-2", name: "Seat 2", stackStart: 50000, privateCards: ["9c", "9d"] },
    { seat: 3, playerId: "seat-3", name: "Seat 3", stackStart: 50000, privateCards: ["Ks", "Kh"] },
    { seat: 4, playerId: "seat-4", name: "Seat 4", stackStart: 50000, privateCards: ["7s", "6s"] },
    { seat: 5, playerId: "seat-5", name: "Seat 5", stackStart: 50000, privateCards: ["Ad", "2d"] },
    { seat: 6, playerId: "seat-6", name: "Seat 6", stackStart: 50000, privateCards: ["Jc", "Tc"] }
  ],
  board: ["As", "8d", "3c", "Jh", "2s"],
  actions: [
    { seq: 1, street: "preflop", seat: 1, type: "smallBlind", amount: 100, potAfter: 100 },
    { seq: 2, street: "preflop", seat: 2, type: "bigBlind", amount: 200, potAfter: 300 },
    { seq: 3, street: "preflop", seat: 3, type: "raise", amount: 700, potAfter: 900 },
    { seq: 4, street: "preflop", seat: 1, type: "call", amount: 600, potAfter: 1500 },
    { seq: 5, street: "preflop", seat: 2, type: "fold", amount: 0, potAfter: 1500 },
    { seq: 6, street: "flop", seat: 3, type: "bet", amount: 1000, potAfter: 2500 },
    { seq: 7, street: "flop", seat: 1, type: "call", amount: 1000, potAfter: 3500 },
    { seq: 8, street: "turn", seat: 3, type: "check", amount: 0, potAfter: 3500 },
    { seq: 9, street: "turn", seat: 1, type: "check", amount: 0, potAfter: 3500 },
    { seq: 10, street: "river", seat: 3, type: "bet", amount: 1900, potAfter: 5400 },
    { seq: 11, street: "river", seat: 1, type: "fold", amount: 0, potAfter: 5400 }
  ],
  result: { winnerSeat: 3, pot: 5400, showdown: false }
};

function actionLabel(action){
  const seat = `Seat ${action.seat}`;
  if(action.type === "smallBlind") return `${seat} posts small blind ${action.amount}`;
  if(action.type === "bigBlind") return `${seat} posts big blind ${action.amount}`;
  if(action.amount) return `${seat} ${action.type}s ${action.amount}`;
  return `${seat} ${action.type}s`;
}
export function createPublicHandView(hand, { revealAfterComplete = false } = {}){
  const complete = !!hand?.result;
  return {
    schemaVersion: "svr-public-hand-v1",
    eventId: hand.eventId,
    tableId: hand.tableId,
    handId: hand.handId,
    startedAt: hand.startedAt,
    blinds: hand.blinds,
    players: (hand.players || []).map(p=>({ seat:p.seat, playerId:p.playerId, name:p.name, stackStart:p.stackStart })),
    board: hand.board || [],
    actions: (hand.actions || []).map(a=>({ seq:a.seq, street:a.street, seat:a.seat, type:a.type, amount:a.amount, potAfter:a.potAfter, label:actionLabel(a) })),
    result: hand.result || null,
    privateCards: revealAfterComplete && complete && hand.result?.showdown ? (hand.players || []).map(p=>({ seat:p.seat, cards:p.privateCards })) : "hidden",
    feedPolicy: "private cards are hidden during active play"
  };
}
export function createAdminHandView(hand){
  return { schemaVersion:"svr-admin-hand-v1", ...hand, feedPolicy:"admin review includes private fields" };
}
export function installPhase177HandHistoryPublicFilter(){
  const publicView = createPublicHandView(samplePrivateHand);
  const adminView = createAdminHandView(samplePrivateHand);
  window.SVR_PHASE177_HAND_HISTORY = {
    label: LABEL,
    locked: true,
    publicView,
    adminView,
    tables: ["events", "tables", "hands", "hand_players", "hand_actions", "public_replay_frames", "media_queue"],
    checkedAt: new Date().toISOString()
  };
  console.log("[Phase177] hand history public filter locked");
  return window.SVR_PHASE177_HAND_HISTORY;
}
