export function createAudioPlaylist({ tracks = [], onState = ()=>{} } = {}){
  const state = {
    enabled: false,
    primed: false,
    trackIndex: 0,
    trackTitle: "Music Disabled",
    trackCount: 0,
    error: "Lobby music disabled"
  };

  function emit(){
    onState({ ...state });
  }

  async function toggle(){
    state.enabled = false;
    state.primed = false;
    state.error = "Lobby music disabled";
    emit();
    return false;
  }

  async function next(){
    state.enabled = false;
    state.primed = false;
    state.error = "Lobby music disabled";
    emit();
    return false;
  }

  async function start(){
    state.enabled = false;
    state.primed = false;
    state.error = "Lobby music disabled";
    emit();
    return false;
  }

  async function prime(){
    state.enabled = false;
    state.primed = false;
    state.error = "Lobby music disabled";
    emit();
    return false;
  }

  function stop(){
    state.enabled = false;
    state.primed = false;
    state.error = "Lobby music disabled";
    emit();
  }

  emit();
  return { toggle, next, start, stop, getState: ()=>({ ...state }), prime };
}
