# Set up the online roster — English League v8.7.0

You do this setup once. Future name and team changes are made with **Manage** on your remote. They need no new website or Apps Script deployment.

## 1. Update the script attached to your existing spreadsheet

1. Unzip `english-league-v8-7-0-netlify.zip`.
2. Open `GOOGLE-APPS-SCRIPT-v8.7.0.gs` in a plain-text editor. Copy its entire contents.
3. Open the Google spreadsheet you already use for English League results.
4. Choose **Extensions → Apps Script** (Turkish: **Uzantılar → Apps Komut Dosyası**).
5. Open the file containing your current English League script, usually **Code.gs**. Save a copy of the old text as a backup.
6. Replace that file's old English League code with the complete new `.gs` file. Do not paste the new code beneath the old code or leave another copy of the same English League functions in the project. Keep unrelated scripts if you have any.
7. Check that `TEACHER_PIN` at the top matches the Teacher PIN you currently use to save results. This is different from the changing screen-access password.
8. Click **Save**.

The replacement includes the existing leaderboard and battle recording, Full Session recording, Class Mission status and the four participation-count leader columns. It adds roster requests without clearing or rewriting existing results. You do not need to type students or create a tab manually.

## 2. Update the EXISTING web-app deployment

1. In Apps Script, click **Deploy → Manage deployments**.
2. Select the active web-app deployment used by your tally system.
3. Click the **pencil / Edit** icon.
4. Open **Version** and select **New version**. You can enter the description “English League v8.7.0 — editable roster.”
5. Keep **Execute as: Me** and the existing working access setting. The remote's server needs the web app accessible without a Google sign-in; this is normally **Who has access: Anyone**. The script checks the Teacher PIN before returning roster data or accepting writes. Your spreadsheet itself does not need to be publicly shared. School-account policies may restrict this setting.
6. Click **Deploy**. Complete Google's authorization prompt if one appears.
7. Keep using the existing `/exec` URL. Updating an existing deployment preserves its URL. There is no URL to paste into the app when you follow these steps.

Saving the editor alone does not update the live web app. Do not choose **New deployment** for this update, since that creates a different deployment URL. You do not need to press **Run** on `doPost`.

Google's official instructions:
- https://developers.google.com/apps-script/concepts/deployments
- https://developers.google.com/apps-script/guides/web

## 3. Deploy the updated tally app

Deploy the complete extracted project to your existing Netlify site using your existing Git-connected build or Netlify CLI deployment. Keep the `public` folder, `netlify/functions` folder and `netlify.toml` together. The new roster connection needs the included `roster` server function; uploading only `public` as a static site does not deploy that function. Keep your existing TURN configuration. No new environment variables are required for the roster feature.

Refresh both the board and phone. The opening screen should show **v8.7.0**.

## 4. Load the roster for the first time

1. Connect your phone to the board as usual.
2. Tap **Manage** in the remote's top bar.
3. Enter your **Teacher PIN** and tap **Load online**.
4. The script automatically creates a **Roster** tab in your existing spreadsheet and fills it with all **120 existing students**, including the previous team corrections.
5. The five classes and their teams appear on the remote. There is no manual copying of names.

If a tab named Roster already contains unrelated data, rename that unrelated tab first. The script will refuse to overwrite a differently structured Roster tab.

## 5. Edit from the remote

- **Add:** select the class, tap **+ Add Student**, enter the name, choose the class/team and tap **Save online**.
- **Rename or move:** tap the student's name, edit the name or change the team/class, then tap **Save online**.
- **Remove:** tap the name → **Remove from roster** → confirm removal. The student is hidden from future sessions rather than losing their identity.
- **Restore:** turn on **Show removed students**, tap the student and choose **Restore student**.

The app shows **Saved online ✓** only after receiving confirmation. Closing without saving discards the form's edits.

## When do changes take effect?

An active lesson keeps a snapshot of its original roster. Editing or removing a student does not change that lesson's scores, participation counts, Secret Agent assignments or final contributor records.

Use **New Session** on the board, then select the class to use your saved changes. A Team Reset does not start a new session or apply a different roster. If you have not selected a class yet, a loaded roster is available immediately.

Names stay saved between sessions and deployments. The board and phone retain a local copy for lessons without a working roster connection. Online edits require internet access. On a different phone, or to pick up changes made on another device, open **Manage → Load online** before choosing the class for the new session. You never have to re-enter the student list.

Continue using the existing **Record / Save to Google Sheets** process to save lesson results. Roster saves and lesson-result saves are separate operations.

## If something goes wrong

- **Invalid PIN:** use the fixed Teacher PIN in Apps Script, not the changing Turkey-time screen-access code.
- **Update Apps Script / Unknown record type:** the live deployment still uses the old code. Repeat section 2 and choose **New version**.
- **Could not confirm the roster request:** check internet access, the Apps Script deployment/access setting and the Netlify roster function. Choose **Reload online** to see the actual saved data before retrying.
- **Another device changed the roster:** reload the online roster and make your edit again. This prevents overwriting someone else's changes.
- **Changes are saved but the picker shows the old team:** start a New Session. This protects the current lesson's participation records.

Make ordinary roster changes through Manage. Leave Student ID and Active values in the Sheet to the app. Do not delete the Roster tab to start a new lesson; use New Session on the board.

Verification before delivery used the actual Apps Script code with a local Sheets simulator and the real website in Chromium, including a 393 × 660 phone viewport. Your live Google deployment has not been changed or tested from here; the first Load online after these steps confirms the live connection.
