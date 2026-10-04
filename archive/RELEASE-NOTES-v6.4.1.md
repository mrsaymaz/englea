# English League v6.4.1 — Crown and Vixar visibility fixes

## Champion crown

The crown now occupies a fixed, centered row above the result-screen avatar. It no longer tries to align with the character's head, and its floating animation is removed. The portrait and crown have a reserved gap for every team and level. The result layout can scroll on short screens without compressing the crown into the heading. Animated and Light also keep the portrait and decorative result effects still.

## Vixar entrance

Light disables CSS animations, and Animated uses the same lean rules. The old Vixar curtain depended entirely on a CSS animation to disappear, leaving it permanently over the raid in both modes even though combat continued.

The curtain is now explicitly hidden in Animated and Light. Performance retains its entrance, with a raid-managed timer that dismisses the curtain even if the CSS animation does not run. Reduced motion skips the entrance. Exiting or retrying resets the curtain and cancels its pending timer.

Raid access requirements, health, damage, combat duration, elemental seals, Unity rewards and result saving are unchanged.

## Guardian and Vixar art

The new creature-style Guardian and illustrated Vixar shown in chat are concept previews for a later Animated art update. The game art in this patch remains the v6.4 artwork. A future Guardian implementation should preserve the four colored streams, assembly of separate parts, and three gradual level rewards, using a small number of static image layers.

## Deploy

Follow UPDATE-v6.4.1.md. Keep the existing Netlify/Cloudflare environment variables. The startup version marker is **Animated Evolution · v6.4.1**.
