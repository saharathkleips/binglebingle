# word

Defines the `Word` type and functions for constructing words from raw Korean strings and converting them back to Unicode.

## Exports

- `Word` — `readonly CompleteCharacter[]` — ordered array of complete Korean syllable characters; each element resolves to a codepoint in U+AC00–U+D7A3
- `createWord(word: string) => Word | null` — parses and validates a raw string; returns `null` if the string is empty or any character is outside U+AC00–U+D7A3
- `wordToString(word: Word) => string` — converts a `Word` back to its Unicode string
