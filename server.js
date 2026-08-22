const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const QRCode = require('qrcode');
const { CATEGORIES, pickQuestions } = require('./questions');
const history = require('./history');
const { pickWord } = require('./words');
const { VALID: WORDLE_DICT } = require('./wordle-dict');
const { pickGameWords, pickGameWord } = require('./game-words');

const app = express();
const server = http.createServer(app);

// When the static client is hosted on another origin (e.g. Cloudflare Pages),
// list its origin(s) in CLIENT_ORIGIN (comma-separated) so the cross-origin
// Socket.IO connection is allowed. Unset means same-origin only, the default.
const clientOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const io = new Server(
  server,
  clientOrigins.length
    ? { cors: { origin: clientOrigins, methods: ['GET', 'POST'] } }
    : {},
);

// Still serve the client locally so a combined deployment keeps working and
// the server can act as a fallback host.
app.use(express.static(path.join(__dirname, 'public')));

// Quiz tuning.
const QUESTIONS_PER_GAME = 10;
const POINTS_PER_CORRECT = 2;
const ANSWER_SECONDS = 30;
const REVEAL_SECONDS = 5;

// Wordle tuning.
const WORDLE_MAX_GUESSES = 6;
const WORDLE_SECONDS = 180; // round cap so a stalled player can't hang the game

// Word Scramble tuning.
const SCRAMBLE_ROUNDS = 6;
const SCRAMBLE_SECONDS = 25; // per-round answer window
const SCRAMBLE_REVEAL_SECONDS = 3;
const SCRAMBLE_BASE = 2; // points for unscrambling the word
const SCRAMBLE_SPEED_BONUS = 1; // extra for the first to solve each round

// Hangman tuning.
const HANGMAN_MAX_WRONG = 6; // wrong letters allowed before you're out
const HANGMAN_SECONDS = 150; // round cap so a stalled player can't hang the game

// Sudoku tuning. Blanks removed from a full grid per difficulty.
const SUDOKU_HOLES = { easy: 38, medium: 46, hard: 52 };
function holesFor(d) {
  return SUDOKU_HOLES[d] || SUDOKU_HOLES.medium;
}
function cleanDifficulty(d) {
  return SUDOKU_HOLES[d] ? d : 'medium';
}

// Games and their player limits. `solo: true` means the game can be played
// alone (a one-player room that starts immediately, no lobby).
const GAMES = {
  quiz: { min: 2, max: 4, name: 'Quiz Up' },
  ttt: { min: 2, max: 2, name: 'Tic Tac Toe' },
  wordle: { min: 2, max: 4, name: 'Wordle', solo: true },
  sudoku: { min: 2, max: 4, name: 'Sudoku', solo: true },
  scramble: { min: 2, max: 4, name: 'Word Scramble', solo: true },
  hangman: { min: 2, max: 4, name: 'Hangman', solo: true },
};

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function limits(type) {
  return GAMES[type] || GAMES.quiz;
}

// In-memory rooms. Fine for a party game; state is disposable.
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
  // PUBLIC_URL is where players load the client from. Set it to the static
  // host (e.g. the Cloudflare Pages URL) when client and server are split, so
  // the QR code and join link point players at the client, not the server.
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/+$/, '');
  const h = socket.handshake.headers;
  const proto = (h['x-forwarded-proto'] || '').split(',')[0] || 'http';
  const host = h['x-forwarded-host'] || h.host;
  return `${proto}://${host}`;
}

