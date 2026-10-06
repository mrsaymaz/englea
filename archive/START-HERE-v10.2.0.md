# v10.2.0 — Comeback Halo

Teams that won **neither the League title nor the Final Arena** in a class's last session earn **double points (×2)** for that class's next session. This gives them a real chance to catch up.

## How it works

- **The halo shows on the board.** Each halo team's avatar wears a golden halo with **×2** above its head.
  - The halo follows the avatar as it evolves. Each of the 44 evolution pictures, and each Light-mode avatar, has its own head position, so the halo always sits on the head.
  - When a head is near the top of the picture, the avatar shrinks very slightly so the halo stays clear of the team name.
- **The phone marks those teams with a small gold "×2".**
- **Who gets it:**
  - Every team that won neither title gets the halo.
  - A Grand Champion (both titles) leaves the other three teams with a halo.
  - A shared League title counts each tied team as a winner.
  - If every team won something, nobody gets a halo, and the first session of a class has none either.
- **Every positive award to a halo team is doubled:** the + button and Award Custom Points. Deductions are never doubled. It stacks with the other bonuses, so a halo team with the ×2 power-up earns ×4.
- **The halo is decided when you choose the class.** It is fixed from the first award to the end of the session, and a board reload keeps it.
- **Each class has its own halo,** based on that class's last session.

### Where the last session comes from

- **The board** remembers each class's result when the Final Arena ends.
- **Google Sheets** sends each class's last saved result with **Load islands**, which runs on its own after you type your Teacher PIN on the phone.
- A class that moves to another smart board therefore keeps its halo.
- If the board and the Sheet disagree, the more recent session counts. Results from Sheets that arrive after the first award do not change the current session.

## Deploying this update

1. Finish the active lesson and save the session from the remote, as usual.
2. **Update the Apps Script** (needed for halos to follow a class to another board):
   1. Open your Sheet → **Extensions → Apps Script**.
   2. Replace the whole script with **GOOGLE-APPS-SCRIPT-v10.2.0.gs**.
   3. Check that the `TEACHER_PIN` line still holds your own PIN, then **Save**.
   4. Go to **Deploy → Manage deployments → Edit (pencil) → New version → Deploy**. Keep the same URL and do not create a second deployment.

   The new script includes v10.1.2 (day-first dates and `formatOldDates`). If you skip this step, the halo still works on each board from that board's own results.
3. Deploy the complete extracted project to your existing Netlify site with your usual method. Include **public**, **netlify/functions** and **netlify.toml**. No new environment variables are needed.
4. Refresh the board and the phone. Both opening screens must show **Island Run Edition · v10.2.0**.

## Quick classroom check

1. **Finish a session for a class**, Final Arena included. Note the League champion(s) and the Arena champion.
2. **Start that class's next session and choose the class.** The other teams wear the halo with ×2, and the phone shows ×2 on them.
3. **Award a halo team:** it receives double the points.

Earlier guides are in `archive/`. `START-HERE-v10.1.2.md` covers the day-first dates.
