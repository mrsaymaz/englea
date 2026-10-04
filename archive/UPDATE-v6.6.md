# Updating to v6.6 — no Terminal needed

1. Download and unzip `english-league-v6-6-netlify.zip`.
2. Open the existing GitHub repository connected to your Netlify site. Go to the main file list, where `public`, `netlify` and `netlify.toml` already appear.
3. Choose **Add file → Upload files**. Drag in the contents of the extracted `english-league-v6-6-netlify` folder, including its `public` and `netlify` folders. Do not upload the outer folder itself.
4. Commit the files to the branch Netlify uses for production. Wait for its new deploy to finish.
5. Open your game in a private browser window. Confirm **Animated Evolution · v6.6** on the startup screen, then select **Animated**.
6. Reload the smartboard and phone before starting a new lesson.

Keep the existing Cloudflare environment variables and Netlify settings. The package uses the same `public` publish folder and `netlify/functions` folder.

Upload the full package, not only `index.html`. The new animation requires `public/raid-motion.js`, the updated `public/animated-mode.css`, and four `guardian-*.webp` images in `public/assets/animated/`.

To check it: complete a Class Mission to see body → head → tail → wings, followed by three separate level rewards. During the VIXAR raid, watch for lunges, coloured bolts, shields and hit reactions. The simplified HUD keeps HP and Knocked Out labels visible.

If an old version appears, check the deployed GitHub commit and branch first. `public/index.html` should begin with the v6.6 version comment; avoid placing another `index.html` at the repository's top level.