function lobbyState(room) {
  const lim = limits(room.gameType);
  return {
    code: room.code,
    state: room.state,
    hostId: room.hostId,
    gameType: room.gameType,
    gameName: lim.name,
    minPlayers: lim.min,
    maxPlayers: lim.max,
    categories: room.gameType === 'quiz' ? CATEGORIES : null,
    difficulty: room.difficulty || 'medium',
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isHost: p.id === room.hostId,
      avatar: p.avatar || null,
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

// Selfie avatars: a small base64 data URL the client captured from the
// camera. Reject anything that isn't an image data URL, and cap the size so
// one bad payload can't bloat a socket message.
const MAX_AVATAR_CHARS = 250000; // ~180KB of image data as base64
function cleanAvatar(avatar) {
  if (typeof avatar !== 'string') return null;
  if (avatar.length > MAX_AVATAR_CHARS) return null;
  if (!/^data:image\/(png|jpe?g|webp);base64,/.test(avatar)) return null;
  return avatar;
}

// Live stats for the home screen: how many people are in a room right now.
function statsPayload() {
  let players = 0;
  for (const r of rooms.values()) players += r.players.length;
  return { players, rooms: rooms.size };
}
function broadcastStats() {
  io.emit('stats', statsPayload());
}

// ========================= QUIZ =========================

function scoreboard(room) {
  return [...room.players]
    .sort((a, b) => b.score - a.score)
    .map((p) => ({ id: p.id, name: p.name, score: p.score }));
}

function startQuiz(room, cats) {
  room.state = 'playing';
  room.players.forEach((p) => (p.score = 0));
  const questions = pickQuestions(QUESTIONS_PER_GAME, cats);
  room.game = {
    type: 'quiz',
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
    return endQuiz(room);
  }

  g.phase = 'question';
  g.answers = new Map();
  g.endsAt = Date.now() + ANSWER_SECONDS * 1000;

  const q = g.questions[g.qIndex];
  history.recordShown(q.q); // remember this question was shown
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
    results,
    scoreboard: scoreboard(room),
    seconds: REVEAL_SECONDS,
    isLast: g.qIndex >= g.questions.length - 1,
  });

  g.timer = setTimeout(() => nextQuestion(room), REVEAL_SECONDS * 1000);
}

function maybeRevealEarly(room) {
  const g = room.game;
  if (!g || g.type !== 'quiz' || g.phase !== 'question') return;
  const everyone = room.players.every((p) => g.answers.has(p.id));
  if (everyone) revealAnswer(room);
}

function endQuiz(room) {
  const g = room.game;
  if (g) clearTimeout(g.timer);
  room.state = 'over';
  const board = scoreboard(room);
  const top = board.length ? board[0].score : 0;
  const winners = board.filter((p) => p.score === top && top > 0).map((p) => p.id);
  io.to(room.code).emit('gameOver', {
    scoreboard: board,
    winnerIds: winners,
    tie: winners.length > 1,
  });
  room.game = null;
}

// ========================= TIC TAC TOE =========================

const TTT_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function winningLine(b) {
  for (const [a, c, d] of TTT_LINES) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return [a, c, d];
  }
  return null;
}

function startTtt(room) {
  room.state = 'playing';
  const [a, b] = room.players;
  // Alternate who goes first across rematches.
  const firstIsA = !room.tttFirstWasA;
  room.tttFirstWasA = firstIsA;
  const xId = firstIsA ? a.id : b.id;
  const oId = firstIsA ? b.id : a.id;
  room.game = {
    type: 'ttt',
    board: Array(9).fill(null),
    order: [xId, oId],
    marks: { [xId]: 'X', [oId]: 'O' },
    turn: xId,
    winner: null,
    line: null,
    draw: false,
  };
  broadcastTtt(room);
}

function broadcastTtt(room) {
  const g = room.game;
  io.to(room.code).emit('ttt:state', {
    board: g.board,
    turn: g.turn,
    marks: g.marks,
    winner: g.winner,
    line: g.line,
    draw: g.draw,
    state: room.state,
    players: room.players.map((p) => ({ id: p.id, name: p.name })),
  });
}

// ========================= WORDLE =========================

function scoreGuess(guess, secret) {
  const res = Array(5).fill('absent');
  const s = secret.split('');
  const g = guess.split('');
  const counts = {};
  for (const c of s) counts[c] = (counts[c] || 0) + 1;
  for (let i = 0; i < 5; i++) {
    if (g[i] === s[i]) {
      res[i] = 'correct';
      counts[g[i]] -= 1;
    }
  }
  for (let i = 0; i < 5; i++) {
    if (res[i] === 'correct') continue;
    if (counts[g[i]] > 0) {
      res[i] = 'present';
      counts[g[i]] -= 1;
    }
  }
  return res;
}

function startWordle(room) {
  room.state = 'playing';
  const boards = {};
  room.players.forEach((p) => {
    boards[p.id] = { guesses: [], solved: false, done: false, solvedAt: null };
  });
  room.game = {
    type: 'wordle',
    secret: pickWord(),
    boards,
    solveSeq: 0,
    winnerIds: [],
    timer: null,
  };
  room.game.timer = setTimeout(() => endWordle(room), WORDLE_SECONDS * 1000);
  broadcastWordle(room);
}

function wordleSummary(room) {
  const g = room.game;
  return room.players.map((p) => {
    const b = g.boards[p.id];
    return {
      id: p.id,
      name: p.name,
      guessCount: b ? b.guesses.length : 0,
      solved: b ? b.solved : false,
      done: b ? b.done : true,
    };
  });
}

