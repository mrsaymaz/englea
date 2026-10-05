/* Small, accessible pickers and bounded, transform-only student celebrations. */
(function(root) {
    'use strict';
    const number = value => Math.round(value).toLocaleString('en-US');
    let dialog, body, title, subtitle, cancelAction = null, pickerKind = null;
    // v10.1.1: one student card at a time on the board (see celebrate below).
    const shown = new Set(), FADE_MS = 200;
    let pending = null, pendingFrame = 0, pendingTimer = 0, slideUntil = 0, fadeUntil = 0;
    function element(tag, className, text) {
        const node = document.createElement(tag);
        node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }
    function renderNextToInvite(container, className, teamId, totals) {
        if (!container) return;
        container.replaceChildren();
        container.append(element('div','mobile-invite-title','Next to invite'));
        if (!LeagueStudents.validClass(className)) {
            container.append(element('p','mobile-invite-empty','Choose a class to see names.'));
            return;
        }
        const list = element('ul','mobile-invite-list');
        list.setAttribute('aria-label','Students with the fewest contributions');
        for (const person of LeagueStudents.nextToInvite(className,teamId,totals)) {
            const row = element('li','mobile-invite-row');
            row.dataset.studentId = person.id;
            const count = element('span','mobile-invite-count',`${number(person.awards)}×`);
            count.setAttribute('aria-label',`${number(person.awards)} ${person.awards === 1 ? 'contribution' : 'contributions'}`);
            row.append(element('span','mobile-invite-name',person.name),count);
            list.append(row);
        }
        container.append(list);
    }
    function ensureDialog() {
        if (dialog) return;
        dialog = element('dialog','student-picker');
        dialog.id = 'student-picker';
        dialog.setAttribute('aria-labelledby','student-picker-title');
        dialog.setAttribute('aria-describedby','student-picker-subtitle');
        const header = element('header','student-picker-header');
        const labels = element('div','');
        labels.append(element('div','student-picker-kicker','ENGLISH LEAGUE'));
        title = element('h2','','Choose class'); title.id = 'student-picker-title';
        subtitle = element('p','',''); subtitle.id = 'student-picker-subtitle';
        labels.append(title, subtitle);
        const cancel = element('button','student-picker-close','×'); cancel.type = 'button';
        cancel.setAttribute('aria-label','Cancel'); cancel.onclick = () => close(true);
        header.append(labels, cancel);
        body = element('div','student-picker-body');
        dialog.append(header, body);
        dialog.addEventListener('cancel', event => {event.preventDefault();close(true);});
        document.body.append(dialog);
    }
    function close(cancel = false) {
        if (!dialog) return;
        const callback = cancelAction;
        cancelAction = null; pickerKind = null;
        if (dialog.open) dialog.close();
        if (cancel) callback?.();
    }
    function show(kind, heading, copy, onCancel, color = '#7dd3fc') {
        ensureDialog();
        pickerKind = kind; cancelAction = onCancel || null;
        dialog.dataset.kind = kind;
        dialog.style.setProperty('--student-color',color);
        title.textContent = heading; subtitle.textContent = copy;
        body.replaceChildren();
    }
    function reveal() {
        if (!dialog.open) dialog.showModal();
        (body.querySelector('button:not(:disabled)') || dialog.querySelector('button')).focus();
    }
    function button(label, detail, className, callback) {
        const node = element('button',className); node.type = 'button';
        node.append(element('strong','',label));
        if (detail) node.append(element('span','',detail));
        node.onclick = () => { if (node.disabled) return; node.disabled = true; close(); callback(); };
        return node;
    }
    function chooseClass({selected, locked, onSelect, onCancel}) {
        show('class','Choose your class',locked
            ? 'This session has student points. Start a new session to change class.'
            : 'Choose once for this session. Then award points to your students.',onCancel);
        const grid = element('div','student-class-grid');
        for (const className of LeagueStudents.classes) {
            const count = LeagueStudents.teams.reduce((sum,team) => sum + LeagueStudents.members(className,team).length,0);
            const node = button(className,selected === className ? 'Current class' : `${count} students`,'student-class-choice',() => onSelect(className));
            node.dataset.className = className;
            node.setAttribute('aria-pressed',String(selected === className));
            node.disabled = locked && selected !== className;
            grid.append(node);
        }
        body.append(grid); reveal();
    }
    function chooseStudent({className, team, totals, pointValue, onSelect, onCancel, onBack}) {
        show('student',`${className} · ${team.name}`,'Who earned these points?',onCancel,team.color);
        body.append(element('div','student-award-preview',`+${number(pointValue)} base points · bonuses added on the board`));
        const grid = element('div','student-name-grid');
        for (const person of LeagueStudents.members(className,team.id)) {
            const count = totals[person.id]?.awards || 0;
            const node = button(person.name,`${number(count)} ${count === 1 ? 'contribution' : 'contributions'}`,'student-name-choice',() => onSelect(person));
            node.dataset.studentId = person.id;
            grid.append(node);
        }
        body.append(grid);
        if (onBack) body.append(button('Change class','','student-picker-back',onBack));
        body.append(element('p','student-picker-note','Points are added only after you choose a name.'));
        reveal();
    }
    function drop(entry) {
        clearTimeout(entry.timer); entry.motion?.cancel(); entry.fade?.cancel(); entry.node.remove(); shown.delete(entry);
    }
    // Animated mode also carries performance-light (it shares the lean renderer); only real Light stays still.
    const stillCards = () => matchMedia('(prefers-reduced-motion: reduce)').matches || (document.body.classList.contains('performance-light') && !document.body.classList.contains('performance-animated'));
    // The card on screen leaves quickly (about 0.2 s) so the next one never overlaps it.
    function fadeOut() {
        for (const entry of shown) {
            if (entry.leaving) continue;
            entry.leaving = true; clearTimeout(entry.timer);
            if (stillCards() || !entry.node.isConnected) { drop(entry); continue; }
            entry.fade = entry.node.animate([{opacity:0}],{duration:FADE_MS,easing:'ease-in',fill:'forwards'});
            entry.fade.addEventListener('finish',() => drop(entry),{once:true});
            fadeUntil = Math.max(fadeUntil, performance.now() + FADE_MS);
        }
    }
    function clearCelebration(teamId) {
        if (pending?.team.id === teamId) pending = null;
        for (const entry of [...shown]) if (entry.teamId === teamId) drop(entry);
    }
    // v9.7.0: the award card shows the Island Run seals this student earned as navigator (islands 1–10,
    // five to a row) instead of the points; the score panel and the history still show the points.
    function sealGrid(person) {
        const seals = root.LeagueNavigatorSeals?.islands(person.className, person.id) || [];
        const grid = element('span','student-seal-grid');
        grid.setAttribute('role','img');
        grid.setAttribute('aria-label',`${seals.length} of 10 Island Run navigator seals`);
        for (let island = 1; island <= 10; island++) {
            // Earned seals are bright gold with the island number, readable from the back of the room.
            const earned = seals.includes(island), slot = element('span',`student-seal-slot${earned ? ' earned' : ''}`,String(island));
            if (earned) slot.title = `Island ${island} · ${root.LeagueNavigatorSeals.guardian(island)} seal`;
            grid.append(slot);
        }
        return grid;
    }
    // v10.0: the card takes on the student's team element as they collect navigator seals. The look grows in
    // four stages (no number is shown): Spark 1–3, Surge 4–6, Storm 7–9, Mythic at all ten seals.
    const ELEMENTS = {
        gryffindor:{kind:'fire',title:'Flamebearer'}, slytherin:{kind:'nature',title:'Earthshaker'},
        ravenclaw:{kind:'water',title:'Tidecaller'}, hufflepuff:{kind:'air',title:'Stormrider'}
    };
    const CROWNS = {
        fire:'<path d="M4 22h28l-2-12-5 5-3-11-4 9-3-7-3 9-4-5z"/>',
        nature:'<path d="M18 4c-5 5-6 10-2 15-6-3-10-2-13 2 4 2 9 2 13 0-1 2-1 4 0 5h4c1-1 1-3 0-5 4 2 9 2 13 0-3-4-7-5-13-2 4-5 3-10-2-15z"/>',
        water:'<path d="M3 20c4-6 8-6 11-2 2-6 6-10 4-15 6 4 8 10 6 15 3-4 7-4 9 2-5-2-9 3-15 3S8 18 3 20z"/>',
        air:'<path d="M4 12c6-5 13-5 17 0-5-2-10-1-12 3 5-3 12-2 15 3-6-2-11 0-13 4 6-1 12 1 15 5H4c-2-5-2-10 0-15z"/>'
    };
    const tierOf = level => level >= 10 ? 'mythic' : level >= 7 ? 'storm' : level >= 4 ? 'surge' : level >= 1 ? 'spark' : '';
    function elementalize(node, team, person, first = false) {
        const level = root.LeagueNavigatorSeals?.islands(person.className, person.id).length || 0, tier = tierOf(level), info = ELEMENTS[team.id];
        if (!tier || !info) return null;
        node.classList.add('el-card', `el-${info.kind}`, `el-${tier}`);
        node.style.setProperty('--el-level', String(level));
        const fx = element('span','el-fx'); fx.setAttribute('aria-hidden','true');
        fx.append(element('span','el-glow'));
        if (tier === 'storm' || tier === 'mythic') { const frame = element('span','el-frame'); frame.append(element('span','el-strip')); fx.append(frame); }
        // Particles grow in number with each seal; spread and timing are fixed per index, so no two cards flicker alike.
        const count = Math.min(16, 2 + level + (tier === 'mythic' ? 4 : 0));
        for (let i = 0; i < count; i++) {
            const p = element('i','el-p'), spread = (i * 0.618034) % 1;
            p.style.setProperty('--x', `${Math.round(6 + spread * 88)}%`);
            p.style.setProperty('--d', `${-((i * 0.37) % 1.8).toFixed(2)}s`);
            p.style.setProperty('--s', (0.75 + ((i * 7) % 5) * 0.12 + level * 0.03).toFixed(2));
            p.style.setProperty('--t', `${(1.7 + ((i * 3) % 4) * 0.22).toFixed(2)}s`);
            fx.append(p);
        }
        // Storm and Mythic: the element breaks out along the top edge (flames, sprouting leaves, droplets, curls).
        const edges = tier === 'mythic' ? 9 : tier === 'storm' ? 6 : 0;
        for (let i = 0; i < edges; i++) {
            const x = Math.round(8 + (i + 0.5) * (84 / edges));
            if (first && x > 34 && x < 66) continue; // leave the centre clear for the "★ First time" tag
            const e = element('i','el-edge');
            e.style.setProperty('--x', `${x}%`);
            e.style.setProperty('--d', `${-((i * 0.29) % 1).toFixed(2)}s`);
            e.style.setProperty('--s', (0.8 + ((i * 5) % 3) * 0.18 + (tier === 'mythic' ? 0.2 : 0)).toFixed(2));
            e.style.setProperty('--r', `${(i % 2 ? 1 : -1) * (12 + (i % 3) * 8)}deg`);
            fx.append(e);
        }
        node.prepend(fx);
        if (tier === 'mythic') {
            const crown = element('span','el-crown');
            crown.innerHTML = `<svg viewBox="0 0 36 26" aria-hidden="true">${CROWNS[info.kind]}</svg>`;
            node.querySelector('.student-contribution-name')?.before(crown);
            node.querySelector('.student-contribution-name')?.after(element('span','el-title',info.title));
            node.setAttribute('aria-label', `${person.name}, ${info.title}`);
        }
        return {level, tier};
    }
    // v10.1.1: one card at a time. A new award fades the previous card out first; while the team cards slide into a
    // new ranking no card is shown, and the new card appears once its team card has landed. The card is built in the
    // frame after the score update (so it does not add to that frame's work), and its entrance starts only after it
    // has been drawn once (so a busy frame never skips the fade-in).
    function celebrate(team, person, points, detail = '', options = {}) {
        pending = {team, person, options};
        fadeOut();
        schedule();
    }
    function schedule() {
        if (pendingFrame || pendingTimer) return;
        pendingFrame = requestAnimationFrame(() => {
            pendingFrame = 0;
            const wait = Math.max(slideUntil, fadeUntil) - performance.now();
            if (wait > 0) { pendingTimer = setTimeout(() => { pendingTimer = 0; schedule(); }, wait); return; }
            showCard();
        });
    }
    // Called by the board just before the team cards slide into a new order. Returns how long the slide should wait
    // so that a card on screen has faded first.
    function beforeSlide(duration) {
        fadeOut(); // the award itself may already have started the fade: wait for whatever is left of it
        const hold = stillCards() || !shown.size ? 0 : Math.max(0, Math.ceil(fadeUntil - performance.now()));
        // The slide starts with the next drawn frame, which can come late on a busy board: allow a margin.
        slideUntil = Math.max(slideUntil, performance.now() + hold + duration + 120);
        return hold;
    }
    function showCard() {
        const p = pending; pending = null;
        if (!p) return;
        const {team, person, options} = p;
        const host = document.querySelector(`#team-${team.id} .mascot-area`);
        if (!host) return;
        for (const entry of [...shown]) drop(entry);
        const node = element('div','student-contribution-badge');
        node.style.setProperty('--student-color',team.color);
        node.setAttribute('role','status'); node.setAttribute('aria-live','polite');
        node.append(element('span','student-contribution-kicker',`${person.className} · POINTS EARNED`),
            element('strong','student-contribution-name',person.name),
            sealGrid(person));
        // v9.5.0: a student's first contribution of the session gets its own small flourish.
        if (options.first) { node.classList.add('first-contribution'); node.append(element('span','student-contribution-first','★ First time')); }
        const elemental = elementalize(node, team, person, Boolean(options.first));
        const entry = {node, teamId:team.id, motion:null, timer:0};
        shown.add(entry);
        if (stillCards()) { host.append(node); entry.timer = setTimeout(() => drop(entry),4300); return; }
        node.style.opacity = '0.01'; // drawn once, nearly invisible, before the entrance starts
        host.append(node);
        requestAnimationFrame(() => {
            if (!shown.has(entry) || entry.leaving) return;
            node.style.opacity = '';
            // A new seal since this student's last card: one short burst of their element.
            if (elemental && root.LeagueNavigatorSeals?.takeLevelUp(person.className, person.id)) {
                node.classList.add('el-levelup');
                node.querySelector('.el-glow')?.animate([{opacity:0,transform:'scale(.7)'},{opacity:1,transform:'scale(1.35)',offset:.35},{opacity:0,transform:'scale(1.6)'}],{duration:1100,delay:250,easing:'ease-out'});
            }
            entry.motion = node.animate([
                {opacity:0,transform:'translateY(9px) scale(.98)'},
                {opacity:1,transform:'translateY(0) scale(1)',offset:.12},
                {opacity:1,transform:'translateY(0) scale(1)',offset:.88},
                {opacity:0,transform:'translateY(-6px) scale(1)'}
            ],{duration:4200,easing:'ease-out'});
            entry.timer = setTimeout(() => drop(entry),4300);
        });
    }
    function clearCelebrations() {
        pending = null; cancelAnimationFrame(pendingFrame); clearTimeout(pendingTimer); pendingFrame = pendingTimer = 0;
        for (const entry of [...shown]) drop(entry);
    }
    function renderContributors(host, teams, className, totals) {
        host.replaceChildren();
        const any = teams.some(team => LeagueStudents.ranked(className,team.id,totals).length);
        host.hidden = !className;
        if (!className) return;
        host.append(element('div','champion-contributor-title','TOP PARTICIPATION LEADERS'));
        if (!any) {host.append(element('p','champion-contributor-empty','No student contributions recorded'));return;}
        for (const team of teams) {
            const rows = LeagueStudents.ranked(className,team.id,totals);
            const group = element('div','champion-contributor-group');
            group.style.setProperty('--student-color',team.color);
            if (teams.length > 1) group.append(element('div','champion-contributor-team',team.name));
            const list = element('ol','champion-contributor-list');
            const visibleCount = teams.length > 1 ? 1 : 3;
            const makeRow = person => {
                const row = element('li',`champion-contributor${person.rank === 1 ? ' is-top' : ''}`);
                row.append(element('span','contributor-rank',String(person.rank)),element('strong','contributor-name',person.name),
                    element('span','contributor-score',`${number(person.awards)}×`));
                return row;
            };
            rows.slice(0,visibleCount).forEach(person => list.append(makeRow(person)));
            if (!rows.length) list.append(element('li','champion-contributor-empty','No student contributions recorded'));
            group.append(list);
            if (rows.length > visibleCount) {
                const details = element('details','contributor-more');
                const tiedLeaders = rows.filter(person => person.rank === 1).length;
                const label = tiedLeaders > visibleCount ? `${tiedLeaders} tied leaders · View all ${rows.length}` : `View all ${rows.length} contributors`;
                details.append(element('summary','',label));
                const remaining = element('ol','champion-contributor-list');
                rows.slice(visibleCount).forEach(person => remaining.append(makeRow(person)));
                details.append(remaining); group.append(details);
            }
            host.append(group);
        }
    }
    function renderTeamRecognition(host, teams, className, totals, avatarMarkup) {
        host.replaceChildren();
        for (const team of teams) {
            const card = element('article','team-recognition-card');
            card.dataset.team = team.id;
            card.style.setProperty('--recognition-color',team.color);
            card.setAttribute('aria-label',`${team.name} participation leaders`);
            const avatar = element('div','team-recognition-avatar');
            avatar.setAttribute('aria-hidden','true');
            // Trusted local avatar renderer; student names are always text nodes.
            avatar.innerHTML = avatarMarkup(team);
            card.append(avatar,element('h4','team-recognition-name',team.name));
            const rows = LeagueStudents.ranked(className,team.id,totals).slice(0,3);
            const list = element('ol','team-recognition-list');
            for (const person of rows) {
                const row = element('li','team-recognition-contributor');
                const count = element('span','team-recognition-count',`${number(person.awards)}×`);
                count.setAttribute('aria-label',`${person.awards} ${person.awards === 1 ? 'contribution' : 'contributions'}`);
                row.append(element('span','team-recognition-rank',String(person.rank)),
                    element('strong','team-recognition-student',person.name),count);
                list.append(row);
            }
            if (rows.length) card.append(list);
            else card.append(element('p','team-recognition-empty',className ? 'No contributions recorded yet' : 'No class selected'));
            host.append(card);
        }
    }
    function renderConstellation(container, team, className, totals, {animate = false} = {}) {
        if (!container) return;
        const roster = LeagueStudents.members(className,team.id);
        const contributors = LeagueStudents.contributors(className,team.id,totals);
        const signature = contributors.map(person => person.id).join('|');
        if (container.dataset.contributors === signature) return;
        const previous = new Set((container.dataset.contributors || '').split('|'));
        container.dataset.contributors = signature;
        container.hidden = contributors.length === 0;
        container.setAttribute('aria-label',`${team.name}: ${contributors.length} distinct contributors`);
        container.replaceChildren();
        // Fixed roster positions keep existing stars in place as new ones appear.
        roster.forEach((person,index) => {
            if (!totals[person.id]?.awards) return;
            const angle = -Math.PI/2 + index * Math.PI*2/roster.length;
            const star = element('span','teamwork-star','★');
            star.setAttribute('aria-hidden','true');
            star.style.left = `${50 + 43*Math.cos(angle)}%`;
            star.style.top = `${50 + 42*Math.sin(angle)}%`;
            if (animate && !previous.has(person.id)) star.classList.add('teamwork-star-new');
            container.append(star);
        });
    }
    root.LeagueStudentUI = {chooseClass,chooseStudent,close,celebrate,beforeSlide,clearCelebration,clearCelebrations,renderContributors,renderTeamRecognition,renderConstellation,renderNextToInvite,get active(){return pickerKind;}};
})(window);
