# character

Game model for a Korean syllable character under construction. A `Character` is what the player is assembling in a guess slot — keyed by position (`choseong`, `jungseong`, `jongseong`) rather than a flat list. This module encodes the Korean syllable construction rules and is the primary interface for the game state reducer.

## Contracts

- `Jamo` — string-literal union of all 45 valid Hangul Compatibility Jamo the game can produce. Slot assignments in `Character` are typed as `Jamo`, not raw `string`.
- `Character` — `{ choseong?, jungseong?, jongseong? }`. An empty object `{}` is a valid empty slot. Combinations collapse immediately — two consonants become a single double consonant token before being stored.
- `compose(a, b)` — merges an incoming single-slot `Character` into a target `Character` following Korean syllable construction rules. Returns the updated `Character`, or `null` if the combination is not permitted. Never throws. Consonant always routes to choseong/jongseong; vowel always routes to jungseong — drag direction does not change the outcome.
- `resolveCharacter(char)` — renders a `Character` as its Unicode string: bare consonant, bare vowel, or a composed syllable block. Returns `null` only when both `choseong` and `jungseong` are absent.
- `isComplete(char)` — returns `true` iff `resolveCharacter` produces a syllable block in U+AC00–U+D7A3. Requires at minimum `choseong` + `jungseong`. ㅇ is treated as a regular consonant with no special handling.
- `decompose(char)` — steps a `Character` back by one construction level. Never loses a jamo. Returns at most two `Character` objects per call. Simple single-jamo characters return a one-element array; double consonant choseong and complex vowel jungseong split into their two component jamo. Full syllables peel off the jongseong: simple jongseong becomes a standalone choseong; compound batchim is returned intact as `{ jongseong }` for the caller to decompose further in a second step. Returns `[]` only for the empty `Character` `{}`.

## Out of scope

- Unicode arithmetic (syllable block formula, codepoint tables) — that is `jamo/`.
- Jamo rotation — that is `jamo/rotation`.
- Whether a character is the correct answer for a given guess position — that is the game state reducer.

## Dependencies

- `jamo/` — jamo combination rules, compound batchim upgrade, and syllable block composition/decomposition
