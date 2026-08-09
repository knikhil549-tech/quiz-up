// Secret words for Wordle (all exactly 5 letters, lowercase, reasonably common).
// Guesses are not checked against a dictionary, so this list only needs to be
// words people can reasonably guess.
const WORDS = [
  'apple', 'brave', 'crane', 'drink', 'eagle', 'flame', 'ghost', 'house',
  'input', 'jolly', 'knife', 'lemon', 'mango', 'noble', 'ocean', 'piano',
  'queen', 'robot', 'sugar', 'table', 'ultra', 'vivid', 'whale', 'yield',
  'zebra', 'alien', 'angel', 'arrow', 'beach', 'bench', 'berry', 'black',
  'blaze', 'bloom', 'board', 'brain', 'bread', 'brick', 'brush', 'cabin',
  'candy', 'chair', 'charm', 'cheer', 'chess', 'chief', 'child', 'clean',
  'clear', 'click', 'cloud', 'coast', 'cream', 'crown', 'dance', 'delta',
  'dream', 'dress', 'drive', 'eager', 'earth', 'empty', 'event', 'fairy',
  'faith', 'fancy', 'feast', 'fever', 'field', 'first', 'flash', 'fleet',
  'float', 'focus', 'frost', 'fruit', 'giant', 'glass', 'globe', 'glory',
  'grace', 'grand', 'grape', 'grass', 'green', 'happy', 'heart', 'heavy',
  'honey', 'hotel', 'ideal', 'image', 'ivory', 'jewel', 'juice', 'laser',
  'laugh', 'light', 'lucky', 'lunar', 'magic', 'maple', 'medal', 'metal',
  'money', 'mouse', 'movie', 'music', 'north', 'novel', 'nurse', 'olive',
  'onion', 'opera', 'orbit', 'organ', 'otter', 'owner', 'panda', 'paper',
  'party', 'peace', 'pearl', 'pilot', 'pixel', 'pizza', 'plant', 'pride',
  'prize', 'proud', 'pulse', 'quest', 'quiet', 'radio', 'raven', 'ready',
  'river', 'roast', 'royal', 'salad', 'sauce', 'scarf', 'scout', 'shine',
  'shore', 'sight', 'skate', 'sleep', 'smart', 'smile', 'snake', 'solar',
  'sound', 'space', 'spark', 'spice', 'sport', 'stage', 'steam', 'stone',
  'storm', 'story', 'sunny', 'super', 'sweet', 'swing', 'sword', 'tiger',
  'toast', 'topic', 'torch', 'tower', 'track', 'train', 'treat', 'tribe',
  'trick', 'trust', 'tulip', 'twist', 'unity', 'urban', 'value', 'venue',
  'viral', 'vocal', 'voice', 'wagon', 'watch', 'water', 'wheat', 'wheel',
  'world', 'worth', 'yacht', 'young', 'youth',
];

function pickWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

module.exports = { WORDS, pickWord };
