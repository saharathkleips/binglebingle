# character

Game model for a Korean syllable character under construction. A `Character` is what the player is assembling in a guess slot — keyed by position (`choseong`, `jungseong`, `jongseong`) rather than a flat list. This module encodes the Korean syllable construction rules and is the primary interface for the game state reducer.

## Contracts

- `Character` — discriminated union over six slot configurations: `EMPTY`, `CHOSEONG_ONLY`, `JUNGSEONG_ONLY`, `JONGSEONG_ONLY`, `OPEN_SYLLABLE`, `FULL_SYLLABLE`. Use `character(slots?)` to construct one; the `kind` is derived automatically.
- `CompleteCharacter` — union of the `OPEN_SYLLABLE` and `FULL_SYLLABLE` `Character` variants; represents a fully-formed syllable block. Obtained by narrowing a `Character` via `isComplete`.
- `character(input?)` — factory that constructs a `Character`. When called with a syllable string (U+AC00–U+D7A3), returns a `CompleteCharacter | null`. When called with optional slot values `{ choseong?, jungseong?, jongseong? }`, derives the kind automatically and returns `Character | null`. Returns `null` for structurally invalid combinations (e.g. jungseong + jongseong without choseong, or ㄸ/ㅃ/ㅉ as jongseong).
- `compose(a, b)` — merges an incoming single-slot `Character` into a target `Character` following Korean syllable construction rules. Returns the updated `Character`, or `null` if the combination is not permitted. Never throws. Consonant always routes to choseong/jongseong; vowel always routes to jungseong — drag direction does not change the outcome.
- `resolveCharacter(char)` — renders a `Character` as its Unicode string: bare consonant, bare vowel, or a composed syllable block. Returns `null` only for the `EMPTY` character.
- `isComplete(char)` — type guard; returns `true` and narrows to `CompleteCharacter` iff `resolveCharacter` produces a syllable block in U+AC00–U+D7A3. Requires at minimum `choseong` + `jungseong`. ㅇ is treated as a regular consonant with no special handling.
- `decompose(char)` — steps a `Character` back by one construction level following right-to-left (last-added-first) semantics. Never loses a jamo. Returns `[Character, Character]` when the character can be split, or `null` when it is irreducible (EMPTY or single-jamo). Double consonant choseong and complex vowel jungseong split into their two component jamo. Choseong + complex jungseong peels off the last-added vowel part, keeping choseong bound to the base vowel (e.g. 화 → {ㅎ,ㅗ} + {ㅏ}). Choseong + simple jungseong peels off the jungseong entirely (e.g. 호 → {ㅎ} + {ㅗ}). Full syllables with a compound jongseong split the batchim in two: the first consonant stays as jongseong; the second becomes a standalone choseong (e.g. 홳 → {ㅎ,ㅙ,ㄱ} + {ㅅ}). Full syllables with a simple jongseong return the jongseong as a standalone choseong (unchanged).
- `fullDecompose(characters)` — recursively decomposes an array of Characters until all are irreducible single-jamo. Use after selecting a word to build the initial jamo pool.
- `normalizeCharacter(char)` — rotates a single-jamo `Character` to the canonical (0-index) member of its rotation set. Non-rotatable or multi-jamo `Character`s are returned unchanged. Use on each pool element after `decompose` to prevent the pool from revealing which target jamo are rotated.
- `getNextRotation(char)` — advances a single-jamo `Character` to the next member of its rotation set (wraps around). Returns `null` if the `Character` is not single-jamo or its jamo is not rotatable. Delegates to `getNextRotation` in `jamo/rotation`; this layer-owned entry point keeps the game state reducer from reaching into the jamo slice directly.

## Out of scope

- Unicode arithmetic (syllable block formula, codepoint tables) — that is `jamo/`.
- Raw jamo rotation data and cycling — that is `jamo/rotation`. (Character-level normalization that _uses_ rotation lives here as `normalizeCharacter`.)
- Whether a character is the correct answer for a given guess position — that is the game state reducer.

## Dependencies

- `jamo/` — jamo combination rules, compound batchim upgrade, and syllable block composition/decomposition