function broadcastWordle(room, reveal) {
  const g = room.game;
  const summary = wordleSummary(room);
  room.players.forEach((p) => {
    const b = g.boards[p.id];
    io.to(p.id).emit('wordle:state', {
      me: {
        guesses: b ? b.guesses : [],
        solved: b ? b.solved : false,
        done: b ? b.done : true,
        maxGuesses: WORDLE_MAX_GUESSES,
      },
      opponents: summary.filter((s) => s.id !== p.id),
      state: room.state,
      secret: reveal ? g.secret : null,
      winnerIds: reveal ? g.winnerIds : null,
    });
  });
}

function endWordle(room) {
  const g = room.game;
  if (!g) return;
  if (g.timer) clearTimeout(g.timer);
  room.state = 'over';
  const solvers = room.players
    .filter((p) => g.boards[p.id] && g.boards[p.id].solved)
    .sort((a, b) => {
      const A = g.boards[a.id];
      const B = g.boards[b.id];
      return A.guesses.length - B.guesses.length || A.solvedAt - B.solvedAt;
    });
  g.winnerIds = solvers.length ? [solvers[0].id] : [];
  broadcastWordle(room, true);
}

// ========================= SUDOKU =========================

function makeSolvedGrid() {
  const g = Array(81).fill(0);
  function ok(i, val) {
    const r = Math.floor(i / 9);
    const c = i % 9;
    for (let k = 0; k < 9; k++) {
      if (g[r * 9 + k] === val) return false;
      if (g[k * 9 + c] === val) return false;
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let a = 0; a < 3; a++) {
      for (let b = 0; b < 3; b++) {
        if (g[(br + a) * 9 + (bc + b)] === val) return false;
      }
    }
    return true;
  }
  function fill(i) {
    if (i >= 81) return true;
    if (g[i] !== 0) return fill(i + 1);
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const n of nums) {
      if (ok(i, n)) {
        g[i] = n;
        if (fill(i + 1)) return true;
        g[i] = 0;
      }
    }
    return false;
  }
  fill(0);
  return g;
}

// Count solutions of a partial grid, stopping once we reach `cap`.
function countSolutions(grid, cap) {
  const g = grid.slice();
  let count = 0;
  function ok(i, val) {
    const r = Math.floor(i / 9);
    const c = i % 9;
    for (let k = 0; k < 9; k++) {
      if (g[r * 9 + k] === val) return false;
      if (g[k * 9 + c] === val) return false;
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let a = 0; a < 3; a++) {
      for (let b = 0; b < 3; b++) {
        if (g[(br + a) * 9 + (bc + b)] === val) return false;
      }
    }
    return true;
  }
  function rec(i) {
    if (count >= cap) return;
    if (i >= 81) {
      count += 1;
      return;
    }
    if (g[i] !== 0) return rec(i + 1);
    for (let v = 1; v <= 9; v++) {
      if (ok(i, v)) {
        g[i] = v;
        rec(i + 1);
        g[i] = 0;
        if (count >= cap) return;
      }
    }
  }
  rec(0);
  return count;
}

// Remove cells one at a time, keeping the puzzle uniquely solvable, until we
// hit the target number of holes (or can't remove more without ambiguity).
function makePuzzle(solution, holes) {
  const p = solution.slice();
  const order = shuffle([...Array(81).keys()]);
  let removed = 0;
  for (const i of order) {
    if (removed >= holes) break;
    if (p[i] === 0) continue;
    const backup = p[i];
    p[i] = 0;
    if (countSolutions(p, 2) === 1) {
      removed += 1;
    } else {
      p[i] = backup; // removing this cell would make the puzzle ambiguous
    }
  }
  return p;
}

function sudokuComplete(board) {
  if (!Array.isArray(board) || board.length !== 81) return false;
  for (let i = 0; i < 81; i++) {
    if (!Number.isInteger(board[i]) || board[i] < 1 || board[i] > 9) return false;
  }
  for (let u = 0; u < 9; u++) {
    const row = new Set();
    const col = new Set();
    const box = new Set();
    for (let k = 0; k < 9; k++) {
      row.add(board[u * 9 + k]);
      col.add(board[k * 9 + u]);
      const br = Math.floor(u / 3) * 3 + Math.floor(k / 3);
      const bc = (u % 3) * 3 + (k % 3);
      box.add(board[br * 9 + bc]);
    }
    if (row.size !== 9 || col.size !== 9 || box.size !== 9) return false;
  }
  return true;
}

