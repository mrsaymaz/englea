# v10.4.1 — The Challenge Deck

**New in v10.4.1:** Ask a Question cards are short and easy. Each island of grades 5–8 now has six of its own, on the island's theme (240 in all). A card shows a short answer, such as “At eight o'clock.”, and three short questions: the right one and two proper questions that ask for something else (“Where does school start?”). Island Run's own questions are unchanged.

When a team reaches **Level 5** or **Level 10** and the wheel is set to **English Only**, the wheel no longer just names a skill. It deals a real card from the class's own island words, and the team's new level depends on the answer.

## How a challenge plays

1. A team reaches Level 5 (or 10). The English wheel spins and lands on one of its nine skills.
2. The card flips in on the board. It shows:
   - the skill;
   - the student who gave the team its last point (this student answers);
   - the stakes, for example **✓ Right: keep Level 5 · ✗ Wrong: back to Level 4**.
3. The student answers.
4. **Right:** the team keeps every point and its new level.
5. **Wrong:** the team goes back to where it stood when it reached the level before this wheel: its points, level, evolutions and relic at that moment. The wheel waits at the same level again, so the team can earn it back.
6. **Skip card** (on the board or the phone) changes nothing.

### The nine cards

| Card | How it is answered |
| --- | --- |
| **Vocabulary**: an English meaning | three words; the student picks one |
| **Translation**: a Turkish word | three English words |
| **Grammar**: a sentence with a gap | three words |
| **Sentence Repair**: one wrong word, marked in red | three fixes |
| **Listening**: the board speaks a word (grades 5–6) or a sentence (grades 7–8); 🔊 plays it again | three options |
| **Ask a Question**: a short answer, such as “At eight o'clock.” | three short questions; the student picks the one that asks for it |
| **Taboo Description**: only your phone shows the English word and up to four forbidden **Turkish** words. Show your phone to the student. They describe the word in Turkish without those words, and the whole team guesses the English word. No timer. | you tap ✓ or ✗ |
| **Pronunciation**: the student reads a word aloud | you tap ✓ or ✗; afterwards 🔊 plays it |
| **Speaking**: the student says one sentence with the word | you tap ✓ or ✗ |

- **Answering the three-option cards:** the student taps an option on the board, or says it and you tap it on your phone.
- **After a three-option card:** the board shows **✓ Right** or **✗ Wrong**. After a wrong answer it also shows the correct answer and a short explanation. Tap **Continue** on the board or the phone to go on.
- **Where the cards come from:** the island the team plays next, then the islands before it. Questions you edited in Teacher Studio are used.
- **Changed your mind?** If you tapped ✗ by mistake, **Undo** puts the team back.
- **Practice cards:** the wheel button with **English Only** selected deals a practice card. It changes no points.
- **All Subjects** wheel: unchanged.

### In Google Sheets

Every card is saved in a new **Challenge_Log** tab when you save the session from the phone. Each row has the date (day first), class, team, student, wheel level, card, word, island and Right, Wrong or Skipped. Filter by student or card to see who needs help with what.

## Deploying this update

1. **Apps Script: update required.**
   - Open your Google Sheet, then **Extensions → Apps Script**.
   - Replace the code with **GOOGLE-APPS-SCRIPT-v10.4.0.gs**. Keep your own Teacher PIN on its line.
   - **Deploy → Manage deployments → Edit → New version → Deploy**.
   - Until you do this, the phone keeps the cards and tells you to update when you save.
2. Deploy the complete extracted project to your existing Netlify site with your usual method. Include **public**, **netlify/functions** and **netlify.toml**.
3. Refresh the board and the phone. Both opening screens must show **Island Run Edition · v10.4.1**.

## Quick classroom check

1. Choose **English Only** on the wheel (the board remembers it for the session).
2. Give one team five awards (Soft mode). After the evolution, the wheel spins and a card names the student who gave the last point.
3. Answer one card wrong: the team goes back to Level 4. Award once more: Level 5 and the wheel come back.
4. Save the session from the phone: the **Challenge_Log** tab appears in the Sheet.

Earlier guides are in `archive/`. `START-HERE-v10.3.0.md` covers the smoother class moments on slow boards.
