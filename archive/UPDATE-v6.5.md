# Update your existing Netlify site to v6.5

This update must be uploaded as the complete package. Uploading only `index.html` will omit the redesigned Guardian and VIXAR files.

1. Download and extract `english-league-animated-bosses-v6-5-netlify.zip`.
2. Open the GitHub repository already connected to your Netlify site.
3. Choose **Add file → Upload files**.
4. Upload the contents of the extracted folder, preserving the `public`, `netlify`, and `vendor` folder structure. Allow GitHub to replace files with matching names.
5. Commit the changes to the production branch used by Netlify.
6. Open Netlify and wait until the new Production deploy says **Published**.
7. Open the game in a private window and confirm the startup label says **Animated Evolution · v6.5**.
8. Select **Animated** and test Unity Ascension or the secret VIXAR raid. The redesigned artwork is exclusive to Animated mode.

Your existing Cloudflare TURN environment variables do not need to be changed.

If Netlify still shows an older version, verify that GitHub contains `public/assets/animated/unity-guardian.webp` and `public/assets/animated/vixar.webp`, then use **Deploys → Trigger deploy → Clear cache and deploy site**.