function matchesGivens(board, puzzle) {
  for (let i = 0; i < 81; i++) {
    if (puzzle[i] !== 0 && board[i] !== puzzle[i]) return false;
  }
  return true;
}

function startSudoku(room) {
  room.state = 'playing';
  const solution = makeSolvedGrid();
  const puzzle = makePuzzle(solution, holesFor(room.difficulty));
  const givens = puzzle.filter((v) => v !== 0).length;
  const boards = {};
  room.players.forEach((p) => {
    boards[p.id] = { solved: false, solvedAt: null, filled: givens };
  });
  room.game = {
    type: 'sudoku',
    puzzle,
    solution,
    givens,
    boards,
    solveSeq: 0,
    winnerIds: [],
    timer: null,
  };
  // No time limit: Sudoku runs until someone solves it (or everyone leaves),
  // so players can take as long as they like, even in multiplayer.
  io.to(room.code).emit('sudoku:start', {
    puzzle,
    players: sudokuSummary(room),
    state: room.state,
  });
}

function sudokuSummary(room) {
  const g = room.game;
  return room.players.map((p) => {
    const b = g.boards[p.id];
    return {
      id: p.id,
      name: p.name,
      filled: b ? b.filled : 0,
      solved: b ? b.solved : false,
    };
  });
}

function endSudoku(room) {
  const g = room.game;
  if (!g) return;
  if (g.timer) clearTimeout(g.timer);
  room.state = 'over';
  const solvers = room.players
    .filter((p) => g.boards[p.id] && g.boards[p.id].solved)
    .sort((a, b) => g.boards[a.id].solvedAt - g.boards[b.id].solvedAt);
  g.winnerIds = solvers.length ? [solvers[0].id] : [];
  io.to(room.code).emit('sudoku:over', {
    players: sudokuSummary(room),
    winnerIds: g.winnerIds,
    solution: g.solution,
  });
}

// ========================= WORD SCRAMBLE =========================

function scrambleWord(word) {
  const letters = word.split('');
  let out = word;
  // Reshuffle until the letters actually move (guards short/repeated words).
  for (let attempt = 0; attempt < 12 && out === word; attempt++) {
    out = shuffle(letters.slice()).join('');
  }
  return out;
}

function startScramble(room) {
  room.state = 'playing';
  room.players.forEach((p) => (p.score = 0));
  const words = pickGameWords(SCRAMBLE_ROUNDS).map((w) => ({
    word: w.word,
    hint: w.hint,
    scrambled: scrambleWord(w.word),
  }));
  room.game = {
    type: 'scramble',
    words,
    rIndex: -1,
    phase: 'round',
    endsAt: 0,
    solved: new Map(), // playerId -> { order, gained } for the current round
    solveSeq: 0,
    timer: null,
  };
  io.to(room.code).emit('scramble:start', { total: words.length });
  nextScramble(room);
}

function nextScramble(room) {
  const g = room.game;
  if (!g) return;
  g.rIndex += 1;
  if (g.rIndex >= g.words.length) return endScramble(room);

  g.phase = 'round';
  g.solved = new Map();
  g.endsAt = Date.now() + SCRAMBLE_SECONDS * 1000;
  const w = g.words[g.rIndex];
  io.to(room.code).emit('scramble:round', {
    index: g.rIndex,
    total: g.words.length,
    scrambled: w.scrambled,
    hint: w.hint,
    length: w.word.length,
    seconds: SCRAMBLE_SECONDS,
    endsAt: g.endsAt,
    scoreboard: scoreboard(room),
  });

  clearTimeout(g.timer);
  g.timer = setTimeout(() => revealScramble(room), SCRAMBLE_SECONDS * 1000);
}

function revealScramble(room) {
  const g = room.game;
  if (!g || g.phase !== 'round') return;
  g.phase = 'reveal';
  clearTimeout(g.timer);

  const w = g.words[g.rIndex];
  const results = {};
  room.players.forEach((p) => {
    const s = g.solved.get(p.id);
    results[p.id] = { solved: !!s, gained: s ? s.gained : 0 };
  });

  io.to(room.code).emit('scramble:reveal', {
    index: g.rIndex,
    answer: w.word,
    results,
    scoreboard: scoreboard(room),
    isLast: g.rIndex >= g.words.length - 1,
    seconds: SCRAMBLE_REVEAL_SECONDS,
  });

  g.timer = setTimeout(() => nextScramble(room), SCRAMBLE_REVEAL_SECONDS * 1000);
}

