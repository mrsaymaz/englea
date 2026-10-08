# v11.0.0 — The Vixar Saga

Each class now has its own Vixar Saga: three fights across the term, each against a stronger form of Vixar, ending with Mr. Saymaz freed from the curse. Everything from v10.5.1 is kept: tallies, wheels, the Challenge Deck, the Battle Arena, Island Run, Secret Agent and the Comeback Halo.

## Deploying this update

1. **Apps Script: update.** Open the Google Sheet → Extensions → Apps Script. Replace the code with **GOOGLE-APPS-SCRIPT-v11.0.0.gs**, then Deploy → Manage deployments → Edit → **New version** → Deploy. The web-app URL stays the same. The script creates two tabs the first time they are needed:
   - **Vixar_Saga**: one row per class (stage, level cap, attempts at the current form, the date each form was broken, corrections).
   - **Vixar_Finale_Lines**: the Finale's thank-you speech for each grade.
   Merge Spell answers are added to **Challenge_Log** as `Merge · …` rows.
2. Deploy the complete project to your Netlify site as usual (**public**, **netlify/functions**, **netlify.toml**). No new environment variables.
3. Reload the board and the phone. Both opening screens must show **Island Run Edition · v11.0.0**.

If the old script is still deployed, the phone says "The Vixar Saga is kept on this board and phone. Update Apps Script using GOOGLE-APPS-SCRIPT-v11.0.0.gs…" and keeps the saga queued until the new script is live.

## How the saga runs

| Act | Vixar form | The class needs | A win gives |
|---|---|---|---|
| I | **Violet** | every team at Level 10 + the Class Mission | Level 11 (**Mythic**, violet crystal) from the next session |
| II | **Scarlet** | every team at Level 11 + the Class Mission | Level 12 (**Celestial**, scarlet ember) from the next session |
| III | **Gilded** | every team at Level 12 + the Class Mission + the Merge Spell | The Finale · the class is **Freed** |

- **One fight per class per session.** After a win or a loss the Rift closes until a later lesson. A loss keeps the form and the level cap and counts an attempt. Nothing names a team or a student as the reason.
- **The cap rises from the next session.** A class that breaks the Violet form stays at Level 10 for the rest of that lesson.
- **Undo never changes the saga.** To fix a misclick or a test run, use **Set stage** on the phone (below).
- **Reloading mid-fight** (a crash, a closed tab) brings the board back with the Rift open and no attempt counted.

## On the phone: More controls → Vixar Saga

- The class's stage and attempt, and how close it is: "Level 11: 3 of 4 teams · Class Mission ✓".
- **Hold to open the Rift** for 1.5 seconds. A short tap does nothing, so it can't be opened by accident. Nothing appears on the board until every team reaches the act's level; then the raid sigil appears. **Close the Rift** if plans change.
- **Switch to Soft**: shown when Hard progression is on, because Hard rarely reaches the act's level in one lesson.
- **Replay the Finale** (a Freed class only).
- **Set stage (Manage, PIN)**: moves a class to any stage. It asks for confirmation, saves to Google Sheets and is written in the Corrections column.
- During the Merge Spell the phone shows the question, the suggested student (the one with the fewest contributions; you can change them) and the three options. During the Finale it shows **Continue** and **English voice: on/off**.

The saga row is saved through the phone's outbox, like the other Google Sheets saves. Offline, it waits ("Offline · the board's saved copy") and is sent after the Teacher sign-in.

## Try the fights first: the Vixar fight preview

Open **`vixar-preview.html`** on your site (for example `https://your-site.netlify.app/vixar-preview.html`) and choose Act I, II or III, or the Finale, in Animated or Light mode. The board asks for the access code as usual, then opens straight into that fight with every team at the act's level, the Class Mission complete and the Rift open. Use Pause, Skip and Exit as in class; answer the Merge Spell on the board. The **Preview** button at the top switches act or display.

Nothing is saved: the preview keeps everything in that browser tab's memory, never touches the classes' saga, sessions or contributions, and sends nothing to Google Sheets. The address is `index.html#preview-act1` (… `act2`, `act3`, `finale`, with `-light` for Light mode).

## The fights

