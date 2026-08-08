const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const QRCode = require('qrcode');
const { CATEGORIES, pickQuestions } = require('./questions');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Quiz tuning.
const QUESTIONS_PER_GAME = 5;
const POINTS_PER_CORRECT = 2;
const ANSWER_SECONDS = 30;
const REVEAL_SECONDS = 5; // how long the correct answer + running scores stay up
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;

// In-memory rooms. Fine for a party game; state is disposable.
// rooms: code -> {
//   code, hostId, state: 'lobby'|'playing'|'over',
//   players: [{id, name, score}],
//   game: { questions, qIndex, phase, endsAt, answers: Map<id,{choice,at}>, timer } | null
// }
const rooms = new Map();

// Unambiguous characters only (no O/0, I/1, etc.) so codes are easy to type.
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function makeCode() {
  let code;
  do {
    code = Array.from({ length: 4 }, () =>
      CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
    ).join('');
  } while (rooms.has(code));
  return code;
}

function baseUrl(socket) {
  const h = socket.handshake.headers;
  const proto = (h['x-forwarded-proto'] || '').split(',')[0] || 'http';
  const host = h['x-forwarded-host'] || h.host;
  return `${proto}://${host}`;
}

function lobbyState(room) {
  return {
    code: room.code,
    state: room.state,
    hostId: room.hostId,
    minPlayers: MIN_PLAYERS,
    maxPlayers: MAX_PLAYERS,
    categories: CATEGORIES,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isHost: p.id === room.hostId,
    })),
  };
}

function broadcastLobby(room) {
  io.to(room.code).emit('lobby', lobbyState(room));
}

function cleanName(name, fallback) {
  const n = (name || '').toString().trim().slice(0, 20);
  return n || fallback;
}

function scoreboard(room) {
  return [...room.players]
    .sort((a, b) => b.score - a.score)
    .map((p) => ({ id: p.id, name: p.name, score: p.score }));
}

// ---------- Quiz flow ----------

function startGame(room, cats) {
  room.state = 'playing';
  room.players.forEach((p) => (p.score = 0));
  const questions = pickQuestions(QUESTIONS_PER_GAME, cats);
  room.game = {
    questions,
    qIndex: -1,
    phase: 'question',
    endsAt: 0,
    answers: new Map(),
    timer: null,
  };
  io.to(room.code).emit('gameStarted', { total: questions.length });
  nextQuestion(room);
}

function nextQuestion(room) {
  const g = room.game;
  if (!g) return;
  g.qIndex += 1;

  if (g.qIndex >= g.questions.length) {
    return endGame(room);
  }

  g.phase = 'question';
  g.answers = new Map();
  g.endsAt = Date.now() + ANSWER_SECONDS * 1000;

  const q = g.questions[g.qIndex];
  io.to(room.code).emit('question', {
    index: g.qIndex,
    total: g.questions.length,
    question: q.q,
    options: q.options,
    seconds: ANSWER_SECONDS,
    endsAt: g.endsAt,
    pointsPerCorrect: POINTS_PER_CORRECT,
  });

  clearTimeout(g.timer);
  g.timer = setTimeout(() => revealAnswer(room), ANSWER_SECONDS * 1000);
}

function revealAnswer(room) {
  const g = room.game;
  if (!g || g.phase !== 'question') return;
  g.phase = 'reveal';
  clearTimeout(g.timer);

  const q = g.questions[g.qIndex];

  // Award points, and remember each player's result for personalised feedback.
  const results = {};
  room.players.forEach((p) => {
    const a = g.answers.get(p.id);
    const answered = !!a;
    const correct = answered && a.choice === q.correct;
    if (correct) p.score += POINTS_PER_CORRECT;
    results[p.id] = {
      answered,
      choice: answered ? a.choice : null,
      correct,
      gained: correct ? POINTS_PER_CORRECT : 0,
    };
  });

  io.to(room.code).emit('reveal', {
    index: g.qIndex,
    correct: q.correct,
    explanation: q.explanation || null,
    results, // keyed by playerId; client picks out its own
    scoreboard: scoreboard(room),
    seconds: REVEAL_SECONDS,
    isLast: g.qIndex >= g.questions.length - 1,
  });

  g.timer = setTimeout(() => nextQuestion(room), REVEAL_SECONDS * 1000);
}

// If everyone still connected has answered, don't make them wait out the clock.
function maybeRevealEarly(room) {
  const g = room.game;
  if (!g || g.phase !== 'question') return;
  const everyone = room.players.every((p) => g.answers.has(p.id));
  if (everyone) revealAnswer(room);
}

