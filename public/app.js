/* Game Night — room + lobby + Quiz / Tic Tac Toe / Wordle clients */
(function () {
  const socket = io();

  const $ = (id) => document.getElementById(id);
  const screens = {
    home: $("screen-home"),
    name: $("screen-name"),
    lobby: $("screen-lobby"),
    question: $("screen-question"),
    reveal: $("screen-reveal"),
    results: $("screen-results"),
    ttt: $("screen-ttt"),
    wordle: $("screen-wordle"),
  };
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
  };

  const params = new URLSearchParams(location.search);
  const linkCode = (params.get("room") || "").toUpperCase().trim();

  // ============ HOME (launcher) ============
  document.querySelectorAll(".game-card").forEach((card) => {
    card.addEventListener("click", () => {
      ensureAudio();
      state.mode = "create";
      state.pendingGame = card.getAttribute("data-game") || "quiz";
      state.pendingCode = null;
      const label = card.querySelector(".gc-name").textContent;
      $("name-title").textContent = "Hosting " + label;
      $("name-sub").textContent = "Pick a name your friends will recognise.";
      $("input-name").value = "";
      $("name-error").textContent = "";
      show("name");
      $("input-name").focus();
    });
  });

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
      socket.emit("createRoom", { name, gameType: state.pendingGame }, onRoomJoined);
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

  $("btn-leave").addEventListener("click", leaveToHome);
  $("btn-results-leave").addEventListener("click", leaveToHome);
  $("btn-ttt-leave").addEventListener("click", leaveToHome);
  $("btn-wordle-leave").addEventListener("click", leaveToHome);
  function leaveToHome() {
    socket.emit("leaveRoom");
    location.href = location.origin;
  }

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
    const enough = room.players.length >= need;
    const startBtn = $("btn-start");
    const waiting = $("waiting-note");

    if (amHost) {
      startBtn.classList.remove("hidden");
      startBtn.disabled = !enough;
      startBtn.textContent = enough
        ? "Start game"
        : "Need " + (need - room.players.length) + " more…";
      waiting.classList.add("hidden");
    } else {
      startBtn.classList.add("hidden");
      waiting.classList.remove("hidden");
    }
    $("qr-wrap").classList.toggle("hidden", !amHost || !state.joinUrl);

    // Categories only apply to the quiz, and only the host chooses.
    if (amHost && room.gameType === "quiz" && Array.isArray(room.categories) && room.categories.length) {
      renderCategories(room.categories);
      $("cat-card").classList.remove("hidden");
    } else {
      $("cat-card").classList.add("hidden");
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
