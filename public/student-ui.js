/* Small, accessible pickers and bounded, transform-only student celebrations. */
(function(root) {
    'use strict';
    const number = value => Math.round(value).toLocaleString('en-US');
    let dialog, body, title, subtitle, cancelAction = null, pickerKind = null;
    const celebrations = new Map();
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
    function clearCelebration(teamId) {
        const active = celebrations.get(teamId);
        if (active) { clearTimeout(active.timer); active.motion?.cancel(); active.node.remove(); celebrations.delete(teamId); }
    }
    function celebrate(team, person, points, detail = '', options = {}) {
        const host = document.querySelector(`#team-${team.id} .mascot-area`);
        if (!host) return;
        clearCelebration(team.id);
        const node = element('div','student-contribution-badge');
        node.style.setProperty('--student-color',team.color);
        node.setAttribute('role','status'); node.setAttribute('aria-live','polite');
        node.append(element('span','student-contribution-kicker',`${person.className} · POINTS EARNED`),
            element('strong','student-contribution-name',person.name),
            element('span','student-contribution-points',`+${number(points)}${detail ? ` · ${detail}` : ''}`));
        // v9.5.0: a student's first contribution of the session gets its own small flourish.
        if (options.first) { node.classList.add('first-contribution'); node.append(element('span','student-contribution-first','★ First time')); }
        host.append(node);
        root.LeagueBoardFX?.flyPoints(node.querySelector('.student-contribution-points'),team.id,team.color);
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('performance-light');
        const motion = reduced ? null : node.animate([
            {opacity:0,transform:'translateY(9px) scale(.98)'},
            {opacity:1,transform:'translateY(0) scale(1)',offset:.12},
            {opacity:1,transform:'translateY(0) scale(1)',offset:.88},
            {opacity:0,transform:'translateY(-6px) scale(1)'}
        ],{duration:3600,easing:'ease-out'});
        celebrations.set(team.id,{node,motion,timer:setTimeout(() => clearCelebration(team.id),3700)});
    }
    function clearCelebrations() { for (const teamId of [...celebrations.keys()]) clearCelebration(teamId); }
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
    root.LeagueStudentUI = {chooseClass,chooseStudent,close,celebrate,clearCelebration,clearCelebrations,renderContributors,renderTeamRecognition,renderConstellation,renderNextToInvite,get active(){return pickerKind;}};
})(window);
