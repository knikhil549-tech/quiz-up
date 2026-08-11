// Word bank for Word Scramble and Hangman. Single words, lowercase, letters
// only, each with a short category hint. Kept common and recognisable so they
// are fair to unscramble or guess a letter at a time.
const GAME_WORDS = [
  { word: 'penguin', hint: 'Animal' },
  { word: 'dolphin', hint: 'Animal' },
  { word: 'elephant', hint: 'Animal' },
  { word: 'giraffe', hint: 'Animal' },
  { word: 'kangaroo', hint: 'Animal' },
  { word: 'leopard', hint: 'Animal' },
  { word: 'squirrel', hint: 'Animal' },
  { word: 'octopus', hint: 'Animal' },
  { word: 'hedgehog', hint: 'Animal' },
  { word: 'panther', hint: 'Animal' },
  { word: 'banana', hint: 'Fruit' },
  { word: 'apricot', hint: 'Fruit' },
  { word: 'avocado', hint: 'Fruit' },
  { word: 'coconut', hint: 'Fruit' },
  { word: 'pineapple', hint: 'Fruit' },
  { word: 'cherry', hint: 'Fruit' },
  { word: 'mango', hint: 'Fruit' },
  { word: 'lemon', hint: 'Fruit' },
  { word: 'canada', hint: 'Country' },
  { word: 'brazil', hint: 'Country' },
  { word: 'france', hint: 'Country' },
  { word: 'japan', hint: 'Country' },
  { word: 'egypt', hint: 'Country' },
  { word: 'mexico', hint: 'Country' },
  { word: 'norway', hint: 'Country' },
  { word: 'kenya', hint: 'Country' },
  { word: 'pancake', hint: 'Food' },
  { word: 'popcorn', hint: 'Food' },
  { word: 'sandwich', hint: 'Food' },
  { word: 'biscuit', hint: 'Food' },
  { word: 'noodle', hint: 'Food' },
  { word: 'pretzel', hint: 'Food' },
  { word: 'muffin', hint: 'Food' },
  { word: 'cricket', hint: 'Sport' },
  { word: 'hockey', hint: 'Sport' },
  { word: 'tennis', hint: 'Sport' },
  { word: 'cycling', hint: 'Sport' },
  { word: 'boxing', hint: 'Sport' },
  { word: 'archery', hint: 'Sport' },
  { word: 'karate', hint: 'Sport' },
  { word: 'crimson', hint: 'Colour' },
  { word: 'magenta', hint: 'Colour' },
  { word: 'turquoise', hint: 'Colour' },
  { word: 'lavender', hint: 'Colour' },
  { word: 'maroon', hint: 'Colour' },
  { word: 'trumpet', hint: 'Instrument' },
  { word: 'violin', hint: 'Instrument' },
  { word: 'guitar', hint: 'Instrument' },
  { word: 'flute', hint: 'Instrument' },
  { word: 'piano', hint: 'Instrument' },
  { word: 'rainbow', hint: 'Nature' },
  { word: 'volcano', hint: 'Nature' },
  { word: 'glacier', hint: 'Nature' },
  { word: 'thunder', hint: 'Weather' },
  { word: 'tornado', hint: 'Weather' },
  { word: 'blizzard', hint: 'Weather' },
  { word: 'galaxy', hint: 'Space' },
  { word: 'comet', hint: 'Space' },
  { word: 'meteor', hint: 'Space' },
  { word: 'saturn', hint: 'Space' },
  { word: 'lobster', hint: 'Ocean' },
  { word: 'anchor', hint: 'Ocean' },
  { word: 'seaweed', hint: 'Ocean' },
  { word: 'teacher', hint: 'Job' },
  { word: 'doctor', hint: 'Job' },
  { word: 'painter', hint: 'Job' },
  { word: 'farmer', hint: 'Job' },
  { word: 'dentist', hint: 'Job' },
  { word: 'jacket', hint: 'Clothing' },
  { word: 'sweater', hint: 'Clothing' },
  { word: 'sandal', hint: 'Clothing' },
  { word: 'scooter', hint: 'Vehicle' },
  { word: 'tractor', hint: 'Vehicle' },
  { word: 'bicycle', hint: 'Vehicle' },
];

function shuffleCopy(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// n distinct words for a Word Scramble game.
function pickGameWords(n) {
  return shuffleCopy(GAME_WORDS).slice(0, Math.min(n, GAME_WORDS.length));
}

// One word for a Hangman round.
function pickGameWord() {
  return GAME_WORDS[Math.floor(Math.random() * GAME_WORDS.length)];
}

module.exports = { GAME_WORDS, pickGameWords, pickGameWord };
