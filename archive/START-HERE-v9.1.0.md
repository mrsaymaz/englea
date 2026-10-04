# v9.1.0 — the interactive Island Run update

This package updates your existing tally system. Island Run still opens beside the Battle Arena champion, using that team's class and current avatar. There is no separate site to deploy.

## Upgrade in this order

1. Keep a copy of your working deployment and download an Island Run backup from **Run settings → Save & restore**. Finish any active lesson first.
2. Open your existing Google spreadsheet. Choose **Extensions → Apps Script**.
3. Open **GOOGLE-APPS-SCRIPT-v9.1.0.gs** from this package in a text editor. Copy its contents into the existing main script file, replacing the previous complete version. Do not add a second copy alongside the old functions. Keep your current `TEACHER_PIN` value.
4. Save. Choose **Deploy → Manage deployments**, select your existing web-app deployment, click its edit/pencil control, choose **New version**, then **Deploy**. Keep the same deployment URL and existing execution/access settings. Do not create a separate web app.
5. Deploy this complete project to your current Netlify site once, using the same deployment method that already works for you. Include **public**, **netlify/functions**, and **netlify.toml**. Do not upload only the public folder: the connection and Sheets functions are still required.
6. Keep your working Cloudflare TURN environment variables unchanged. No new key, token or environment variable is needed for this update.
7. Refresh/reopen the board and phone. Both opening screens should show **Island Run Edition · v9.1.0**. Create a new room and approve the phone.

Your existing Google Sheet is retained. The script automatically adds **Best coin percent** in column G and **Hard cleared** in column H of `Island_Progress`. The first six columns and historical rows are preserved. Other result, participation, roster and teaching tabs keep their existing functions.

If you already put your own data in columns G/H of `Island_Progress`, move those custom columns elsewhere first. The script stops with an explanation instead of overwriting them. Do not rename, clear or rebuild your existing result tabs.

If the older Apps Script is still deployed, new passport saves will ask you to update it; they will not silently discard the extra statistics. Progress stays local until you retry the save. Keep that browser's data or download a backup.

## What students do

- **Run:** Up/Down change lanes; Jump or swipe right jumps. Coins and obstacles remain active during learning questions. Each island introduces one special rule early in the run.
- **Read:** The prompt appears first. Choices then stay in fixed lane positions while a small gold selection marker approaches. Choose the answer lane; jumping does not change the selected answer. No countdown is displayed.
- **Focus:** Correct answers add 28 Focus; every five consecutive collected coins add 6. Special island runes also add Focus. At 100, Focus automatically gives a seven-second nearby-coin magnet and protection from one hit. It does not create coins or change the boss target. All four teams receive identical benefits with their own elemental colours/trails.
- **Boss:** Dodge the marked lane(s), or jump. When a gold lane appears, move into it and stay briefly to launch collected coins. Four successful volleys can win if enough coins were collected. Soft allows six openings; Hard allows five. Correct answers slightly lengthen each opening. Missing too many openings or losing all guards can still end the run.
- **Celebrate:** A five-second, skippable restoration scene plays before the result panel. The champion's avatar lands, the island gains its team's restoration layer, and the boss seal appears. It adds no new tally points or contribution records.

The targets are unchanged: Soft starts at **50%**, Hard at **70%**, increasing by **2 percentage points per island**. Island 10 requires **68% / 88%**. Each target is rounded up from the route's actual finite coin total. Learning bonus points and Focus never substitute for required coins.

## The ten island mechanics

| Island | Mechanic | Student action |
|---|---|---|
| 1 | Lantern gates | Jump the amber hurdle. |
| 2 | Clockwork cargo | Watch a gear change lanes, then dodge or jump. |
| 3 | Crystal reflections | Collect the solid diamond; hollow echoes are harmless. |
| 4 | Rising roots | Leave the marked lane or jump. |
| 5 | Signal crossing | Follow the green lane. |
| 6 | Stormstream | Catch the silver wind for Focus. |
| 7 | Tidal sweep | Jump the low wave. |
| 8 | Moonlit trail | Follow three moonstones. |
| 9 | Forge vents | Jump the paired vents. |
| 10 | Eclipse passage | Find the clear lane or jump the shadow pulse. |

Mechanics wait until learning questions and corrections have finished. Ordinary course coins and obstacles continue during questions. Each mechanic reserves a short clear obstacle corridor; no coins are deleted from the route.

## Island Passport and saving

Choose **Passport** on the island map. Each of the ten slots shows the team's earned boss seal, best stars, best coin percentage and Hard-clear mark. Older saved victories retain their seals and stars; their coin percentage stays blank until a new successful run supplies it. Practice runs do not update passport records.

After running, return to **Champions** and use **Save session** on the teacher remote. This saves the latest passport along with the existing session record. Re-saving the same session updates its progress without duplicating the lesson result. On another board, choose the class and **Load islands**. Progress remains separate by class and team. Soft/Hard share unlocks; weaker replays never reduce best records.

Teacher Studio and the editable question pool remain in place. Published changes affect the next run, not a run already underway. The three challenge types remain balanced and use the existing no-repeat history.

**Run settings → Save & restore → Download balance notes** exports the last 60 local runs for troubleshooting difficulty. It contains no student or class names and is not sent online automatically.

## Vixar is unchanged

Vixar is the separate raid on the main tally board. The raid button becomes available when all four teams are at least **Level 8**. All four at **Level 10** can break seals and damage Vixar. The existing Class Mission/Unity Guardian victory sequence remains. Completing ten islands is **not** required to reveal Vixar.

## Five-minute pre-class check

1. Connect the phone, choose a class, award a student point, and check that the board changes.
2. Complete a test Arena session and open the glowing island beside the Arena champion. Confirm the correct team, class and avatar.
3. Use **Run settings → Test any island** to preview a boss and the new island rule without changing progression. Test Up, Down, Jump, pause and returning to Champions.
4. On the actual horizontal smartboard, check that a long prompt and all three choices are readable. Use Calm or Extra breathing room as appropriate. Try reduced motion if desired.
5. After a real completed run, save the session and load islands again. Check the passport and the new `Island_Progress` columns.

The supplied automated tests pass, but this build has not been tested on your physical smartboard/iPhone, live Netlify deployment or live spreadsheet. See **TEST-REPORT-v9.1.0.md** for the exact verification scope. No live account was changed while preparing this ZIP.
