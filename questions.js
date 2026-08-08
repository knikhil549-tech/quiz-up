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
  {
    q: 'What is the largest mammal in the world?',
    options: ['African elephant', 'Blue whale', 'Giraffe', 'Great white shark'],
    correct: 1,
    explanation: 'The blue whale can grow to around 30 metres long.',
  },
  {
    q: 'How many colours are traditionally in a rainbow?',
    options: ['5', '6', '7', '9'],
    correct: 2,
    explanation: 'Red, orange, yellow, green, blue, indigo, violet.',
  },
  {
    q: 'Which country is home to the kangaroo?',
    options: ['Brazil', 'South Africa', 'Australia', 'India'],
    correct: 2,
    explanation: 'Kangaroos are native to Australia.',
  },
  {
    q: 'Who developed the theory of general relativity?',
    options: ['Isaac Newton', 'Albert Einstein', 'Niels Bohr', 'Galileo Galilei'],
    correct: 1,
    explanation: 'Einstein published general relativity in 1915.',
  },
  {
    q: 'What is the largest country in the world by area?',
    options: ['Canada', 'China', 'United States', 'Russia'],
    correct: 3,
    explanation: 'Russia spans about 17 million square kilometres.',
  },
  {
    q: 'How many players from one team are on a football (soccer) pitch?',
    options: ['9', '10', '11', '12'],
    correct: 2,
    explanation: 'Eleven per side, including the goalkeeper.',
  },
  {
    q: 'What is the freezing point of water in Celsius?',
    options: ['-10', '0', '32', '100'],
    correct: 1,
    explanation: 'Water freezes at 0 degrees Celsius (32 Fahrenheit).',
  },
  {
    q: 'Which instrument has 88 keys?',
    options: ['Guitar', 'Piano', 'Violin', 'Harp'],
    correct: 1,
    explanation: 'A standard piano has 88 keys.',
  },
  {
    q: 'Which gas makes up most of Earth’s atmosphere?',
    options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'],
    correct: 2,
    explanation: 'Nitrogen is about 78 percent of the air.',
  },
  {
    q: 'In which country is the Eiffel Tower?',
    options: ['Italy', 'France', 'Spain', 'Germany'],
    correct: 1,
    explanation: 'The Eiffel Tower is in Paris, France.',
  },
  {
    q: 'What is the square root of 144?',
    options: ['10', '11', '12', '14'],
    correct: 2,
    explanation: '12 x 12 = 144.',
  },
  {
    q: 'Which animal is known as the "King of the Jungle"?',
    options: ['Tiger', 'Lion', 'Elephant', 'Bear'],
    correct: 1,
    explanation: 'The lion carries the nickname despite living in grasslands.',
  },
  {
    q: 'What is the largest organ in the human body?',
    options: ['Liver', 'Brain', 'Skin', 'Heart'],
    correct: 2,
    explanation: 'The skin is the body’s largest organ.',
  },
  {
    q: 'Who wrote the "Harry Potter" book series?',
    options: ['J.R.R. Tolkien', 'J.K. Rowling', 'Roald Dahl', 'C.S. Lewis'],
    correct: 1,
    explanation: 'J.K. Rowling wrote the seven Harry Potter novels.',
  },
  {
    q: 'What is the capital of Japan?',
    options: ['Kyoto', 'Osaka', 'Tokyo', 'Seoul'],
    correct: 2,
    explanation: 'Tokyo is Japan’s capital and largest city.',
  },
  {
    q: 'How many legs does a spider have?',
    options: ['6', '8', '10', '12'],
    correct: 1,
    explanation: 'Spiders are arachnids and have eight legs.',
  },
  {
    q: 'What is the boiling point of water at sea level in Celsius?',
    options: ['80', '90', '100', '120'],
    correct: 2,
    explanation: 'Water boils at 100 degrees Celsius at sea level.',
  },
  {
    q: 'Which planet is closest to the Sun?',
    options: ['Venus', 'Mercury', 'Mars', 'Earth'],
    correct: 1,
    explanation: 'Mercury is the innermost planet.',
  },
  {
    q: 'What is the currency of the United Kingdom?',
    options: ['Euro', 'Dollar', 'Pound sterling', 'Franc'],
    correct: 2,
    explanation: 'The UK uses the pound sterling.',
  },
  {
    q: 'The Great Barrier Reef lies off the coast of which country?',
    options: ['Brazil', 'Australia', 'Mexico', 'Thailand'],
    correct: 1,
    explanation: 'It stretches along the coast of Queensland, Australia.',
  },
  {
    q: 'How many bones are in the adult human body?',
    options: ['201', '206', '210', '195'],
    correct: 1,
    explanation: 'Adults have 206 bones; babies are born with more.',
  },
  {
    q: 'What does "CPU" stand for?',
    options: [
      'Central Process Unit',
      'Central Processing Unit',
      'Computer Personal Unit',
      'Central Peripheral Unit',
    ],
    correct: 1,
    explanation: 'CPU is the Central Processing Unit.',
  },
  {
    q: 'Which element has the atomic number 1?',
    options: ['Helium', 'Oxygen', 'Hydrogen', 'Carbon'],
    correct: 2,
    explanation: 'Hydrogen is the first and lightest element.',
  },
  {
    q: 'In which sport would you perform a "slam dunk"?',
    options: ['Volleyball', 'Basketball', 'Tennis', 'Football'],
    correct: 1,
    explanation: 'A slam dunk is a basketball move.',
  },
  {
    q: 'What is the tallest animal in the world?',
    options: ['Elephant', 'Giraffe', 'Horse', 'Camel'],
    correct: 1,
    explanation: 'Giraffes can reach around 5.5 metres tall.',
  },
  {
    q: 'How many sides does a triangle have?',
    options: ['2', '3', '4', '5'],
    correct: 1,
    explanation: 'A triangle has three sides.',
  },
  {
    q: 'Which ocean lies between the Americas and Europe/Africa?',
    options: ['Pacific', 'Indian', 'Atlantic', 'Arctic'],
    correct: 2,
    explanation: 'The Atlantic Ocean separates the Americas from Europe and Africa.',
  },
  {
    q: 'Who is often called the "Father of the Computer"?',
    options: ['Alan Turing', 'Charles Babbage', 'Bill Gates', 'Steve Jobs'],
    correct: 1,
    explanation: 'Charles Babbage designed the first mechanical computer.',
  },
  {
    q: 'What is the main ingredient in guacamole?',
    options: ['Tomato', 'Avocado', 'Pepper', 'Onion'],
    correct: 1,
    explanation: 'Guacamole is made mainly from mashed avocado.',
  },
  {
    q: 'Which country gifted the Statue of Liberty to the USA?',
    options: ['United Kingdom', 'France', 'Spain', 'Italy'],
    correct: 1,
    explanation: 'France gave the statue to the USA in 1886.',
  },
  {
    q: 'What is the fastest land animal?',
    options: ['Lion', 'Cheetah', 'Horse', 'Leopard'],
    correct: 1,
    explanation: 'A cheetah can sprint at roughly 100 km/h.',
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
