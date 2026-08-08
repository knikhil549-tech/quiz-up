// A small general-knowledge bank. Each round pulls a random subset.
// options: exactly 4 choices. correct: index (0-3) into options.
const BANK = [
  {
    q: 'Which planet is the largest in our solar system?',
    options: ['Saturn', 'Jupiter', 'Neptune', 'Earth'],
    correct: 1,
    explanation: 'Jupiter is more than twice as massive as all the other planets combined.',
  },
  {
    q: 'What is the capital of Australia?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
    correct: 2,
    explanation: 'Canberra was purpose-built as the capital; Sydney and Melbourne are larger.',
  },
  {
    q: 'How many continents are there on Earth?',
    options: ['5', '6', '7', '8'],
    correct: 2,
    explanation: 'Asia, Africa, North America, South America, Antarctica, Europe, Australia.',
  },
  {
    q: 'Who painted the Mona Lisa?',
    options: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Vincent van Gogh'],
    correct: 1,
    explanation: 'Leonardo da Vinci painted it in the early 1500s.',
  },
  {
    q: 'What is the chemical symbol for gold?',
    options: ['Go', 'Gd', 'Au', 'Ag'],
    correct: 2,
    explanation: 'Au comes from the Latin "aurum". Ag is silver.',
  },
  {
    q: 'Which ocean is the largest?',
    options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
    correct: 3,
    explanation: 'The Pacific covers about a third of the planet.',
  },
  {
    q: 'In which year did World War II end?',
    options: ['1943', '1945', '1948', '1950'],
    correct: 1,
    explanation: 'The war ended in 1945.',
  },
  {
    q: 'What is the smallest prime number?',
    options: ['0', '1', '2', '3'],
    correct: 2,
    explanation: '2 is the smallest and the only even prime.',
  },
  {
    q: 'Which gas do plants primarily absorb from the air?',
    options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'],
    correct: 2,
    explanation: 'Plants take in CO2 for photosynthesis and release oxygen.',
  },
  {
    q: 'How many strings does a standard guitar have?',
    options: ['4', '5', '6', '7'],
    correct: 2,
    explanation: 'A standard guitar has 6 strings.',
  },
  {
    q: 'What is the tallest mountain above sea level?',
    options: ['K2', 'Mount Everest', 'Kilimanjaro', 'Denali'],
    correct: 1,
    explanation: 'Everest peaks at about 8,849 metres above sea level.',
  },
  {
    q: 'Which language has the most native speakers worldwide?',
    options: ['English', 'Hindi', 'Spanish', 'Mandarin Chinese'],
    correct: 3,
    explanation: 'Mandarin Chinese has the most native speakers.',
  },
  {
    q: 'What is the hardest naturally occurring substance?',
    options: ['Quartz', 'Diamond', 'Titanium', 'Granite'],
    correct: 1,
    explanation: 'Diamond tops the Mohs hardness scale at 10.',
  },
  {
    q: 'How many minutes are there in a full day?',
    options: ['1200', '1440', '1600', '2400'],
    correct: 1,
    explanation: '24 hours x 60 minutes = 1440.',
  },
  {
    q: 'Which country hosted the first modern Olympic Games in 1896?',
    options: ['France', 'Greece', 'Italy', 'United Kingdom'],
    correct: 1,
    explanation: 'The first modern Olympics were held in Athens, Greece.',
  },
  {
    q: 'What is the powerhouse of the cell?',
    options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi body'],
    correct: 2,
    explanation: 'Mitochondria generate most of the cell’s energy (ATP).',
  },
  {
    q: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Mercury', 'Jupiter'],
    correct: 1,
    explanation: 'Iron oxide (rust) on its surface gives Mars its red colour.',
  },
  {
    q: 'How many sides does a hexagon have?',
    options: ['5', '6', '7', '8'],
    correct: 1,
    explanation: 'A hexagon has 6 sides.',
  },
  {
    q: 'What is the currency of Japan?',
    options: ['Won', 'Yuan', 'Yen', 'Ringgit'],
    correct: 2,
    explanation: 'Japan uses the yen.',
  },
  {
    q: 'Who wrote the play "Romeo and Juliet"?',
    options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
    correct: 1,
    explanation: 'Shakespeare wrote it in the 1590s.',
  },
];

// Fisher-Yates shuffle, then take the first n.
function pickQuestions(n) {
  const a = BANK.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}

module.exports = { BANK, pickQuestions };
