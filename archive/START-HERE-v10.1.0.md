# v10.1.0 — One-step Teacher sign-in

**v10.1.1: student cards on the board.**

- **One card at a time.** When another student earns points, the card on screen fades out in about 0.2 s, then the new card appears.
- **No card during a ranking change.** If the award changes the ranking, the card fades first, the team cards slide, and the new card appears once its team card has landed.
- **A shorter pause at each award**, with the same card look.
- Deploy the project as below. The Apps Script is unchanged, and both opening screens show **v10.1.1**.

Type your Teacher PIN once, when you connect the phone. After you tap **Allow** on the board, the phone signs in to Google Sheets and loads everything for the lesson:

- the online **roster** (student names);
- the class's **islands**, **navigator seals**, Island Run questions and answer log;
- the **School League Season** totals.

No more separate PIN prompts: **Load islands**, **Save Record**, saved-result **Send/Retry**, **Manage** and **Studio** all reuse the same PIN.

## Using it

1. On the board, tap **Start New Session** as usual. The board shows the room code.
2. On the phone's opening screen, under **Remote Control**:
   - type the **4-digit room code**;
   - type your **Teacher PIN** in the new box below it;
   - tap **Connect Phone**.
3. Tap **Allow** on the board.
4. A pill at the bottom of the phone shows the progress:
   - **Signing in to Google Sheets…**
   - **✓ Signed in · student names loaded**, and once a class is chosen: **✓ Signed in · names, islands, seals and season loaded**.
   - The pill fades after a few seconds. The More sheet (•••) then shows **Teacher signed in ✓**.

### Notes

- **The PIN box is optional.** Leave it empty and the remote works as before: Load islands asks for the PIN when a class is chosen.
- **Wrong PIN.** The pill says **Teacher PIN not accepted · tap to try again**, and Load islands asks once. A PIN that works there signs you in for everything, names included.
- **Signing in later.** Open the More sheet (•••) → **Teacher sign-in**.
- **Student names reach today's lesson** as long as no student has been awarded yet. After the first award, the lesson keeps its names, and new names apply from the next session. This is how Manage already works.
- **The PIN is never saved.** It is kept only in the phone's memory for this lesson, and it is cleared from the box as soon as you tap Connect Phone. Reloading the phone forgets it.
- **The board needs no PIN while the phone is connected.** The board does not contact Google Sheets itself. The phone loads the data and passes it on.

## Deploying this update

1. Finish the active lesson and save the session from the remote, as usual.
2. **Apps Script: no change.** Keep **GOOGLE-APPS-SCRIPT-v10.0.0.gs**. If your Sheet still runs an older script, follow step 2 of `archive/START-HERE-v10.0.0.md` first.
3. Deploy the complete extracted project to your existing Netlify site with your usual method. Include **public**, **netlify/functions** and **netlify.toml**. No new environment variables are needed.
4. Refresh the board and the phone. Both opening screens must show **Island Run Edition · v10.1.1**. Mixed versions are refused on purpose.

## Quick classroom check

1. Board and phone show **v10.1.1**.
2. Connect the phone with the room code and your Teacher PIN, then tap **Allow**.
3. Choose the class. The phone shows **✓ Signed in · names, islands, seals and season loaded**, and no PIN box appears.
4. At the end, **Save Record** has the PIN filled in already. Tap **Submit**.

The elemental student cards and the School League Season from v10.0 are unchanged; see `archive/START-HERE-v10.0.0.md`.
