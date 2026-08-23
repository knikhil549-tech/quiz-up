// Fun questions: silly prompts about the people in the room, one per player
// per game. Unlike the trivia bank there is no right answer. Everyone types a
// short guess, the server picks one submission at random as the "winner", and
// whoever wrote it takes the points.
//
// `{name}` is replaced with the player the question is about. `hint` becomes
// the input's placeholder, so the prompt sets the expected flavour of answer.
// Apostrophes use the curly ’ on purpose so they sit safely inside
// single-quoted strings.
//
// Keep these warm and daft. They are read out to the person they are about, so
// nothing that invites a mean answer, and nothing about looks, money, age,
// relationships or anything that would land badly with people who just met.
const FUN_PROMPTS = [
  { q: 'What kind of Pokémon is {name}?', hint: 'e.g. Snorlax' },
  { q: 'What animal is {name} on a Monday morning?', hint: 'e.g. sloth' },
  { q: 'If {name} were a kitchen appliance, which one?', hint: 'e.g. air fryer' },
  { q: 'What is {name}’s secret superpower?', hint: 'e.g. finding parking' },
  { q: 'What is {name}’s supervillain name?', hint: 'e.g. Doctor Snooze' },
  { q: 'What snack IS {name}?', hint: 'e.g. cold samosa' },
  { q: 'Which emoji is {name}?', hint: 'e.g. 🦆 or name it' },
  { q: 'What would {name}’s band be called?', hint: 'e.g. Wet Socks' },
  { q: 'What weather is {name}?', hint: 'e.g. light drizzle' },
  { q: 'If {name} were a vehicle, what is it?', hint: 'e.g. cargo bike' },
  { q: 'What is the title of {name}’s autobiography?', hint: 'e.g. Almost Ready' },
  { q: 'What sound does {name} make?', hint: 'e.g. hmmmph' },
  { q: 'What is {name}’s wrestling nickname?', hint: 'e.g. The Deadline' },
  { q: 'Which app on your phone is {name}?', hint: 'e.g. Maps' },
  { q: 'What houseplant is {name}?', hint: 'e.g. brave cactus' },
  { q: 'What is {name}’s signature dance move?', hint: 'e.g. the shuffle' },
  { q: 'What breakfast item is {name}?', hint: 'e.g. burnt toast' },
  { q: 'In another life, what is {name}’s job?', hint: 'e.g. lighthouse keeper' },
  { q: 'Which board game is {name}?', hint: 'e.g. Jenga' },
  { q: 'What mythical creature is {name}?', hint: 'e.g. sleepy dragon' },
  { q: 'Which chess piece is {name}?', hint: 'e.g. rogue knight' },
  { q: 'What is {name}’s catchphrase?', hint: 'e.g. one sec' },
  { q: 'Which season is {name}?', hint: 'e.g. late autumn' },
  { q: 'What is {name}’s racing sheep called?', hint: 'e.g. Mutton Chop' },
  { q: 'What flavour of ice cream is {name}?', hint: 'e.g. mystery blue' },
  { q: 'What is {name}’s spirit vegetable?', hint: 'e.g. proud beetroot' },
  { q: 'Which household chore is {name}?', hint: 'e.g. folding laundry' },
  { q: 'What is {name}’s hidden talent?', hint: 'e.g. perfect parking' },
  { q: 'If {name} were a biscuit, which one?', hint: 'e.g. digestive' },
  { q: 'What is {name}’s walk-on music?', hint: 'e.g. kazoo solo' },
  { q: 'What kind of cloud is {name}?', hint: 'e.g. big fluffy' },
  { q: 'Which piece of stationery is {name}?', hint: 'e.g. good stapler' },
  { q: 'What is {name}’s spy codename?', hint: 'e.g. Warm Pigeon' },
  { q: 'What is {name}’s signature dish?', hint: 'e.g. toast, again' },
  { q: 'Which type of pasta is {name}?', hint: 'e.g. fusilli' },
  { q: 'What does {name} guard fiercely?', hint: 'e.g. the aux cable' },
];

// n distinct prompts, in random order.
function pickFunPrompts(n) {
  const a = FUN_PROMPTS.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}

module.exports = { FUN_PROMPTS, pickFunPrompts };
