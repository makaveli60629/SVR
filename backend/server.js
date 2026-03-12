/**
 * SVR Poker — Backend Server
 * Express + Socket.IO multiplayer poker server
 *
 * Run: node server.js
 * Env: copy .env.example → .env and fill in values
 */

require('dotenv').config();
const express   = require('express');
const http      = require('http');
const cors      = require('cors');
const { Server } = require('socket.io');
const path      = require('path');

// ── Engine (CommonJS-compatible wrapper) ────────────────────────────────────
// We inline a CJS version of the engine here so the server doesn't need ESM
const { PokerTableServer } = require('./pokerTableServer');

// ── App setup ───────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// Serve static game files from /game (relative to project root)
const GAME_DIR = path.join(__dirname, '..', 'game');
app.use('/game', express.static(GAME_DIR));
app.use('/', express.static(path.join(__dirname, '..')));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// ── Table registry ───────────────────────────────────────────────────────────
const tables = new Map();   // tableId → PokerTableServer instance
const playerSocket = new Map(); // playerId → socket.id

function getOrCreateTable(tableId) {
  if (!tables.has(tableId)) {
    const t = new PokerTableServer({
      tableId,
      maxSeats:   6,
      smallBlind: 10,
      bigBlind:   20,
    });
    // Pipe all game events to the table's room
    t.onEvent = (event, data) => {
      io.to(tableId).emit(event, data);
    };
    tables.set(tableId, t);
    console.log(`[SVR] Table created: ${tableId}`);
  }
  return tables.get(tableId);
}

// ── Socket.IO ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[SVR] Client connected: ${socket.id}`);

  // ── registerPlayer ───────────────────────────────────────────────────────
  socket.on('registerPlayer', ({ playerId, name }) => {
    playerSocket.set(playerId, socket.id);
    socket.playerId = playerId;
    socket.playerName = name || `Player_${playerId.slice(0, 5)}`;
    console.log(`[SVR] Registered: ${socket.playerName} (${playerId})`);
    socket.emit('registered', { playerId, name: socket.playerName });
  });

  // ── joinTable ────────────────────────────────────────────────────────────
  socket.on('joinTable', ({ tableId, playerId, chips }) => {
    const table = getOrCreateTable(tableId || 'main');
    socket.join(table.tableId);

    try {
      const state = table.addPlayer({
        id:    playerId || socket.playerId,
        name:  socket.playerName || `Guest_${socket.id.slice(0,4)}`,
        chips: chips || 1000,
      });
      socket.tableId = table.tableId;
      socket.emit('tableState', state);
      io.to(table.tableId).emit('tableUpdate', table.toPublicState());
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  // ── action (fold / check / call / raise / allin) ─────────────────────────
  socket.on('action', ({ tableId, playerId, type, amount }) => {
    const table = tables.get(tableId || socket.tableId);
    if (!table) { socket.emit('error', { message: 'Table not found' }); return; }

    const result = table.action(playerId || socket.playerId, type, amount || 0);
    if (result && result.error) {
      socket.emit('error', { message: result.error });
    } else {
      io.to(table.tableId).emit('tableUpdate', table.toPublicState());
    }
  });

  // ── Convenience aliases kept for legacy client compatibility ─────────────
  socket.on('raise',     d => socket.emit('action', { ...d, type: 'raise' }));
  socket.on('fold',      d => socket.emit('action', { ...d, type: 'fold'  }));
  socket.on('check',     d => socket.emit('action', { ...d, type: 'check' }));
  socket.on('call',      d => socket.emit('action', { ...d, type: 'call'  }));

  // ── startRound (manual override) ─────────────────────────────────────────
  socket.on('startRound', ({ tableId }) => {
    const table = tables.get(tableId || socket.tableId);
    if (!table) { socket.emit('error', { message: 'Table not found' }); return; }
    table.startRound();
    io.to(table.tableId).emit('tableUpdate', table.toPublicState());
  });

  // ── nextStage (admin/debug override) ─────────────────────────────────────
  socket.on('nextStage', ({ tableId }) => {
    const table = tables.get(tableId || socket.tableId);
    if (!table) { socket.emit('error', { message: 'Table not found' }); return; }
    table._nextStage();
    io.to(table.tableId).emit('tableUpdate', table.toPublicState());
  });

  // ── getState ──────────────────────────────────────────────────────────────
  socket.on('getState', ({ tableId, playerId }) => {
    const table = tables.get(tableId || socket.tableId);
    if (!table) { socket.emit('error', { message: 'Table not found' }); return; }
    socket.emit('tableState', table.toPublicState(playerId || socket.playerId));
  });

  // ── leaveTable ────────────────────────────────────────────────────────────
  socket.on('leaveTable', ({ tableId, playerId }) => {
    const table = tables.get(tableId || socket.tableId);
    if (table) {
      table.removePlayer(playerId || socket.playerId);
      socket.leave(table.tableId);
      io.to(table.tableId).emit('tableUpdate', table.toPublicState());
    }
  });

  // ── disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[SVR] Disconnected: ${socket.id}`);
    if (socket.playerId) playerSocket.delete(socket.playerId);
    if (socket.tableId) {
      const table = tables.get(socket.tableId);
      if (table) {
        table.removePlayer(socket.playerId);
        io.to(socket.tableId).emit('tableUpdate', table.toPublicState());
      }
    }
  });
});

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`[SVR] Server running on http://localhost:${PORT}`);
  console.log(`[SVR] Game served at  http://localhost:${PORT}/game`);
});
