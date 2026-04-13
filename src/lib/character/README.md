# character

Game model for a Korean syllable character under construction. A `Character` is what the player is assembling in a guess slot — keyed by position (`choseong`, `jungseong`, `jongseong`) rather than a flat list. This module encodes the Korean syllable construction rules and is the primary interface for the game state reducer.

## Contracts

- `Character` — discriminated union over six slot configurations: `EMPTY`, `CHOSEONG_ONLY`, `JUNGSEONG_ONLY`, `JONGSEONG_ONLY`, `OPEN_SYLLABLE`, `FULL_SYLLABLE`. Use `character(slots?)` to construct one; the `kind` is derived automatically.
- `character(slots?)` — factory that constructs a `Character` from optional `{ choseong?, jungseong?, jongseong? }` slot values. Returns `null` for structurally invalid combinations (e.g. jungseong + jongseong without choseong, or ㄸ/ㅃ/ㅉ as jongseong).
- `compose(a, b)` — merges an incoming single-slot `Character` into a target `Character` following Korean syllable construction rules. Returns the updated `Character`, or `null` if the combination is not permitted. Never throws. Consonant always routes to choseong/jongseong; vowel always routes to jungseong — drag direction does not change the outcome.
- `resolveCharacter(char)` — renders a `Character` as its Unicode string: bare consonant, bare vowel, or a composed syllable block. Returns `null` only for the `EMPTY` character.
- `CompleteCharacter` — subtype of `Character` narrowed to `OPEN_SYLLABLE | FULL_SYLLABLE`; represents a fully-formed syllable block. Use `isComplete` to obtain one.
- `isComplete(char)` — type guard; returns `true` and narrows to `CompleteCharacter` iff `resolveCharacter` produces a syllable block in U+AC00–U+D7A3. Requires at minimum `choseong` + `jungseong`. ㅇ is treated as a regular consonant with no special handling.
- `decompose(char)` — steps a `Character` back by one construction level following right-to-left (last-added-first) semantics. Never loses a jamo. Returns at most two `Character` objects per call. Simple single-jamo characters return a one-element array; double consonant choseong and complex vowel jungseong split into their two component jamo. Choseong + complex jungseong peels off the last-added vowel part, keeping choseong bound to the base vowel (e.g. 화 → {ㅎ,ㅗ} + {ㅏ}). Choseong + simple jungseong peels off the jungseong entirely (e.g. 호 → {ㅎ} + {ㅗ}). Full syllables with a compound jongseong split the batchim in two: the first consonant stays as jongseong; the second becomes a standalone choseong (e.g. 홳 → {ㅎ,ㅙ,ㄱ} + {ㅅ}). Full syllables with a simple jongseong return the jongseong as a standalone choseong (unchanged). Returns `[]` only for the empty `Character` `{}`.

## Out of scope

- Unicode arithmetic (syllable block formula, codepoint tables) — that is `jamo/`.
- Jamo rotation — that is `jamo/rotation`.
- Whether a character is the correct answer for a given guess position — that is the game state reducer.

## Dependencies

- `jamo/` — jamo combination rules, compound batchim upgrade, and syllable block composition/decomposition