function maybeRevealScrambleEarly(room) {
  const g = room.game;
  if (!g || g.type !== 'scramble' || g.phase !== 'round') return;
  if (room.players.length && room.players.every((p) => g.solved.has(p.id))) {
    revealScramble(room);
  }
}

function endScramble(room) {
  const g = room.game;
  if (g) clearTimeout(g.timer);
  room.state = 'over';
  const board = scoreboard(room);
  const top = board.length ? board[0].score : 0;
  const winners = board.filter((p) => p.score === top && top > 0).map((p) => p.id);
  io.to(room.code).emit('scramble:over', {
    scoreboard: board,
    winnerIds: winners,
    tie: winners.length > 1,
  });
  room.game = null;
}

// ========================= HANGMAN =========================

// The word masked to what a player has revealed so far: each position is the
// letter if guessed, otherwise null. The secret itself never leaves the server
// until the round is over.
function hangmanMasked(secret, guessed) {
  return secret.split('').map((ch) => (guessed.includes(ch) ? ch : null));
}
function hangmanSolved(secret, guessed) {
  return secret.split('').every((ch) => guessed.includes(ch));
}

function startHangman(room) {
  room.state = 'playing';
  const pick = pickGameWord();
  const secret = pick.word.toLowerCase().replace(/[^a-z]/g, '');
  const boards = {};
  room.players.forEach((p) => {
    boards[p.id] = { guessed: [], wrong: 0, solved: false, done: false, solvedAt: null };
  });
  room.game = {
    type: 'hangman',
    secret,
    hint: pick.hint,
    boards,
    solveSeq: 0,
    winnerIds: [],
    timer: null,
  };
  room.game.timer = setTimeout(() => endHangman(room), HANGMAN_SECONDS * 1000);
  broadcastHangman(room);
}

function hangmanSummary(room) {
  const g = room.game;
  return room.players.map((p) => {
    const b = g.boards[p.id];
    return {
      id: p.id,
      name: p.name,
      wrong: b ? b.wrong : 0,
      solved: b ? b.solved : false,
      done: b ? b.done : true,
    };
  });
}

function broadcastHangman(room, reveal) {
  const g = room.game;
  const summary = hangmanSummary(room);
  room.players.forEach((p) => {
    const b = g.boards[p.id];
    io.to(p.id).emit('hangman:state', {
      me: {
        guessed: b ? b.guessed : [],
        wrong: b ? b.wrong : 0,
        maxWrong: HANGMAN_MAX_WRONG,
        solved: b ? b.solved : false,
        done: b ? b.done : true,
        masked: b ? hangmanMasked(g.secret, b.guessed) : [],
      },
      hint: g.hint,
      length: g.secret.length,
      opponents: summary.filter((s) => s.id !== p.id),
      state: room.state,
      secret: reveal ? g.secret : null,
      winnerIds: reveal ? g.winnerIds : null,
    });
  });
}

function endHangman(room) {
  const g = room.game;
  if (!g) return;
  if (g.timer) clearTimeout(g.timer);
  room.state = 'over';
  const solvers = room.players
    .filter((p) => g.boards[p.id] && g.boards[p.id].solved)
    .sort((a, b) => {
      const A = g.boards[a.id];
      const B = g.boards[b.id];
      return A.wrong - B.wrong || A.solvedAt - B.solvedAt;
    });
  g.winnerIds = solvers.length ? [solvers[0].id] : [];
  broadcastHangman(room, true);
}

// ========================= DISPATCH =========================

function launch(room, categories) {
  if (room.gameType === 'ttt') return startTtt(room);
  if (room.gameType === 'wordle') return startWordle(room);
  if (room.gameType === 'sudoku') return startSudoku(room);
  if (room.gameType === 'scramble') return startScramble(room);
  if (room.gameType === 'hangman') return startHangman(room);
  const cats = Array.isArray(categories)
    ? categories.filter((c) => typeof c === 'string')
    : null;
  return startQuiz(room, cats);
}

function clearRoomTimer(room) {
  if (room.game && room.game.timer) clearTimeout(room.game.timer);
}

// ========================= SOCKETS =========================

