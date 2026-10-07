# v10.5.0 — Living Creatures

This is the complete integrated build, based on your v10.4.3 ZIP.

## See the artwork without a deployment

1. Extract the whole ZIP into a folder on your computer.
2. Open `public/creature-studio.html` in your browser.
3. Choose a creature and, for a team creature, its level (0–10).
4. Click the pose buttons or **Play action sequence**. **Show original** compares it with the existing avatar.

Keep the `assets` and `island-runner` folders beside this page. The studio previews art only; it does not connect to a class, change scores or save records. The complete board still uses your normal hosted setup for the remote and Netlify functions.

## What students will see

| Place | New reactions |
| --- | --- |
| Team cards | Acknowledgement for points, proud evolution/new-leader poses, guard or recoil for existing power-up events |
| Arena and survival | Ready/strike artwork during the existing approach; guard, recoil, dodge, knockout and low-HP bracing |
| Island Run | The team's current-level creature, with two gentle running poses, jumping, landing and boss-attack responses |
| Island bosses | Warning stance, strike, guarding, recoil, exposed core and defeat |
| Vixar | Charge, cast, guarding, phase reveals, final blast and reactions to the Guardian's two claws |
| Results | Champions pose first; tied teams turn towards one another and acknowledge the tie; a creature encourages the lowest-scoring team(s), which respond proudly |

The League and Battle champion areas keep their prominence. Social exchanges occur in the four-team recognition area, inside the avatar boxes; participation names stay visible. There is no new attack-name text.

Action art is enabled in **Animated** mode (the existing default) and Island Run. Original artwork stays visible at rest and whenever a new atlas has not loaded. Reduced motion keeps the artwork changes but avoids the running pose cycle.

## Update your existing site

1. Keep this project's `public`, `netlify/functions` and `netlify.toml` together.
2. Deploy it through your existing working Netlify workflow. See `NETLIFY-SETUP.md` if you need the original setup instructions.
3. Refresh the smart board and the phone after deployment. Both opening screens should show **v10.5.0**. Reconnect the remote.
4. If one device still shows the old build, close its old tab and reopen the same site URL. The existing build check intentionally requires the phone and board to match.

**No Apps Script update is needed when upgrading from your working v10.4.3 build.** Keep the existing v10.4.0 Apps Script deployment, spreadsheet tabs and environment variables. There are no new keys to add.

No deployment has been performed for you. Automated and native Canvas checks passed; physical phone/smart-board and browser layout testing still need your local preview. Details are in `TEST-REPORT-v10.5.0.md`.
