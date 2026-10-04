# Arena balance report — English League v8.5.1

30 September 2026. Final release checks: **322,000 simulated battles**, plus **72 exact browser/laboratory parity cases**. The simulation uses the released arena combat code and production virtual clock with presentation and audio disabled. Calibration/trial runs were separate and are not included in this final-check total.

## Result

Across Levels 0–10 with equal positive scores (250 HP each) and equal zero scores (200 HP each), all measured house win rates were between **23.73% and 26.18%**, against a neutral reference of 25%. The largest within-case gap was **2.23 percentage points**. These results support smaller systematic differences; they do not prove perfect fairness for every trait build or starting state.

## Equal positive scores: 250 HP each

10,000 independent validation battles per level, with randomized valid traits and relics from Level 5.

| Level | Gryffindor | Slytherin | Hufflepuff | Ravenclaw |
|---|---:|---:|---:|---:|
| 0 | 25.43% | 24.76% | 24.40% | 25.41% |
| 1 | 25.37% | 24.79% | 24.78% | 25.06% |
| 2 | 24.47% | 25.50% | 24.73% | 25.30% |
| 3 | 25.63% | 25.07% | 24.15% | 25.15% |
| 4 | 24.89% | 25.20% | 25.16% | 24.75% |
| 5 | 24.86% | 25.90% | 24.62% | 24.62% |
| 6 | 24.87% | 25.48% | 24.74% | 24.91% |
| 7 | 24.53% | 23.73% | 25.96% | 25.78% |
| 8 | 24.87% | 25.23% | 24.46% | 25.44% |
| 9 | 25.05% | 25.50% | 25.18% | 24.27% |
| 10 | 25.56% | 24.76% | 25.44% | 24.24% |

## Equal zero scores: 200 HP each

10,000 validation battles per level, except Level 9, which received a targeted final adjustment and was checked with **20,000 fresh seeds**. The original Level-9 validation result was excluded from the final table. Other rows retain their independently tested effective parameters; the changed low-HP Level-9 entries do not affect those rows.

| Level | Gryffindor | Slytherin | Hufflepuff | Ravenclaw |
|---|---:|---:|---:|---:|
| 0 | 25.17% | 24.03% | 25.14% | 25.66% |
| 1 | 24.27% | 26.18% | 24.79% | 24.76% |
| 2 | 25.96% | 24.87% | 23.74% | 25.43% |
| 3 | 24.69% | 25.81% | 24.62% | 24.88% |
| 4 | 24.13% | 25.23% | 25.39% | 25.25% |
| 5 | 25.63% | 24.65% | 25.42% | 24.30% |
| 6 | 25.31% | 24.94% | 25.23% | 24.52% |
| 7 | 25.27% | 24.32% | 25.50% | 24.91% |
| 8 | 24.75% | 24.18% | 25.87% | 25.20% |
| 9 | 25.64% | 24.77% | 24.71% | 24.88% |
| 10 | 23.89% | 24.56% | 25.79% | 25.76% |

Nominal 95% Monte Carlo uncertainty near a 25% win rate is about ±0.85 percentage points for 10,000 runs and ±0.60 for 20,000. Tiny differences should not be treated as meaningful house rankings.

## What the refinement changed

1. Team/level output multipliers were calibrated with poison protection enabled. A low-HP table complements the ordinary 250-HP table. The arena interpolates using average **initial maximum HP**, fixed at battle start; it never changes multipliers based on current health, current rank or a selected winner.
2. Hufflepuff's signature establishes a shield of at least 10 HP, preserving a larger existing shield. Its relic heals up to 28 HP, capped by missing health. Neither changes starting HP, level or participation.
3. Poison respects combat invulnerability and combat shield HP. Invulnerability blocks damage without spending shield HP. Otherwise the shield absorbs the tick, and only excess damage reaches HP. Poison continues to bypass armor and the normal guard reduction.
4. Fractional poison output carries between ticks in the single active chain. Whole-number deductions stay close to accumulated scaled damage, avoiding the old effect where a tiny coefficient change increased every small poison tick by a full HP. Refreshing an active chain preserves the carry; a new chain starts at a half-point rounding offset.

