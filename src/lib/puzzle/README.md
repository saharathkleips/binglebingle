# puzzle

Owns the game-initialization concern of _which word to play_. Loads the word list from a static
asset and selects a word by strategy. Distinct from `src/lib/word/`, which defines what a word
structurally is and how it decomposes.

## Exports

- `WordSelectionStrategy` — discriminated union: `daily`, `random`, `fixed`, `byDate`
- `loadWords() => Promise<readonly Word[]>` — fetches `public/data/words.json`, validates each entry via `createWord`; invalid entries are silently dropped
- `selectWord(words, strategy) => Word` — selects a word by strategy (daily, random, fixed, byDate)
