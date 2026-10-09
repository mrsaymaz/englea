/* Class-scoped identities and participation totals. No network requests.
   v12.0.0: this public file holds example names only. The real class lists live in Google Sheets (the Roster tab) and
   reach a board or phone only through the signed-in, PIN-checked roster request (roster-manager.js); a device keeps
   its own copy for offline lessons. Example students have IDs that start with "example-", so a lesson played with
   example names can never be saved under a real student's ID. */
(function(root) {
    'use strict';
    const classes = Object.freeze(['5-A', '5-C', '6-C', '7-A', '8-B']);
    const teams = Object.freeze(['gryffindor', 'slytherin', 'hufflepuff', 'ravenclaw']);
    // The same seven example names per house in every class (used before sign-in and in the public previews).
    const EXAMPLE_NAMES = Object.freeze({
        gryffindor: ['Ada', 'Bora', 'Cleo', 'Deniz', 'Emil', 'Fiona', 'Gale'],
        slytherin: ['Hazel', 'Ilkin', 'Jasper', 'Kaya', 'Leo', 'Mira', 'Nilo'],
        hufflepuff: ['Olive', 'Pax', 'Quinn', 'Rumi', 'Sage', 'Toby', 'Uma'],
        ravenclaw: ['Vera', 'Wren', 'Xan', 'Yara', 'Zeno', 'Arin', 'Bex']
    });
    const EXAMPLE_PREFIX = 'example-';
    const isExample = id => typeof id === 'string' && id.startsWith(EXAMPLE_PREFIX);
    const defaultStudents = classes.flatMap(className => teams.flatMap(teamId => EXAMPLE_NAMES[teamId].map((name,index) =>
        ({id:`${EXAMPLE_PREFIX}${className}-${teamId}-${index}`,name,className,teamId,active:true}))));
    function validateRoster(value) {
        if(!Array.isArray(value)||value.length>500)throw Error('Roster must contain no more than 500 students.');
        const ids=new Set();
        return value.map(p=>{
            const name=typeof p?.name==='string'?p.name.trim().normalize('NFC'):'';
            if(!p||typeof p.id!=='string'||! /^[A-Za-z0-9:_-]{1,100}$/.test(p.id)||ids.has(p.id)
                ||!classes.includes(p.className)||!teams.includes(p.teamId)||typeof p.active!=='boolean'
                ||!name||name.length>70||! /^\p{L}[\p{L}\p{M}\p{N} .’'-]*$/u.test(name))throw Error('Check the student name, class and team. Names must start with a letter and use letters, spaces, numbers, dots, apostrophes or hyphens.');
            ids.add(p.id);return {id:p.id,name,className:p.className,teamId:p.teamId,active:p.active};
        });
    }
    let activeStudents,rosters;
    function useRoster(value) {
        activeStudents=Object.freeze(validateRoster(value).map(p=>Object.freeze(p)));
        rosters=Object.fromEntries(classes.map(c=>[c,Object.fromEntries(teams.map(t=>[t,Object.freeze(activeStudents.filter(p=>p.active&&p.className===c&&p.teamId===t))]))]));
    }
    useRoster(defaultStudents);
    const defaults=()=>defaultStudents.map(p=>({...p}));
    const snapshot=()=>activeStudents.map(p=>({...p}));
    // True while the board or phone shows example names (nobody has signed in on this device yet).
    const usingExamples=()=>activeStudents.length>0&&activeStudents.every(p=>isExample(p.id));
    const validClass = value => classes.includes(value);
    const members = (className, teamId) => validClass(className) && teams.includes(teamId) ? rosters[className][teamId] : [];
    const student = (className, teamId, id) => members(className, teamId).find(item => item.id === id) || null;
    function restore(className, saved) {
        const result = {};
        for (const teamId of teams) for (const item of members(className, teamId)) {
            const entry = saved?.[item.id];
            if (entry && Number.isFinite(entry.points) && entry.points > 0 && Number.isSafeInteger(entry.awards) && entry.awards > 0) {
                result[item.id] = {points:entry.points, awards:entry.awards};
            }
        }
        return result;
    }
    function credit(totals, person, points) {
        if (!person || !Number.isFinite(points) || points <= 0) return;
        const previous = totals[person.id] || {points:0, awards:0};
        totals[person.id] = {points:previous.points + points, awards:previous.awards + 1};
    }
    function ranked(className, teamId, totals) {
        let rank = 0, lastAwards = null;
        return members(className, teamId).filter(person => totals[person.id]?.awards > 0)
            .map(person => ({...person, ...totals[person.id]}))
            .sort((a,b) => b.awards-a.awards || a.name.localeCompare(b.name,'tr'))
            .map(person => {
                if (person.awards !== lastAwards) rank++;
                lastAwards = person.awards;
                return {...person, rank};
            });
    }
    // Stable roster order breaks ties; zero-turn students are included.
    function nextToInvite(className, teamId, totals = {}) {
        return members(className,teamId)
            .map((person,index) => ({...person,awards:totals[person.id]?.awards || 0,order:index}))
            .sort((a,b) => a.awards-b.awards || a.order-b.order)
            .slice(0,3);
    }
    const hasCredits = totals => Object.values(totals).some(entry => entry.points > 0);
    const contributors = (className, teamId, totals) => members(className,teamId).filter(person => totals[person.id]?.awards > 0);
    const uniqueCount = (className, totals) => teams.reduce((sum,teamId) => sum + contributors(className,teamId,totals).length,0);
    // v9.6.0: `everyone` lists every student of the class in roster order with their contribution count (zero included),
    // so the Sheet keeps the whole class's record. v12.0.0: each row carries the student's roster ID, with the name and
    // team as they were in this lesson, so later renames and team changes never split or merge a student's history.
    const summary = (className, totals) => ({className:className || null, metric:'contribution_count', ids:1,
        teams:Object.fromEntries(teams.map(teamId => [teamId, ranked(className, teamId, totals)])),
        everyone:Object.fromEntries(teams.map(teamId => [teamId, members(className, teamId).map(person => ({id:person.id, name:person.name, awards:totals[person.id]?.awards || 0}))]))});
    // Example students are not real students: their rows are left out of what is saved to Google Sheets.
    function withoutExamples(summaryValue) {
        if (!summaryValue || typeof summaryValue !== 'object') return {summary:summaryValue, skipped:0};
        let skipped = 0;
        const keep = list => Array.isArray(list) ? list.filter(row => { const out = isExample(row?.id); if (out && Number(row?.awards) > 0) skipped += Number(row.awards); return !out; }) : list;
        const next = {...summaryValue};
        if (summaryValue.everyone) next.everyone = Object.fromEntries(Object.entries(summaryValue.everyone).map(([t, list]) => [t, keep(list)]));
        if (summaryValue.teams) { const before = skipped; next.teams = Object.fromEntries(Object.entries(summaryValue.teams).map(([t, list]) => [t, keep(list)])); if (summaryValue.everyone) skipped = before; }
        return {summary:next, skipped};
    }
    root.LeagueStudents = Object.freeze({defaults, snapshot, useRoster, validateRoster, classes, teams, members, student, validClass, restore, credit, ranked, nextToInvite, hasCredits, contributors, uniqueCount, summary,
        isExample, usingExamples, withoutExamples, EXAMPLE_NAMES});
})(window);
