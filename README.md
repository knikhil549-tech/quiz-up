# Game Night 🎲

A no-signup, scan-to-play collection of party games for hangouts. One person
hosts on their screen, everyone else scans a QR code to join. No accounts, no
installs.

## The games

Pick one on the home screen:

- **Quiz Up** 🧠 — trivia race, 2–4 players. 10 questions, 30 seconds each, 2
  points per correct answer. Host picks one or more categories (Science &
  Nature, Geography, Movies, Music, General Knowledge). Highest score wins.
- **Tic Tac Toe** ⭕ — classic X vs O, exactly 2 players. Turn-based, with a
  highlighted winning line and a one-tap rematch. First player is X; the
  starter alternates each rematch.
- **Wordle** 🔤 — guess-the-word race, solo or 2–4 players. Everyone gets the
  same secret 5-letter word and their own board of 6 guesses. Guesses are
  checked against a real word list (built from the system dictionary), so only
  actual words are accepted. First to solve (fewest guesses) wins; if nobody
  solves, the word is revealed.
- **Sudoku** 🔢 — fill a 9×9 grid, solo or 2–4 players, with **Easy / Medium /
  Hard** difficulty (chosen on the solo screen or by the host in the lobby).
  Puzzles are generated with a guaranteed unique solution. In multiplayer
  everyone races the same puzzle; the first to complete it correctly wins and
  the finished grid is revealed to everyone.
- **Word Scramble** 🔀 — unscramble the word, solo or 2–4 players. 6 rounds of
  25 seconds each; every word comes with a category hint. Correct answers score
  2 points, plus 1 bonus for the first to solve each round. Highest total wins.
- **Hangman** 🔡 — guess the word letter by letter, solo or 2–4 players.
  Everyone gets the same secret word (with a category hint) and 6 wrong letters
  before they are out. First to reveal the whole word (fewest misses) wins; if
  nobody solves, the word is revealed.

**Solo mode:** Wordle, Sudoku, Word Scramble and Hangman can be played alone —
pick the game, choose "Play solo", and you start immediately (no room or second
player needed).

## How a room works

- Host picks a game → a **4-letter code** and a **QR code** appear.
- Others scan the QR (or type the code) and pick a name — they land straight in
  the lobby for whatever game the host chose.
- Host starts once enough players are in (2 minimum for every game; up to 4 for
  most, exactly 2 for Tic Tac Toe).
- Correct answers/wins play a short sound and drop a confetti burst.

## Run it

```bash
npm install
npm start
```

Then open **http://localhost:3000**.

### Playing across phones (same Wi-Fi)

For friends' phones to join, the host should open the app on the machine's LAN
address so the QR encodes an address the phones can reach:

```
http://<your-LAN-IP>:3000
```

Everyone must be on the same Wi-Fi. (`localhost` only works on the host's own
machine.) When deployed to a public host, just share that URL instead.

## Project layout

- `server.js` — Express + Socket.IO. Shared room/lobby, plus the state machine
  for each game (quiz, tic tac toe, wordle, sudoku, word scramble, hangman).
- `questions.js` — the quiz bank grouped by category.
- `words.js` — the Wordle secret-word list.
- `wordle-dict.js` — auto-generated list of valid 5-letter guesses (real words).
- `game-words.js` — word + category-hint bank for Word Scramble and Hangman.
- `history.js` — tracks how many times each quiz question has been shown so the
  picker favours the least-shown ones.
- `public/` — the single-page client (`index.html`, `style.css`, `app.js`).

## Tuning

Knobs live at the top of `server.js`, including per-game player limits:

```js
const QUESTIONS_PER_GAME = 10;
const POINTS_PER_CORRECT = 2;
const ANSWER_SECONDS = 30;
const REVEAL_SECONDS = 5;
const WORDLE_MAX_GUESSES = 6;
const WORDLE_SECONDS = 180;
const SCRAMBLE_ROUNDS = 6;
const SCRAMBLE_SECONDS = 25;
const HANGMAN_MAX_WRONG = 6;

const GAMES = {
  quiz: { min: 2, max: 4, name: 'Quiz Up' },
  ttt: { min: 2, max: 2, name: 'Tic Tac Toe' },
  wordle: { min: 2, max: 4, name: 'Wordle', solo: true },
  sudoku: { min: 2, max: 4, name: 'Sudoku', solo: true },
  scramble: { min: 2, max: 4, name: 'Word Scramble', solo: true },
  hangman: { min: 2, max: 4, name: 'Hangman', solo: true },
};
```

Add or edit quiz questions in `questions.js` (each needs 4 options and a
`correct` index 0–3). Add Wordle words in `words.js` (5 letters each).

## Notes

- State is in-memory and disposable — restarting the server clears all rooms.
- If the host leaves, the crown passes to the next player automatically.
- If a player leaves mid-game and there aren't enough left to continue, the room
  drops back to the lobby.
- Leaving a game asks for confirmation first, so a stray tap won't drop you out.
- Sudoku has no time limit — a round runs until someone solves it.
