/**
 * SVR Poker — vrSocketBridge.js
 * Connects the VR/browser game client to the SVR Poker Socket.IO server.
 * Emits and receives all multiplayer table events.
 */

import { io } from 'https://cdn.socket.io/4.7.2/socket.io.esm.min.js';

let socket = null;

/**
 * Connect to the SVR Poker server.
 * @param {string} serverURL  - e.g. 'http://localhost:8080'
 * @param {string} playerId   - Unique player identifier
 * @param {string} playerName - Display name
 */
export function connect(serverURL, playerId, playerName = 'Player') {
  socket = io(serverURL, { transports: ['websocket', 'polling'] });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
    socket.emit('registerPlayer', { playerId, name: playerName });
  });

  socket.on('disconnect', () => console.warn('[Socket] Disconnected'));

  socket.on('tableUpdate', (table) => {
    console.log('[Socket] Table update', table.stage, '— pot:', table.pot);
    if (typeof window.onTableUpdate === 'function') window.onTableUpdate(table);
  });

  socket.on('roundStarted', (table) => {
    console.log('[Socket] Round started');
    if (typeof window.onTableUpdate === 'function') window.onTableUpdate(table);
  });

  socket.on('roundOver', (data) => {
    console.log('[Socket] Round over', data.winners);
    if (typeof window.onRoundOver === 'function') window.onRoundOver(data);
  });

  socket.on('stageChanged', (data) => {
    console.log('[Socket] Stage:', data.stage, data.community.join(' '));
    if (typeof window.onStageChanged === 'function') window.onStageChanged(data);
  });

  socket.on('actionRequired', (data) => {
    console.log('[Socket] Action required for', data.playerId);
    if (typeof window.onActionRequired === 'function') window.onActionRequired(data);
  });

  socket.on('error', (data) => console.error('[Socket] Error:', data.message));

  return socket;
}

export function joinTable(tableId, playerId, chips = 1000) {
  if (!socket) throw new Error('Not connected');
  socket.emit('joinTable', { tableId, playerId, chips });
}

export function sendAction(tableId, playerId, type, amount = 0) {
  if (!socket) throw new Error('Not connected');
  socket.emit('action', { tableId, playerId, type, amount });
}

export function startRound(tableId) {
  if (!socket) throw new Error('Not connected');
  socket.emit('startRound', { tableId });
}

export function getState(tableId, playerId) {
  if (!socket) throw new Error('Not connected');
  socket.emit('getState', { tableId, playerId });
}

export function leaveTable(tableId, playerId) {
  if (!socket) throw new Error('Not connected');
  socket.emit('leaveTable', { tableId, playerId });
}

// Convenience wrappers
export const fold  = (tid, pid)        => sendAction(tid, pid, 'fold');
export const check = (tid, pid)        => sendAction(tid, pid, 'check');
export const call  = (tid, pid)        => sendAction(tid, pid, 'call');
export const raise = (tid, pid, amt)   => sendAction(tid, pid, 'raise', amt);
export const allIn = (tid, pid)        => sendAction(tid, pid, 'allin');
