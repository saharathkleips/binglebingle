I'm planning a new software project and need your help producing a complete GSD-ready planning document I can use to bootstrap development with Claude Code.

## Project Overview
I'm designing a single-player word-guessing game that takes some inspiration from Wordle, but leverages the geometric nature of Korean hangeul (한글). The game starts with a pre-determined collection of Korean jamo (자모), the 14 basic consonants and 10 basic vowels, that can be arranged to create different Korean characters (글자). For instance combining the consonant ㄱ with the vowel ㅏ creates the character 가. Using the available jamo, the player creates a variety of characters and then submits the list of characters for evaluation. The game then evaluates each character's position with respect to the hidden Korean word: gray if the character does not appear in the word at all, yellow if the character appears in the word but in the wrong position, and green if the character appears in the word and is in the correct position. The additional twist in the game comes from how Korean jamo can be rotated to form a different jamo. For instance the consonant ㄱ can be rotated into the consonant ㄴ and the vowel ㅏ can be rotated into the vowels ㅜ, ㅓ, and ㅗ. The game continues until the player has guessed the final word and the score is calcuated by how many guesses it took.

For example in a 3-character game, if the secret word is "한국어", the player is given the following jamo: 1 ㅎ, 3 ㄱ, 1 ㅇ, and 3 ㅏ. Note that the 1 ㄴ in the word is simply a rotated ㄱ, the 1 ㅜ and 1 ㅓ is simply a rotated ㅏ.

The player starts the game by submiting 오, 난, and 한. Note that the submission does not need to be a valid word and it does not need to contain every available jamo, but it must be derived from the given set of jamo.

The game then evaluates "gray, gray, yellow" since the first two characters are not contained within the word and the last character 한 is in the wrong position.

If the player then guesses 한, 어, 국 the state is evaluated as "green, yellow, yellow" since 한 is now in its correct position but the last two characters are out of order.

The player then guesses the correct word 한, 국, 어 and since they took 3 guesses, their score is 3.

## Tech Stack Preferences
- TypeScript
- React
- Tailwind
- Vite
- ViTest
- Playwright

## Constraints
The application will be a statically rendered single-page progressive web application (PWA) hosted on GitHub Pages and should be mobile friendly.

## Design
Visual design will be iterated on at a later time with further detail, but should be inspired by Korean dancheong (단청) and obangsaek (오방색). I plan to utilize Google Stitch here.

How it feels to play the game, the application's UX, will be the most critical element but can be further explored at a later time. Since this word game involves connecting and rotating different jamo, being able to smoothly and easily drag different jamo and creating characters should be responsive and fun. I plan to take many iterations to get this right after playing with the UX myself.

---

Please produce the following documents in order, pausing after each for my feedback before continuing:

1. **architecture.md** — system overview, layer diagram in ASCII or Mermaid, key technical decisions and why, explicit non-goals

2. **conventions.md** — naming conventions, file structure, patterns to use consistently, anti-patterns to avoid

3. **plan-models.md** — all data types, interfaces, and state shape. This should be complete enough that implementation needs no guessing

4. For each major domain or feature area, a **plan-[domain].md** covering:
   - What this domain does and its boundaries
   - Interfaces it consumes and produces  
   - Implementation steps in dependency order
   - Edge cases and explicit gotchas

5. An initial **CLAUDE.md** — lean, under 200 lines, covering: what the project is, tech stack, file structure map, hard constraints, and pointers to the plan docs

6. A **tasks/** seed — the first 3-5 atomic tasks to get the scaffold running, each with explicit acceptance criteria and context pointers

For each document, flag any assumptions you're making and any decisions I should consciously review before handing this to a coding agent. The downstream agent is a 9B local model, so plans should be explicit and leave no architectural decisions to inference.