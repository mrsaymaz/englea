# English League v8.5.0

This package adds balanced arena HP, visible elemental projectiles in both battles, and the Turkey-time access screen. No Google Apps Script or spreadsheet layout update is needed.

## Deploy this version

The new access screen needs the included Netlify Function to check the time online. Deploy the complete project, including `public`, `netlify/functions` and `netlify.toml`. Uploading only the static `public` folder is insufficient.

If your existing Netlify site is connected to Git, update the project files in that repository and deploy as usual. Keep the publish directory as `public` and the functions directory as `netlify/functions`.

If you deploy from your computer, unzip the package and open a terminal in the folder containing `netlify.toml`. With Node.js installed, run these commands one at a time:

```sh
npx netlify-cli login
npx netlify-cli link
npx netlify-cli deploy --dir=public --functions=netlify/functions
```

Choose your existing English League site when linking. The last command creates a draft deployment. Open its URL, enter the current normal access code, and check that the classroom opens. To publish the checked files to your live site, run:

```sh
npx netlify-cli deploy --prod --dir=public --functions=netlify/functions
```

The time function needs no new environment variables. Keep your existing TURN environment variables. Refresh both the board and remote after deployment and check for **Animated Evolution · v8.5.0**.

If the access screen says it cannot verify access, check that your internet connection works and that the deployment includes the `access-time` function. Your site's `/api/access-time` address should return JSON containing `serverNow`. It does not reveal either valid code. Opening `index.html` directly from disk will not work with the new online gate.

Netlify reference: https://cli.netlify.com/commands/deploy/

## Access codes

Use the current time in Turkey, in four-digit HHMM format. Keep leading zeros. Each digit changes independently; there is no carrying between digits.

| Code | Rule | Example |
| --- | --- | --- |
| Normal | Add one to every digit; 9 becomes 0 | 09:29 → 1030; 11:46 → 2257 |
| Master / unlock | Subtract one from every digit; 0 becomes 9 | 08:50 → 9749 |

The server evaluates UTC+3 at submission time. Changing the device timezone or clock does not alter the accepted code. Only the current minute is accepted, so recalculate if the minute changes while typing.

Three consecutive incorrect submissions lock that browser profile on that site for six hours. Reloading or reopening it preserves the lock in localStorage. Normal codes are rejected while locked. The current master code always clears the lock and opens the classroom. Correct normal access also resets the consecutive-error count. Failed time-verification requests do not count as incorrect codes. Additional submissions while locked do not extend the lock.

A successful unlock is remembered for six hours in that tab, including reloads; a new tab normally requires a code. An already-open lesson is not interrupted when a minute changes or its tab grant expires. Reloading after expiry asks for a new code. Browser tabs opened by duplicating an existing tab may inherit its session storage.

This is a casual classroom access gate, not strong authentication or server-enforced brute-force protection. LocalStorage applies to one browser profile and origin, not the whole physical device. Clearing site data, using a different profile or modifying client code can bypass it. The formulas produce predictable codes, and static assets are still public. Internet access is required for verification; there is no device-clock fallback.

## Arena HP: 200–250

Starting HP is calculated after Secret Agent reveals and transfers:

`round(200 + 50 × sqrt(max(0, teamPoints) / highestPositiveScore))`

The ratio is capped at 1. If there is no positive score, every team starts with 200 HP. Negative scores also receive 200 HP.

| Team points when the highest score is 1,000 | Starting HP |
| --- | --- |
| 1,000 | 250 |
| 750 | 243 |
| 500 | 235 |
| 250 | 225 |
| 100 | 216 |
| 0 or below | 200 |

Points still help, while the maximum starting-health advantage is 25%. Existing levels, traits, damage and relic abilities still matter. Vixar's separate HP model is retained; this range applies to the team-versus-team arena.

## Visible elemental combat

Each team's three projectile styles rotate automatically during existing attacks. Matching defense styles play when that team guards or absorbs an attack. They are visual variations, not extra abilities or damage bonuses.

| Team | Three projectile styles | Three defensive styles |
| --- | --- | --- |
| Gryffindor / Fire | Ember, flame crescent, spark volley | Ember shield, fire arcs, flame wall |
| Slytherin / Nature | Leaf, thorn, curling vine | Folded leaf, woven vines, thorn ring |
| Hufflepuff / Air | Air crescent, cyclone, gust lines | Air cushion, slipstream, cyclone shell |
| Ravenclaw / Water | Droplet, wave, water ring | Bubble, water veil, curling current |

The avatars make small movements near their own positions while projectiles travel to the target. Arena damage occurs at arrival. A full block scatters the projectile and loses no HP; a partial defense shows a smaller remaining shot and reduced damage. A dodge lets the shot pass beyond the avatar without damage. Move names remain hidden.

The same team projectiles and defensive accents are integrated into ordinary Vixar combat, including attacks on elemental seals. Vixar's incoming shots now travel for 240 milliseconds before damage is applied; the team's defense appears at impact. Boss and finale rules otherwise remain as before.

The effects use small SVGs, finite transform/opacity animations and bounded effect counts. A separate arena layer keeps these lightweight visuals visible in Performance, Animated and Light modes. Reduced-motion preferences suppress motion. Pause, scene exit and fast-forward clean up effects.

## Verification and limits

- Server-time examples, midnight wrapping, minute changes, deliberately incorrect browser clock and timezone, three-attempt lockout, reload persistence, master override, six-hour expiry and failed-network handling passed.
- Exact HP examples and a zero-score arena passed. Visible hit, full-block, partial-block and dodge outcomes matched HP changes.
- All twelve arena attack and twelve defense variants, rendered visibility, bounded effects, pause/exit cleanup and reduced-motion handling passed.
- All twelve team projectiles and defensive accents appeared in Vixar. Pause cleanup and fast-forward boss-fight completion passed.
- Secret Agent transfers, negative scores, recovery, Undo, one-use Shield behavior and remote retry protection passed.
- Participation, rosters, constellation/mission rules, final recognition, wheel rules and Apps Script tests passed. Mobile remote layout and the new access screen were checked at iPhone 14 Pro portrait dimensions.

Browser tests use Chromium emulation and a local server running the production access function. The package has not been deployed to your live Netlify site. Physical iPhone/Safari, classroom hardware, real WebRTC connectivity and live Google Sheets writes were not tested in this update.

Earlier release documents are historical; use this guide for v8.5.0 deployment.
