const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname,'../public');
const source = fs.readFileSync(path.join(root,'game.js'),'utf8');
function node() {
    const result = {dataset:{},style:{setProperty(key,value){this[key]=value;}},children:[],attributes:{},hidden:false,
        setAttribute(key,value){this.attributes[key]=value;},
        replaceChildren(...children){this.children=children;},
        append(...children){this.children.push(...children);}};
    result.classList = {add(name){result.className=(result.className||'')+' '+name;}};
    return result;
}
const containers = new Map();
const storage = new Map();
const context = {window:{},document:{createElement:node,getElementById(id){if(!containers.has(id))containers.set(id,node());return containers.get(id);}},
    localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},
    crypto:{randomUUID:()=> 'test-session'}, CLASS_MISSION_TARGET:15,
    selectedClass:'5-A',studentContributions:{},classMission:{target:15,progress:0,completed:false,rewardGranted:false},
    recoveryRestoring:false, launches:0, histories:[],
    updateClassMissionUI(){},saveState(){throw Error('Award already owns its Undo snapshot');},
    addHistoryLog(){},playSound(){},requestUnityEvent(){context.launches++;},
    cancelTeamScoreAnimation(){},clearAvatarReaction(){},cancelAnimatedPresentation(){},updateGameState(){},
    LeagueMotion:{channel:()=>({cancel(){}})}};
vm.createContext(context);
for(const file of ['student-rosters.js','student-ui.js','game-rules.js','session-state.js','session-recovery.js']) {
    vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
    Object.assign(context,context.window);
}
context.LeagueStudentUI.celebrate=()=>{};
function extract(name,next) {
    return source.slice(source.indexOf(`            function ${name}(`),source.indexOf(`            function ${next}(`));
}
vm.runInContext(extract('recordStudentAward','renderChampionContributors')+
    extract('syncParticipationMission','completeClassMission')+
    extract('completeClassMission','unityEventIsBlocked'),context);
const students=context.LeagueStudents;
const people=students.teams.flatMap(id=>students.members('5-A',id));
const teams=students.teams.map(id=>({id,name:id,level:3,points:500,traits:[],powerups:{}}));
const award=(person,points=10)=>context.recordStudentAward(teams.find(t=>t.id===person.teamId),person,points);
const halo=id=>context.document.getElementById(`constellation-${id}`);
award(people[0]);
assert.equal(context.classMission.progress,1);
assert.equal(halo('gryffindor').children.length,1);
const firstPosition=halo('gryffindor').children[0].style.left;
award(people[0],1000);
assert.equal(context.classMission.progress,1);
assert.equal(halo('gryffindor').children.length,1);
assert.equal(context.studentContributions[people[0].id].awards,2);
for(const points of [0,-10,NaN,Infinity])award(people[1],points);
context.recordStudentAward(teams[0],null,50);
assert.equal(students.uniqueCount('5-A',context.studentContributions),1);
for(const person of people.slice(1,14))award(person);
assert.equal(context.classMission.progress,14);
assert.equal(context.launches,0);
assert.equal(halo('gryffindor').children[0].style.left,firstPosition);
const beforeThreshold=JSON.stringify({totals:context.studentContributions,mission:context.classMission});
award(people[14]);
assert.equal(context.classMission.progress,15);
assert.equal(context.classMission.completed,true);
assert.equal(context.launches,1);
award(people[14]);award(people[15]);
assert.equal(context.classMission.progress,15);
assert.equal(context.launches,1);
assert.equal(students.uniqueCount('5-A',context.studentContributions),16);
console.log('PASS first positive contribution adds one star/mission step; repeats and non-awards do not; fifteenth student completes exactly once');

