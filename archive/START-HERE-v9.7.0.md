# v9.7.0 — One navigator per session, student seals, and a phone controller for Island Run

## Deploying this update

1. Finish the active lesson and save the session from the remote, as usual.
2. **Update the Apps Script (required).** Open your Sheet → **Extensions → Apps Script**. Replace the whole script with **GOOGLE-APPS-SCRIPT-v9.7.0.gs**. Check that the `TEACHER_PIN` line still holds your own PIN. Save, then **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. Keep the same deployment URL and access settings. Do not create a second deployment. (This script also contains everything from v9.6.0, so it is the only update needed if you skipped v9.6.0.)
3. Deploy the complete extracted project to your existing Netlify site with your usual method. Include **public**, **netlify/functions** and **netlify.toml**. No new environment variables are needed.
4. Refresh the board and the phone. Both opening screens must show **Island Run Edition · v9.7.0**. Mixed versions are refused on purpose.

If you skip step 2, a save that carries navigator seals stops with a message asking you to update the script. The seals stay on the phone and the board, and nothing is lost; save again after updating.

## One navigator for the whole session

When a team wins the Final Arena and goes on to Island Run, one student is chosen at random from that team's contributors in this session (the whole team if nobody contributed). That student is the navigator for every Island Run of the session: every island, every replay. The board's history line records the choice, the opening card names them, and a page reload keeps the same student. There is no "Another student" button any more.

## Island seals belong to the navigator

- Each island the navigator's runs complete (practice runs excepted) earns **that student** the island's seal. The result card shows it, for example **Emobi Nese · seal 3 of 10**, and when the class is back on the board a card announces **Navigator seal earned**.
- When a student earns points, their award card on the team card is a little larger and shows **ten seal places**: islands 1–5 on the first row and 6–10 on the second. Earned seals are bright gold with the island number, so they read from the back of the room; empty places are faint outlines with the number. The points are no longer printed on this card (the score panel and the history still show them).
- Seals are no longer shown on the team cards (board and remote). The team's passport still unlocks islands and restores the map, as before.

**Google Sheet.** A new **Navigator_Seals** tab keeps one row per student and island: **Date, Class, Team, Student, Student ID, Island, Guardian, Session ID**. Saving again never repeats a row. Rows are matched by the roster's student ID, so a student renamed in Manage keeps their seals. **Load islands** brings the seals back to the board and the phone, so they appear on any device after loading.

## A student controller on your phone

Some students prefer not to stand at the board. While Island Run is open, your phone can steer the runner:

- When a run starts, a large **student controller** pops up on the phone: **UP**, **DOWN** and a big **JUMP** button, with the navigator's name at the top. **Teacher ✕** returns to your usual controls; it then stays closed until the next run starts. **Student controller** in the Island Run panel opens it again.
- **Bluetooth keyboard.** Pair a Bluetooth keyboard with your phone and give it to the student. **↑** and **↓** change lanes; **→** or **Space** jumps. The keys work whenever Island Run is open on the board, even with the controller closed, so the student never needs to see your screen. Holding an arrow down moves only one lane.
- The board's own buttons, swipes and keys keep working at the same time.
- The phone tries to keep its screen awake while Island Run is open. If your phone still locks, set **Settings → Display & Brightness → Auto-Lock** to a longer time for the lesson; a locked phone cannot pass key presses on.

## Quick classroom check

1. Board and phone show **v9.7.0**.
2. Award a student: the award card shows their name and ten seal places.
3. Finish the session and open Island Run. The opening card names the navigator; the phone shows the same name, and the student controller pops up when the run starts.
4. With a Bluetooth keyboard paired to the phone, press ↑, ↓ and Space: the runner moves on the board.
5. Win an island: the result card names the navigator's new seal. Back on the board, "Navigator seal earned" appears, and that student's next award card shows the seal.
6. **Save Record** on the phone, then open the Sheet: **Navigator_Seals** has a row for the seal.
