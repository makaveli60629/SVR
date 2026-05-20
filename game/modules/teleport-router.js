import * as THREE from "three";

export const SVR_ROUTE_KEYS = Object.freeze({
  LOBBY: "lobby",
  MAIN_POKER_PIT: "main_poker_pit",
  SEAT_SOUTH_PLAYER: "seat_south_player",
  SCORPION_ROOM: "scorpion_room",
  PGA_HUB: "pga_hub",
  PGA_DRIVE: "pga_drive",
  PGA_CHIP_PUTT: "pga_chip_putt",
  REIKI_HUB: "reiki_hub",
  REIKI_ROOM: "reiki_room",
  SMOKER_LOUNGE: "smoker_lounge",
  VR_STORE: "vr_store",
  SPONSOR_WALL: "sponsor_wall"
});

export const SVR_ROUTE_ALIASES = Object.freeze({
  table: SVR_ROUTE_KEYS.MAIN_POKER_PIT,
  poker: SVR_ROUTE_KEYS.MAIN_POKER_PIT,
  mainPokerPit: SVR_ROUTE_KEYS.MAIN_POKER_PIT,
  main_poker: SVR_ROUTE_KEYS.MAIN_POKER_PIT,
  seat: SVR_ROUTE_KEYS.SEAT_SOUTH_PLAYER,
  playerSeat: SVR_ROUTE_KEYS.SEAT_SOUTH_PLAYER,
  southSeat: SVR_ROUTE_KEYS.SEAT_SOUTH_PLAYER,
  reiki: SVR_ROUTE_KEYS.REIKI_HUB,
  reikiHub: SVR_ROUTE_KEYS.REIKI_HUB,
  reikiRoom: SVR_ROUTE_KEYS.REIKI_ROOM,
  reikiEscape: SVR_ROUTE_KEYS.REIKI_ROOM,
  pga: SVR_ROUTE_KEYS.PGA_HUB,
  pgaHub: SVR_ROUTE_KEYS.PGA_HUB,
  pgaWall: SVR_ROUTE_KEYS.PGA_HUB,
  pgaDrive: SVR_ROUTE_KEYS.PGA_DRIVE,
  drive: SVR_ROUTE_KEYS.PGA_DRIVE,
  chipPutt: SVR_ROUTE_KEYS.PGA_CHIP_PUTT,
  pgaChipPutt: SVR_ROUTE_KEYS.PGA_CHIP_PUTT,
  chip_putt: SVR_ROUTE_KEYS.PGA_CHIP_PUTT,
  scorpion: SVR_ROUTE_KEYS.SCORPION_ROOM,
  scorpionRoom: SVR_ROUTE_KEYS.SCORPION_ROOM,
  smokerLounge: SVR_ROUTE_KEYS.SMOKER_LOUNGE,
  lounge: SVR_ROUTE_KEYS.SMOKER_LOUNGE,
  storeRoom: SVR_ROUTE_KEYS.VR_STORE,
  store: SVR_ROUTE_KEYS.VR_STORE,
  vrStore: SVR_ROUTE_KEYS.VR_STORE,
  sponsor: SVR_ROUTE_KEYS.SPONSOR_WALL,
  sponsorWall: SVR_ROUTE_KEYS.SPONSOR_WALL,
  legends: SVR_ROUTE_KEYS.SPONSOR_WALL,
  legend: SVR_ROUTE_KEYS.SPONSOR_WALL
});

function cloneVector(v){
  if (!v) return null;
  if (v.isVector3) return v.clone();
  if (typeof v.x === "number" && typeof v.z === "number") return new THREE.Vector3(v.x, typeof v.y === "number" ? v.y : 0, v.z);
  return null;
}

function cloneTarget(rec){
  if (!rec) return null;
  return {
    ...rec,
    pos: cloneVector(rec.pos),
    look: cloneVector(rec.look),
    routeKey: rec.routeKey || rec.key || null
  };
}

function makeRecord(key, label, type, rec, fallback = null, extra = {}){
  const src = cloneTarget(rec) || cloneTarget(fallback) || {};
  return {
    key,
    label,
    type,
    pos: src.pos || new THREE.Vector3(0, 0, 4.8),
    look: src.look || new THREE.Vector3(0, 1.35, 0),
    scenePath: extra.scenePath || src.scenePath || null,
    returnRoute: extra.returnRoute || src.returnRoute || SVR_ROUTE_KEYS.LOBBY,
    privateScene: !!extra.privateScene,
    spawnNote: extra.spawnNote || "",
    sourceKey: src.sourceKey || src.routeKey || src.key || null
  };
}

export function normalizeRouteKey(key){
  if (!key) return SVR_ROUTE_KEYS.LOBBY;
  return SVR_ROUTE_ALIASES[key] || key;
}

