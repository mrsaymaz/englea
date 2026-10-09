# Update your existing Netlify site to v7.1.3

1. Extract this ZIP.
2. Update the existing site's source with the complete `public` folder, alongside the included `netlify` folder, `netlify.toml` and `VERSION.txt`. Keep `public` as the publish directory. The outer ZIP folder should not become an extra folder in your site's source.
3. Use your usual deployment process for the existing site and wait for it to finish.
4. Reload the smartboard and phone. Both opening screens should show **Animated Evolution · v7.1.3**.

The new files `public/student-rosters.js`, `public/student-ui.js` and `public/students.css` must be deployed together with the updated `public/game.js`, `public/index.html` and `public/remote-protocol.js`. Uploading only `index.html` is insufficient.

The existing TURN function, Netlify configuration and environment variables are unchanged. The on-screen student features work without a Sheets change. To store the count-based team leaders in Google Sheets, install the included `GOOGLE-APPS-SCRIPT-v7.1.2.gs` using the steps below.

If you already deployed `GOOGLE-APPS-SCRIPT-v7.1.2.gs`, no Apps Script redeployment is required for the automatic point-tier feature.

## Update the Google Apps Script

1. Open the Google Sheet used by the league and choose **Extensions → Apps Script**.
2. Open `Code.gs`, replace its contents with the complete contents of `GOOGLE-APPS-SCRIPT-v7.1.2.gs`, and save.
3. Choose **Deploy → Manage deployments**. Open the existing web-app deployment with the pencil icon, select **New version**, and deploy. Updating the existing deployment keeps its web-app URL, so the site endpoint does not need to change.
4. If Google asks for authorization, approve the spreadsheet access for your own script.
5. Make sure columns **I–L** of the `Leaderboard` sheet are empty, then finish a test session and save its official record from the remote. The four leader headers will be added automatically.

The four new columns are **Leaders of Gryffindor**, **Leaders of Hufflepuff**, **Leaders of Slytherin**, and **Leaders of Ravenclaw**. Each cell stores up to three names with their number of contributions, for example `Nog (5) · Süvog (4) · Meyebur Eril (3)`. Student point totals are not written to these columns.

## In class

1. Start a session on the board and connect your remote as usual.
2. Tap **Class**, then **5-A**, **5-C**, **6-C**, **7-A** or **8-B**. The popup closes and the selected class remains in the header. Tapping **+** before selecting a class guides you through this step.
   - 5-A or 5-C selects **10** points.
   - 6-C selects **100** points.
   - 7-A selects **1,000** points.
   - 8-B selects **10,000** points.
   You can press any point-tier button afterward to change the award amount normally.
3. Tap a team's **+**, then choose the student who earned the points. Only that class's members of the chosen team appear. Closing the popup adds nothing.
4. The student's name and the actual earned points appear near the team avatar. An evolution-ready or level-unlocked message appears when relevant.
5. Finish the session as usual. The League and Arena champion panels show leading contributors, their points and their rank. **View all** expands the remaining names. If the same team wins both titles, its contributors appear under the combined champion.
6. **Start Session** clears the previous totals and class choice. Select the next class on the remote.

The board's **Class** and **Add Points** buttons also offer the same choices. Positive custom point awards use the student picker too.

## Quick check on your real devices

- Select your class and award points to two different students. Check their names and the score on the board.
- Cancel one student selection and confirm the score stays the same.
- Use **Undo** on the board to reverse an award and its student credit.
- Use **Reset Team** once and confirm that the team score returns to zero while the students' earned contribution list remains available.
- Reload the board and select **Resume session**. Reconnect the phone and check the class and score.
- Finish a session and check the champion contributors. Tap **View all** if there are more names.
- When saving the official result, check the pre-filled class, enter your usual PIN and verify the usual result row plus the four leader cells in columns I–L.

Local browser tests used simulated phone transport. This short check confirms behavior on your actual phone, smartboard and classroom network.
