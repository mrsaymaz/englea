# v10.1.2 — Dates in Google Sheets are day first (DD/MM/YYYY)

Every date the app saves to Google Sheets now reads **day/month/year**, with the time, for example **05/10/2026 19:46:12** for 5 October 2026.

Before, the Apps Script wrote each save's date as US-style text, month first (10/5/2026, 7:46:12 PM). Now it writes a real date that the Sheet always shows as DD/MM/YYYY, whatever the Sheet's region setting. Because it is a real date, you can also sort and filter by it.

This covers every tab the app writes a date to:

| Tab | Column |
|---|---|
| Leaderboard | Date |
| Battle_Results | Date |
| Student_Contributions | Date |
| Navigator_Seals | Date |
| Island_Progress | Last updated |
| Question_Log | Date |
| Question_Summary | Last wrong (date only) |

## Deploying this update

1. Finish the active lesson and save the session from the remote, as usual.
2. **Update the Apps Script (required for the new date format):**
   1. Open your Sheet → **Extensions → Apps Script**.
   2. Replace the whole script with **GOOGLE-APPS-SCRIPT-v10.1.2.gs**.
   3. Check that the `TEACHER_PIN` line still holds your own PIN, then **Save**.
   4. **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. Keep the same deployment URL and access settings, and do not create a second deployment.

   The new script includes everything from v10.0.0 (the School League Season), v9.7.0 and v9.6.0.
3. Deploy the complete extracted project to your existing Netlify site with your usual method. Include **public**, **netlify/functions** and **netlify.toml**. No new environment variables are needed.
4. Refresh the board and the phone. Both opening screens must show **Island Run Edition · v10.1.2**. Mixed versions are refused on purpose.

## Optional: convert the dates already in your Sheet

New saves are day first straight away. Rows saved before this update keep their month-first text until you convert them once:

1. In **Extensions → Apps Script**, choose **formatOldDates** in the function list at the top. It sits next to the Run button.
2. Click **Run**. The first time, Google asks you to allow the script to edit your Sheet.
3. The log shows how many dates were converted in each tab.

What it changes:

- Month-first text such as "10/5/2026, 7:46:12 PM" becomes 05/10/2026 19:46:12.
- Dates written as "2026-10-05T…" or "2026-10-05" become day-first dates too.
- Cells that are already dates only switch to the day-first format.
- Anything else, such as notes or text typed by hand, is left exactly as it is.
- Running it a second time changes nothing.

Run it when no lesson is being saved.

## Quick check

1. Save a session from the phone.
2. In the Sheet, the new Leaderboard row's date reads day first, for example **05/10/2026 19:46:12**.

Earlier guides: `archive/START-HERE-v10.1.0.md` covers the one-step Teacher sign-in and the v10.1.1 student cards. `archive/START-HERE-v10.0.0.md` covers the elemental cards and the School League Season.