**Act I · Violet.** The familiar Vixar fight. Each act opens with a title card (the act, the form's name and one line of story). At the moment of victory the board celebrates, then freezes like a film: the violet form shatters into crystal and Scarlet Vixar's face looks through a tear in the air. The reward ceremony shows "The Violet Form Is Broken" and each team's Level 11 form.

**Act II · Scarlet.** Longer and tougher. Scarlet Vixar's **Scarlet Brand** marks one team for six seconds; while the mark is on, part of that team's damage heals Vixar, so the other teams carry the attack. The arena is a crimson eclipse over obsidian spires. The scarlet form shatters into embers and Gilded Vixar looks through the tear.

**Act III · Gilded.** Gilded Vixar can't be pushed below 70% until it casts the **Edict of Separation**. Then the **Merge Spell** begins:
- Houses answer English questions from the class's islands in a fixed order: Gryffindor, Hufflepuff, Slytherin, Ravenclaw, then again. Each house needs 2 right answers for its pair to fuse (4 per pair).
- A wrong answer passes the turn to the partner house, which can rescue the pair with a new question. The student who missed is never named.
- The ritual circle drains for **2 minutes** (no seconds are shown). If it empties, Vixar shatters it once and a **second casting** of 1 minute begins for any pair not yet fused. A fused pair stays fused.
- **Slyffindor** (Gryffindor + Slytherin) and **Huffleclaw** (Hufflepuff + Ravenclaw) fight as one stronger fighter each. A pair that did not fuse fights on as two teams.
- Answer from the board or the phone. Every answer is logged in **Challenge_Log** (`Merge · …`).

**The Finale** (after Act III): the gold cracks, the armour breaks, Mr. Saymaz breaks free of the cursed gown (its chains, violet bindings and gold faceplate shatter) and thanks the class line by line (one line per Continue), the board names up to three students from each house who carried it (contributions in the saga sessions, Island Run navigators, Merge Spell answers), the four Celestial creatures turn back into their Level 0 selves, run to him and jump into his arms, and a closing card shows the class and the date. Short captions tell the story between the steps. Press Continue on the board or the phone. **English voice** reads the lines aloud with the device's English voice, if it has one.

After the Finale the class is **Freed**: Mr. Saymaz stands where the raid sigil was, as an ally. Tap him to replay the Finale (no fight).

## Teacher Studio → Finale speech

Edit what Mr. Saymaz says in the Finale for each grade: one line per Continue, 1 to 10 lines of up to 160 characters. **Use the default lines** restores the built-in speech. **Save online** writes the Vixar_Finale_Lines tab; other boards pick it up at the next sign-in.

## Also in this build

- **Every fighter faces Vixar** (and its opponent in the Arena).
- **English Wheel cards no longer show point totals**, which can get very large. The card says "✓ Right: keep Level 5 and its points · ✗ Wrong: back to Level 4", and the result says "Hufflepuff gets to keep its Level 5 and its points!" or "Hufflepuff goes back to Level 4 and the points it had there."

## Old smart boards

The new combat effects (damage numbers, sparks, hit-stop, the ground warning, shield shards, a small shake) animate only position and opacity, share the board's effects budget and stop when the scene pauses or the tab is hidden. **Light mode** or **reduced motion** shows the numbers still and plays the escapes and the Finale as still frames with the same results.

## The art

Mr. Saymaz (portrait, five poses and a six-frame reveal in which he breaks free of the cursed gown) and the two fused creatures, Slyffindor and Huffleclaw (pictures and nine-pose sheets), are in this build. **Still to come (placeholders in the build):** Mr. Saymaz kneeling with his arms open (`public/assets/saga/mr-saymaz-kneel.webp`) and the hug illustration (`public/assets/saga/hug.webp`). Both files are labelled half-size placeholders that the board skips: until they are replaced, he bends down to the little creatures and holds them with his arms open. Replace each file with the real picture under the same name, deploy and reload. Scarlet and Gilded Vixar fight as their full pictures; the placeholders for sharper poses are in `art/vixar-poses/` (see the README there). Details: **CREATURES-v11.0.0.md** → "Mr. Saymaz and the fused teams". Earlier guides are in `archive/`.
