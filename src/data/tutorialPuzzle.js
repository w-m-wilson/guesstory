// Game 1 — teaches the core loop: find items, rank them, submit
export const TUTORIAL_PUZZLE_1 = {
  id: 'tutorial-1',
  category: 'Numbers, Smallest to Largest',
  hint: 'Think about counting up from the very beginning',
  seed: [
    { rank: 1, name: 'one', aliases: ['1'] },
  ],
  bank: [
    { rank: 1, name: 'one',   aliases: ['1'] },
    { rank: 2, name: 'two',   aliases: ['2'] },
    { rank: 3, name: 'three', aliases: ['3'] },
    { rank: 4, name: 'four',  aliases: ['4'] },
    { rank: 5, name: 'five',  aliases: ['5'] },
  ],
  topFive: [1, 2, 3, 4, 5],
}

// Game 2 — teaches category guessing, hints, and coins
export const TUTORIAL_PUZZLE_2 = {
  id: 'tutorial-2',
  category: 'Numbers, Largest to Smallest',
  hint: 'Think about counting backwards from ten',
  seed: [
    { rank: 1, name: 'ten', aliases: ['10'] },
  ],
  bank: [
    { rank: 1,  name: 'ten',   aliases: ['10'] },
    { rank: 2,  name: 'nine',  aliases: ['9']  },
    { rank: 3,  name: 'eight', aliases: ['8']  },
    { rank: 4,  name: 'seven', aliases: ['7']  },
    { rank: 5,  name: 'six',   aliases: ['6']  },
    { rank: 6,  name: 'five',  aliases: ['5']  },
    { rank: 7,  name: 'four',  aliases: ['4']  },
    { rank: 8,  name: 'three', aliases: ['3']  },
    { rank: 9,  name: 'two',   aliases: ['2']  },
    { rank: 10, name: 'one',   aliases: ['1']  },
  ],
  topFive: [1, 2, 3, 4, 5],
}
