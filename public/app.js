/* Game Night — room + lobby + Quiz / Tic Tac Toe / Wordle clients */
(function () {
  // Same origin by default; when GAME_SERVER_URL is set (static client hosted
  // apart from the server), connect to that backend instead.
  const socket = window.GAME_SERVER_URL ? io(window.GAME_SERVER_URL) : io();

  const $ = (id) => document.getElementById(id);
  const screens = {
    home: $("screen-home"),
    mode: $("screen-mode"),
    name: $("screen-name"),
    lobby: $("screen-lobby"),
    question: $("screen-question"),
    reveal: $("screen-reveal"),
    results: $("screen-results"),
    ttt: $("screen-ttt"),
    wordle: $("screen-wordle"),
    sudoku: $("screen-sudoku"),
    scramble: $("screen-scramble"),
    hangman: $("screen-hangman"),
  };
  const SOLO_GAMES = new Set(["wordle", "sudoku", "scramble", "hangman"]);
  function show(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[name].classList.add("active");
  }

  const state = {
    mode: null, // 'create' | 'join'
    pendingGame: "quiz", // game chosen on the launcher
    pendingCode: null,
    myId: null,
    room: null,
    joinUrl: null,
    gameType: "quiz",
    // quiz
    qIndex: -1,
    seconds: 30,
    endsAt: 0,
    picked: null,
    tick: null,
    selectedCats: null,
    // wordle
    wordle: { input: "", lastCount: 0, over: false },
    // sudoku
    sudoku: null,
    sudokuDifficulty: "medium",
    // word scramble
    scramble: null,
    scrambleTick: null,
    // hangman
    hangman: null,
  };

  const DIFF_LIST = [
    { key: "easy", label: "Easy" },
    { key: "medium", label: "Medium" },
    { key: "hard", label: "Hard" },
  ];

  // Renders an Easy/Medium/Hard segmented control into `el`.
  function renderDiffList(el, current, onPick) {
    el.innerHTML = "";
    DIFF_LIST.forEach((d) => {
      const btn = document.createElement("button");
      btn.className = "diff-btn" + (d.key === current ? " on" : "");
      btn.textContent = d.label;
      btn.addEventListener("click", () => onPick(d.key));
      el.append(btn);
    });
  }

  const GAME_LIST = [
    { type: "quiz", icon: "🧠", name: "Quiz Up" },
    { type: "ttt", icon: "⭕", name: "Tic Tac Toe" },
    { type: "wordle", icon: "🔤", name: "Wordle" },
    { type: "sudoku", icon: "🔢", name: "Sudoku" },
    { type: "scramble", icon: "🔀", name: "Word Scramble" },
    { type: "hangman", icon: "🔡", name: "Hangman" },
  ];
  const GAME_ICON = { quiz: "🧠", ttt: "⭕", wordle: "🔤", sudoku: "🔢", scramble: "🔀", hangman: "🔡" };
  const GAME_NAME = { quiz: "Quiz Up", ttt: "Tic Tac Toe", wordle: "Wordle", sudoku: "Sudoku", scramble: "Word Scramble", hangman: "Hangman" };

  const params = new URLSearchParams(location.search);
  const linkCode = (params.get("room") || "").toUpperCase().trim();

  // Live count of people currently in a game, shown on the home screen.
  socket.on("stats", (d) => {
    const el = $("live-count");
    if (!el) return;
    const n = (d && d.players) || 0;
    el.textContent = n > 0 ? "🟢 " + n + (n === 1 ? " player" : " players") + " in a game now" : "";
  });

  // ============ HOME (launcher) ============
  document.querySelectorAll(".game-card").forEach((card) => {
    card.addEventListener("click", () => {
      ensureAudio();
      const game = card.getAttribute("data-game") || "quiz";
      state.pendingGame = game;
      state.pendingCode = null;
      if (SOLO_GAMES.has(game)) {
        // Let the player choose solo or multiplayer.
        $("mode-icon").textContent = GAME_ICON[game] || "🎮";
        $("mode-title").textContent = GAME_NAME[game] || "Play";
        $("mode-error").textContent = "";
        const diffWrap = $("mode-diff");
        if (game === "sudoku") {
          renderModeDiff();
          diffWrap.classList.remove("hidden");
        } else {
          diffWrap.classList.add("hidden");
        }
        show("mode");
      } else {
        goToNameForCreate(game);
      }
    });
  });

  function goToNameForCreate(game) {
    state.mode = "create";
    state.pendingGame = game;
    $("name-title").textContent = "Hosting " + (GAME_NAME[game] || "game");
    $("name-sub").textContent = "Pick a name your friends will recognise.";
    $("input-name").value = "";
    $("name-error").textContent = "";
    show("name");
    $("input-name").focus();
  }

  // ============ MODE (solo vs friends) ============
  function renderModeDiff() {
    renderDiffList($("mode-diff-list"), state.sudokuDifficulty, (key) => {
      state.sudokuDifficulty = key;
      renderModeDiff();
    });
  }

  $("btn-mode-solo").addEventListener("click", () => {
    ensureAudio();
    $("mode-error").textContent = "";
    socket.emit("createSolo", { gameType: state.pendingGame, difficulty: state.sudokuDifficulty }, (res) => {
      if (!res || !res.ok) {
        $("mode-error").textContent = (res && res.error) || "Could not start.";
        return;
      }
      state.myId = res.playerId;
      state.gameType = res.gameType || state.pendingGame;
      state.room = { hostId: state.myId, gameType: state.gameType, solo: true };
      // The game's own state event will switch to the right screen.
    });
  });
  $("btn-mode-friends").addEventListener("click", () => goToNameForCreate(state.pendingGame));
  $("btn-mode-back").addEventListener("click", () => show("home"));

  $("btn-join").addEventListener("click", () => tryJoinFromHome());
  $("input-code").addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryJoinFromHome();
  });

  function tryJoinFromHome() {
    const code = $("input-code").value.toUpperCase().trim();
    $("home-error").textContent = "";
    if (code.length !== 4) {
      $("home-error").textContent = "Enter the 4-character room code.";
      return;
    }
    goToNameForJoin(code);
  }

  function goToNameForJoin(code) {
    state.mode = "join";
    state.pendingCode = code;
    $("name-title").textContent = "Joining room " + code;
    $("name-sub").textContent = "What should everyone call you?";
    $("input-name").value = "";
    $("name-error").textContent = "";
    show("name");
    $("input-name").focus();
  }

  // ============ NAME ============
  $("btn-name-go").addEventListener("click", submitName);
  $("input-name").addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitName();
  });
  $("btn-name-back").addEventListener("click", () => {
    $("input-code").value = "";
    show("home");
  });

  function submitName() {
    const name = $("input-name").value.trim();
    $("name-error").textContent = "";
    if (!name) {
      $("name-error").textContent = "Please enter a name.";
      return;
    }
    if (state.mode === "create") {
      socket.emit(
        "createRoom",
        { name, gameType: state.pendingGame, difficulty: state.sudokuDifficulty },
        onRoomJoined
      );
    } else {
      socket.emit("joinRoom", { code: state.pendingCode, name }, onRoomJoined);
    }
  }

  function onRoomJoined(res) {
    if (!res || !res.ok) {
      $("name-error").textContent = (res && res.error) || "Something went wrong.";
      return;
    }
    state.myId = res.playerId;
    state.joinUrl = res.joinUrl || null;
    state.gameType = res.gameType || "quiz";
    applyLobby(res);
    if (res.qr) {
      $("qr-img").src = res.qr;
      $("qr-wrap").classList.remove("hidden");
    } else {
      $("qr-wrap").classList.add("hidden");
    }
    show("lobby");
  }

  // ============ LOBBY ============
  $("btn-start").addEventListener("click", () => {
    $("lobby-error").textContent = "";
    const categories = state.selectedCats ? Array.from(state.selectedCats) : [];
    socket.emit("startGame", { categories }, (res) => {
      if (res && !res.ok) $("lobby-error").textContent = res.error || "Could not start.";
    });
  });

  $("btn-leave").addEventListener("click", askLeave);
  $("btn-results-leave").addEventListener("click", askLeave);
  $("btn-ttt-leave").addEventListener("click", askLeave);
  $("btn-wordle-leave").addEventListener("click", askLeave);
  $("btn-sudoku-leave").addEventListener("click", askLeave);
  $("btn-scramble-leave").addEventListener("click", askLeave);
  $("btn-hangman-leave").addEventListener("click", askLeave);
  function leaveToHome() {
    socket.emit("leaveRoom");
    location.href = location.origin;
  }

  // Confirm before leaving so an accidental tap doesn't drop you out.
  function askLeave() {
    $("confirm-overlay").classList.remove("hidden");
  }
  $("confirm-no").addEventListener("click", () => {
    $("confirm-overlay").classList.add("hidden");
  });
  $("confirm-yes").addEventListener("click", () => {
    $("confirm-overlay").classList.add("hidden");
    leaveToHome();
  });
  // Tapping the dimmed backdrop cancels too.
  $("confirm-overlay").addEventListener("click", (e) => {
    if (e.target === $("confirm-overlay")) $("confirm-overlay").classList.add("hidden");
  });

  $("btn-copy").addEventListener("click", async () => {
    if (!state.joinUrl) return;
    try {
      await navigator.clipboard.writeText(state.joinUrl);
      $("btn-copy").textContent = "Copied!";
      setTimeout(() => ($("btn-copy").textContent = "Copy join link"), 1500);
    } catch (_) {
      /* clipboard may be blocked; the QR still works */
    }
  });

  socket.on("lobby", applyLobby);
  socket.on("aborted", (d) => {
    $("lobby-error").textContent = (d && d.reason) || "Back to the lobby.";
    show("lobby");
  });

  function applyLobby(room) {
    state.room = room;
    state.gameType = room.gameType || state.gameType;
    $("lobby-code").textContent = room.code;
    $("lobby-game").textContent = room.gameName || "";
    $("player-count").textContent =
      String(room.players.length) + " / " + (room.maxPlayers || 4);

    const list = $("player-list");
    list.innerHTML = "";
    room.players.forEach((p) => {
      const li = document.createElement("li");
      const dot = document.createElement("span");
      dot.className = "dot";
      const label = document.createElement("span");
      label.textContent = p.name;
      li.append(dot, label);
      if (p.id === state.myId) {
        const you = document.createElement("span");
        you.className = "you";
        you.textContent = "(you)";
        li.append(you);
      }
      if (p.isHost) {
        const crown = document.createElement("span");
        crown.className = "crown";
        crown.textContent = "👑 host";
        li.append(crown);
      }
      list.append(li);
    });

    if (!screens.lobby.classList.contains("active")) return;

    const amHost = room.hostId === state.myId;
    const need = room.minPlayers || 2;
    const max = room.maxPlayers || 4;
    const count = room.players.length;
    const startBtn = $("btn-start");
    const waiting = $("waiting-note");

    if (amHost) {
      startBtn.classList.remove("hidden");
      if (count < need) {
        startBtn.disabled = true;
        startBtn.textContent = "Need " + (need - count) + " more…";
      } else if (count > max) {
        startBtn.disabled = true;
        startBtn.textContent = (room.gameName || "This game") + " is " + max + " players max";
      } else {
        startBtn.disabled = false;
        startBtn.textContent = "Start game";
      }
      waiting.classList.add("hidden");
    } else {
      startBtn.classList.add("hidden");
      waiting.classList.remove("hidden");
    }
    $("qr-wrap").classList.toggle("hidden", !amHost || !state.joinUrl);

    // Host-only game switcher.
    if (amHost) {
      renderGameSwitch(room);
      $("switch-card").classList.remove("hidden");
    } else {
      $("switch-card").classList.add("hidden");
    }

    // Categories only apply to the quiz, and only the host chooses.
    if (amHost && room.gameType === "quiz" && Array.isArray(room.categories) && room.categories.length) {
      renderCategories(room.categories);
      $("cat-card").classList.remove("hidden");
    } else {
      $("cat-card").classList.add("hidden");
    }

    // Difficulty only applies to Sudoku, and only the host chooses.
    if (amHost && room.gameType === "sudoku") {
      state.sudokuDifficulty = room.difficulty || state.sudokuDifficulty;
      renderDiffList($("diff-list"), state.sudokuDifficulty, (key) => {
        state.sudokuDifficulty = key;
        socket.emit("setSudokuDifficulty", { difficulty: key }, () => {});
      });
      $("diff-card").classList.remove("hidden");
    } else {
      $("diff-card").classList.add("hidden");
    }
  }

  function renderCategories(cats) {
    if (!state.selectedCats) {
      state.selectedCats = new Set(cats.map((c) => c.name));
    }
    const list = $("cat-list");
    list.innerHTML = "";
    cats.forEach((c) => {
      const on = state.selectedCats.has(c.name);
      const chip = document.createElement("button");
      chip.className = "chip" + (on ? " on" : "");
      const name = document.createElement("span");
      name.className = "chip-name";
      name.textContent = c.name;
      const count = document.createElement("span");
      count.className = "chip-count";
      count.textContent = c.count;
      chip.append(name, count);
      chip.addEventListener("click", () => {
        if (state.selectedCats.has(c.name)) {
          if (state.selectedCats.size === 1) return;
          state.selectedCats.delete(c.name);
        } else {
          state.selectedCats.add(c.name);
        }
        renderCategories(cats);
      });
      list.append(chip);
    });
    $("cat-count").textContent = state.selectedCats.size + " / " + cats.length;
  }

  function renderGameSwitch(room) {
    const list = $("switch-list");
    list.innerHTML = "";
    GAME_LIST.forEach((g) => {
      const on = room.gameType === g.type;
      const btn = document.createElement("button");
      btn.className = "gs-btn" + (on ? " on" : "");
      btn.innerHTML =
        '<span class="gs-icon"></span><span class="gs-name"></span>';
      btn.querySelector(".gs-icon").textContent = g.icon;
      btn.querySelector(".gs-name").textContent = g.name;
      btn.addEventListener("click", () => {
        if (room.gameType === g.type) return;
        $("lobby-error").textContent = "";
        socket.emit("setGame", { gameType: g.type }, (res) => {
          if (res && !res.ok) $("lobby-error").textContent = res.error || "Could not switch.";
        });
      });
      list.append(btn);
    });
  }

  function hostRematch(errEl) {
    socket.emit("rematch", null, (res) => {
      if (res && !res.ok && errEl) errEl.textContent = res.error || "Could not restart.";
    });
  }

  // ============ QUIZ ============
  socket.on("gameStarted", () => {});

  socket.on("question", (data) => {
    stopTick();
    state.qIndex = data.index;
    state.seconds = data.seconds;
    state.endsAt = data.endsAt;
    state.picked = null;

    $("q-progress").textContent = "Q" + (data.index + 1) + " / " + data.total;
    $("q-text").textContent = data.question;
    $("q-status").textContent = "";

    const wrap = $("q-options");
    wrap.innerHTML = "";
    data.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "option";
      btn.innerHTML =
        '<span class="opt-letter">' + "ABCD"[i] + '</span><span class="opt-text"></span>';
      btn.querySelector(".opt-text").textContent = opt;
      btn.addEventListener("click", () => pickAnswer(i, btn));
      wrap.append(btn);
    });

    show("question");
    startTick();
  });

  function pickAnswer(choice, btn) {
    if (state.picked !== null) return;
    ensureAudio();
    state.picked = choice;

    document.querySelectorAll("#q-options .option").forEach((b, i) => {
      b.classList.add("locked");
      if (i === choice) b.classList.add("chosen");
    });
    $("q-status").textContent = "Locked in — waiting for others…";

    socket.emit("answer", { index: state.qIndex, choice }, () => {});
  }

  socket.on("answerCount", (d) => {
    if (!screens.question.classList.contains("active")) return;
    if (state.picked !== null) {
      $("q-status").textContent = "Locked in — " + d.answered + " / " + d.total + " answered";
    }
  });

  socket.on("reveal", (data) => {
    stopTick();
    const mine = data.results && data.results[state.myId];
    const correctIdx = data.correct;

    const icon = $("reveal-icon");
    const head = $("reveal-headline");
    if (!mine || !mine.answered) {
      icon.textContent = "⏳";
      head.textContent = "Time's up";
      head.className = "";
    } else if (mine.correct) {
      icon.textContent = "✅";
      head.textContent = "Correct! +" + mine.gained;
      head.className = "ok-text";
      celebrate();
    } else {
      icon.textContent = "❌";
      head.textContent = "Not quite";
      head.className = "danger-text";
    }

    const optBtns = document.querySelectorAll("#q-options .option .opt-text");
    const correctText = optBtns[correctIdx] ? optBtns[correctIdx].textContent : "";
    $("reveal-correct").textContent =
      "Answer: " + "ABCD"[correctIdx] + (correctText ? " — " + correctText : "");
    $("reveal-explain").textContent = data.explanation || "";

    renderBoard($("reveal-board"), data.scoreboard);
    $("reveal-next").textContent = data.isLast
      ? "Final scores coming up…"
      : "Next question in a moment…";

    show("reveal");
  });

  socket.on("gameOver", (data) => {
    stopTick();
    const board = data.scoreboard || [];
    renderBoard($("results-board"), board, data.winnerIds || []);

    const headline = $("results-headline");
    const sub = $("results-sub");
    if (!data.winnerIds || data.winnerIds.length === 0) {
      headline.textContent = "No winner";
      sub.textContent = "Nobody scored this round.";
    } else if (data.tie) {
      const names = board.filter((p) => data.winnerIds.includes(p.id)).map((p) => p.name);
      headline.textContent = "It's a tie!";
      sub.textContent = names.join(" & ") + " — " + board[0].score + " points each";
    } else {
      const w = board.find((p) => p.id === data.winnerIds[0]);
      headline.textContent = (w ? w.name : "Winner") + " wins!";
      sub.textContent =
        (w ? w.score : 0) + " points" + (data.winnerIds[0] === state.myId ? " — that's you 🎉" : "");
      if (data.winnerIds[0] === state.myId) celebrate();
    }

    const amHost = state.room && state.room.hostId === state.myId;
    $("btn-again").classList.toggle("hidden", !amHost);
    $("results-waiting").classList.toggle("hidden", amHost);
    show("results");
  });

  $("btn-again").addEventListener("click", () => socket.emit("playAgain", null, () => {}));
  socket.on("backToLobby", () => show("lobby"));

  // ============ TIC TAC TOE ============
  socket.on("ttt:state", (d) => {
    state.ttt = d;
    const myMark = d.marks[state.myId];
    const nameOf = (id) => {
      const p = d.players.find((x) => x.id === id);
      return p ? p.name : "Player";
    };

    const board = $("ttt-board");
    board.innerHTML = "";
    d.board.forEach((mark, i) => {
      const cell = document.createElement("button");
      cell.className = "ttt-cell" + (mark ? " filled mark-" + mark : "");
      if (d.line && d.line.includes(i)) cell.classList.add("win");
      cell.textContent = mark || "";
      const myTurn = d.state === "playing" && d.turn === state.myId && !mark;
      if (myTurn) {
        cell.addEventListener("click", () => socket.emit("ttt:move", { cell: i }));
      } else {
        cell.disabled = true;
      }
      board.append(cell);
    });

    const status = $("ttt-status");
    if (d.state === "over") {
      if (d.draw) {
        status.textContent = "It's a draw!";
        status.className = "center";
      } else if (d.winner === state.myId) {
        status.textContent = "You win! 🎉";
        status.className = "center ok-text";
        celebrate();
      } else {
        status.textContent = nameOf(d.winner) + " wins";
        status.className = "center danger-text";
      }
    } else {
      status.className = "center";
      if (d.turn === state.myId) {
        status.textContent = "Your turn (" + myMark + ")";
      } else {
        status.textContent = "Waiting for " + nameOf(d.turn) + " (" + d.marks[d.turn] + ")";
      }
    }

    const amHost = state.room && state.room.hostId === state.myId;
    const over = d.state === "over";
    $("btn-ttt-rematch").classList.toggle("hidden", !(over && amHost));
    $("ttt-waiting").classList.toggle("hidden", !(over && !amHost));

    show("ttt");
  });

  $("btn-ttt-rematch").addEventListener("click", () => hostRematch(null));

  // ============ WORDLE ============
  const WK_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

  socket.on("wordle:state", (d) => {
    // Reset the typed row whenever a new guess was accepted.
    if (d.me.guesses.length !== state.wordle.lastCount) {
      state.wordle.input = "";
      state.wordle.lastCount = d.me.guesses.length;
    }
    state.wordle.over = d.state === "over";
    state.wordle.data = d;
    renderWordle();
    show("wordle");
  });

  function renderWordle() {
    const d = state.wordle.data;
    if (!d) return;
    const max = d.me.maxGuesses || 6;
    const done = d.me.done || state.wordle.over;

    $("wordle-guesscount").textContent = d.me.guesses.length + " / " + max;

    // Grid
    const grid = $("wordle-grid");
    grid.innerHTML = "";
    for (let r = 0; r < max; r++) {
      const row = document.createElement("div");
      row.className = "wordle-row";
      const guess = d.me.guesses[r];
      const typing = !done && r === d.me.guesses.length ? state.wordle.input : null;
      for (let c = 0; c < 5; c++) {
        const tile = document.createElement("div");
        tile.className = "wordle-tile";
        if (guess) {
          tile.textContent = guess.word[c].toUpperCase();
          tile.classList.add("t-" + guess.result[c]);
        } else if (typing !== null && c < typing.length) {
          tile.textContent = typing[c].toUpperCase();
          tile.classList.add("t-typing");
        }
        row.append(tile);
      }
      grid.append(row);
    }

    // Keyboard letter states from my guesses
    const best = {};
    const rank = { correct: 3, present: 2, absent: 1 };
    d.me.guesses.forEach((g) => {
      g.word.split("").forEach((ch, i) => {
        const st = g.result[i];
        if (!best[ch] || rank[st] > rank[best[ch]]) best[ch] = st;
      });
    });
    const kb = $("wordle-keyboard");
    kb.innerHTML = "";
    WK_ROWS.forEach((rowStr, idx) => {
      const row = document.createElement("div");
      row.className = "wk-row";
      if (idx === 2) row.append(makeKey("↵", "enter", "wk-wide"));
      rowStr.split("").forEach((ch) => {
        row.append(makeKey(ch.toUpperCase(), ch, best[ch] ? "k-" + best[ch] : ""));
      });
      if (idx === 2) row.append(makeKey("⌫", "back", "wk-wide"));
      kb.append(row);
    });
    kb.classList.toggle("hidden", done);

    // Opponents / players progress
    const opps = d.opponents || [];
    $("wordle-opps").classList.toggle("hidden", opps.length === 0);
    const list = $("wordle-opp-list");
    list.innerHTML = "";
    opps.forEach((o) => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      name.className = "bname";
      name.textContent = o.name;
      const pts = document.createElement("span");
      pts.className = "pts";
      pts.textContent = o.solved ? "✅ " + o.guessCount : o.done ? "❌ " + o.guessCount : o.guessCount + " / " + max;
      li.append(name, pts);
      list.append(li);
    });

    // Status message / end banner
    const msg = $("wordle-msg");
    const banner = $("wordle-banner");
    if (state.wordle.over) {
      msg.textContent = "";
      banner.classList.remove("hidden");
      const won = d.winnerIds && d.winnerIds.includes(state.myId);
      const anyWinner = d.winnerIds && d.winnerIds.length > 0;
      $("wordle-banner-icon").textContent = won ? "🏆" : anyWinner ? "🙁" : "🫥";
      if (won) {
        $("wordle-banner-title").textContent = "You win!";
        $("wordle-banner-title").className = "ok-text";
      } else if (anyWinner) {
        const wname = (opps.find((o) => o.id === d.winnerIds[0]) || {}).name || "Someone";
        $("wordle-banner-title").textContent = wname + " wins";
        $("wordle-banner-title").className = "";
      } else {
        $("wordle-banner-title").textContent = "Nobody got it";
        $("wordle-banner-title").className = "";
      }
      $("wordle-banner-sub").textContent = d.secret
        ? "The word was " + d.secret.toUpperCase()
        : "";
      if (won) celebrate();
    } else {
      banner.classList.add("hidden");
      if (done) {
        msg.textContent = d.me.solved ? "Solved! Waiting for others…" : "Out of guesses. Waiting for others…";
      } else {
        msg.textContent = "";
      }
    }

    const amHost = state.room && state.room.hostId === state.myId;
    $("btn-wordle-rematch").classList.toggle("hidden", !(state.wordle.over && amHost));
    $("wordle-waiting").classList.toggle("hidden", !(state.wordle.over && !amHost));
  }

  function makeKey(label, key, cls) {
    const b = document.createElement("button");
    b.className = "wk-key " + (cls || "");
    b.textContent = label;
    b.addEventListener("click", () => wordleKey(key));
    return b;
  }

  function wordleKey(key) {
    const d = state.wordle.data;
    if (!d || state.wordle.over || d.me.done) return;
    if (key === "enter") {
      submitWordleGuess();
    } else if (key === "back") {
      state.wordle.input = state.wordle.input.slice(0, -1);
      renderWordle();
    } else if (/^[a-z]$/.test(key)) {
      if (state.wordle.input.length < 5) {
        state.wordle.input += key;
        renderWordle();
      }
    }
  }

  function submitWordleGuess() {
    const word = state.wordle.input;
    if (word.length !== 5) {
      $("wordle-msg").textContent = "Enter 5 letters";
      return;
    }
    socket.emit("wordle:guess", { word }, (res) => {
      if (res && !res.ok) {
        $("wordle-msg").textContent = res.error || "Not accepted";
      }
    });
  }

  $("btn-wordle-rematch").addEventListener("click", () => hostRematch(null));

  // Physical keyboard support for Wordle (handy on laptops).
  document.addEventListener("keydown", (e) => {
    if (!screens.wordle.classList.contains("active")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "Enter") wordleKey("enter");
    else if (e.key === "Backspace") wordleKey("back");
    else if (/^[a-zA-Z]$/.test(e.key)) wordleKey(e.key.toLowerCase());
  });

  // ============ SUDOKU ============
  socket.on("sudoku:start", (d) => {
    state.sudoku = {
      puzzle: d.puzzle,
      board: d.puzzle.slice(),
      given: d.puzzle.map((v) => v !== 0),
      selected: null,
      over: false,
      players: d.players || [],
      winnerIds: null,
      solution: null,
    };
    $("sudoku-msg").textContent = "";
    renderSudoku();
    show("sudoku");
  });

  socket.on("sudoku:progress", (d) => {
    if (!state.sudoku) return;
    state.sudoku.players = d.players || [];
    if (screens.sudoku.classList.contains("active")) renderSudoku();
  });

  socket.on("sudoku:over", (d) => {
    const s = state.sudoku;
    if (!s) return;
    s.over = true;
    s.players = d.players || s.players;
    s.winnerIds = d.winnerIds || [];
    s.solution = d.solution || null;
    if (s.solution) s.board = s.solution.slice(); // reveal the answer
    renderSudoku();
    if (s.winnerIds.includes(state.myId)) celebrate();
    show("sudoku");
  });

  function sudokuConflicts(board) {
    const bad = new Set();
    function scan(cells) {
      const seen = {};
      for (const i of cells) {
        const v = board[i];
        if (!v) continue;
        if (seen[v] !== undefined) {
          bad.add(i);
          bad.add(seen[v]);
        } else seen[v] = i;
      }
    }
    for (let u = 0; u < 9; u++) {
      const row = [];
      const col = [];
      const box = [];
      for (let k = 0; k < 9; k++) {
        row.push(u * 9 + k);
        col.push(k * 9 + u);
        const br = Math.floor(u / 3) * 3 + Math.floor(k / 3);
        const bc = (u % 3) * 3 + (k % 3);
        box.push(br * 9 + bc);
      }
      scan(row);
      scan(col);
      scan(box);
    }
    return bad;
  }

  function renderSudoku() {
    const s = state.sudoku;
    if (!s) return;
    const filled = s.board.filter((v) => v !== 0).length;
    $("sudoku-status").textContent = filled + " / 81";
    const conflicts = s.over ? new Set() : sudokuConflicts(s.board);

    const grid = $("sudoku-grid");
    grid.innerHTML = "";
    for (let i = 0; i < 81; i++) {
      const r = Math.floor(i / 9);
      const c = i % 9;
      const cell = document.createElement("button");
      cell.className = "sudoku-cell";
      if (s.given[i]) cell.classList.add("given");
      if (i === s.selected) cell.classList.add("sel");
      if (conflicts.has(i)) cell.classList.add("bad");
      if (c % 3 === 2 && c !== 8) cell.classList.add("br");
      if (r % 3 === 2 && r !== 8) cell.classList.add("bb");
      cell.textContent = s.board[i] ? s.board[i] : "";
      if (!s.given[i] && !s.over) {
        cell.addEventListener("click", () => {
          s.selected = i;
          renderSudoku();
        });
      } else {
        cell.disabled = true;
      }
      grid.append(cell);
    }

    const pad = $("sudoku-pad");
    pad.innerHTML = "";
    for (let n = 1; n <= 9; n++) {
      const b = document.createElement("button");
      b.className = "sudoku-key";
      b.textContent = String(n);
      b.addEventListener("click", () => placeSudoku(n));
      pad.append(b);
    }
    const er = document.createElement("button");
    er.className = "sudoku-key erase";
    er.textContent = "⌫";
    er.addEventListener("click", () => placeSudoku(0));
    pad.append(er);
    pad.classList.toggle("hidden", s.over);
    $("btn-sudoku-check").classList.toggle("hidden", s.over);

    const opps = (s.players || []).filter((p) => p.id !== state.myId);
    $("sudoku-opps").classList.toggle("hidden", opps.length === 0);
    const list = $("sudoku-opp-list");
    list.innerHTML = "";
    opps.forEach((o) => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      name.className = "bname";
      name.textContent = o.name;
      const pts = document.createElement("span");
      pts.className = "pts";
      pts.textContent = o.solved ? "✅ solved" : o.filled + " / 81";
      li.append(name, pts);
      list.append(li);
    });

    const banner = $("sudoku-banner");
    if (s.over) {
      banner.classList.remove("hidden");
      const won = s.winnerIds && s.winnerIds.includes(state.myId);
      const any = s.winnerIds && s.winnerIds.length > 0;
      $("sudoku-banner-icon").textContent = won ? "🏆" : any ? "🙁" : "⏳";
      const title = $("sudoku-banner-title");
      if (won) {
        title.textContent = "You solved it!";
        title.className = "ok-text";
      } else if (any) {
        const w = (opps.find((o) => o.id === s.winnerIds[0]) || {}).name || "Someone";
        title.textContent = w + " solved it first";
        title.className = "";
      } else {
        title.textContent = "Time's up";
        title.className = "";
      }
      $("sudoku-banner-sub").textContent = s.solution ? "Here's the finished grid." : "";
    } else {
      banner.classList.add("hidden");
    }

    const amHost = state.room && state.room.hostId === state.myId;
    $("btn-sudoku-rematch").classList.toggle("hidden", !(s.over && amHost));
    $("sudoku-waiting").classList.toggle("hidden", !(s.over && !amHost));
  }

  function placeSudoku(n) {
    const s = state.sudoku;
    if (!s || s.over) return;
    if (s.selected == null || s.given[s.selected]) return;
    s.board[s.selected] = n === 0 ? 0 : n;
    $("sudoku-msg").textContent = "";
    renderSudoku();
    reportSudokuProgress();
  }

  let sudokuProgTimer = null;
  function reportSudokuProgress() {
    if (sudokuProgTimer) return;
    sudokuProgTimer = setTimeout(() => {
      sudokuProgTimer = null;
      if (!state.sudoku) return;
      socket.emit("sudoku:progress", {
        filled: state.sudoku.board.filter((v) => v !== 0).length,
      });
    }, 400);
  }

  $("btn-sudoku-check").addEventListener("click", () => {
    const s = state.sudoku;
    if (!s || s.over) return;
    if (s.board.some((v) => v === 0)) {
      $("sudoku-msg").textContent = "Fill every cell first.";
      return;
    }
    socket.emit("sudoku:submit", { board: s.board }, (res) => {
      if (!res || !res.ok) {
        $("sudoku-msg").textContent = (res && res.error) || "Not solved yet — check for mistakes.";
      }
    });
  });

  $("btn-sudoku-rematch").addEventListener("click", () => hostRematch($("sudoku-msg")));

  // Physical keyboard for Sudoku (laptops).
  document.addEventListener("keydown", (e) => {
    if (!screens.sudoku.classList.contains("active")) return;
    const s = state.sudoku;
    if (!s || s.over) return;
    if (/^[1-9]$/.test(e.key)) placeSudoku(parseInt(e.key, 10));
    else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") placeSudoku(0);
    else if (s.selected != null && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      let i = s.selected;
      if (e.key === "ArrowUp" && i >= 9) i -= 9;
      if (e.key === "ArrowDown" && i < 72) i += 9;
      if (e.key === "ArrowLeft" && i % 9 !== 0) i -= 1;
      if (e.key === "ArrowRight" && i % 9 !== 8) i += 1;
      s.selected = i;
      renderSudoku();
      e.preventDefault();
    }
  });

  // ============ WORD SCRAMBLE ============
  socket.on("scramble:start", () => {
    state.scramble = { board: [], over: false, index: -1, solved: false };
  });

  socket.on("scramble:round", (d) => {
    stopScrambleTick();
    const s = state.scramble || (state.scramble = {});
    s.index = d.index;
    s.solved = false;
    s.over = false;
    s.board = d.scoreboard || s.board || [];

    $("scramble-progress").textContent = "R" + (d.index + 1) + " / " + d.total;
    $("scramble-hint").textContent = "Hint: " + d.hint + " · " + d.length + " letters";
    renderScrambleLetters(d.scrambled);

    $("scramble-input").value = "";
    $("scramble-input").disabled = false;
    $("scramble-submit").disabled = false;
    $("scramble-msg").textContent = "";
    $("scramble-msg").className = "muted center small";
    $("scramble-answer-row").classList.remove("hidden");
    $("scramble-reveal").classList.add("hidden");
    $("scramble-banner").classList.add("hidden");
    $("btn-scramble-rematch").classList.add("hidden");
    $("scramble-waiting").classList.add("hidden");

    renderScrambleBoard();
    show("scramble");
    startScrambleTick(d.endsAt, d.seconds);
    $("scramble-input").focus();
  });

  socket.on("scramble:solved", (d) => {
    if (!screens.scramble.classList.contains("active")) return;
    if (state.scramble && state.scramble.solved) {
      $("scramble-msg").textContent = "Solved! " + d.solved + " / " + d.total + " done";
    }
  });

  socket.on("scramble:reveal", (d) => {
    stopScrambleTick();
    const s = state.scramble || (state.scramble = {});
    s.board = d.scoreboard || [];
    const mine = d.results && d.results[state.myId];

    $("scramble-answer-row").classList.add("hidden");
    $("scramble-input").disabled = true;
    $("scramble-submit").disabled = true;
    $("scramble-msg").textContent = "";

    $("scramble-reveal").classList.remove("hidden");
    $("scramble-reveal-icon").textContent = mine && mine.solved ? "✅" : "💡";
    $("scramble-reveal-word").textContent = (d.answer || "").toUpperCase();
    $("scramble-reveal-note").textContent =
      mine && mine.solved
        ? "You got it! +" + mine.gained
        : d.isLast
        ? "Final scores coming up…"
        : "Next word in a moment…";

    renderScrambleBoard();
  });

  socket.on("scramble:over", (d) => {
    stopScrambleTick();
    const s = state.scramble || (state.scramble = {});
    s.over = true;
    s.board = d.scoreboard || [];

    $("scramble-answer-row").classList.add("hidden");
    $("scramble-reveal").classList.add("hidden");
    $("scramble-msg").textContent = "";

    const board = s.board;
    const banner = $("scramble-banner");
    banner.classList.remove("hidden");
    const won = d.winnerIds && d.winnerIds.includes(state.myId);
    const any = d.winnerIds && d.winnerIds.length > 0;
    const title = $("scramble-banner-title");
    $("scramble-banner-icon").textContent = won ? "🏆" : any ? "🙁" : "🫥";
    if (won) {
      title.textContent = "You win!";
      title.className = "ok-text";
    } else if (d.tie && any) {
      const names = board.filter((p) => d.winnerIds.includes(p.id)).map((p) => p.name);
      title.textContent = "It's a tie!";
      title.className = "";
      $("scramble-banner-sub").textContent = names.join(" & ") + " — " + (board[0] ? board[0].score : 0) + " points each";
    } else if (any) {
      const w = board.find((p) => p.id === d.winnerIds[0]);
      title.textContent = (w ? w.name : "Winner") + " wins!";
      title.className = "";
    } else {
      title.textContent = "No winner";
      title.className = "";
    }
    if (!(d.tie && any)) {
      const w = board.find((p) => p.id === (d.winnerIds && d.winnerIds[0]));
      $("scramble-banner-sub").textContent = any && w ? w.score + " points" : "Nobody scored.";
    }

    renderScrambleBoard();
    const amHost = state.room && state.room.hostId === state.myId;
    $("btn-scramble-rematch").classList.toggle("hidden", !amHost);
    $("scramble-waiting").classList.toggle("hidden", amHost);
    if (won) celebrate();
    show("scramble");
  });

  function renderScrambleLetters(scrambled) {
    const wrap = $("scramble-letters");
    wrap.innerHTML = "";
    (scrambled || "").split("").forEach((ch) => {
      const tile = document.createElement("span");
      tile.className = "sc-tile";
      tile.textContent = ch.toUpperCase();
      wrap.append(tile);
    });
  }

  function renderScrambleBoard() {
    const s = state.scramble;
    if (!s) return;
    renderBoard($("scramble-board"), s.board || []);
  }

  function submitScramble() {
    const s = state.scramble;
    if (!s || s.solved || s.over) return;
    const word = $("scramble-input").value.trim();
    if (!word) return;
    ensureAudio();
    socket.emit("scramble:guess", { index: s.index, word }, (res) => {
      if (!res) return;
      if (res.correct) {
        s.solved = true;
        $("scramble-input").disabled = true;
        $("scramble-submit").disabled = true;
        $("scramble-msg").textContent = "Solved! +" + res.gained + " 🎉";
        $("scramble-msg").className = "ok-text center small";
        celebrate();
      } else if (res.ok) {
        $("scramble-msg").textContent = "Not quite, keep trying";
        $("scramble-msg").className = "muted center small";
        $("scramble-input").select();
      } else if (res.error) {
        $("scramble-msg").textContent = res.error;
        $("scramble-msg").className = "muted center small";
      }
    });
  }

  $("scramble-submit").addEventListener("click", submitScramble);
  $("scramble-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitScramble();
  });
  $("btn-scramble-rematch").addEventListener("click", () => hostRematch($("scramble-msg")));

  function startScrambleTick(endsAt, seconds) {
    stopScrambleTick();
    const render = () => {
      const remaining = Math.max(0, endsAt - Date.now());
      const secs = Math.ceil(remaining / 1000);
      $("scramble-timer").textContent = String(secs);
      $("scramble-timer").classList.toggle("urgent", secs <= 5);
      $("scramble-timerbar").style.width =
        Math.max(0, Math.min(100, (remaining / (seconds * 1000)) * 100)) + "%";
      if (remaining <= 0) stopScrambleTick();
    };
    render();
    state.scrambleTick = setInterval(render, 200);
  }
  function stopScrambleTick() {
    if (state.scrambleTick) {
      clearInterval(state.scrambleTick);
      state.scrambleTick = null;
    }
  }

  // ============ HANGMAN ============
  socket.on("hangman:state", (d) => {
    state.hangman = { data: d, over: d.state === "over" };
    renderHangman();
    show("hangman");
  });

  function renderHangman() {
    const h = state.hangman;
    if (!h || !h.data) return;
    const d = h.data;
    const done = d.me.done || h.over;
    const reveal = h.over && d.secret;

    $("hangman-hint").textContent = "Hint: " + d.hint;
    const remaining = Math.max(0, d.me.maxWrong - d.me.wrong);
    $("hangman-lives").textContent = remaining + " ❤";

    // The word: revealed letters, or the full secret once the round is over.
    const letters = reveal ? d.secret.split("") : d.me.masked;
    const revealedSet = new Set((d.me.masked || []).filter(Boolean));
    const wordEl = $("hangman-word");
    wordEl.innerHTML = "";
    (letters || []).forEach((ch) => {
      const tile = document.createElement("span");
      tile.className = "hm-tile" + (ch ? "" : " blank");
      tile.textContent = ch ? ch.toUpperCase() : "_";
      wordEl.append(tile);
    });

    // Wrong letters guessed so far.
    const wrongLetters = (d.me.guessed || []).filter((l) => !revealedSet.has(l));
    $("hangman-misses").textContent = wrongLetters.length
      ? "Misses: " + wrongLetters.join(" ").toUpperCase() + " (" + d.me.wrong + " / " + d.me.maxWrong + ")"
      : "";

    // Keyboard (letters only). Colour guessed keys, disable them and everything
    // once this player is done or the round is over.
    const kb = $("hangman-keyboard");
    kb.innerHTML = "";
    const guessed = new Set(d.me.guessed || []);
    WK_ROWS.forEach((rowStr) => {
      const row = document.createElement("div");
      row.className = "wk-row";
      rowStr.split("").forEach((ch) => {
        const b = document.createElement("button");
        let cls = "wk-key";
        if (guessed.has(ch)) cls += revealedSet.has(ch) ? " k-correct" : " k-absent";
        b.className = cls;
        b.textContent = ch.toUpperCase();
        b.disabled = done || guessed.has(ch);
        b.addEventListener("click", () => hangmanGuess(ch));
        row.append(b);
      });
      kb.append(row);
    });
    kb.classList.toggle("hidden", done);

    // Per-player, when done but the round is still going.
    const msg = $("hangman-msg");
    if (!h.over && done) {
      msg.textContent = d.me.solved ? "Solved! Waiting for others…" : "Out of guesses. Waiting for others…";
    } else {
      msg.textContent = "";
    }

    // Opponents.
    const opps = d.opponents || [];
    $("hangman-opps").classList.toggle("hidden", opps.length === 0);
    const list = $("hangman-opp-list");
    list.innerHTML = "";
    opps.forEach((o) => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      name.className = "bname";
      name.textContent = o.name;
      const pts = document.createElement("span");
      pts.className = "pts";
      pts.textContent = o.solved
        ? "✅ " + o.wrong + " miss"
        : o.done
        ? "❌ out"
        : o.wrong + " / " + d.me.maxWrong + " miss";
      li.append(name, pts);
      list.append(li);
    });

    // End banner.
    const banner = $("hangman-banner");
    if (h.over) {
      banner.classList.remove("hidden");
      const won = d.winnerIds && d.winnerIds.includes(state.myId);
      const any = d.winnerIds && d.winnerIds.length > 0;
      $("hangman-banner-icon").textContent = won ? "🏆" : any ? "🙁" : "🫥";
      const title = $("hangman-banner-title");
      if (won) {
        title.textContent = "You win!";
        title.className = "ok-text";
      } else if (any) {
        const wname = (opps.find((o) => o.id === d.winnerIds[0]) || {}).name || "Someone";
        title.textContent = wname + " wins";
        title.className = "";
      } else {
        title.textContent = "Nobody got it";
        title.className = "";
      }
      $("hangman-banner-sub").textContent = d.secret ? "The word was " + d.secret.toUpperCase() : "";
      if (won) celebrate();
    } else {
      banner.classList.add("hidden");
    }

    const amHost = state.room && state.room.hostId === state.myId;
    $("btn-hangman-rematch").classList.toggle("hidden", !(h.over && amHost));
    $("hangman-waiting").classList.toggle("hidden", !(h.over && !amHost));
  }

  function hangmanGuess(letter) {
    const h = state.hangman;
    if (!h || h.over || !h.data || h.data.me.done) return;
    if ((h.data.me.guessed || []).includes(letter)) return;
    ensureAudio();
    socket.emit("hangman:guess", { letter }, () => {});
  }

  $("btn-hangman-rematch").addEventListener("click", () => hostRematch(null));

  // Physical keyboard support for Hangman (handy on laptops).
  document.addEventListener("keydown", (e) => {
    if (!screens.hangman.classList.contains("active")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[a-zA-Z]$/.test(e.key)) hangmanGuess(e.key.toLowerCase());
  });

  // ============ celebration: sound + confetti ============
  let audioCtx = null;
  function ensureAudio() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === "suspended") audioCtx.resume();
    } catch (_) {
      /* audio is a nicety */
    }
  }

  function playCorrectSound() {
    ensureAudio();
    if (!audioCtx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const now = audioCtx.currentTime;
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const t = now + i * 0.09;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        osc.start(t);
        osc.stop(t + 0.4);
      });
    } catch (_) {
      /* ignore */
    }
  }

  function dropConfetti() {
    const canvas = document.createElement("canvas");
    canvas.className = "confetti-canvas";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";

    const colors = ["#5b4cff", "#21a179", "#ffcc00", "#ff5c8a", "#00b3ff"];
    const parts = Array.from({ length: 130 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 * dpr - Math.random() * canvas.height * 0.3,
      r: (4 + Math.random() * 5) * dpr,
      c: colors[Math.floor(Math.random() * colors.length)],
      vx: (-1 + Math.random() * 2) * dpr,
      vy: (2 + Math.random() * 3.5) * dpr,
      rot: Math.random() * Math.PI,
      vr: -0.2 + Math.random() * 0.4,
    }));

    let start = null;
    const duration = 1900;
    function frame(ts) {
      if (start === null) start = ts;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      parts.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05 * dpr;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
        ctx.restore();
      });
      if (ts - start < duration) requestAnimationFrame(frame);
      else canvas.remove();
    }
    requestAnimationFrame(frame);
  }

  function celebrate() {
    playCorrectSound();
    dropConfetti();
  }

  // ---- quiz countdown timer ----
  function startTick() {
    render();
    state.tick = setInterval(render, 200);
    function render() {
      const remaining = Math.max(0, state.endsAt - Date.now());
      const secs = Math.ceil(remaining / 1000);
      $("q-timer").textContent = String(secs);
      const pct = Math.max(0, Math.min(100, (remaining / (state.seconds * 1000)) * 100));
      $("timerbar-fill").style.width = pct + "%";
      $("q-timer").classList.toggle("urgent", secs <= 5);
      if (remaining <= 0) stopTick();
    }
  }
  function stopTick() {
    if (state.tick) {
      clearInterval(state.tick);
      state.tick = null;
    }
  }

  function renderBoard(ul, board, winnerIds) {
    ul.innerHTML = "";
    board.forEach((p, i) => {
      const li = document.createElement("li");
      const rank = document.createElement("span");
      rank.className = "rank";
      rank.textContent = "#" + (i + 1);
      const name = document.createElement("span");
      name.className = "bname";
      name.textContent = p.name + (p.id === state.myId ? " (you)" : "");
      const pts = document.createElement("span");
      pts.className = "pts";
      pts.textContent = p.score;
      if (winnerIds && winnerIds.includes(p.id)) li.classList.add("winner");
      li.append(rank, name, pts);
      ul.append(li);
    });
  }

  // ============ boot ============
  if (linkCode) {
    goToNameForJoin(linkCode);
  } else {
    show("home");
  }
})();
