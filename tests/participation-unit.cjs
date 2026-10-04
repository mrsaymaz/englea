const assert=require('assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');

const root=path.resolve(__dirname,'..');
const context={window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'public/student-rosters.js'),'utf8'),context);
const students=context.window.LeagueStudents;
assert.ok(students.members('5-A','hufflepuff').some(person=>person.name==='Nisa'));
assert.ok(!students.members('5-A','gryffindor').some(person=>person.name==='Nisa'));
assert.ok(students.members('5-A','gryffindor').some(person=>person.name==='Elif Naz'));
assert.ok(!students.members('5-A','hufflepuff').some(person=>person.name==='Elif Naz'));
assert.ok(students.members('6-C','ravenclaw').some(person=>person.name==='Elif Naz'));

assert.equal(students.classes.reduce((total,className) => total + students.teams.reduce((sum,teamId) => sum + students.members(className,teamId).length,0),0),120);
assert.equal(students.members('5-C','slytherin').at(-1).name,'Cemile');
assert.ok(students.members('8-B','slytherin').some(person=>person.name==='Muhammed B.'));
assert.ok(!students.members('8-B','slytherin').some(person=>person.name==='Hasan Hüseyin'));
assert.ok(students.members('8-B','ravenclaw').some(person=>person.name==='Hasan Hüseyin'));
assert.ok(!students.members('8-B','ravenclaw').some(person=>person.name==='Muhammed B.'));

const totals={
  '5-A:gryffindor:0':{points:1000,awards:1},
  '5-A:gryffindor:1':{points:20,awards:2},
  '5-A:gryffindor:2':{points:500,awards:1}
};
const ranked=students.ranked('5-A','gryffindor',totals);
assert.deepEqual(JSON.parse(JSON.stringify(ranked.map(person=>[person.name,person.awards,person.rank]))),[
  ['Sümeyye',2,1],['Elif Naz',1,2],['Mehmet Emin',1,2]
]);
assert.equal(students.summary('5-A',totals).metric,'contribution_count');

const picker=fs.readFileSync(path.join(root,'public/student-ui.js'),'utf8');
assert.match(picker,/count === 1 \? 'contribution' : 'contributions'/);
assert.match(picker,/person\.awards/);
assert.doesNotMatch(picker,/contributor-score[^\n]+person\.points/);

const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
for(const id of ['mobile-participation-btn','mobile-participation-modal','mobile-participation-body']){
  assert.equal((html.match(new RegExp(`id=["']${id}["']`,'g'))||[]).length,1,`${id} must occur once`);
}
console.log('PASS corrected 120-student roster, participation ranking, picker labels, champion count display and remote summary structure');
