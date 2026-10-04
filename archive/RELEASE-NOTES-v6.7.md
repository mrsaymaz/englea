# v6.7 — Evolution and VIXAR finale

- Animated Ravenclaw levels 1–10 have stronger talons, hooked beaks, neck/head silhouettes, sapphire wave armor and equipment.
- Animated Slytherin levels 1–10 gain jade leaf armor, vine engravings, thorn circlets and a stronger cobra-to-hydra progression.
- Level-zero forms remain familiar. Gryffindor and Hufflepuff artwork is unchanged.
- Art remains a single 384×384 transparent WebP per visible team form. No extra animated armor layers or idle particles are required.
- VIXAR's four seals are separate, targetable scene elements in Animated mode; Light and Performance retain their SVG characters.
- Teams approach their own seal, then help remaining seals. Boss HP cannot be damaged until all four seals break. In-flight seal attacks cannot silently redirect onto the boss.
- Team attacks have brief element-specific strikes, recoil and shields. VIXAR has directed attacks, blocks and short cast effects.
- At 10% boss HP (420/4200), one final attack knocks all teams out, including through shields.
- With the completed Class Mission, four team-colored beams summon the Unity Guardian. Guardian height is approximately half VIXAR's fitted image height at every viewport.
- A short charge and focused final strike defeat VIXAR. All teams immediately revive at their maximum raid HP; KO labels disappear and the result shows 4/4 teams standing.
- Without the completed Class Mission the final attack results in defeat and no Guardian is summoned.
- Existing Level-10 seal requirement is preserved. The raid remains discoverable when every team reaches Level 8.
- Finale lasts about 6.6 seconds. The combat timer pauses during this final sequence.
- Effects use finite transform/opacity animations, at most 12 temporary effect nodes, and at most one motion per actor. Exit/retry cancels pending damage and visual work. Reduced motion keeps the HP/result sequence without optional movement.
- Startup and asset cache version are 6.7. Soft evolution, mobile remote, TURN function, scoring and Sheets recording paths are preserved.