function endGame(room) {
  const g = room.game;
  if (g) clearTimeout(g.timer);
  room.state = 'over';
  const board = scoreboard(room);
  const top = board.length ? board[0].score : 0;
  const winners = board.filter((p) => p.score === top && top > 0).map((p) => p.id);
  io.to(room.code).emit('gameOver', {
    scoreboard: board,
    winnerIds: winners, // may be several on a tie; empty if nobody scored
    tie: winners.length > 1,
  });
  room.game = null;
}

// ---------- Sockets ----------

io.on('connection', (socket) => {
  socket.data.roomCode = null;

  socket.on('createRoom', async ({ name } = {}, cb) => {
    const code = makeCode();
    const room = { code, hostId: socket.id, players: [], state: 'lobby', game: null };
    rooms.set(code, room);
    room.players.push({ id: socket.id, name: cleanName(name, 'Host'), score: 0 });
    socket.join(code);
    socket.data.roomCode = code;

    const joinUrl = `${baseUrl(socket)}/?room=${code}`;
    let qr = null;
    try {
      qr = await QRCode.toDataURL(joinUrl, { margin: 1, width: 360 });
    } catch (_) {
      /* QR is a nicety; code still works without it */
    }

    if (cb) cb({ ok: true, playerId: socket.id, joinUrl, qr, ...lobbyState(room) });
    broadcastLobby(room);
  });

  socket.on('joinRoom', ({ code, name } = {}, cb) => {
    code = (code || '').toString().toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) return cb && cb({ ok: false, error: 'Room not found' });
    if (room.state !== 'lobby')
      return cb && cb({ ok: false, error: 'That game has already started' });
    if (room.players.length >= MAX_PLAYERS)
      return cb && cb({ ok: false, error: `Room is full (${MAX_PLAYERS} max)` });

    room.players.push({ id: socket.id, name: cleanName(name, 'Player'), score: 0 });
    socket.join(code);
    socket.data.roomCode = code;

    if (cb) cb({ ok: true, playerId: socket.id, ...lobbyState(room) });
    broadcastLobby(room);
  });

  socket.on('startGame', ({ categories } = {}, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return cb && cb({ ok: false, error: 'Room no longer exists' });
    if (socket.id !== room.hostId)
      return cb && cb({ ok: false, error: 'Only the host can start' });
    if (room.state !== 'lobby')
      return cb && cb({ ok: false, error: 'Game already started' });
    if (room.players.length < MIN_PLAYERS)
      return cb && cb({ ok: false, error: `Need at least ${MIN_PLAYERS} players` });

    const cats = Array.isArray(categories)
      ? categories.filter((c) => typeof c === 'string')
      : null;

    if (cb) cb({ ok: true });
    startGame(room, cats);
  });

  socket.on('answer', ({ index, choice } = {}, cb) => {
    const room = rooms.get(socket.data.roomCode);
    const g = room && room.game;
    if (!g || g.phase !== 'question') return cb && cb({ ok: false });
    if (index !== g.qIndex) return cb && cb({ ok: false }); // stale answer
    if (g.answers.has(socket.id)) return cb && cb({ ok: false }); // no changing
    if (typeof choice !== 'number' || choice < 0 || choice > 3)
      return cb && cb({ ok: false });

    g.answers.set(socket.id, { choice, at: Date.now() });
    if (cb) cb({ ok: true });
    // Let everyone see how many have locked in.
    io.to(room.code).emit('answerCount', {
      answered: g.answers.size,
      total: room.players.length,
    });
    maybeRevealEarly(room);
  });

  // Host can send the room back to a fresh lobby for another round.
  socket.on('playAgain', (_payload, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return cb && cb({ ok: false, error: 'Room no longer exists' });
    if (socket.id !== room.hostId)
      return cb && cb({ ok: false, error: 'Only the host can restart' });
    if (room.game) clearTimeout(room.game.timer);
    room.game = null;
    room.state = 'lobby';
    room.players.forEach((p) => (p.score = 0));
    if (cb) cb({ ok: true });
    io.to(room.code).emit('backToLobby');
    broadcastLobby(room);
  });

  socket.on('leaveRoom', () => handleLeave());
  socket.on('disconnect', () => handleLeave());

  function handleLeave() {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    room.players = room.players.filter((p) => p.id !== socket.id);
    socket.data.roomCode = null;

    if (room.players.length === 0) {
      if (room.game) clearTimeout(room.game.timer);
      rooms.delete(room.code);
      return;
    }
    // Host left: hand the crown to whoever's been there longest.
    if (room.hostId === socket.id) room.hostId = room.players[0].id;

    if (room.state === 'lobby') {
      broadcastLobby(room);
    } else if (room.state === 'playing') {
      // A departure might mean the remaining players have all answered.
      maybeRevealEarly(room);
      // Keep the live scoreboard honest for whoever's left.
      io.to(room.code).emit('lobby', lobbyState(room));
    }
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Quiz game running on http://localhost:${PORT}`));
