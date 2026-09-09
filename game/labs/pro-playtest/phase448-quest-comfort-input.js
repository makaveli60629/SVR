export const PHASE448_BUILD = 'PHASE-448-QUEST-COMFORT-INPUT-LAB';
export const FRAME_BUDGET_MS = Object.freeze({hz72: 13.89, hz90: 11.11});
export const TABLE_TELEPORT_ENABLED = false;

const VALID_SOURCES = new Set(['left-hand','right-hand','left-controller','right-controller']);
const VALID_ACTIONS = new Set(['hover','select','confirm','cancel','grip']);

export function normalizeQuestIntent(input) {
  const intent = {
    source: String(input?.source || ''),
    action: String(input?.action || '').toLowerCase(),
    targetId: String(input?.targetId || ''),
    at: Number(input?.at),
    pressure: Math.max(0, Math.min(1, Number(input?.pressure || 0)))
  };
  if (!VALID_SOURCES.has(intent.source)) throw new Error('invalid-source');
  if (!VALID_ACTIONS.has(intent.action)) throw new Error('invalid-action');
  if (!intent.targetId || intent.targetId.length > 128) throw new Error('invalid-target');
  if (!Number.isFinite(intent.at) || intent.at <= 0) throw new Error('invalid-time');
  return Object.freeze(intent);
}

export function createIntentGate({debounceMs=180, holdConfirmMs=320}={}) {
  let lastKey = '', lastAt = -Infinity;
  return Object.freeze({
    accept(intent) {
      const normalized = normalizeQuestIntent(intent);
      const key = normalized.source + ':' + normalized.action + ':' + normalized.targetId;
      if (key === lastKey && normalized.at - lastAt < debounceMs) return Object.freeze({accepted:false,reason:'debounced'});
      lastKey = key; lastAt = normalized.at;
      if (normalized.action === 'confirm' && normalized.pressure < 0.55) return Object.freeze({accepted:false,reason:'confirm-pressure'});
      return Object.freeze({accepted:true,intent:normalized,holdConfirmMs});
    }
  });
}

export function createFrameMonitor({windowSize=180,targetHz=72}={}) {
  const samples=[];
  const budget = targetHz >= 90 ? FRAME_BUDGET_MS.hz90 : FRAME_BUDGET_MS.hz72;
  return Object.freeze({
    sample(frameMs) {
      if (!Number.isFinite(frameMs) || frameMs <= 0 || frameMs > 1000) return;
      samples.push(frameMs); if (samples.length > windowSize) samples.shift();
    },
    snapshot() {
      if (!samples.length) return Object.freeze({samples:0,averageMs:0,p95Ms:0,budgetMs:budget,withinBudget:false});
      const sorted=[...samples].sort((a,b)=>a-b);
      const averageMs=samples.reduce((a,b)=>a+b,0)/samples.length;
      const p95Ms=sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*.95)-1)];
      return Object.freeze({samples:samples.length,averageMs:+averageMs.toFixed(2),p95Ms:+p95Ms.toFixed(2),budgetMs:budget,withinBudget:p95Ms<=budget});
    }
  });
}

export function evaluateSeatedComfort({eyeHeight,seatDrift,faceObstructionDistance,teleportEnabled}) {
  const failures=[];
  if (!(eyeHeight >= 1.35 && eyeHeight <= 1.75)) failures.push('eye-height');
  if (!(seatDrift >= 0 && seatDrift <= 0.08)) failures.push('seat-drift');
  if (Number.isFinite(faceObstructionDistance) && faceObstructionDistance < 0.45) failures.push('face-obstruction');
  if (teleportEnabled !== false) failures.push('teleport-enabled');
  return Object.freeze({pass:failures.length===0,failures,teleportLocked:true});
}

export function installQuestComfortLab({renderer,camera,onSnapshot}={}) {
  if (!renderer || typeof renderer.setAnimationLoop !== 'function') throw new Error('renderer-required');
  const monitor=createFrameMonitor({targetHz:72});
  let previous=0, running=true;
  const originalLoop=renderer.getAnimationLoop?.() || null;
  renderer.setAnimationLoop((time,frame)=>{
    if (previous) monitor.sample(time-previous); previous=time;
    originalLoop?.(time,frame);
  });
  const timer=setInterval(()=>onSnapshot?.(monitor.snapshot()),2000);
  return Object.freeze({
    build:PHASE448_BUILD,
    cameraPresent:Boolean(camera),
    teleportEnabled:TABLE_TELEPORT_ENABLED,
    snapshot:()=>monitor.snapshot(),
    stop(){if(!running)return;running=false;clearInterval(timer);renderer.setAnimationLoop(originalLoop);}
  });
}