Poison remains a persistent team ability and can continue after its original attacker is knocked out. The classroom Shield that blocks Half Down or Secret Agent selection is a separate mechanic and is unchanged.

## Improvements compared with the prior independent v8.5.0 checks

| Condition / team | v8.5.0 | v8.5.1 |
|---|---:|---:|
| Level 1, equal positive points — Slytherin | 27.73% | 24.79% |
| Level 5, equal positive points — Ravenclaw | 22.63% | 24.62% |
| Level 10, equal positive points — Hufflepuff | 22.98% | 25.44% |
| Level 5, all zero points — Hufflepuff | 20.04% | 25.42% |
| Level 10, all zero points — Hufflepuff | 19.13% | 25.79% |

These compare separate independent seed sets and include all the released balance changes together. They do not isolate the causal effect of one coefficient.

## Earned advantages remain

The points/level tests rotate the advantage through each house, at base Levels 1, 5 and 9, with 2,000 battles per house/condition: 72,000 battles total.

| Advantage | Mean win rate of advantaged team | Range across tested house/level cases |
|---|---:|---:|
| 1,000 points versus three teams on 500 (250 versus 235 HP) | 29.21% | 27.05–31.50% |
| 1,000 points versus three teams on zero (250 versus 200 HP) | 43.89% | 39.55–51.10% |
| One extra level, with equal positive points | 29.77% | 28.10–31.90% |

A separate 20,000-run check covered the Level-4-to-5 relic unlock: the promoted team won 37.35% on average, with house results between 36.48% and 38.44%.

The extreme one-positive-score/three-zero-score scenario still shows house-dependent advantages (39.55–51.10% across tested cases). Asymmetric abilities and mixed HP states are not perfectly interchangeable. This release substantially improves equal-strength comparisons and keeps earned advantages; it does not promise identical win probability for every unequal configuration.

The 200–250 points-to-HP formula, post-Secret-Agent score calculation, winner comparator, targeting rules, action clock and 30-second limit are retained. Class point scales remain ratio-based. Vixar uses its separate existing balance and was not part of team-win-rate fitting.

## Verification

- 72 browser-versus-laboratory matches at Levels 0, 3, 5, 8, 9 and 10; equal positive, equal zero and mixed positive/zero/negative scores. Final HP, damage, action/signature counts, winner and duration matched exactly.
- Unit checks cover invulnerability, full and partial combat shields, damage accounting, poison expiry/refresh, single-chain behavior, fractional carry and fixed-start interpolation across all house/level entries.
- Browser checks passed for the 200–250 HP examples, projectile hits/blocks/dodges, all twelve team projectile variants in Vixar, cleanup and fast-forward boss completion.
- Classroom Shield and Secret Agent tests passed, including negative transfers, Undo, duplicate command handling and recovery. Participation, rosters, constellation/mission, final recognition, wheel and Apps Script checks passed.
- Turkey-time access tests passed, including changed device clock/timezone, three-strike lockout, master override, expiry and failed-network behavior. JavaScript syntax checks passed.

Tests use Chromium emulation and local services. Live Netlify deployment, real WebRTC/Sheets connections, physical iPhone/Safari and classroom projector timing were not exercised. Real-time browser timer jitter and teacher-selected trait preferences can change outcomes. No student records were used for simulation.

## Reproduce

See `tests/balance-lab/README.md`. The folder includes released source extracts, the game.js SHA-256 manifest, seeded scripts and final raw results. `node verify.cjs 10000` reproduces the equal-team validation cases; `node stress.cjs` reproduces the advantage and relic-boundary cases. Browser parity uses the full project source with temporary test hooks and requires Playwright/Chromium.

The historical v8.5.0 laboratory remains a separate diagnostic artifact. This package is the deployable v8.5.1 update.
