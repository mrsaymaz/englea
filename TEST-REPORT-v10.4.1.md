# v10.4.1 verification

## v10.4.1: short Ask a Question cards

`tests/v104.cjs` now checks the new Ask a Question list (`public/ask-questions.js`):
- six cards for each of the 40 islands of grades 5–8 (240 in all);
- every question ends with "?" and has eight words or fewer, and the three questions on a card are different;
- a card shows its own right question and its two written wrong questions, with no reading text;
- the explanation names the question word ("What time" asks about a time; "Who's" asks about a person; "Can I…?" is a yes/no question);
- Island Run reading questions that start with a question word are also used:
  - exercise questions are left out;
  - the two wrong options are the island's own short questions, starting with a different question word ("What" and "Which" count as one, and so do "When" and "What time").

**Island Run rewrite.** All four grades were rewritten.
- `island-run-integration.cjs` and the engine test still pass: 240 simulated full runs, 4,240 question variants.
- 800 sampled Ask a Question cards: about two thirds now come from Island Run reading questions, and none puts "When" against "What time".
- `board-v104.cjs` passes with the new content.

`tests/island-short.cjs` checks Island Run content for all four grades:
- reading tasks: 10 words or fewer;
- answer choices: 5 words or fewer;
- meanings: 8 words or fewer, without the word itself;
- gaps: 12 words or fewer, with one ___;
- three different choices;
- the same number and order of islands, words, gaps and tasks, and every word's English and Turkish unchanged.

Every card was written so that the wrong questions are proper English but ask for something else, so only one question fits the answer.

The rest of this report is the v10.4.0 verification. It still applies.

# v10.4.0 verification

## The Challenge Deck

**`tests/v104.cjs`** (no browser), 9 checks:
- **Every card can be dealt.** All nine card types, on all 40 islands of grades 5–8, five deals each: 1,800 cards, none missing.
  - Choice cards always have three different options and one right answer.
  - For Vocabulary and Translation, the right answer is the card's word.
  - For Grammar and Sentence Repair, the explanation contains the right answer.
- **Cards come from the team's current island first.**
- **Card details:**
  - Sentence Repair marks a wrong word that is also an option.
  - Listening speaks a word in grades 5–6 and a sentence in grades 7–8.
  - Ask a Question (v10.4.0) picked the question that asks for the given answer. v10.4.1 replaced it with its own short list (above).
- **Taboo:** 1–4 forbidden Turkish words, the translation first.
  - Example: neck → boyun, vücut, baş.
  - Most cards forbid two or more words.
  - A cognate (festival = festival) is forbidden on purpose.
- **Teacher Studio:** pasted word pairs alone are enough for Translation, Taboo, Pronunciation and Speaking. Vocabulary needs English meanings; without them, the wheel shows only the skill name, as before.
- **Apps Script v10.4.0 (in-memory spreadsheet):**
  - Challenge_Log headers and rows are written.
  - Dates are real dates in the day-first format.
  - A formula-like word is written as text.
  - A retried save adds only new cards.
  - Seven kinds of invalid rows are refused, and a refused save writes nothing.
  - Load islands reports `challengeLogVersion: 1`.
- **Netlify:** while the Sheet runs an older script, the phone keeps the cards and asks for the v10.4.0 script (nothing is written). With v10.4.0, the cards are saved.
- **Board wiring:** the go-back point, the stakes line, Skip/Continue from the scene bar, the recovery snapshot, the phone command, the Sheets payload and script order.

**`tests/board-v104.cjs`** (Chromium, a 1366 × 768 board and a 393 × 760 phone linked together), 8 checks:
1. **Five awards from five students:** Level 5, then the English wheel, then a card naming the fifth student. It shows on the board and the phone, with "✓ Right: keep Level 5 · ✗ Wrong: back to Level 4".
2. **Wrong** (on the board for a choice card, ✗ on the phone otherwise): Gryffindor goes back to the points, level and four evolutions it had when it reached Level 4. The wheel's Level 5 is open again. The board shows the correct answer and the consequence. Continue on the phone closes the card and the wheel.
3. **One more award:** Level 5 and the wheel again. Right, answered on the phone, keeps every point and the level.
4. **Taboo:** the phone shows the word, its meaning and the forbidden Turkish words with ✓, ✗ and Skip. The board shows neither the word nor its Turkish.
5. **Sentence Repair:** the wrong word is marked. A late phone tap for a closed card is refused. The scene bar's Skip after an answer acts as Continue.
6. **Skip card:** nothing changes. While a card is unanswered, the recovery snapshot keeps its wheel.
7. **Practice card** from the manual English wheel: no points change.
8. **Google Sheets summary:** all six cards (team, student, card, word, island, result).

`board-v104.cjs` passed every run after the content fix: 9 runs, the last 3 with the final card animation, plus the full `test:board` runs.

## Speed on a slow board

Chromium, 1366 × 768, Animated mode, processor slowed to a quarter of its speed. Each run was recorded over 2.6 s, from a team reaching Level 5 until the card (or the wheel result) is shown; six runs each. "Stutter" is the time spent in frames longer than 50 ms.

| Wheel at Level 5 | Worst frame | Stutter, six runs |
|---|---|---|
| All Subjects (unchanged, no card), ten runs | 50–83 ms | 100–1050 ms (average 390) |
| English, first build of the card | 50–100 ms | 317–1251 ms (average 620) |
| English, as shipped, twelve runs | 50–100 ms | 184–950 ms (average 490) |

What changed between the first build and the shipped version:
- **The wheel is not drawn under the card.** Its blurred backdrop was the main extra cost.
- **Only the card itself animates.** The full-screen darkening appears at once instead of fading.

Answering a card: worst frame 50–67 ms (Ask a Question, Grammar and Translation measured). The card uses no blur and no `color-mix()`, so older smart-board browsers draw it correctly.

## Regression runs

- `npm run test:v104`: the whole dependency-free chain (v9 → v10.4) passes.
- `npm run test:board`: board-v95, v97, v10, season-relay, teacher-signin, board-v101, v102, v103 and v104 all pass (39 checks).
- `next-to-invite.cjs` and `teacher-studio.cjs` pass.
- `npm test` (`run.cjs`) stops at `students.cjs`: the "Load islands" dialog covers the phone's + button. This failure also happens on v10.3.0 without this release's changes. It is the older-suite failure recorded in `archive/TEST-REPORT-v10.1.0.md`.

## Limits

- Pronunciation and Speaking are judged by the teacher. The board does not listen to the student.
- Vocabulary needs English meanings in the island's content. Every built-in island has 20 of them; a Studio bank of word pairs only has none.
- Taboo's extra forbidden words come from a list of about 200 common words that appear in definitions. Some cards forbid only the Turkish translation.
- The wheel mode (English Only or All Subjects) is kept for the session, including after a reload. A new session starts on All Subjects.
