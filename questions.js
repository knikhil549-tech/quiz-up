// Questions grouped by category. Each game pulls a random subset from the
// categories the host selected in the lobby.
// options: exactly 4 choices. correct: index (0-3) into options.
// Apostrophes in explanations use the curly ’ on purpose so they sit safely
// inside single-quoted strings.
const CATEGORY_QUESTIONS = {
  'Science & Nature': [
    {
      q: 'Which planet is the largest in our solar system?',
      options: ['Saturn', 'Jupiter', 'Neptune', 'Earth'],
      correct: 1,
      explanation: 'Jupiter is more than twice as massive as all the other planets combined.',
    },
    {
      q: 'What is the chemical symbol for gold?',
      options: ['Go', 'Gd', 'Au', 'Ag'],
      correct: 2,
      explanation: 'Au comes from the Latin "aurum". Ag is silver.',
    },
    {
      q: 'Which gas do plants primarily absorb from the air?',
      options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'],
      correct: 2,
      explanation: 'Plants take in CO2 for photosynthesis and release oxygen.',
    },
    {
      q: 'What is the hardest naturally occurring substance?',
      options: ['Quartz', 'Diamond', 'Titanium', 'Granite'],
      correct: 1,
      explanation: 'Diamond tops the Mohs hardness scale at 10.',
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
      q: 'Who developed the theory of general relativity?',
      options: ['Isaac Newton', 'Albert Einstein', 'Niels Bohr', 'Galileo Galilei'],
      correct: 1,
      explanation: 'Einstein published general relativity in 1915.',
    },
    {
      q: 'What is the freezing point of water in Celsius?',
      options: ['-10', '0', '32', '100'],
      correct: 1,
      explanation: 'Water freezes at 0 degrees Celsius (32 Fahrenheit).',
    },
    {
      q: 'Which gas makes up most of Earth’s atmosphere?',
      options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'],
      correct: 2,
      explanation: 'Nitrogen is about 78 percent of the air.',
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
      q: 'How many bones are in the adult human body?',
      options: ['201', '206', '210', '195'],
      correct: 1,
      explanation: 'Adults have 206 bones; babies are born with more.',
    },
    {
      q: 'Which element has the atomic number 1?',
      options: ['Helium', 'Oxygen', 'Hydrogen', 'Carbon'],
      correct: 2,
      explanation: 'Hydrogen is the first and lightest element.',
    },
    {
      q: 'What is the tallest animal in the world?',
      options: ['Elephant', 'Giraffe', 'Horse', 'Camel'],
      correct: 1,
      explanation: 'Giraffes can reach around 5.5 metres tall.',
    },
    {
      q: 'What is the fastest land animal?',
      options: ['Lion', 'Cheetah', 'Horse', 'Leopard'],
      correct: 1,
      explanation: 'A cheetah can sprint at roughly 100 km/h.',
    },
    {
      q: 'What is the most abundant metal in the Earth’s crust?',
      options: ['Iron', 'Aluminium', 'Copper', 'Calcium'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'Aluminium makes up about 8 percent of the crust by mass.',
    },
    {
      q: 'Which subatomic particle carries no electric charge?',
      options: ['Proton', 'Electron', 'Neutron', 'Positron'],
      correct: 2,
      difficulty: 'hard',
      explanation: 'Neutrons are electrically neutral; protons are positive and electrons negative.',
    },
    {
      q: 'What is the pH of a neutral solution at 25 degrees Celsius?',
      options: ['0', '7', '14', '1'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'A neutral solution has a pH of 7; below is acidic, above is basic.',
    },
    {
      q: 'Who formulated the three laws of planetary motion?',
      options: ['Copernicus', 'Johannes Kepler', 'Isaac Newton', 'Tycho Brahe'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'Kepler derived the laws from Tycho Brahe’s observational data.',
    },
    {
      q: 'The building blocks of DNA are known as what?',
      options: ['Amino acids', 'Nucleotides', 'Codons', 'Peptides'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'DNA is a chain of nucleotides; amino acids build proteins.',
    },
    {
      q: 'Which metal is a liquid at room temperature?',
      options: ['Gallium', 'Mercury', 'Sodium', 'Lead'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'Mercury is the only metal that is liquid at ordinary room temperature.',
    },
    {
      q: 'The speed of light in a vacuum is closest to how many km per second?',
      options: ['30,000', '150,000', '300,000', '3,000,000'],
      correct: 2,
      difficulty: 'hard',
      explanation: 'Light travels at about 299,792 km/s, roughly 300,000 km/s.',
    },
    {
      q: 'What is the largest moon of Saturn?',
      options: ['Europa', 'Titan', 'Ganymede', 'Io'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'Titan is Saturn’s largest moon; Ganymede orbits Jupiter.',
    },
    {
      q: 'Which type of blood cell mainly fights infection?',
      options: ['Red blood cells', 'White blood cells', 'Platelets', 'Plasma'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'White blood cells (leukocytes) defend the body against infection.',
    },
    {
      q: 'What process converts a liquid into a gas below its boiling point?',
      options: ['Condensation', 'Evaporation', 'Sublimation', 'Deposition'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'Evaporation occurs at the surface of a liquid below boiling point.',
    },
  ],

  Geography: [
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
      q: 'Which ocean is the largest?',
      options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
      correct: 3,
      explanation: 'The Pacific covers about a third of the planet.',
    },
    {
      q: 'What is the tallest mountain above sea level?',
      options: ['K2', 'Mount Everest', 'Kilimanjaro', 'Denali'],
      correct: 1,
      explanation: 'Everest peaks at about 8,849 metres above sea level.',
    },
    {
      q: 'Which country is home to the kangaroo?',
      options: ['Brazil', 'South Africa', 'Australia', 'India'],
      correct: 2,
      explanation: 'Kangaroos are native to Australia.',
    },
    {
      q: 'What is the largest country in the world by area?',
      options: ['Canada', 'China', 'United States', 'Russia'],
      correct: 3,
      explanation: 'Russia spans about 17 million square kilometres.',
    },
    {
      q: 'In which country is the Eiffel Tower?',
      options: ['Italy', 'France', 'Spain', 'Germany'],
      correct: 1,
      explanation: 'The Eiffel Tower is in Paris, France.',
    },
    {
      q: 'What is the capital of Japan?',
      options: ['Kyoto', 'Osaka', 'Tokyo', 'Seoul'],
      correct: 2,
      explanation: 'Tokyo is Japan’s capital and largest city.',
    },
    {
      q: 'The Great Barrier Reef lies off the coast of which country?',
      options: ['Brazil', 'Australia', 'Mexico', 'Thailand'],
      correct: 1,
      explanation: 'It stretches along the coast of Queensland, Australia.',
    },
    {
      q: 'Which ocean lies between the Americas and Europe/Africa?',
      options: ['Pacific', 'Indian', 'Atlantic', 'Arctic'],
      correct: 2,
      explanation: 'The Atlantic Ocean separates the Americas from Europe and Africa.',
    },
    {
      q: 'What is the capital of Canada?',
      options: ['Toronto', 'Ottawa', 'Vancouver', 'Montreal'],
      correct: 1,
      explanation: 'Ottawa is Canada’s capital.',
    },
    {
      q: 'What is the capital of Egypt?',
      options: ['Alexandria', 'Cairo', 'Giza', 'Luxor'],
      correct: 1,
      explanation: 'Cairo is Egypt’s capital and largest city.',
    },
    {
      q: 'What is the capital of Brazil?',
      options: ['Rio de Janeiro', 'Sao Paulo', 'Brasilia', 'Salvador'],
      correct: 2,
      explanation: 'Brasilia was built to be the capital and opened in 1960.',
    },
    {
      q: 'What is the capital of Spain?',
      options: ['Barcelona', 'Madrid', 'Seville', 'Valencia'],
      correct: 1,
      explanation: 'Madrid is Spain’s capital.',
    },
    {
      q: 'What is the capital of Germany?',
      options: ['Munich', 'Frankfurt', 'Berlin', 'Hamburg'],
      correct: 2,
      explanation: 'Berlin is Germany’s capital.',
    },
    {
      q: 'What is the capital of Italy?',
      options: ['Milan', 'Venice', 'Rome', 'Naples'],
      correct: 2,
      explanation: 'Rome is Italy’s capital.',
    },
    {
      q: 'What is the capital of Russia?',
      options: ['Saint Petersburg', 'Moscow', 'Kazan', 'Sochi'],
      correct: 1,
      explanation: 'Moscow is Russia’s capital.',
    },
    {
      q: 'What is the capital of India?',
      options: ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'],
      correct: 1,
      explanation: 'New Delhi is the capital of India.',
    },
    {
      q: 'What is the capital of South Korea?',
      options: ['Busan', 'Seoul', 'Incheon', 'Daegu'],
      correct: 1,
      explanation: 'Seoul is South Korea’s capital.',
    },
    {
      q: 'What is the capital of Argentina?',
      options: ['Santiago', 'Buenos Aires', 'Lima', 'Bogota'],
      correct: 1,
      explanation: 'Buenos Aires is Argentina’s capital.',
    },
    {
      q: 'What is the capital of Kenya?',
      options: ['Mombasa', 'Nairobi', 'Kampala', 'Addis Ababa'],
      correct: 1,
      explanation: 'Nairobi is Kenya’s capital.',
    },
    {
      q: 'What is the capital of Kazakhstan?',
      options: ['Almaty', 'Astana', 'Bishkek', 'Tashkent'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'Astana is the capital; Almaty is the largest city.',
    },
    {
      q: 'The Atacama, one of the driest deserts on Earth, lies mainly in which country?',
      options: ['Peru', 'Chile', 'Argentina', 'Bolivia'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'The Atacama Desert runs along northern Chile.',
    },
    {
      q: 'Which strait separates Europe from Africa?',
      options: ['Bosphorus', 'Strait of Gibraltar', 'Strait of Hormuz', 'Bering Strait'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'The Strait of Gibraltar links the Mediterranean to the Atlantic.',
    },
    {
      q: 'Mount Kilimanjaro, Africa’s highest peak, is in which country?',
      options: ['Kenya', 'Tanzania', 'Uganda', 'Ethiopia'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'Kilimanjaro rises in northeastern Tanzania.',
    },
    {
      q: 'What is the smallest country in the world by area?',
      options: ['Monaco', 'Nauru', 'Vatican City', 'San Marino'],
      correct: 2,
      difficulty: 'hard',
      explanation: 'Vatican City covers about 0.44 square kilometres.',
    },
    {
      q: 'Lake Baikal, the world’s deepest lake, is located in which country?',
      options: ['Mongolia', 'Russia', 'China', 'Kazakhstan'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'Baikal lies in southern Siberia, Russia.',
    },
    {
      q: 'What is the capital of New Zealand?',
      options: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'Wellington is the capital; Auckland is the largest city.',
    },
    {
      q: 'Which country has the most natural lakes?',
      options: ['Russia', 'United States', 'Canada', 'Finland'],
      correct: 2,
      difficulty: 'hard',
      explanation: 'Canada holds more lakes than the rest of the world combined.',
    },
    {
      q: 'The Danube river flows through the most countries of any river. Roughly how many?',
      options: ['4', '6', '10', '14'],
      correct: 2,
      difficulty: 'hard',
      explanation: 'The Danube passes through about 10 countries in central and eastern Europe.',
    },
    {
      q: 'What is the capital of Switzerland?',
      options: ['Zurich', 'Geneva', 'Bern', 'Basel'],
      correct: 2,
      difficulty: 'hard',
      explanation: 'Bern is the seat of government; Zurich and Geneva are larger cities.',
    },
  ],

  Movies: [
    {
      q: 'Which 1997 film features the sinking of a famous ocean liner?',
      options: ['Titanic', 'The Poseidon Adventure', 'Pearl Harbor', 'Life of Pi'],
      correct: 0,
      explanation: 'James Cameron’s Titanic won 11 Academy Awards.',
    },
    {
      q: 'Who directed the 1993 film "Jurassic Park"?',
      options: ['James Cameron', 'Steven Spielberg', 'George Lucas', 'Ridley Scott'],
      correct: 1,
      explanation: 'Steven Spielberg directed Jurassic Park.',
    },
    {
      q: 'In "The Lion King", what is the name of the young cub who becomes king?',
      options: ['Mufasa', 'Scar', 'Simba', 'Nala'],
      correct: 2,
      explanation: 'Simba is the young lion at the heart of the story.',
    },
    {
      q: 'Which film series features the pirate Jack Sparrow?',
      options: ['Pirates of the Caribbean', 'Treasure Island', 'Master and Commander', 'The Goonies'],
      correct: 0,
      explanation: 'Jack Sparrow is played by Johnny Depp in Pirates of the Caribbean.',
    },
    {
      q: 'What is the name of the wizarding school in the Harry Potter films?',
      options: ['Beauxbatons', 'Hogwarts', 'Durmstrang', 'Ilvermorny'],
      correct: 1,
      explanation: 'Hogwarts School of Witchcraft and Wizardry.',
    },
    {
      q: 'Which animated film follows a clownfish searching for his son?',
      options: ['Shark Tale', 'Finding Nemo', 'The Little Mermaid', 'Moana'],
      correct: 1,
      explanation: 'Marlin searches for Nemo in Finding Nemo.',
    },
    {
      q: 'Who played Iron Man in the Marvel Cinematic Universe?',
      options: ['Chris Evans', 'Chris Hemsworth', 'Robert Downey Jr.', 'Mark Ruffalo'],
      correct: 2,
      explanation: 'Robert Downey Jr. played Tony Stark / Iron Man.',
    },
    {
      q: 'In which film would you hear the line "May the Force be with you"?',
      options: ['Star Trek', 'Star Wars', 'Guardians of the Galaxy', 'Dune'],
      correct: 1,
      explanation: 'It is the iconic farewell from Star Wars.',
    },
    {
      q: 'Which film features a giant ape climbing the Empire State Building?',
      options: ['Godzilla', 'King Kong', 'Rampage', 'Mighty Joe Young'],
      correct: 1,
      explanation: 'King Kong famously scales the skyscraper.',
    },
    {
      q: 'In "The Matrix", which colour pill does Neo take?',
      options: ['Blue', 'Green', 'Red', 'Yellow'],
      correct: 2,
      explanation: 'The red pill reveals the truth of the Matrix.',
    },
    {
      q: 'Who directed the 1994 film "Pulp Fiction"?',
      options: ['Martin Scorsese', 'Quentin Tarantino', 'David Fincher', 'Joel Coen'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'Quentin Tarantino wrote and directed Pulp Fiction.',
    },
    {
      q: 'Which 2019 film was the first non-English language film to win Best Picture?',
      options: ['Roma', 'Parasite', 'Amour', 'Drive My Car'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'Bong Joon-ho’s Parasite won Best Picture in 2020.',
    },
    {
      q: 'Who played the Joker in the 2008 film "The Dark Knight"?',
      options: ['Jack Nicholson', 'Heath Ledger', 'Joaquin Phoenix', 'Jared Leto'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'Heath Ledger won a posthumous Oscar for the role.',
    },
    {
      q: 'Who composed the scores for "Jaws", "Star Wars", and "Jurassic Park"?',
      options: ['Hans Zimmer', 'John Williams', 'Ennio Morricone', 'Danny Elfman'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'John Williams composed all three iconic scores.',
    },
    {
      q: 'In "The Godfather", what is the surname of the central crime family?',
      options: ['Soprano', 'Corleone', 'Barzini', 'Tattaglia'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'The story centres on the Corleone family.',
    },
    {
      q: 'In "2001: A Space Odyssey", what is the name of the sentient computer?',
      options: ['HAL 9000', 'Skynet', 'Deep Thought', 'GERTY'],
      correct: 0,
      difficulty: 'hard',
      explanation: 'HAL 9000 controls the spacecraft Discovery One.',
    },
    {
      q: 'Which director made "Vertigo", "Psycho", and "Rear Window"?',
      options: ['Stanley Kubrick', 'Alfred Hitchcock', 'Billy Wilder', 'Orson Welles'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'Alfred Hitchcock, the "Master of Suspense", directed all three.',
    },
    {
      q: 'Which film won the very first Academy Award for Best Picture?',
      options: ['Wings', 'Sunrise', 'The Jazz Singer', 'Metropolis'],
      correct: 0,
      difficulty: 'hard',
      explanation: 'Wings won at the first Oscars ceremony in 1929.',
    },
    {
      q: '"Citizen Kane" was co-written, directed by, and starred which filmmaker?',
      options: ['Orson Welles', 'Charlie Chaplin', 'John Ford', 'Frank Capra'],
      correct: 0,
      difficulty: 'hard',
      explanation: 'Orson Welles made Citizen Kane in 1941 at age 25.',
    },
    {
      q: 'Which film held the record as highest-grossing of all time just before "Avatar" (2009)?',
      options: ['Titanic', 'Jurassic Park', 'The Dark Knight', 'The Return of the King'],
      correct: 0,
      difficulty: 'hard',
      explanation: 'Titanic (1997) held the record until Avatar surpassed it.',
    },
  ],

  Music: [
    {
      q: 'How many strings does a standard guitar have?',
      options: ['4', '5', '6', '7'],
      correct: 2,
      explanation: 'A standard guitar has 6 strings.',
    },
    {
      q: 'Which instrument has 88 keys?',
      options: ['Guitar', 'Piano', 'Violin', 'Harp'],
      correct: 1,
      explanation: 'A standard piano has 88 keys.',
    },
    {
      q: 'Which band released the album "Abbey Road"?',
      options: ['The Rolling Stones', 'The Beatles', 'Queen', 'Pink Floyd'],
      correct: 1,
      explanation: 'Abbey Road was released by The Beatles in 1969.',
    },
    {
      q: 'Who is widely known as the "King of Pop"?',
      options: ['Elvis Presley', 'Michael Jackson', 'Prince', 'Freddie Mercury'],
      correct: 1,
      explanation: 'Michael Jackson earned the title King of Pop.',
    },
    {
      q: 'How many strings does a standard violin have?',
      options: ['3', '4', '5', '6'],
      correct: 1,
      explanation: 'A violin has four strings: G, D, A, and E.',
    },
    {
      q: 'Which instrument is Yo-Yo Ma famous for playing?',
      options: ['Violin', 'Cello', 'Piano', 'Flute'],
      correct: 1,
      explanation: 'Yo-Yo Ma is a world-renowned cellist.',
    },
    {
      q: '"Bohemian Rhapsody" is a song by which band?',
      options: ['The Who', 'Led Zeppelin', 'Queen', 'The Eagles'],
      correct: 2,
      explanation: 'Queen released Bohemian Rhapsody in 1975.',
    },
    {
      q: 'Who sang the hit "Rolling in the Deep"?',
      options: ['Beyonce', 'Adele', 'Rihanna', 'Taylor Swift'],
      correct: 1,
      explanation: 'Adele released it on her album 21.',
    },
    {
      q: 'In music, what does the term "forte" mean?',
      options: ['Slow', 'Loud', 'Soft', 'Fast'],
      correct: 1,
      explanation: 'Forte means to play loudly.',
    },
    {
      q: 'Which of these is a woodwind instrument?',
      options: ['Trumpet', 'Clarinet', 'Trombone', 'Cello'],
      correct: 1,
      explanation: 'The clarinet is a woodwind; the others are brass or string.',
    },
    {
      q: 'Which composer wrote the set of concertos known as "The Four Seasons"?',
      options: ['Bach', 'Vivaldi', 'Mozart', 'Handel'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'Antonio Vivaldi composed The Four Seasons around 1723.',
    },
    {
      q: 'How many symphonies did Ludwig van Beethoven complete?',
      options: ['5', '7', '9', '12'],
      correct: 2,
      difficulty: 'hard',
      explanation: 'Beethoven completed nine symphonies.',
    },
    {
      q: 'In music, how many semitones make up one octave?',
      options: ['7', '8', '10', '12'],
      correct: 3,
      difficulty: 'hard',
      explanation: 'An octave spans 12 semitones.',
    },
    {
      q: 'Which Italian term means to gradually get louder?',
      options: ['Diminuendo', 'Crescendo', 'Staccato', 'Legato'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'Crescendo marks a gradual increase in volume.',
    },
    {
      q: 'The opera "The Magic Flute" was composed by whom?',
      options: ['Verdi', 'Mozart', 'Wagner', 'Puccini'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'Mozart composed The Magic Flute in 1791.',
    },
    {
      q: 'Which of these instruments is not part of the string family?',
      options: ['Viola', 'Cello', 'Oboe', 'Double bass'],
      correct: 2,
      difficulty: 'hard',
      explanation: 'The oboe is a woodwind instrument.',
    },
    {
      q: 'How many lines make up a standard musical staff?',
      options: ['4', '5', '6', '7'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'A staff has five lines and four spaces.',
    },
    {
      q: 'The piece "Für Elise" was written by which composer?',
      options: ['Chopin', 'Beethoven', 'Liszt', 'Schubert'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'Beethoven composed the bagatelle known as Für Elise.',
    },
    {
      q: 'Which term describes the quality or colour of a musical sound?',
      options: ['Tempo', 'Timbre', 'Dynamics', 'Metre'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'Timbre distinguishes one instrument’s tone from another.',
    },
    {
      q: 'How many keys on a standard piano are black?',
      options: ['32', '36', '40', '52'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'A piano has 36 black keys and 52 white keys, 88 in total.',
    },
  ],

  'General Knowledge': [
    {
      q: 'Who painted the Mona Lisa?',
      options: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Vincent van Gogh'],
      correct: 1,
      explanation: 'Leonardo da Vinci painted it in the early 1500s.',
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
      q: 'How many players from one team are on a football (soccer) pitch?',
      options: ['9', '10', '11', '12'],
      correct: 2,
      explanation: 'Eleven per side, including the goalkeeper.',
    },
    {
      q: 'What is the square root of 144?',
      options: ['10', '11', '12', '14'],
      correct: 2,
      explanation: '12 x 12 = 144.',
    },
    {
      q: 'Who wrote the "Harry Potter" book series?',
      options: ['J.R.R. Tolkien', 'J.K. Rowling', 'Roald Dahl', 'C.S. Lewis'],
      correct: 1,
      explanation: 'J.K. Rowling wrote the seven Harry Potter novels.',
    },
    {
      q: 'What is the currency of the United Kingdom?',
      options: ['Euro', 'Dollar', 'Pound sterling', 'Franc'],
      correct: 2,
      explanation: 'The UK uses the pound sterling.',
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
      q: 'In which sport would you perform a "slam dunk"?',
      options: ['Volleyball', 'Basketball', 'Tennis', 'Football'],
      correct: 1,
      explanation: 'A slam dunk is a basketball move.',
    },
    {
      q: 'How many sides does a triangle have?',
      options: ['2', '3', '4', '5'],
      correct: 1,
      explanation: 'A triangle has three sides.',
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
      q: 'Which language has the most native speakers worldwide?',
      options: ['English', 'Hindi', 'Spanish', 'Mandarin Chinese'],
      correct: 3,
      explanation: 'Mandarin Chinese has the most native speakers.',
    },
    {
      q: 'In what year did the Berlin Wall fall?',
      options: ['1987', '1989', '1991', '1993'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'The Berlin Wall fell in November 1989.',
    },
    {
      q: 'Who wrote the novel "War and Peace"?',
      options: ['Fyodor Dostoevsky', 'Leo Tolstoy', 'Anton Chekhov', 'Ivan Turgenev'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'Leo Tolstoy published War and Peace in the 1860s.',
    },
    {
      q: 'What is the chemical formula for common table salt?',
      options: ['NaCl', 'KCl', 'CaCO3', 'H2O'],
      correct: 0,
      difficulty: 'hard',
      explanation: 'Table salt is sodium chloride, NaCl.',
    },
    {
      q: 'How many time zones does Russia span?',
      options: ['7', '9', '11', '13'],
      correct: 2,
      difficulty: 'hard',
      explanation: 'Russia officially spans 11 time zones.',
    },
    {
      q: 'Who developed one of the first successful polio vaccines in the 1950s?',
      options: ['Alexander Fleming', 'Jonas Salk', 'Louis Pasteur', 'Edward Jenner'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'Jonas Salk introduced the first effective polio vaccine in 1955.',
    },
    {
      q: 'Which of the seven ancient wonders of the world still stands today?',
      options: ['Hanging Gardens', 'Great Pyramid of Giza', 'Colossus of Rhodes', 'Lighthouse of Alexandria'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'The Great Pyramid of Giza is the only ancient wonder still standing.',
    },
    {
      q: 'What does "GDP" stand for in economics?',
      options: ['Gross Domestic Product', 'General Domestic Price', 'Gross Detailed Product', 'Global Demand Percentage'],
      correct: 0,
      difficulty: 'hard',
      explanation: 'GDP is the Gross Domestic Product of an economy.',
    },
    {
      q: 'Which element has the chemical symbol "Fe"?',
      options: ['Fluorine', 'Iron', 'Francium', 'Lead'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'Fe stands for iron, from the Latin "ferrum".',
    },
    {
      q: 'The Magna Carta was sealed in which year?',
      options: ['1066', '1215', '1348', '1492'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'King John sealed the Magna Carta in 1215.',
    },
    {
      q: 'Which planet in our solar system rotates on its side, with an axial tilt near 98 degrees?',
      options: ['Neptune', 'Uranus', 'Saturn', 'Venus'],
      correct: 1,
      difficulty: 'hard',
      explanation: 'Uranus is tilted about 98 degrees, so it rolls along its orbit.',
    },
  ],
};

// Difficulty ordering: lower rank comes out first, so games favour the harder
// questions. Anything not explicitly tagged is treated as 'easy'.
const DIFFICULTY_RANK = { hard: 0, medium: 1, easy: 2 };

// Flatten into a single bank, tagging each question with its category and a
// difficulty (defaulting to 'easy' when the question does not set one).
const BANK = [];
for (const [cat, questions] of Object.entries(CATEGORY_QUESTIONS)) {
  questions.forEach((q) => BANK.push({ difficulty: 'easy', ...q, cat }));
}

// Category summary for the lobby picker.
const CATEGORIES = Object.keys(CATEGORY_QUESTIONS).map((name) => ({
  name,
  count: CATEGORY_QUESTIONS[name].length,
}));

const CATEGORY_NAMES = new Set(CATEGORIES.map((c) => c.name));

const history = require('./history');

// Pick n questions, favouring harder ones first and, within the same
// difficulty, the ones shown least often so the bank cycles through before
// repeating. If `cats` is a non-empty list of valid category names, only those
// categories are used; otherwise the whole bank is fair game.
function pickQuestions(n, cats) {
  let pool = BANK;
  if (Array.isArray(cats) && cats.length) {
    const wanted = new Set(cats.filter((c) => CATEGORY_NAMES.has(c)));
    if (wanted.size) {
      const filtered = BANK.filter((q) => wanted.has(q.cat));
      if (filtered.length) pool = filtered;
    }
  }
  // Shuffle first so questions that tie on difficulty and show-count come out in
  // random order, then a stable sort puts harder and least-shown questions at
  // the front. Harder questions win ties, so a game leans hard while still
  // cycling through the bank within each difficulty tier.
  const a = pool.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  a.sort((x, y) => {
    const rank = (DIFFICULTY_RANK[x.difficulty] ?? 2) - (DIFFICULTY_RANK[y.difficulty] ?? 2);
    if (rank !== 0) return rank;
    return history.getCount(x.q) - history.getCount(y.q);
  });
  return a.slice(0, Math.min(n, a.length));
}

module.exports = { BANK, CATEGORIES, pickQuestions };
