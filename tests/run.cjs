const fs = require('fs');
const { spawnSync } = require('child_process');
process.chdir(__dirname);
fs.mkdirSync('output', { recursive: true });
for (const script of ['island-run-integration.cjs', 'island-run-tally-hooks.cjs', 'island-runner/test-engine.cjs', 'arena-balance-unit.cjs', 'apps-script.cjs', 'participation-unit.cjs', 'v7-2-unit.cjs', 'teamwork-unit.cjs', 'students.cjs', 'verify.cjs', 'resilience.cjs']) {
    const result = spawnSync(process.execPath, [script], { stdio: 'inherit', env: process.env });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status || 1);
}
