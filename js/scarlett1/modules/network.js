// Networking stub — emits status to terminal. (No sockets yet)
export function initNetwork({ Bus }) {
  const state = { connected: false, peers: 1 };
  window.networkStatus = () => ({ ...state });

  window.connectNetwork = () => {
    state.connected = true;
    Bus.log('NETWORK: CONNECTED (stub)');
    Bus.emit('networkConnected', state);
  };

  Bus.log('NETWORK MODULE READY (stub)');
}
