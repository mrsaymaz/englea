# English League v11.0.0 — The Vixar Saga

Vixar is no longer one fight. Each class now plays its own three-act saga across the term: break the **Violet** form, then the **Scarlet** form, then the **Gilded** form, and free Mr. Saymaz from the curse. Start with **START-HERE-v11.0.0.md**.

- **Three acts, one class at a time.** Each win moves the class to the next form and raises its level cap: Level 10 → **11 (Mythic)** → **12 (Celestial)**. The new cap starts from the next session.
- **The Rift.** No fight starts on its own. Mr. Saymaz opens the Rift from the phone (a 1.5-second hold). The raid sigil then appears once every team has reached the act's level.
- **Act I and Act II end in an escape.** The board celebrates a false victory, the celebration freezes, Vixar’s form shatters and its next form escapes through a tear. The reward panel previews every team's next form.
- **Act II: the Scarlet Brand.** Scarlet Vixar marks one team; for a few seconds part of that team's damage heals Vixar.
- **Act III: the Edict and the Merge Spell.** At 70% HP Gilded Vixar casts the Edict of Separation. Old rivals answer English questions in turn to fuse: **Gryffindor + Slytherin = Slyffindor**, **Hufflepuff + Ravenclaw = Huffleclaw**. Without the Merge Spell the class rarely wins.
- **The Finale.** The gold armour cracks and Mr. Saymaz is freed. He thanks the class (lines editable per grade in Teacher Studio), names the students who carried each house, and the four creatures hug him. A Freed class sees Mr. Saymaz as an ally on the board and can replay the Finale.
- **Game-feel combat, light on old boards.** Damage numbers, hit sparks, short hit-stops on criticals, a red ground warning before Vixar's blow, shields that shatter and a few pixels of shake on heavy hits. All of it uses transforms and opacity only, counts against the board's effects budget and turns into still numbers in Light mode or with reduced motion.
- **Fight preview:** `vixar-preview.html` opens any act (or the Finale) straight into the real fight, in Animated or Light mode, with nothing saved.
- **New art:** Level 11 and Level 12 forms of all four teams (avatars and action poses), Scarlet Vixar, Gilded Vixar and its cracking frame, Mr. Saymaz (five poses, a portrait and a six-frame reveal) and the fused Slyffindor and Huffleclaw (pictures and action poses).

**Upgrading from v10.5.1:** paste **GOOGLE-APPS-SCRIPT-v11.0.0.gs** into the Apps Script editor and deploy it as a **New version** of the existing web app. It adds two tabs (**Vixar_Saga**, **Vixar_Finale_Lines**) and logs Merge Spell answers in **Challenge_Log**. No new Netlify or Cloudflare environment variables. Then deploy the whole project and reload the board and the phone (both show **v11.0.0**).

**Art still to come:** only the hug illustration. Until it is added, the hug step shows Mr. Saymaz with the four Level 12 creatures around him. See **CREATURES-v11.0.0.md** → "Mr. Saymaz and the fused teams".

## Verification

`npm run test:v11 --prefix tests` runs the dependency-free suite (all earlier checks plus `v11.cjs`). `npm run test:board --prefix tests` runs the browser suites (board + phone), including `board-v11.cjs`. `npm run test:saga-balance --prefix tests` runs the balance lab. Results: **TEST-REPORT-v11.0.0.md**.

See **NETLIFY-SETUP.md** for deployment, **CREATURES-v11.0.0.md** for the artwork and art slots, and **CHANGELOG.md** for earlier releases. The previous README is in `archive/README-v10.5.1.md`.
