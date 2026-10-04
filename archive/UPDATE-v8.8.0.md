# English League v8.8.0 — Island Run

After the Battle Arena finishes, **Island Run** appears beside the **Battle Arena champion's avatar** on the results screen. If the same team also wins the League, it appears beside the Grand Champion. The other champion and all four teams' contributor panels stay in their existing result layout.

## Using it

1. Start a tally session, select the class and run the lesson as usual.
2. Finish the session and let the Battle Arena complete.
3. Select **Island Run** beside the Battle Arena winner.
4. The island map opens with that winning team, its current avatar/level and the session's class already selected. Choose Soft or Hard and an unlocked island, then select **Run this island**.
5. Use the board's Up, Down and Jump controls, swipes or keyboard as in the approved standalone build.
6. Select **Back to Champions** to return to the tally results. An unfinished run pauses and stays available if you reopen Island Run during the same result screen. Completed islands are saved immediately.

If no class was selected in the tally session, a five-option class picker appears before the adventure. This chooses the runner's curriculum without rewriting the finished tally record.

## What carries over

- The **Battle Arena winner** is the runner, even if another team is League champion.
- Animated mode uses the winning team's actual current-level artwork. Performance and Light modes use the tally renderer's current SVG avatar with its earned traits.
- Grade and class come from the session. The winner/class selectors are fixed in the integrated map; Soft/Hard and teacher question editing remain available.
- Island progress stays separate for each class and team and continues across sessions in the same browser. Question edits and recently shown question history are retained too.
- The approved Runner v3 mechanics remain: 4,240 variations, recent-topic selection, higher forward jumps, active coins/hazards during questions, and boss targets rising by 2 percentage points per island (Soft 50–68%, Hard 70–88%).
- Runner coins and bonus scores belong to the adventure. They do not rewrite finalized tally points, levels, participation, champion titles or Google Sheet records.

**Teacher remote:** while a run is active, the existing scene controls show **Pause/Resume** and **Back to Champions**. Movement remains on the smartboard. On the island map there is no running course to pause, so only the return action is shown.

**Starting a new tally session or leaving the results screen** clears the paused, unfinished run. Completed island progress and saved question edits remain. Reloading the page also loses an unfinished run; session recovery restores the tally result, from which Island Run can be opened again.

## Move your standalone progress

The standalone file and deployed website may have different browser storage. To transfer progress:

1. In the standalone runner, open **Teacher → Save & restore → Download backup**.
2. In the integrated runner, open the same panel and import that JSON backup.
3. Check the import summary and select **Replace with this backup**.

The backup's progress and question edits are restored. The current launch still uses the battle-winning team and the class selected for this session. As before, importing replaces the runner's current local save, so export it first if needed. Versions 1, 2 and 3 backups are supported.

## Deploy to your existing Netlify site

Use your current deployment method for the **complete project**, including Netlify Functions. The website is not deployed by this ZIP download.

1. Extract the entire ZIP. The root contains `netlify.toml`, `public/` and `netlify/functions/`.
2. If your site deploys from a connected repository, update that repository with the extracted project contents and commit to its deployed branch. Include the entire new `public/island-runner/` folder, `public/island-run.js`, `public/island-run.css`, and the updated `public/index.html` and `public/game.js`.
3. Keep the existing site and its environment variables. The publish directory remains **public** and the Functions directory remains **netlify/functions**. Use the same Functions-capable process you used for v8.7.0; uploading only the HTML file is insufficient.
4. Wait for deployment to complete, then reload both the board and phone. The opening badge reads **Island Run Edition · v8.8.0**.
5. Finish a short test session, launch Island Run, try moving/jumping, pause from the remote, return to Champions and reopen the paused run.

**No Google Apps Script update is needed when updating from a working v8.7.0 deployment.** The v8.7.0 Apps Script, roster function, access-time function and TURN function are unchanged. Existing Google Sheet tabs and columns need no changes. Keep the included older setup instructions only for their original setup tasks.

The runner loads when opened, rather than adding its question bank and boss artwork to every normal tally session. The integrated child page opens through the existing teacher-access/results flow; its direct URL displays a link back to the tally.

## Validation

The embedded gameplay passed all 23 Runner v3 logic suites and 240 full-run simulations. Integration harnesses exercised the real runner UI code, tally result functions and remote command routing. Existing dependency-free tests for participation, roster backend, contribution-based leaders, wheel rules, class mission, team resets and arena balance passed. See `TEST-REPORT-v8.8.0.md` for details.

Native browser rendering, a live remote connection and physical smartboard touch were not exercised for this integration in the build environment. Complete the short device test above before classroom use.
