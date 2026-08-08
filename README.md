# Quiz Up 🧠

A no-signup, scan-to-play quiz game for **2–4 players**, made for hangouts.
One person hosts on their screen, everyone else scans a QR code to join. No
accounts, no installs.

## How a round works

- Host creates a room → a **4-letter code** and a **QR code** appear.
- Others scan the QR (or type the code) and pick a name — they land straight in the lobby.
- Host picks one or more **categories** (Science & Nature, Geography, Movies, Music, General Knowledge) in the lobby. Questions are drawn only from the selected categories.
- Host starts once **2–4** players are in.
- **5 questions**, **30 seconds** each, **2 points** per correct answer.
- The clock is server-timed, so every device counts down together. If everyone
  locks in early, the round reveals immediately.
- After each question: the correct answer, a short explanation, and the running scores.
- Highest score wins. Ties are shown as a tie. Host can hit **Play again** to reset.

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

On this machine that is currently **http://192.168.1.23:3000**. Everyone must be
on the same Wi-Fi. (`localhost` only works on the host's own machine.)

## Project layout

- `server.js` — Express + Socket.IO. Rooms, lobby, and the quiz state machine (question → reveal → next → results).
- `questions.js` — the question bank grouped by category; each game pulls 5 at random from the host's selected categories.
- `public/` — the single-page client (`index.html`, `style.css`, `app.js`).

## Tuning

Knobs live at the top of `server.js`:

```js
const QUESTIONS_PER_GAME = 5;
const POINTS_PER_CORRECT = 2;
const ANSWER_SECONDS = 30;
const REVEAL_SECONDS = 5;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;
```

Add or edit questions in `questions.js` (each needs 4 options and a `correct` index 0–3).

## Notes

- State is in-memory and disposable — restarting the server clears all rooms.
- If the host leaves, the crown passes to the next player automatically.
