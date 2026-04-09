# character

Game model for a Korean syllable character under construction. A `Character` is what the player is assembling in a guess slot — keyed by position (`choseong`, `jungseong`, `jongseong`) rather than a flat list. This module encodes the Korean syllable construction rules and is the primary interface for the game state reducer.

## Contracts

- `Jamo` — string-literal union of all 45 valid Hangul Compatibility Jamo the game can produce. Slot assignments in `Character` are typed as `Jamo`, not raw `string`.
- `Character` — `{ choseong?, jungseong?, jongseong? }`. An empty object `{}` is a valid empty slot. Combinations collapse immediately — two consonants become a single double consonant token before being stored.
- `combine(a, b)` — merges an incoming single-slot `Character` into a target `Character` following Korean syllable construction rules. Returns the updated `Character`, or `null` if the combination is not permitted. Never throws. Consonant always routes to choseong/jongseong; vowel always routes to jungseong — drag direction does not change the outcome.
- `resolveCharacter(char)` — renders a `Character` as its Unicode string: bare consonant, bare vowel, or a composed syllable block. Returns `null` only when both `choseong` and `jungseong` are absent.
- `isComplete(char)` — returns `true` iff `resolveCharacter` produces a syllable block in U+AC00–U+D7A3. Requires at minimum `choseong` + `jungseong`. ㅇ is treated as a regular consonant with no special handling.
- `decompose(char)` — steps a `Character` back by one construction level, splitting compound batchim jongseong into its two constituent consonant `Character` objects. Returns an array of simpler `Character` objects (may be empty). Note: `decompose` is the inverse of `combine` — not of `composeSyllable`. Each call steps back one construction level (e.g. removes jongseong, or splits compound batchim), while `composeSyllable` is a low-level Unicode arithmetic utility.

## Out of scope

- Unicode arithmetic (syllable block formula, codepoint tables) — that is `jamo/`.
- Jamo rotation — that is `jamo/rotation`.
- Whether a character is the correct answer for a given guess position — that is the game state reducer.

## Dependencies

- `jamo/` — jamo combination rules, compound batchim upgrade, and syllable block composition/decomposition
