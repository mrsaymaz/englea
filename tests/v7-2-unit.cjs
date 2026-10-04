const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../public');
const game = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'game.css'), 'utf8');

assert.match(game, /const SUBJECT_WHEEL_LEVELS = Object\.freeze\(\[5, 10\]\);/);
assert.match(game, /const WHEEL_RESULT_HOLD_MS = 20000;/);
assert.doesNotMatch(game, /\[3,6,9\]|level === 3 \|\| team\.level === 6 \|\| team\.level === 9/);
assert.match(game, /wheelMilestonesReached\.includes\(stage\)/);
assert.match(game, /team\.wheelMilestonesReached = \[\];/);
assert.match(game, /const delay = advanceImmediately \? 0 : WHEEL_RESULT_HOLD_MS;/);

const originalAllSubjects = '["English", "Science", "Maths", "Turkish", "Physical Ed", "Social Studies", "Visual Arts", "Religion", "Music"]';
const originalEnglishChallenges = '["Vocabulary", "Grammar", "Pronunciation", "Speaking", "Listening", "Sentence Repair", "Taboo Description", "Translation", "Ask a Question"]';
assert.ok(game.includes(originalAllSubjects));
assert.ok(game.includes(originalEnglishChallenges));

assert.match(html, /id="wheel-continue-btn"/);
assert.match(html, /id="mobile-wheel-result"/);
assert.doesNotMatch(html, /wheel-countdown|mobile-wheel-countdown/i);
assert.doesNotMatch(game, /level-track-|<small>\/10<\/small>/);
assert.match(css, /\.team-level-display\s*\{\s*position:absolute;\s*top:\.5rem;\s*right:\.5rem;/);
assert.match(css, /\.team-level-badge strong/);

console.log('PASS v7.2.0 wheel milestones are Level 5 and Level 10 only');
console.log('PASS wheel result hold is 20 seconds with no visible countdown');
console.log('PASS board and remote expose manual result dismissal');
console.log('PASS subject and English challenge names are unchanged');
console.log('PASS current Level badge is positioned top-right without a ten-step track');