context.teamsData=teams;context.saveState=()=>{};
vm.runInContext(extract('resetTeamAction','init'),context);
context.resetTeamAction('gryffindor');
assert.equal(teams[0].points,0);
assert.equal(students.contributors('5-A','gryffindor',context.studentContributions).length,7);
context.LeagueStudentUI.renderConstellation(halo('gryffindor'),teams[0],'5-A',context.studentContributions);
assert.equal(halo('gryffindor').children.length,7);
award(people[0]);
assert.equal(context.launches,1);
assert.equal(halo('gryffindor').children.length,7);
console.log('PASS actual Team Reset preserves stars, contributions and completed mission');

const before=JSON.parse(beforeThreshold);
context.studentContributions=students.restore('5-A',before.totals);context.classMission=before.mission;
context.syncParticipationMission({allowCompletion:false});
assert.equal(context.classMission.progress,14);assert.equal(context.classMission.completed,false);
for(const team of teams)context.LeagueStudentUI.renderConstellation(halo(team.id),team,'5-A',context.studentContributions);
assert.equal(teams.reduce((sum,t)=>sum+halo(t.id).children.length,0),14);
const recovery={sessionId:'test-session',teams,pointSliderValues:[10,100,1000,10000],classMission:context.classMission,selectedClass:'5-A',studentContributions:context.studentContributions};
assert.equal(context.LeagueRecovery.save(recovery),true);
const restored=context.LeagueRecovery.read();
context.studentContributions=students.restore(restored.selectedClass,restored.studentContributions);
context.classMission={...restored.classMission,target:20,progress:3}; // v7 in-progress mission migration
context.syncParticipationMission({allowCompletion:false});
assert.equal(context.classMission.target,15);assert.equal(context.classMission.progress,14);
award(people[14]);assert.equal(context.launches,2);
console.log('PASS Undo-compatible totals restore stars and mission together; checkpoint reload and legacy progress reconcile to 15');

context.classMission={target:20,progress:20,completed:true,rewardGranted:true};context.studentContributions={};
context.syncParticipationMission();assert.equal(context.classMission.progress,15);assert.equal(context.launches,2);
context.classMission={target:15,progress:0,completed:false,rewardGranted:false};
context.syncParticipationMission();
for(const team of teams)context.LeagueStudentUI.renderConstellation(halo(team.id),team,'5-A',{});
assert.equal(context.classMission.progress,0);
assert.ok(teams.every(t=>halo(t.id).children.length===0&&halo(t.id).hidden));
assert.equal(students.uniqueCount('5-C',before.totals),0);
console.log('PASS earned legacy reward is preserved without replay; empty new-session records clear stars and mission; class IDs remain isolated');

const recognition=node();
const rankedTotals={};
const gryffindor=students.members('5-A','gryffindor');
[1,4,2,4].forEach((awards,index)=>rankedTotals[gryffindor[index].id]={awards,points:index===0?999999:10});
context.LeagueStudentUI.renderTeamRecognition(recognition,teams,'5-A',rankedTotals,t=>`<svg data-team="${t.id}"></svg>`);
assert.equal(recognition.children.length,4);
assert.deepEqual(recognition.children.map(card=>card.dataset.team),['gryffindor','slytherin','hufflepuff','ravenclaw']);
assert.ok(recognition.children.every(card=>card.children[0].innerHTML.includes(card.dataset.team)));
const leaders=recognition.children[0].children[2].children;
assert.equal(leaders.length,3);
assert.deepEqual(leaders.map(row=>row.children[1].textContent),['Sümeyye','Yusuf Mete','Mehmet Emin']);
assert.deepEqual(leaders.map(row=>row.children[0].textContent),['1','1','2']);
assert.deepEqual(leaders.map(row=>row.children[2].textContent),['4×','4×','2×']);
assert.ok(recognition.children.slice(1).every(card=>card.children[2].textContent==='No contributions recorded yet'));
context.LeagueStudentUI.renderTeamRecognition(recognition,teams,null,{},()=>'<svg></svg>');
assert.equal(recognition.children.length,4);
assert.ok(recognition.children.every(card=>card.children[2].textContent==='No class selected'));
console.log('PASS all four final-screen avatars render; top three use participation counts, stable shared ranks, honest empty states and no stale names');
