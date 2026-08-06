/* PHASE-386-PLANET-PRESERVATION-GUARD */
export const BUILD = 'PHASE-386-PLANET-PRESERVATION-GUARD';

const state = {
  build: BUILD,
  installed: false,
  sweeps: 0,
  authoritativeMoonVisible: false,
  oldMoonsHidden: 0,
  planetGroupsRenamed: 0,
  earthPreserved: false,
  marsPreserved: false,
  checkedAt: null
};

let frameHandle = 0;

function preserveGroup(value) {
  if (!value?.group) return;
  value.group.visible = true;
  const currentName = String(value.group.name || '');
  if (/moon/i.test(currentName)) {
    value.group.userData = {
      ...(value.group.userData || {}),
      svrPhase386OriginalPlanetGroupName: value.group.userData?.svrPhase386OriginalPlanetGroupName || currentName,
      svrPhase386EarthMarsPreserved: true
    };
    value.group.name = currentName.replace(/moon/ig, 'LUNAR-SLOT').replace(/\s+/g, ' ').trim();
    state.planetGroupsRenamed += 1;
  }
}

function preservePlanets() {
  const scene = window.__SVR_SCENE__;
  if (!scene) return false;
  const authoritativeMoon = window.SVR_PHASE386_MOON_AUTHORITY || scene.getObjectByName?.('PHASE386_AUTHORITATIVE_TEXTURED_MOON');
  if (authoritativeMoon) {
    authoritativeMoon.visible = true;
    state.authoritativeMoonVisible = true;
  }
  const planetStates = [
    scene.userData?._phase141ShowcasePlanets,
    scene.userData?._phase140Planets,
    scene.userData?._phase137StablePlanets,
    scene.userData?._phase136Solar,
    scene.userData?._phase154Planets
  ].filter(Boolean);
  let hidden = 0;
  for (const value of planetStates) {
    preserveGroup(value);
    if (value.earth) {
      value.earth.visible = true;
      state.earthPreserved = true;
    }
    if (value.mars) {
      value.mars.visible = true;
      state.marsPreserved = true;
    }
    if (value.moon && value.moon !== authoritativeMoon) {
      value.moon.visible = false;
      value.moon.userData = { ...(value.moon.userData || {}), svrPhase386MoonDuplicateHidden: true };
      hidden += 1;
    }
  }
  state.oldMoonsHidden = Math.max(state.oldMoonsHidden, hidden);
  state.sweeps += 1;
  return true;
}

function tick() {
  preservePlanets();
  frameHandle = requestAnimationFrame(tick);
}

function qa() {
  state.checkedAt = new Date().toISOString();
  return { ...state, pass: state.authoritativeMoonVisible && state.marsPreserved };
}

state.installed = true;
preservePlanets();
frameHandle = requestAnimationFrame(tick);
window.addEventListener('beforeunload', () => cancelAnimationFrame(frameHandle), { once: true });
window.SVR_PHASE386_PRESERVE_PLANETS = preservePlanets;
window.SVR_PHASE386_PLANET_QA = qa;
window.SVR_PHASE386_PLANET_STATE = state;
