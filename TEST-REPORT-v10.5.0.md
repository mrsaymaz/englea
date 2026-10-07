# v10.5.0 verification

## Passed

- The complete dependency-free v10.4 regression chain: **143 PASS records**, exit code 0. This includes remote synchronisation/transport, roster and Sheets behaviour, participation, teamwork, arena balance, island progression, teacher content, challenge cards and the existing runner simulations.
- **10 new pose-controller contract groups**: image decode and original-art fallback; stale/failed/late requests; pose priority and knockout/revive; scene, visibility and pause cleanup; fast-forward suppression; bounded cache; low-HP response; runner/boss state selection; tied and negative-score result ordering; results cancellation and unchanged score objects.
- **55 distributed atlases / 465 frames**: dimensions, transparency, visible content, safe frame margins, ground anchors, distinct frames within each form, byte counts and SHA-256 hashes. Final new-art total: about **11.54 MiB**.
- **493 native Canvas2D renders** through the actual Island Run renderer: all 44 team forms, all island bosses, question-gate jumps, running poses, boss phases, reduced motion and missing-pose fallback. Rendering leaves engine state unchanged. Nine Vixar frame crops included.
- Visual inspection of packed contact sheets and native Canvas output. Fixed-grid extraction artifacts were corrected with figure-based sheet separation so neighbouring feet, tails and horns do not leak into a pose.
- Syntax checks for the edited/new JavaScript and local resource/package integrity checks.
- Comparison with the supplied v10.4.3 ZIP confirms the Apps Script, Netlify functions, runner engine, question banks, game rules, roster and student tracking modules are unchanged. Existing source edits are presentation hooks and build/cache version updates.

## Not run here

Full browser automation, browser CSS layout, physical smart-board performance, iPhone/Safari and live board-to-phone WebRTC tests were not run. The Chromium test-browser download failed in this environment. Native Canvas and DOM contract tests do not substitute for those checks. Earlier archived test reports describe earlier releases and are not new browser results for v10.5.

## Local preview

Extract the ZIP and open `public/creature-studio.html`. Inspect the levels and bosses, switch poses, compare the original and play a sequence. This does not require a Netlify deployment or touch class data.

After your normal deployment, the useful manual checks are: award a point/evolution, run an Arena battle, open Island Run from its result, jump during a question, view an island boss, and finish a Vixar encounter. Check the four results cards after tied and unequal team scores. Refresh both devices to build 10.5.0 before reconnecting.

## Reproduce the automated checks

```sh
npm run test:v105 --prefix tests
```

The following optional checks require Sharp and/or `@napi-rs/canvas` in the runtime. In the creation environment they were provided through `CODEX_PRIMARY_RUNTIME_NODE_MODULES`.

```sh
node tests/creature-art.cjs
node tests/render-creatures.cjs
```

Pass an output directory as the final argument to either native-art check to generate its inspection sheets. No backend credentials or remote messages are used by these tests.
