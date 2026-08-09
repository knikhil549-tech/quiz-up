// Tracks how many times each question has been shown, so the picker can
// favour the least-shown questions and cycle through the whole bank before
// repeating. Persisted to disk so the history survives across games.
//
// Note: on an ephemeral host (e.g. Render's free tier) the file is wiped on
// redeploy/restart, so history resets then. It still holds for the life of a
// running instance. For durable history across restarts, point DATA_DIR at a
// mounted disk or swap this module for a database.
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'question-stats.json');

// key (question text) -> number of times shown
let counts = {};
try {
  const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  if (parsed && typeof parsed === 'object') counts = parsed;
} catch (_) {
  /* first run or unreadable file: start from an empty history */
}

// Debounced write so a burst of shows doesn't hammer the disk.
let saveTimer = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(FILE, JSON.stringify(counts));
    } catch (_) {
      /* disk may be read-only/ephemeral; counts still live in memory */
    }
  }, 1000);
  if (saveTimer.unref) saveTimer.unref();
}

function getCount(key) {
  return counts[key] || 0;
}

function recordShown(key) {
  counts[key] = (counts[key] || 0) + 1;
  scheduleSave();
}

function snapshot() {
  return { ...counts };
}

module.exports = { getCount, recordShown, snapshot };