export function buildTeleportRouteRegistry(sceneTargets = {}, seats = [], tableCenter = new THREE.Vector3(0,0,0)){
  const src = sceneTargets || {};
  const tableLook = tableCenter?.clone ? tableCenter.clone().setY(1.35) : new THREE.Vector3(0, 1.35, 0);
  const fallbackLobby = src.lobby || { pos: new THREE.Vector3(0, 0, 4.8), look: tableLook };
  const fallbackTable = src.table || src.main_poker_pit || { pos: new THREE.Vector3(0, 0, 2.25), look: tableLook };
  const playerSeat = seats.find?.(s => /south|front|player|open/i.test(String(s.label || ""))) || seats[3] || seats[0];
  const seatRec = src.seat || (playerSeat ? { pos: new THREE.Vector3(playerSeat.x, 0, playerSeat.z), look: tableLook } : fallbackTable);

  const registry = {
    [SVR_ROUTE_KEYS.LOBBY]: makeRecord(SVR_ROUTE_KEYS.LOBBY, "Lobby", "lobby_anchor", src.lobby, fallbackLobby, { returnRoute: SVR_ROUTE_KEYS.LOBBY }),
    [SVR_ROUTE_KEYS.MAIN_POKER_PIT]: makeRecord(SVR_ROUTE_KEYS.MAIN_POKER_PIT, "Main Poker Pit", "lobby_anchor", src.main_poker_pit || src.table, fallbackTable),
    [SVR_ROUTE_KEYS.SEAT_SOUTH_PLAYER]: makeRecord(SVR_ROUTE_KEYS.SEAT_SOUTH_PLAYER, "South Player Seat", "seat", src.seat_south_player || src.seat, seatRec, { spawnNote: "Open south/front player seat" }),
    [SVR_ROUTE_KEYS.REIKI_HUB]: makeRecord(SVR_ROUTE_KEYS.REIKI_HUB, "Reiki Hub", "lobby_portal", src.reiki_hub || src.reiki, fallbackLobby),
    [SVR_ROUTE_KEYS.PGA_HUB]: makeRecord(SVR_ROUTE_KEYS.PGA_HUB, "PGA Hub", "lobby_portal", src.pga_hub || src.pga || src.pgaWall, fallbackLobby),
    [SVR_ROUTE_KEYS.SPONSOR_WALL]: makeRecord(SVR_ROUTE_KEYS.SPONSOR_WALL, "Sponsor Wall", "lobby_portal", src.sponsor_wall || src.sponsor || src.legends, fallbackLobby),
    [SVR_ROUTE_KEYS.PGA_DRIVE]: makeRecord(SVR_ROUTE_KEYS.PGA_DRIVE, "PGA Driving Range", "private_scene", src.pga_drive || src.pgaDrive, src.pga_hub || src.pga || fallbackLobby, { scenePath: "game/pga-drive.html", privateScene: true, spawnNote: "Spawn on stance mat facing ball" }),
    [SVR_ROUTE_KEYS.PGA_CHIP_PUTT]: makeRecord(SVR_ROUTE_KEYS.PGA_CHIP_PUTT, "PGA Chip/Putt", "private_scene", src.pga_chip_putt || src.chipPutt, src.pga_drive || src.pgaDrive || fallbackLobby, { scenePath: "game/chip-putt.html", privateScene: true }),
    [SVR_ROUTE_KEYS.REIKI_ROOM]: makeRecord(SVR_ROUTE_KEYS.REIKI_ROOM, "Reiki Room", "private_scene", src.reiki_room || src.reikiRoom, src.reiki_hub || src.reiki || fallbackLobby, { scenePath: "game/reiki.html", privateScene: true }),
    [SVR_ROUTE_KEYS.SMOKER_LOUNGE]: makeRecord(SVR_ROUTE_KEYS.SMOKER_LOUNGE, "Smoker Lounge", "private_scene", src.smoker_lounge || src.smokerLounge, src.sponsor || fallbackLobby, { scenePath: "game/smoker-lounge.html", privateScene: true }),
    [SVR_ROUTE_KEYS.VR_STORE]: makeRecord(SVR_ROUTE_KEYS.VR_STORE, "VR Store", "private_scene", src.vr_store || src.storeRoom, src.sponsor || fallbackLobby, { scenePath: "game/store-room.html", privateScene: true }),
    [SVR_ROUTE_KEYS.SCORPION_ROOM]: makeRecord(SVR_ROUTE_KEYS.SCORPION_ROOM, "Scorpion Room", "private_scene", src.scorpion_room || src.scorpion, src.sponsor || fallbackLobby, { scenePath: "game/scorpion.html", privateScene: true })
  };

  const legacy = { ...src };
  for (const [legacyKey, routeKey] of Object.entries(SVR_ROUTE_ALIASES)){
    if (!legacy[legacyKey] && registry[routeKey]) legacy[legacyKey] = registry[routeKey];
  }

  const state = {
    phase: "PHASE-156-TELEPORT-ROUTER-REGISTRY",
    keys: Object.keys(registry),
    aliases: { ...SVR_ROUTE_ALIASES },
    privateRoutes: Object.values(registry).filter(r => r.privateScene).map(r => r.key),
    rule: "Routes use player pose/XR reference-space systems. Do not move WebXR camera directly."
  };
  window.SVR_TELEPORT_ROUTE_REGISTRY = state;

  return {
    registry,
    legacySceneTargets: legacy,
    getRoute(key){ return registry[normalizeRouteKey(key)] || null; },
    listRoutes(){ return Object.values(registry); },
    normalizeRouteKey
  };
}