io.on('connection', (socket) => {
  socket.data.roomCode = null;
  socket.emit('stats', statsPayload()); // current count for the home screen

  socket.on('createRoom', async ({ name, gameType, difficulty, avatar } = {}, cb) => {
    const type = GAMES[gameType] ? gameType : 'quiz';
    const code = makeCode();
    const room = {
      code,
      hostId: socket.id,
      players: [],
      state: 'lobby',
      gameType: type,
      game: null,
      difficulty: cleanDifficulty(difficulty),
    };
    rooms.set(code, room);
    room.players.push({
      id: socket.id,
      name: cleanName(name, 'Host'),
      score: 0,
      avatar: cleanAvatar(avatar),
    });
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
    broadcastStats();
  });

  // Solo play: a one-player room that starts immediately, no lobby.
  socket.on('createSolo', ({ gameType, difficulty } = {}, cb) => {
    if (!GAMES[gameType] || !GAMES[gameType].solo)
      return cb && cb({ ok: false, error: 'That game has no solo mode' });
    const code = makeCode();
    const room = {
      code,
      hostId: socket.id,
      players: [],
      state: 'lobby',
      gameType,
      game: null,
      solo: true,
      difficulty: cleanDifficulty(difficulty),
    };
    rooms.set(code, room);
    room.players.push({ id: socket.id, name: 'You', score: 0 });
    socket.join(code);
    socket.data.roomCode = code;
    if (cb) cb({ ok: true, playerId: socket.id, gameType });
    launch(room);
    broadcastStats();
  });

  socket.on('joinRoom', ({ code, name, avatar } = {}, cb) => {
    code = (code || '').toString().toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) return cb && cb({ ok: false, error: 'Room not found' });
    if (room.state !== 'lobby')
      return cb && cb({ ok: false, error: 'That game has already started' });
    const lim = limits(room.gameType);
    if (room.players.length >= lim.max)
      return cb && cb({ ok: false, error: `Room is full (${lim.max} max)` });

    room.players.push({
      id: socket.id,
      name: cleanName(name, 'Player'),
      score: 0,
      avatar: cleanAvatar(avatar),
    });
    socket.join(code);
    socket.data.roomCode = code;

    if (cb) cb({ ok: true, playerId: socket.id, ...lobbyState(room) });
    broadcastLobby(room);
    broadcastStats();
  });

  socket.on('startGame', ({ categories } = {}, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return cb && cb({ ok: false, error: 'Room no longer exists' });
    if (socket.id !== room.hostId)
      return cb && cb({ ok: false, error: 'Only the host can start' });
    if (room.state !== 'lobby')
      return cb && cb({ ok: false, error: 'Game already started' });
    const lim = limits(room.gameType);
    if (room.players.length < lim.min)
      return cb && cb({ ok: false, error: `Need at least ${lim.min} players` });

    if (cb) cb({ ok: true });
    launch(room, categories);
  });

  // Host switches the room to a different game while still in the lobby.
  socket.on('setGame', ({ gameType } = {}, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return cb && cb({ ok: false, error: 'Room no longer exists' });
    if (socket.id !== room.hostId)
      return cb && cb({ ok: false, error: 'Only the host can change the game' });
    if (room.state !== 'lobby')
      return cb && cb({ ok: false, error: 'You can only change games in the lobby' });
    if (!GAMES[gameType]) return cb && cb({ ok: false, error: 'Unknown game' });

    room.gameType = gameType;
    if (cb) cb({ ok: true });
    broadcastLobby(room);
  });

  // Host sets the Sudoku difficulty for the room (lobby only).
  socket.on('setSudokuDifficulty', ({ difficulty } = {}, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return cb && cb({ ok: false });
    if (socket.id !== room.hostId)
      return cb && cb({ ok: false, error: 'Only the host can change difficulty' });
    if (room.state !== 'lobby') return cb && cb({ ok: false });
    room.difficulty = cleanDifficulty(difficulty);
    if (cb) cb({ ok: true });
    broadcastLobby(room);
  });

  // Host restarts the same game after it ends.
  socket.on('rematch', (_payload, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return cb && cb({ ok: false, error: 'Room no longer exists' });
    if (socket.id !== room.hostId)
      return cb && cb({ ok: false, error: 'Only the host can restart' });
    const min = room.solo ? 1 : limits(room.gameType).min;
    if (room.players.length < min)
      return cb && cb({ ok: false, error: `Need at least ${min} players` });
    clearRoomTimer(room);
    if (cb) cb({ ok: true });
    launch(room);
  });

  // ---- Quiz ----
  socket.on('answer', ({ index, choice } = {}, cb) => {
    const room = rooms.get(socket.data.roomCode);
    const g = room && room.game;
    if (!g || g.type !== 'quiz' || g.phase !== 'question') return cb && cb({ ok: false });
    if (index !== g.qIndex) return cb && cb({ ok: false });
    if (g.answers.has(socket.id)) return cb && cb({ ok: false });
    if (typeof choice !== 'number' || choice < 0 || choice > 3)
      return cb && cb({ ok: false });

    g.answers.set(socket.id, { choice, at: Date.now() });
    if (cb) cb({ ok: true });
    io.to(room.code).emit('answerCount', {
      answered: g.answers.size,
      total: room.players.length,
    });
    maybeRevealEarly(room);
  });

  // Sends everyone back to the lobby (scores reset) so the host can re-pick
  // categories, change difficulty, or switch to a different game entirely via
  // the lobby's game switcher. Used by Quiz's "Play again" and by every game's
  // "Different game" button. The quicker same-game "rematch" (below) skips
  // the lobby detour.
  socket.on('playAgain', (_payload, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return cb && cb({ ok: false, error: 'Room no longer exists' });
    if (socket.id !== room.hostId)
      return cb && cb({ ok: false, error: 'Only the host can restart' });
    clearRoomTimer(room);
    room.game = null;
    room.state = 'lobby';
    room.players.forEach((p) => (p.score = 0));
    if (cb) cb({ ok: true });
    io.to(room.code).emit('backToLobby');
    broadcastLobby(room);
  });

  // ---- Tic Tac Toe ----
  socket.on('ttt:move', ({ cell } = {}) => {
    const room = rooms.get(socket.data.roomCode);
    const g = room && room.game;
    if (!g || g.type !== 'ttt' || room.state !== 'playing') return;
    if (socket.id !== g.turn) return;
    if (typeof cell !== 'number' || cell < 0 || cell > 8 || g.board[cell]) return;

    g.board[cell] = g.marks[socket.id];
    const line = winningLine(g.board);
    if (line) {
      g.winner = socket.id;
      g.line = line;
      room.state = 'over';
    } else if (g.board.every(Boolean)) {
      g.draw = true;
      room.state = 'over';
    } else {
      g.turn = g.order.find((id) => id !== socket.id);
    }
    broadcastTtt(room);
  });

  // ---- Wordle ----
  socket.on('wordle:guess', ({ word } = {}, cb) => {
    const room = rooms.get(socket.data.roomCode);
    const g = room && room.game;
    if (!g || g.type !== 'wordle' || room.state !== 'playing')
      return cb && cb({ ok: false });
    const b = g.boards[socket.id];
    if (!b || b.done) return cb && cb({ ok: false });
    word = (word || '').toString().toLowerCase();
    if (!/^[a-z]{5}$/.test(word)) return cb && cb({ ok: false, error: 'Enter 5 letters' });
    if (!WORDLE_DICT.has(word)) return cb && cb({ ok: false, error: 'Not in word list' });

    const result = scoreGuess(word, g.secret);
    b.guesses.push({ word, result });
    if (word === g.secret) {
      b.solved = true;
      b.done = true;
      b.solvedAt = ++g.solveSeq;
    } else if (b.guesses.length >= WORDLE_MAX_GUESSES) {
      b.done = true;
    }
    if (cb) cb({ ok: true });

    if (room.players.every((p) => g.boards[p.id] && g.boards[p.id].done)) {
      endWordle(room);
    } else {
      broadcastWordle(room);
    }
  });

  // ---- Sudoku ----
  socket.on('sudoku:progress', ({ filled } = {}) => {
    const room = rooms.get(socket.data.roomCode);
    const g = room && room.game;
    if (!g || g.type !== 'sudoku' || room.state !== 'playing') return;
    const b = g.boards[socket.id];
    if (!b) return;
    if (typeof filled === 'number') b.filled = Math.max(0, Math.min(81, filled | 0));
    io.to(room.code).emit('sudoku:progress', { players: sudokuSummary(room) });
  });

  socket.on('sudoku:submit', ({ board } = {}, cb) => {
    const room = rooms.get(socket.data.roomCode);
    const g = room && room.game;
    if (!g || g.type !== 'sudoku' || room.state !== 'playing')
      return cb && cb({ ok: false });
    const b = g.boards[socket.id];
    if (!b || b.solved) return cb && cb({ ok: false });
    if (matchesGivens(board, g.puzzle) && sudokuComplete(board)) {
      b.solved = true;
      b.filled = 81;
      b.solvedAt = ++g.solveSeq;
      if (cb) cb({ ok: true, solved: true });
      endSudoku(room); // first correct solve wins the race
    } else {
      if (cb) cb({ ok: false, error: 'Not solved yet — check for mistakes' });
    }
  });

  // ---- Word Scramble ----
  socket.on('scramble:guess', ({ index, word } = {}, cb) => {
    const room = rooms.get(socket.data.roomCode);
    const g = room && room.game;
    if (!g || g.type !== 'scramble' || g.phase !== 'round') return cb && cb({ ok: false });
    if (index !== g.rIndex) return cb && cb({ ok: false });
    if (g.solved.has(socket.id)) return cb && cb({ ok: false });

    const guess = (word || '').toString().toLowerCase().replace(/[^a-z]/g, '');
    if (!guess) return cb && cb({ ok: false, error: 'Type your answer' });
    if (guess !== g.words[g.rIndex].word) return cb && cb({ ok: true, correct: false });

    const order = g.solved.size + 1;
    const gained = SCRAMBLE_BASE + (order === 1 ? SCRAMBLE_SPEED_BONUS : 0);
    g.solved.set(socket.id, { order, gained });
    const p = room.players.find((x) => x.id === socket.id);
    if (p) p.score += gained;
    if (cb) cb({ ok: true, correct: true, gained });

    io.to(room.code).emit('scramble:solved', {
      solved: g.solved.size,
      total: room.players.length,
    });
    maybeRevealScrambleEarly(room);
  });

  // ---- Hangman ----
  socket.on('hangman:guess', ({ letter } = {}, cb) => {
    const room = rooms.get(socket.data.roomCode);
    const g = room && room.game;
    if (!g || g.type !== 'hangman' || room.state !== 'playing') return cb && cb({ ok: false });
    const b = g.boards[socket.id];
    if (!b || b.done) return cb && cb({ ok: false });
    letter = (letter || '').toString().toLowerCase();
    if (!/^[a-z]$/.test(letter)) return cb && cb({ ok: false });
    if (b.guessed.includes(letter)) return cb && cb({ ok: false });

    b.guessed.push(letter);
    if (!g.secret.includes(letter)) {
      b.wrong += 1;
      if (b.wrong >= HANGMAN_MAX_WRONG) b.done = true;
    } else if (hangmanSolved(g.secret, b.guessed)) {
      b.solved = true;
      b.done = true;
      b.solvedAt = ++g.solveSeq;
    }
    if (cb) cb({ ok: true });

    if (room.players.every((p) => g.boards[p.id] && g.boards[p.id].done)) {
      endHangman(room);
    } else {
      broadcastHangman(room);
    }
  });

  socket.on('leaveRoom', () => {
    handleLeave();
    broadcastStats();
  });
  socket.on('disconnect', () => {
    handleLeave();
    broadcastStats();
  });

  function handleLeave() {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    room.players = room.players.filter((p) => p.id !== socket.id);
    socket.data.roomCode = null;

    if (room.players.length === 0) {
      clearRoomTimer(room);
      rooms.delete(room.code);
      return;
    }
    if (room.hostId === socket.id) room.hostId = room.players[0].id;

    if (room.state === 'lobby') {
      broadcastLobby(room);
      return;
    }

    // A player left mid-game.
    const lim = limits(room.gameType);
    if (room.gameType === 'quiz') {
      maybeRevealEarly(room);
      io.to(room.code).emit('lobby', lobbyState(room));
      return;
    }
    if (room.players.length < lim.min) {
      // Not enough players to continue; drop back to the lobby.
      clearRoomTimer(room);
      room.game = null;
      room.state = 'lobby';
      io.to(room.code).emit('aborted', { reason: 'A player left, so we went back to the lobby.' });
      broadcastLobby(room);
      return;
    }
    if (room.gameType === 'wordle' && room.game) {
      delete room.game.boards[socket.id];
      if (room.players.every((p) => room.game.boards[p.id] && room.game.boards[p.id].done)) {
        endWordle(room);
      } else {
        broadcastWordle(room);
      }
    } else if (room.gameType === 'sudoku' && room.game) {
      delete room.game.boards[socket.id];
      io.to(room.code).emit('sudoku:progress', { players: sudokuSummary(room) });
    } else if (room.gameType === 'scramble' && room.game) {
      room.game.solved.delete(socket.id);
      maybeRevealScrambleEarly(room);
    } else if (room.gameType === 'hangman' && room.game) {
      delete room.game.boards[socket.id];
      if (room.players.every((p) => room.game.boards[p.id] && room.game.boards[p.id].done)) {
        endHangman(room);
      } else {
        broadcastHangman(room);
      }
    }
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Party games running on http://localhost:${PORT}`));
