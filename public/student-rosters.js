/* Class-scoped identities and participation totals. No network requests. */
(function(root) {
    'use strict';
    const names = {
        '5-A': {
            gryffindor: ['Elif Naz', 'Sümeyye', 'Mehmet Emin', 'Yusuf Mete', 'Yusuf H.', 'Canberk', 'Öykü Nas'],
            slytherin: ['Şeyma', 'Yazan', 'Fatma C.', 'Zümra', 'Abdussamed', 'Baran', 'İlhan'],
            ravenclaw: ['Derin', 'Yusufhan', 'Behçet', 'Nesibe', 'Fatma K.', 'Zehra'],
            hufflepuff: ['Nisa', 'Poyraz', 'Şeyma D.', 'Yunus Emre', 'Eymen', 'İkra']
        },
        '5-C': {
            gryffindor: ['Leys', 'Cuma', 'Rahme', 'Murat', 'Dilek Yaren', 'Fatma N.'],
            slytherin: ['Zuhal', 'Ahmet Osman', 'İsranur', 'Şahin', 'Ayşe', 'Hümeyra', 'Cemile'],
            ravenclaw: ['Burak', 'Hasan', 'Elif', 'Emel', 'Mehmet Ali', 'Hira Nur', 'Rukiye'],
            hufflepuff: ['Şüheda', 'Yusuf Taha', 'Cansu', 'Ömercan', 'Büşra', 'Ahmet']
        },
        '6-C': {
            gryffindor: ['Eslem Nur', 'Selin', 'Berfin', 'Amir', 'Hüseyin Emir'],
            slytherin: ['Hanife Betül', 'Muhammed Al.', 'Yusuf', 'Kamar', 'Azra', 'Kadriye'],
            ravenclaw: ['Ece Eylül', 'Elif Naz', 'Seyfullah', 'Mehmet Berat', 'Hedil'],
            hufflepuff: ['Ecrin', 'Burak', 'Eslem Sare', 'Ozan', 'Muhammed Ab.']
        },
        '7-A': {
            gryffindor: ['Jana', 'Fettah Ali', 'Abdulvahap', 'Mekke Züleyha', 'Hatice Y.', 'Hamza Sadık'],
            slytherin: ['Afra', 'Belinay', 'Ömer Faruk', 'Zeynep', 'Hadice', 'Hiranur'],
            ravenclaw: ['Abdullah', 'Asya', 'Rihem', 'Masuma', 'Sudenur Ecrin', 'Ahmed'],
            hufflepuff: ['Semih', 'Veysel', 'Rimes', 'Berfin', 'Meryem', 'Rahaf']
        },
        '8-B': {
            gryffindor: ['Ahmet Emir', 'Batuhan', 'Gazi', 'Emirhan', 'Yusuf Haktan', 'Yahya'],
            slytherin: ['Abdullah', 'Mahmud', 'Salih', 'Enes', 'M. Emir', 'Muhammed B.'],
            ravenclaw: ['Ensar', 'Seydan', 'Bilal', 'Hasan Hüseyin', 'Ömer Asaf', 'Halit'],
            hufflepuff: ['Ahmet M.', 'Kemal Berk', 'Mert', 'Mustafa', 'Kubilay']
        }
    };
    const classes = Object.freeze(Object.keys(names));
    const teams = Object.freeze(['gryffindor', 'slytherin', 'hufflepuff', 'ravenclaw']);
    const defaultStudents = classes.flatMap(className => teams.flatMap(teamId => names[className][teamId].map((name,index) =>
        ({id:`${className}:${teamId}:${index}`,name,className,teamId,active:true}))));
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
    const summary = (className, totals) => ({className:className || null, metric:'contribution_count',
        teams:Object.fromEntries(teams.map(teamId => [teamId, ranked(className, teamId, totals)]))});
    root.LeagueStudents = Object.freeze({defaults, snapshot, useRoster, validateRoster, classes, teams, members, student, validClass, restore, credit, ranked, nextToInvite, hasCredits, contributors, uniqueCount, summary});
})(window);
