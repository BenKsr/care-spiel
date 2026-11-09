'use strict';

const path = require('path');
const http = require('http');
const crypto = require('crypto');
const express = require('express');
const { Server } = require('socket.io');
const G = require('./game');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.get('/leitung', (req, res) => res.sendFile(path.join(__dirname, 'public', 'leitung.html')));
app.get('/health', (req, res) => res.send('ok'));

const games = new Map();
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

function newCode() {
  let code;
  do {
    code = Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  } while (games.has(code));
  return code;
}

const norm = (c) => String(c || '').trim().toUpperCase();

function push(g) {
  io.to(`host:${g.code}`).emit('host:state', G.hostView(g));
  g.order.forEach((id) => io.to(`p:${g.code}:${id}`).emit('player:state', G.playerView(g, id)));
}

function isHost(g, key) {
  return g && key && g.hostKey === key;
}

// Alte Spiele nach 12 Stunden aufräumen
setInterval(() => {
  const cutoff = Date.now() - 12 * 3600 * 1000;
  for (const [code, g] of games) if (g.createdAt < cutoff) games.delete(code);
}, 3600 * 1000);

io.on('connection', (socket) => {
  let bound = null; // { code, playerId }

  socket.on('host:create', (_, cb) => {
    const code = newCode();
    const key = crypto.randomBytes(12).toString('hex');
    const g = G.createGame(code, key);
    games.set(code, g);
    socket.join(`host:${code}`);
    cb && cb({ ok: true, code, key });
    push(g);
  });

  socket.on('host:resume', ({ code, key } = {}, cb) => {
    const g = games.get(norm(code));
    if (!isHost(g, key)) return cb && cb({ ok: false });
    socket.join(`host:${g.code}`);
    cb && cb({ ok: true });
    push(g);
  });

  socket.on('host:action', ({ code, key, action, value } = {}, cb) => {
    const g = games.get(norm(code));
    if (!isHost(g, key)) return cb && cb({ ok: false, error: 'Keine Berechtigung.' });
    try {
      switch (action) {
        case 'start':
          if (g.phase !== 'lobby') break;
          if (!g.order.length) return cb && cb({ ok: false, error: 'Noch niemand ist beigetreten.' });
          G.startGame(g);
          break;
        case 'prolog':
          if (g.phase === 'prolog') g.prologStep = Math.max(0, Math.min(G.PROLOG.length - 1, Number(value) || 0));
          break;
        case 'rounds':
          if (g.phase === 'prolog') G.startRounds(g);
          break;
        case 'begin':
          if (g.phase === 'intro') G.beginPlay(g, Number(value) || 0);
          break;
        case 'resolve':
          if (g.phase === 'play') G.resolveRound(g);
          break;
        case 'next':
          if (g.phase === 'result') G.nextRound(g);
          break;
        case 'finalStep':
          if (g.phase === 'final') g.finalStep = Math.max(0, Math.min(4, Number(value) || 0));
          break;
        case 'timer':
          if (g.phase === 'play') g.timerEnd = value ? Date.now() + Number(value) * 1000 : null;
          break;
        case 'kick':
          G.removePlayer(g, String(value));
          break;
        case 'end':
          games.delete(g.code);
          io.to(`host:${g.code}`).emit('host:ended');
          g.order.forEach((id) => io.to(`p:${g.code}:${id}`).emit('player:state', { phase: 'gone' }));
          return cb && cb({ ok: true });
        default:
          return cb && cb({ ok: false, error: 'Unbekannte Aktion.' });
      }
      cb && cb({ ok: true });
      push(g);
    } catch (e) {
      console.error(e);
      cb && cb({ ok: false, error: 'Interner Fehler.' });
    }
  });

  socket.on('player:join', ({ code, name, playerId } = {}, cb) => {
    const g = games.get(norm(code));
    if (!g) return cb && cb({ ok: false, error: 'Diesen Spielcode gibt es nicht. Bitte prüfe die vier Buchstaben.' });
    let id = playerId && g.players[playerId] ? playerId : null;
    if (!id) {
      const clean = String(name || '').trim();
      if (!clean) return cb && cb({ ok: false, error: 'Bitte gib einen Namen ein.' });
      if (g.order.length >= 40) return cb && cb({ ok: false, error: 'Das Spiel ist voll.' });
      id = crypto.randomBytes(8).toString('hex');
      G.addPlayer(g, id, clean);
    }
    g.players[id].connected = true;
    bound = { code: g.code, playerId: id };
    socket.join(`p:${g.code}:${id}`);
    cb && cb({ ok: true, playerId: id, code: g.code });
    push(g);
  });

  socket.on('player:draft', ({ alloc, strike, vote } = {}) => {
    if (!bound) return;
    const g = games.get(bound.code);
    const p = g && g.players[bound.playerId];
    if (!p || g.phase !== 'play') return;
    const role = G.roleFor(g, p);
    if (alloc) p.draft = G.sanitize(alloc, role, G.budgetFor(g, p));
    if (typeof strike === 'boolean') p.strike = strike;
    if (vote === true || vote === false || vote === null) p.vote = vote;
  });

  socket.on('player:choice', ({ choice } = {}, cb) => {
    if (!bound) return cb && cb({ ok: false });
    const g = games.get(bound.code);
    const p = g && g.players[bound.playerId];
    if (!p || !G.setChoice(g, p, choice)) return cb && cb({ ok: false, error: 'Die Entscheidung ist nicht mehr möglich.' });
    cb && cb({ ok: true });
    push(g);
  });

  socket.on('player:submit', ({ alloc, strike, vote, submitted } = {}, cb) => {
    if (!bound) return cb && cb({ ok: false });
    const g = games.get(bound.code);
    const p = g && g.players[bound.playerId];
    if (!p || g.phase !== 'play') return cb && cb({ ok: false, error: 'Die Runde ist schon geschlossen.' });
    const role = G.roleFor(g, p);
    if (alloc) p.draft = G.sanitize(alloc, role, G.budgetFor(g, p));
    if (typeof strike === 'boolean') p.strike = strike;
    if (vote === true || vote === false || vote === null) p.vote = vote;
    if (submitted !== false && role.dilemma && p.choice === null) return cb && cb({ ok: false, error: 'Bitte triff zuerst deine Entscheidung.' });
    p.submitted = submitted !== false;
    cb && cb({ ok: true });
    push(g);
  });

  socket.on('disconnect', () => {
    if (!bound) return;
    const g = games.get(bound.code);
    const p = g && g.players[bound.playerId];
    if (p) { p.connected = false; push(g); }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Die unsichtbare Uhr läuft auf http://localhost:${PORT}`);
  console.log(`Spielleitung: http://localhost:${PORT}/leitung`);
});
