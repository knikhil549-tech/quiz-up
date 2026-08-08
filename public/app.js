/* Quiz Up — room, lobby, and quiz client */
(function () {
  const socket = io();

  // --- tiny DOM helpers ---
  const $ = (id) => document.getElementById(id);
  const screens = {
    home: $("screen-home"),
    name: $("screen-name"),
    lobby: $("screen-lobby"),
    question: $("screen-question"),
    reveal: $("screen-reveal"),
    results: $("screen-results"),
  };
  function show(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[name].classList.add("active");
  }

  // --- local state ---
  const state = {
    mode: null, // 'create' | 'join'
    pendingCode: null, // code we're about to join
    myId: null,
    room: null, // latest lobby snapshot
    joinUrl: null,
    // per-question
    qIndex: -1,
    seconds: 30,
    endsAt: 0,
    picked: null, // index I tapped, or null
    tick: null, // interval handle for the countdown
    selectedCats: null, // Set of category names the host has chosen
  };

  // --- read ?room=CODE from the QR/link ---
  const params = new URLSearchParams(location.search);
  const linkCode = (params.get("room") || "").toUpperCase().trim();

  // ============ HOME ============
  $("btn-create").addEventListener("click", () => {
    state.mode = "create";
    state.pendingCode = null;
    $("name-title").textContent = "You're the host";
    $("name-sub").textContent = "Pick a name your friends will recognise.";
    $("input-name").value = "";
    $("name-error").textContent = "";
    show("name");
    $("input-name").focus();
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
      socket.emit("createRoom", { name }, onRoomJoined);
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
  function leaveToHome() {
    socket.emit("leaveRoom");
    location.href = location.origin; // clean slate, drops ?room=
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

  function applyLobby(room) {
    state.room = room;
    $("lobby-code").textContent = room.code;
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

    // Only touch the lobby controls while we're actually on the lobby screen.
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

    // Only the host chooses categories.
    if (amHost && Array.isArray(room.categories) && room.categories.length) {
      renderCategories(room.categories);
      $("cat-card").classList.remove("hidden");
    } else {
      $("cat-card").classList.add("hidden");
    }
  }

  function renderCategories(cats) {
    // Default to all categories selected the first time we see them.
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
          if (state.selectedCats.size === 1) return; // keep at least one on
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

  // ============ QUIZ ============
  socket.on("gameStarted", () => {
    // The first "question" event will drive the UI; nothing to do yet.
  });

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
        '<span class="opt-letter">' +
        "ABCD"[i] +
        '</span><span class="opt-text"></span>';
      btn.querySelector(".opt-text").textContent = opt;
      btn.addEventListener("click", () => pickAnswer(i, btn));
      wrap.append(btn);
    });

    show("question");
    startTick();
  });

  function pickAnswer(choice, btn) {
    if (state.picked !== null) return; // locked in already
    state.picked = choice;

    document.querySelectorAll("#q-options .option").forEach((b, i) => {
      b.classList.add("locked");
      if (i === choice) b.classList.add("chosen");
    });
    $("q-status").textContent = "Locked in — waiting for others…";

    socket.emit("answer", { index: state.qIndex, choice }, (res) => {
      if (res && !res.ok) {
        // Rare: server rejected (stale/late). Let the reveal correct things.
      }
    });
  }

  socket.on("answerCount", (d) => {
    if (!screens.question.classList.contains("active")) return;
    if (state.picked !== null) {
      $("q-status").textContent =
        "Locked in — " + d.answered + " / " + d.total + " answered";
    }
  });

  socket.on("reveal", (data) => {
    stopTick();
    const mine = data.results && data.results[state.myId];
    const correctIdx = data.correct;

    // Colour the options in place before switching screens is overkill;
    // the dedicated reveal screen tells the story clearly.
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
    } else {
      icon.textContent = "❌";
      head.textContent = "Not quite";
      head.className = "danger-text";
    }

    // We don't keep the option text around here, so show the letter + resolve
    // via the question screen buttons still in the DOM.
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
      const names = board
        .filter((p) => data.winnerIds.includes(p.id))
        .map((p) => p.name);
      headline.textContent = "It's a tie!";
      sub.textContent = names.join(" & ") + " — " + board[0].score + " points each";
    } else {
      const w = board.find((p) => p.id === data.winnerIds[0]);
      headline.textContent = (w ? w.name : "Winner") + " wins!";
      sub.textContent =
        (w ? w.score : 0) + " points" + (data.winnerIds[0] === state.myId ? " — that's you 🎉" : "");
    }

    const amHost = state.room && state.room.hostId === state.myId;
    $("btn-again").classList.toggle("hidden", !amHost);
    $("results-waiting").classList.toggle("hidden", amHost);
    show("results");
  });

  $("btn-again").addEventListener("click", () => {
    socket.emit("playAgain", null, () => {});
  });

  socket.on("backToLobby", () => {
    // The follow-up "lobby" event repaints the list; just switch screens.
    show("lobby");
  });

  // ---- countdown timer (client-side, synced to server endsAt) ----
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

  // ---- shared scoreboard renderer ----
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
