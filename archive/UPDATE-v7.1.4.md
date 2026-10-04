# Update your existing Netlify site to v7.1.4

1. Extract this ZIP.
2. Update the existing site's source with the complete `public` folder, alongside the included `netlify` folder, `netlify.toml` and `VERSION.txt`. Keep `public` as the publish directory.
3. Deploy the update using your usual Netlify process.
4. Reload both the smartboard and phone. The opening screen should show **Animated Evolution · v7.1.4**.

The TURN function, Netlify settings and Google Apps Script are unchanged. If `GOOGLE-APPS-SCRIPT-v7.1.2.gs` is already deployed, you do not need to deploy it again for v7.1.4.

## What to check

1. Select a class and award one student a point twice.
2. Open that team's **+** picker again and confirm the student's name says **2 contributions**.
3. Award a different student a larger point amount only once. The first student should remain above them in participation rankings because rankings now use contribution count.
4. Finish the session. On the phone, tap **Participation** and confirm the four team lists and counts.
5. Open **Save Record** and save normally. The existing Google Sheet leader columns continue to use contribution counts.

Team Reset still preserves student contributions. New Session still clears them.
