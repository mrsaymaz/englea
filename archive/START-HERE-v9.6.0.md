# v9.6.0 — Animated mode, every student's contributions, and a smoother Island Run

## Deploying this update

1. Finish the active lesson and save the session from the remote, as usual.
2. **Update the Apps Script (required).** Open your Sheet → **Extensions → Apps Script**. Replace the whole script with **GOOGLE-APPS-SCRIPT-v9.6.0.gs**. Check that the `TEACHER_PIN` line still holds your own PIN. Save, then **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. Keep the same deployment URL and access settings. Do not create a second deployment.
3. Deploy the complete extracted project to your existing Netlify site with your usual method. Include **public**, **netlify/functions** and **netlify.toml**. No new environment variables are needed; keep your TURN variables.
4. Refresh the board and the phone. Both opening screens must show **Island Run Edition · v9.6.0**. Mixed versions are refused on purpose.

If you skip step 2, saving stops with a message asking you to update the script. The session stays on the phone and nothing is lost; save again after updating.

The English League title and fonts are unchanged. No new images, fonts or libraries are added.

## Google Sheet: every student's contributions

- A new **Student_Contributions** tab gets one row per student of the class for each saved session: **Date, Class, Team, Student, Contributions, Session ID**. *Contributions* is how many times that student contributed in the session. Students who did not contribute are listed with **0**, so the whole class is on record.
- Saving the same session again updates its counts in place. It never adds duplicate rows. A new session adds new rows.
- Leaderboard columns **I–L** now list every contributor of each team with their count, for example `Emobi Nese (3) · Detor (1)`. Before, they listed the top three. The headers become **Contributors of Gryffindor** and so on; an existing sheet is renamed in place, and older rows stay as they are.
- A save that only records the arena result adds no student rows.

## Animated mode is the board's mode

**Performance mode is removed.** The display-mode choice shows **Animated** (the default) and **Light**. A board or phone that was set to Performance opens in Animated.

## The board

- **No "takes the lead" banner.** When the lead changes, the leader's crown quietly drops onto the new leader's card.
- **No point bubbles.** The small "+points" cloud is gone from the board and the remote, so nothing is left behind when the cards change places. The score counts up, and the award ribbon still names the student.
- **Class Mission** is one continuous bar again, filling smoothly with each contribution. It keeps the slim v9.5 look.
- **Award Custom Points** closes with its **×** button, and with Escape.

## Final Arena

Attack and relic names are no longer printed in the centre of the arena. Knockouts, **Arena Surge**, **Final Clash** and the winner are still called out.

## The remote

The team cards are taller, so each team shows at least three names. On a short phone screen the page scrolls a little.

## Island Run

**One navigator for the whole run.** When a run starts, one student is chosen at random from the champion team's contributors in this session (the whole team if nobody contributed). The opening card names them, and they lead every question and the Word Trail of that run. The next run picks someone else; everyone leads once before anyone leads twice. **Another student** on the remote still changes the navigator by hand.

**A steady background.** The course no longer changes size or stutters during a run:

- The question panel keeps one height for every kind of question. Picture questions show a smaller picture beside the instruction. The Word Trail clue and its letter slots share one row. A very long question steps its text size down instead of growing the panel.
- The far scenery always moves with the run. Only **Reduce decorative movement** (or the computer's reduce-motion setting) keeps it still.
- The island's landmark drifts slowly across the horizon and never jumps back.
- On a slower board, the automatic graphics settle on one level instead of switching back and forth.

**A richer look that costs less.** Everything that does not change from frame to frame is drawn once and reused:

- **Running lanes.** Each island type has its own path: cobbles (Academy), wooden planks (Village), tiles (City), boardwalk (Coast), riveted steel plates (Harbour), flagstones (Forest) and crystal (Sky). Each lane has a lit edge and brass studs, with grass, flowers or pebbles between the lanes.
- **Coins.** Gold coins turn with a visible edge, catch a glint and cast a soft shadow.
- **Obstacles.** Shaded and outlined, each with a shadow. The gear turns.
- **Word Trail letters.** Gold medallions with an engraved letter. The next letter to collect glows.
- **Attack and defence.** The guardian's attack lanes turn red with a jump sign and chevrons sweeping toward the runner. The gold firing lane sends chevrons toward the guardian, and a gold reticle marks its weak point. Coin volleys fly as coins with a trail; a Word Strike flies as the word on a plaque. The answer gate arrives as a curtain of light with a post in each lane's colour. Points and streak notes that arrive together stack instead of overlapping.
- **Colour.** The scene still regains its colour with each correct answer, now in smooth steps.
- **Cost.** In Chromium, an Island Run frame now takes about 5–6 ms, against about 9 ms in v9.5.0 (1600 × 600 course, software rendering).

## Quick classroom check

1. Board and phone show **v9.6.0**. The display-mode choice shows Animated and Light only.
2. Award a few students. The Class Mission bar fills smoothly. Push another team into the lead: the crown moves and no banner appears. Open **Award Custom Points** and close it with ×.
3. On the phone, each team card shows at least three names.
4. Finish the session. The arena shows no attack names in the centre.
5. Open Island Run. The opening card names the navigator, who stays for the whole run. With Picture gates on, the question panel keeps its height.
6. **Save Record** on the phone, then open the Sheet: **Student_Contributions** lists every student of the class with their count.
