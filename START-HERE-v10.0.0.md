# v10.0.0 — Elemental student cards and the School League Season

## Deploying this update

1. Finish the active lesson and save the session from the remote, as usual.
2. **Update the Apps Script (required for the season standings).** Open your Sheet → **Extensions → Apps Script**. Replace the whole script with **GOOGLE-APPS-SCRIPT-v10.0.0.gs**. Check that the `TEACHER_PIN` line still holds your own PIN. Save, then **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. Keep the same deployment URL and access settings. Do not create a second deployment. (It includes everything from v9.6.0 and v9.7.0.)
3. Deploy the complete extracted project to your existing Netlify site with your usual method. Include **public**, **netlify/functions** and **netlify.toml**. No new environment variables are needed.
4. Refresh the board and the phone. Both opening screens must show **Island Run Edition · v10.0.0**. Mixed versions are refused on purpose.

Nothing new needs to be set up in the Sheet: the season is counted from the tabs you already have.

## Elemental student cards

A student's award card now takes on their team's element as they collect Island Run navigator seals. The card grows stronger with each seal. No level number is shown; the look tells the story.

| Team | Element | Card at all ten seals |
|---|---|---|
| Gryffindor | Fire: embers, then flames along the top edge | **Flamebearer** |
| Slytherin | Nature: drifting leaves, then sprouting leaves along the edge | **Earthshaker** |
| Ravenclaw | Water: rising bubbles, then droplets along the edge | **Tidecaller** |
| Hufflepuff | Air: sweeping wisps, then spinning wind curls along the edge | **Stormrider** |

- **No seals:** the regular card.
- **1–3 seals:** the card is framed and tinted in the element, with a few small particles. Each seal adds a particle and a little more glow.
- **4–6 seals:** the glow breathes around the card and the particles multiply.
- **7–9 seals:** the frame itself flows with the element, and flames, leaves, droplets or wind curls break out along the top edge.
- **All 10 seals:** an elemental crown above the name and the student's title beneath it.

The first card a student gets after earning a new seal plays one short burst of their element. In Light mode, and with the computer's reduce-motion setting, the cards show the same frames and colours without movement.

## School League Season

Every class at the school plays in one season. On the **Champions** screen, a **School League · Season Wins** panel in the upper right ranks the four teams.

- **League Champion** = 1 win. A shared League title gives **each** tied team 1 win.
- **Final Arena Champion** = 1 win.
- A **Grand Champion** (both titles) therefore earns **2 wins**.
- **Every session already in your Sheet counts**, from every class, older ones included. A session saved twice is counted once.
- Today's wins appear beside the winning teams as **+1** or **+2**, dotted while they are not yet saved. After **Save Record** on the phone, the totals update and today's wins turn solid.
- The totals arrive with **Load islands** and with every save, and the board remembers them for the next lesson. If the panel says to update the Apps Script, step 2 above is still needed.

## Quick classroom check

1. Board and phone show **v10.0.0**.
2. Award a student who has navigator seals: their card shows their element. A student with no seals has the regular card.
3. Finish the session: the Champions screen shows **Season Wins** in the upper right, with today's wins dotted.
4. **Save Record** on the phone: the totals update and today's wins turn solid.
