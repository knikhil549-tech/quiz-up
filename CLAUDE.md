# Game Night — project guide

No-signup, scan-to-play multiplayer party games. One host, others join by QR /
4-letter code. Games: **Quiz Up**, **Tic Tac Toe**, **Wordle**, **Sudoku**
(Wordle & Sudoku also have a solo mode).

## Stack & layout
- Node + **Express + Socket.IO**, vanilla-JS single-page client. No build step.
- `server.js` — shared room/lobby + a state machine per game. Tuning constants
  and the `GAMES` map (per-game `min`/`max`/`solo`) are at the top.
- `questions.js` — quiz bank grouped by category · `words.js` — Wordle answers ·
  `wordle-dict.js` — valid-guess dictionary (auto-generated, see below) ·
  `history.js` — quiz question show-counts (persisted to `data/`, gitignored).
- `public/` — `index.html` (all screens), `app.js` (screen-routing client),
  `style.css`. Client routes by `state.gameType`; each screen is a `<section
  class="screen">` toggled by `show(name)`.

## Run locally
```bash
cd party-game && npm start   # PORT env optional; opens on :3000
```

## Deploy (important)
- Repo: **github.com/knikhil549-tech/quiz-up**, live at
  **https://quiz-up-9yrh.onrender.com** (Render, auto-deploys on push to
  `main`). The `gh` CLI is authenticated; `git push origin main` just works.
- **Any push to `main` restarts the server**, which wipes all in-memory rooms
  (state is not persisted). Render free tier also sleeps when idle (~30–60s cold
  start) and its disk resets on redeploy — so `data/` history does not survive.

## Conventions
- Light theme. **No em dashes** (org rule) — use commas/colons/parentheses.
- Match the existing code style; keep the client a thin renderer, game rules on
  the server (authoritative).
- If you change the Wordle answer list, regenerate the dictionary:
  ```bash
  node -e 'const fs=require("fs");const w=fs.readFileSync("/usr/share/dict/words","utf8").split(/\r?\n/);const s=new Set();for(const x of w)if(/^[a-z]{5}$/.test(x))s.add(x);for(const x of require("./words.js").WORDS)s.add(x);fs.writeFileSync("wordle-dict.js","module.exports = { VALID: new Set("+JSON.stringify([...s].sort())+") };\n");'
  ```

## Verifying changes (keep it cheap)
- Default: `node --check server.js` + a small `node -e` test of any changed pure
  logic (scoring, generation, validation). That catches most issues fast.
- Only spin up the browser + multi-tab flow for genuinely user-facing UI or
  real-time behavior — it is the most expensive kind of check.
- The Bash shell's cwd resets to the repo root between calls; always `cd
  party-game` (or use absolute paths) in each command.
