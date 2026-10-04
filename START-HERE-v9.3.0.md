# v9.3.0 — Island Run learning loop and compact remote

## Deploying this update

1. Finish the active lesson. Save the session from the remote, and download an Island Run backup from **Run settings → Save & restore** on the board.
2. **Update the Apps Script (required for answer saving).** Open your Sheet → **Extensions → Apps Script**. Replace the whole script with **GOOGLE-APPS-SCRIPT-v9.3.0.gs**, then change the `TEACHER_PIN` line back to your own PIN. Save, then **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. Keep the same deployment URL and access settings. Do not create a second deployment.
3. Deploy the complete extracted project to your existing Netlify site with your usual method. Include **public**, **netlify/functions** and **netlify.toml**. No new environment variables are needed; keep your TURN variables.
4. Refresh the board and the phone. Both opening screens must show **Island Run Edition · v9.3.0**. Mixed versions are refused on purpose.

The script creates two new tabs on the first save that contains Island Run answers: **Question_Log** (one row per team answer) and **Question_Summary** (accuracy per class and concept, and whether it is still in review). Existing tabs are not changed. If you forget step 2, saving stops with a message asking you to update the script; the answers stay on the phone until you save again.

## What changed

**Missed questions come back.** Every team answer in Island Run is recorded (practice runs are not). When a team misses a concept, it joins that class's review list. Up to two review questions appear in later runs, as a different question on the same concept where one exists. A concept leaves the list after correct answers in two separate runs. **Run settings → Review list** shows the current list and can clear it on that board.

**Second chance.** One missed question returns before the boss with the answers reshuffled, worth half points. It never changes stars and does not clear the review list.

**Listening gates (on by default).** One question per run hides an English word and speaks it; the team chooses the Turkish meaning. Only an installed English voice is used (British first, then American, then any English). If the board has no English voice, the word is shown as text and the board says so. **Run settings** shows the voice and has **Test voice**. The remote shows the board's voice too.

**Picture gates (off by default).** One question per run shows a drawing; the team chooses the English word. 108 small line drawings cover concrete vocabulary on 32 of the 40 islands. Islands with abstract topics simply skip picture gates.

**Word Trail and Word Strike.** After the course, letter-coins arrive in the three lanes. Collect the letters of a vocabulary word in order, with the Turkish meaning as the clue. Soft allows one wrong letter; Hard allows none. A correct word opens the boss fight with a **Word Strike** that removes 15% of the boss's guard. With listening on, the word is also spoken.

**Navigator.** Before each question and the Word Trail, a student from the champion team is named. Names come from that team's contributors in this session; if nobody contributed, the whole team list is used. Everyone has a turn before anyone repeats.

**Compact remote.** The controller fits an iPhone 14 Pro in Safari without scrolling: one header row (connection, class, More), a one-line Class Mission, four cards with 46 px score buttons, and Finish Session. **More** holds board visuals, the Listening and Picture switches, Manage, and Disconnect. While Island Run is open the remote shows an Island Run panel: the navigator, **Another student**, **Hear the word again**, both switches and the board's voice. Turning listening off shows the current word on the board at once; other switch changes start with the next run.

**Housekeeping.** Older guides, reports and scripts moved to `archive/`. `CHANGELOG.md` lists every version.

## Quick classroom check

1. Board: **Run settings** → check the voice line, press **Test voice**. Turn on Picture gates if you want them.
2. Phone: connect, award a point, check the four cards fit without scrolling. Open **More** and close it.
3. Finish a short session and Arena, open Island Run, start island 1. Watch for the navigator name, a listening gate, a picture gate (if on) and the Word Trail before the boss.
4. Miss one question on purpose: it returns as a second chance before the boss.
5. Return to Champions, **Save Record** on the phone, then open the Sheet: Question_Log and Question_Summary should appear.

If speech misbehaves, switch Listening off from the phone (More, or the Island Run panel). The current word appears as text immediately.

## Lightweight by design

No new images, fonts or libraries. Pictures are inline SVG drawn only when a picture gate is on screen. Speech uses the browser's built-in voices. Letter tiles are drawn on the existing canvas. Light graphics mode and reduced motion work as before.
