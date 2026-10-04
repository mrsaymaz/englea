            const teamRelics = {
                gryffindor: { name: "Sword of Godric", icon: "🗡️", effect: "Immune to Point Drains", unlockLevel: 5 },
                slytherin: { name: "Salazar's Locket", icon: "📿", effect: "+10% Base Points", unlockLevel: 5 },
                hufflepuff: { name: "Helga's Cup", icon: "🏆", effect: "Double Comeback Bonus", unlockLevel: 5 },
                ravenclaw: { name: "Rowena's Diadem", icon: "👑", effect: "Wheel grants +10% Points", unlockLevel: 5 }
            };

            const milestones = [ { points: 10000, bonus: 1000 }, { points: 50000, bonus: 5000 }, { points: 100000, bonus: 10000 } ];

            // Traits Dictionary (Esports Vibe)
            const teamTraits = {
                gryffindor: [
                    { id: 'mane_fire', name: 'Inferno Mane', icon: '🔥' }, { id: 'mane_ice', name: 'Frost Mane', icon: '❄️' },
                    { id: 'eyes_glowing', name: 'Astral Eyes', icon: '👁️' }, { id: 'armor_gold', name: 'Aegis Plate', icon: '🛡️' },
                    { id: 'horns_ram', name: 'Titan Horns', icon: '🐏' }, { id: 'wings_eagle', name: 'Griffin Wings', icon: '🦅' },
                    { id: 'fangs_saber', name: 'Saber Fangs', icon: '🦷' }, { id: 'aura_light', name: 'Solar Aura', icon: '☀️' },
                    { id: 'crown_celestial', name: 'Divine Halo', icon: '👑' }, { id: 'tail_manticore', name: 'Manticore Sting', icon: '🦂' }
                ],
                slytherin: [
                    { id: 'hood_cobra', name: 'Emperor Hood', icon: '🐍' }, { id: 'scales_crystal', name: 'Diamond Scales', icon: '💎' },
                    { id: 'fangs_venom', name: 'Toxic Fangs', icon: '🧪' }, { id: 'eyes_void', name: 'Abyssal Gaze', icon: '👁️‍🗨️' },
                    { id: 'horns_dragon', name: 'Wyrm Horns', icon: '🐉' }, { id: 'wings_feathered', name: 'Couatl Wings', icon: '🪽' },
                    { id: 'tail_rattle', name: 'Tremor Tail', icon: '🎵' }, { id: 'aura_poison', name: 'Miasma Aura', icon: '💨' },
                    { id: 'armor_bone', name: 'Skull Helm', icon: '💀' }, { id: 'heads_hydra', name: 'Hydra Heads', icon: '🐲' }
                ],
                hufflepuff: [
                    { id: 'fur_moss', name: 'Sylvan Coat', icon: '🌿' }, { id: 'spikes_rock', name: 'Geode Spikes', icon: '🪨' },
                    { id: 'armor_stone', name: 'Granite Plate', icon: '🗿' }, { id: 'runes_glowing', name: 'Arcane Runes', icon: '✨' },
                    { id: 'claws_diamond', name: 'Crystal Claws', icon: '💎' }, { id: 'tusks_mammoth', name: 'Mammoth Tusks', icon: '🦣' },
                    { id: 'aura_earth', name: 'Seismic Aura', icon: '🌍' }, { id: 'crown_antlers', name: 'Forest Crown', icon: '🦌' },
                    { id: 'wings_gargoyle', name: 'Gargoyle Wings', icon: '🦇' }, { id: 'eyes_berserk', name: 'Primal Fury', icon: '💢' }
                ],
                ravenclaw: [
                    { id: 'feathers_storm', name: 'Tempest Plumage', icon: '🌪️' }, { id: 'eyes_third', name: 'Oracle Eye', icon: '👁️' },
                    { id: 'beak_golden', name: 'Midas Beak', icon: '⚜️' }, { id: 'wings_extra', name: 'Seraph Wings', icon: '👼' },
                    { id: 'aura_lightning', name: 'Static Field', icon: '⚡' }, { id: 'crown_stars', name: 'Astral Crown', icon: '✨' },
                    { id: 'tail_peacock', name: 'Mystic Tail', icon: '🦚' }, { id: 'armor_silver', name: 'Mithril Helm', icon: '🛡️' },
                    { id: 'talons_crystal', name: 'Frost Talons', icon: '❄️' }, { id: 'flames_blue', name: 'Phoenix Fire', icon: '🔥' }
                ]
            };



            // --- FINAL ARENA TRAIT CLASSIFICATION ---
            // Each existing mutation contributes to exactly one combat statistic.
            // This map changes no SVG coordinates or rendering behavior.
            const battleTraitCategories = {
                gryffindor: {
                    mane_fire:'power', mane_ice:'armor', eyes_glowing:'arcane', armor_gold:'armor', horns_ram:'power',
                    wings_eagle:'speed', fangs_saber:'power', aura_light:'arcane', crown_celestial:'arcane', tail_manticore:'power'
                },
                slytherin: {
                    hood_cobra:'armor', scales_crystal:'armor', fangs_venom:'power', eyes_void:'arcane', horns_dragon:'power',
                    wings_feathered:'speed', tail_rattle:'speed', aura_poison:'arcane', armor_bone:'armor', heads_hydra:'power'
                },
                hufflepuff: {
                    fur_moss:'armor', spikes_rock:'power', armor_stone:'armor', runes_glowing:'arcane', claws_diamond:'power',
                    tusks_mammoth:'power', aura_earth:'arcane', crown_antlers:'arcane', wings_gargoyle:'speed', eyes_berserk:'power'
                },
                ravenclaw: {
                    feathers_storm:'speed', eyes_third:'arcane', beak_golden:'power', wings_extra:'speed', aura_lightning:'arcane',
                    crown_stars:'arcane', tail_peacock:'speed', armor_silver:'armor', talons_crystal:'power', flames_blue:'power'
                }
            };

            const battleProfiles = {
                gryffindor: { element:'fire', elementColor:'#f97316', signature:'Inferno Assault', relic:'Solar Aegis', basic:'Flame Pounce', color:'#e11d48' },
                slytherin: { element:'nature', elementColor:'#22c55e', signature:'Verdant Ambush', relic:'Ancient Overgrowth', basic:'Vine Lash', color:'#10b981' },
                hufflepuff: { element:'air', elementColor:'#bae6fd', signature:'Cyclone Bastion', relic:'Second Wind', basic:'Gale Charge', color:'#eab308' },
                ravenclaw: { element:'water', elementColor:'#38bdf8', signature:'Maelstrom Dive', relic:'Water Veil', basic:'Tidal Slash', color:'#3b82f6' }
            };

            // v8.5.1: calibrated team/level output for 250-HP and 200-HP arenas.
            // See BALANCE-REPORT-v8.5.1.md for held-out simulation results and limits.
            // The same multiplier applies to direct attacks and poison ticks.
            const arenaDamageBalance = {
                gryffindor: [1.1239,1.0923,1.0694,1.0554,1.0393,1.0492,1.0212,1.022,1.0189,1.0123,0.9983],
                slytherin: [0.9938,0.9924,0.9868,0.9795,0.9831,1.0585,1.0283,1.0139,1.0198,1.0179,1.0029],
                hufflepuff: [0.9206,0.9263,0.9518,0.9649,0.9897,0.8421,0.847,0.8757,0.9165,0.9591,0.9681],
                ravenclaw: [0.9679,0.9636,0.9724,0.9712,0.9793,1.0954,1.0697,1.0617,1.0553,1.0466,1.0518]
            };


            // Fixed at battle start: interpolation never depends on who is winning.
            // Lower starting-health arenas need different output normalization because
            // poison, healing and shields have different value in shorter encounters.
            const arenaDamageBalanceLowHP = {
                gryffindor: [1.0887,1.0418,1.0353,0.9913,0.9845,1.0182,0.9895,0.9939,0.978,0.9919,0.9618],
                slytherin: [1.0735,1.0642,1.0535,1.0486,1.0364,1.1092,1.0803,1.0738,1.0862,1.0855,1.0661],
                hufflepuff: [0.9469,0.9713,0.9975,1.0388,1.0844,0.9397,0.922,0.9507,0.9869,1.0086,1.0105],
                ravenclaw: [0.9649,0.965,0.9718,0.9686,0.9649,1.0632,1.0425,1.0268,1.0354,1.0436,1.0582]
            };
            function arenaOutputMultiplier(fighter){
                const level=Math.max(0,Math.min(10,Math.round(fighter.level)||0));
                const lowWeight=Math.max(0,Math.min(1,(250-(battleState?.startingMeanHP??250))/50));
                const high=arenaDamageBalance[fighter.id]?.[level]??1;
                const low=arenaDamageBalanceLowHP[fighter.id]?.[level]??high;
                return high+(low-high)*lowWeight;
            }

            let teamsData = [
                { id: 'gryffindor', name: 'Gryffindor', color: '#e11d48', points: 0, level: 0, evolutionProgress: 0, milestonesReached: [], wheelMilestonesReached: [], powerups: { doubleUp: false, halfDown: false, shield: false }, traits: [], hasRelic: false, pendingEvolution: null, cachedSVG: '' },
                { id: 'slytherin', name: 'Slytherin', color: '#10b981', points: 0, level: 0, evolutionProgress: 0, milestonesReached: [], wheelMilestonesReached: [], powerups: { doubleUp: false, halfDown: false, shield: false }, traits: [], hasRelic: false, pendingEvolution: null, cachedSVG: '' },
                { id: 'hufflepuff', name: 'Hufflepuff', color: '#eab308', points: 0, level: 0, evolutionProgress: 0, milestonesReached: [], wheelMilestonesReached: [], powerups: { doubleUp: false, halfDown: false, shield: false }, traits: [], hasRelic: false, pendingEvolution: null, cachedSVG: '' },
                { id: 'ravenclaw', name: 'Ravenclaw', color: '#3b82f6', points: 0, level: 0, evolutionProgress: 0, milestonesReached: [], wheelMilestonesReached: [], powerups: { doubleUp: false, halfDown: false, shield: false }, traits: [], hasRelic: false, pendingEvolution: null, cachedSVG: '' }
            ];

            let battleState = null;
            let battleRaf = null;
            const arenaClock=SceneRuntime.create('arena',{pause:()=>{ArenaMotion.stop();stopBattleMusic(0);},resume:delta=>SceneRuntime.shiftClock(battleState,delta)});
            const battleTimers=arenaClock.tasks;

            function scheduleBattleTask(fn,delay){return arenaClock.after(()=>{if(battleState?.running)fn();},delay);}
            function clearBattleTasks(){arenaClock.clear();battleRaf=null;clearLightBattleVisuals();}
            function scheduleBattleLoop(){if(battleState?.running)battleRaf=arenaClock.after(()=>updateFinalBattle(SceneRuntime.now()),100);}

            function battleFormName(level) {
                if (level >= 10) return 'Legendary';
                if (level >= 8) return 'Ascendant';
                if (level >= 5) return 'Relic Form';
                if (level >= 3) return 'Evolved';
                return level > 0 ? 'Awakened' : 'Base Form';
            }

            function buildBattleFighter(team, highestPoints) {
                const categories = { power:0, armor:0, speed:0, arcane:0 };
                const map = battleTraitCategories[team.id] || {};
                team.traits.forEach(trait => {
                    const category = map[trait];
                    if (category) categories[category]++;
                });
                const maxHP = LeagueRules.arenaHP(team.points,highestPoints);
                return {
                    id:team.id, name:team.name, color:team.color, points:team.points, level:team.level,
                    traits:[...team.traits], hasRelic:team.hasRelic, form:battleFormName(team.level),
                    power:20 + team.level * 2 + categories.power * 4,
                    armor:10 + team.level * 2 + categories.armor * 4,
                    speed:10 + team.level * 2 + categories.speed * 4,
                    arcane:10 + team.level * 2 + categories.arcane * 4,
                    hp:maxHP, maxHP, energy:0, alive:true, damageDealt:0, damageBlocked:0, damageTaken:0,
                    actions:0, criticals:0, signatureUses:0, relicUsed:false, charged:false,
                    guardUntil:0, invulnerableUntil:0, wardUntil:0, dodgeUntil:0, evadeCooldownUntil:0,
                    shieldHP:0, poisonUntil:0, poisonTickDamage:0, poisonTickScheduled:false, poisonSourceId:null, guardWeakenedUntil:0,
                    damageBuffUntil:0, critBuffUntil:0, busyUntil:0, signatureCooldownUntil:0,
                    nextActionAt:0, lastAttacker:null, lastTarget:null, knockedOutAt:null, arenaTieBreaker:Math.random()
                };
            }

            function fighterElement(id) { return document.getElementById(`battle-fighter-${id}`); }
            function shellElement(id) { return document.getElementById(`battle-shell-${id}`); }

            function shuffledBattleOrder(fighters) {
                const shuffled = [...fighters];
                for (let index = shuffled.length - 1; index > 0; index--) {
                    const swapIndex = Math.floor(Math.random() * (index + 1));
                    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
                }
                return shuffled;
            }

            function compareArenaFighters(a,b) {
                const aliveDiff=Number(b.alive)-Number(a.alive); if (aliveDiff) return aliveDiff;
                const percentDiff=(b.hp/b.maxHP)-(a.hp/a.maxHP); if (Math.abs(percentDiff)>.0001) return percentDiff;
                if (b.hp!==a.hp) return b.hp-a.hp;
                if (b.damageDealt!==a.damageDealt) return b.damageDealt-a.damageDealt;
                if (b.points!==a.points) return b.points-a.points;
                return b.arenaTieBreaker-a.arenaTieBreaker;
            }

            // Light Arena scaling is intentionally local to these temporary battle avatars.
            // Mid-level forms remain readable while Level 10 is about 2.8 times the height
            // of Level 0. Scoreboard, Unity, Remote and Ultra avatar sizing are untouched.
            const lightBattleLevelScales = Object.freeze([.55,.64,.73,.82,.91,1,1.11,1.22,1.33,1.44,1.55]);
            function lightBattleScaleForLevel(level) {
                const index=Math.max(0,Math.min(10,Math.round(Number(level)||0)));
                return lightBattleLevelScales[index];
            }

            function renderBattleFighters() {
                const host = document.getElementById('battle-fighters');
                host.innerHTML = battleState.fighters.map(f => {
                    const rightSide = f.arenaSlot === 1 || f.arenaSlot === 3;
                    const relicText = f.hasRelic ? `${teamRelics[f.id].icon} READY` : 'RELIC LOCKED';
                    const ultraTraitScale = Math.min(1.07, .91 + f.level * .016);
                    const arenaScale=lightBattleScaleForLevel(f.level);
                    const detailedPanel='',battleStats='';
                    return `
                        <section id="battle-fighter-${f.id}" class="battle-fighter ${rightSide ? 'right-side' : ''}" data-team="${f.id}" data-slot="${f.arenaSlot}" style="--team-color:${f.color}" aria-label="${f.name} battle fighter">
                            <div class="battle-team-panel">
                                ${detailedPanel}
                                <div class="battle-hp-row">
                                    <span class="battle-hp-label">HP</span>
                                    <div class="battle-hp-track"><div id="battle-hp-loss-${f.id}" class="battle-hp-loss"></div><div id="battle-hp-fill-${f.id}" class="battle-hp-fill"></div></div>
                                    <span id="battle-hp-number-${f.id}" class="battle-hp-number">${f.hp} / ${f.maxHP}</span>
                                </div>
                                ${battleStats}
                            </div>
                            ${isLeanMode() ? '' : `<div id="battle-status-${f.id}" class="battle-status-line"></div>`}
                            <div id="battle-shell-${f.id}" class="battle-avatar-shell" style="--team-color:${f.color}; --battle-level-scale:${arenaScale}">
                                <div class="battle-shadow"></div>
                                <div class="battle-avatar-face"><div class="battle-level-size"><div class="battle-avatar-pose">
                                    <div class="battle-avatar-svg">${getAvatarSVG(f.id, f.traits)}</div>
                                    <div class="battle-shield light-defense-${f.id}"></div>
                                </div></div></div>
                            </div>
                            <div class="battle-ko-label">Knocked Out</div>
                        </section>`;
                }).join('');
                battleState.fighters.forEach(updateBattleHUD);
            }

            function updateBattleHUD(f) {
                const hpFill = document.getElementById(`battle-hp-fill-${f.id}`);
                const hpNumber = document.getElementById(`battle-hp-number-${f.id}`);
                const energy = document.getElementById(`battle-energy-${f.id}`);
                if (!hpFill || !hpNumber) return;
                const percentage = Math.max(0, Math.min(100, (f.hp / f.maxHP) * 100));
                hpFill.style.width = `${percentage}%`;
                const loss=document.getElementById(`battle-hp-loss-${f.id}`);if(loss)loss.style.width=`${percentage}%`;
                hpFill.style.background = percentage > 55 ? 'linear-gradient(90deg,#22c55e,#a3e635)' : percentage > 25 ? 'linear-gradient(90deg,#f59e0b,#facc15)' : 'linear-gradient(90deg,#dc2626,#fb7185)';
                hpNumber.textContent = `${Math.max(0, Math.ceil(f.hp))} / ${f.maxHP}`;
                if (energy) energy.textContent = `${'●'.repeat(Math.min(3,f.energy))}${'○'.repeat(Math.max(0,3-f.energy))}`;
            }

            function setBattleStatus(){}
            function battleAnnounce(){}

            function setArenaTeamFlare(teamId, duration=700) {
                const overlay = document.getElementById('battle-overlay');
                overlay.classList.remove('team-gryffindor','team-slytherin','team-hufflepuff','team-ravenclaw');
                if (teamId) overlay.classList.add(`team-${teamId}`);
                scheduleBattleTask(() => overlay.classList.remove(`team-${teamId}`), duration);
            }

            function battleCenterFor(f) {
                const shell = shellElement(f.id);
                const arena = document.getElementById('battle-arena');
                if (!shell || !arena) return {x:0,y:0};
                const sr = shell.getBoundingClientRect();
                const ar = arena.getBoundingClientRect();
                return { x:sr.left + sr.width/2 - ar.left, y:sr.top + sr.height/2 - ar.top };
            }

            function cacheLightBattleGeometry(){return ArenaMotion.cache();}
            function clearLightBattleVisuals(){ArenaMotion.stop();}
            function animateLightFace(f,reaction='hit'){ArenaMotion.reaction(f.id,reaction,f.color);}
            function animateLightDefense(f){ArenaMotion.reaction(f.id,'guard',f.color);}
            function setMotionVector(attacker,target){attacker._arenaTarget=target.id;attacker._arenaPresented=false;}
            function showTargetIndicator(){}
            function showSignatureSpotlight(){}
            function animateShell(f,className,duration=800){
                if(className==='action-guard'||className==='is-evading')return ArenaMotion.reaction(f.id,'guard',f.color);
                if(className==='action-charge')return ArenaMotion.reaction(f.id,'charge',f.color);
                if(f._arenaPresented)return;const target=battleState?.fighters.find(t=>t.id===f._arenaTarget&&t.alive);if(!target)return;
                f._arenaPresented=true;ArenaMotion.attack(f,target,{impact:f._arenaImpactDelay||(duration>=1100?700:420),signature:duration>=1100});
            }

            function addBattleEffect(){return null;}
            function createImpact(target,color,damage,options={}){ArenaMotion.impact(target,color,options);}
            function createProjectile(attacker,target,color,type=''){animateShell(attacker,'action-arc',920);}
            function createFog(target,color){ArenaMotion.effect(target.id,'poison',color);}
            function createElementalBurst(target,element,large=false){if(target){const profile=Object.values(battleProfiles).find(p=>p.element===element);ArenaMotion.effect(target.id,'impact',profile?.elementColor||'#f8fafc',large);}}
            function shakeArena(){}
            function screenFlash(){}

            function activeTargetPressure(targetId, at=SceneRuntime.now()) {
                battleState.targetLocks = battleState.targetLocks.filter(lock => lock.expires > at);
                return battleState.targetLocks.filter(lock => lock.targetId === targetId).length;
            }

            function registerTargetPressure(targetId, duration=1150) {
                const existing=activeTargetPressure(targetId);
                battleState.targetLocks.push({targetId, expires:SceneRuntime.now()+duration});
                return existing;
            }

            function chooseBattleTarget(attacker) {
                const candidates=battleState.fighters.filter(f=>f.alive && f.id!==attacker.id);
                if (!candidates.length) return null;
                const now=SceneRuntime.now();
                const weighted=candidates.map(target=>{
                    const pressure=activeTargetPressure(target.id,now);
                    let weight=1/(1+pressure*2.8);
                    if (target.wardUntil>now) weight*=.22;
                    if (attacker.lastAttacker===target.id) weight*=1.65;
                    if (attacker.lastTarget===target.id) weight*=.72;
                    weight*=.9+(target.hp/target.maxHP)*.35;
                    return {target,weight};
                });
                const total=weighted.reduce((sum,item)=>sum+item.weight,0);
                let roll=Math.random()*total;
                for (const item of weighted) { roll-=item.weight; if (roll<=0) return item.target; }
                return weighted[weighted.length-1].target;
            }

            function resistanceMultiplier(priorAttackers) {
                if (priorAttackers<=0) return 1;
                if (priorAttackers===1) return .85;
                return .65;
            }

            function canEvade(target, isSignature=false) {
                const now=SceneRuntime.now();
                if (!target.alive || target.evadeCooldownUntil>now || target.invulnerableUntil>now) return false;
                let chance=Math.min(.23,.035+target.speed*.0026);
                if (target.dodgeUntil>now) chance+=.32;
                if (isSignature) chance*=.42;
                return Math.random()<chance;
            }

            function performEvade(target,attackerId) {
                ArenaMotion.resolve(target.id,attackerId,'evaded');
                target.evadeCooldownUntil=SceneRuntime.now()+2600;
                setBattleStatus(target,'Evaded',650);
            }

            function computeBattleDamage(attacker,target,multiplier=1,ignoreArmor=0) {
                const now=SceneRuntime.now();
                const effectiveArmor=Math.max(0,target.armor*(1-ignoreArmor));
                const mitigation=100/(100+effectiveArmor*1.05);
                const random=.92+Math.random()*.16;
                const surge=battleState.surge ? 1.24 : 1;
                const finalBoost=battleState.finalClash ? 1.28 : 1;
                const charge=attacker.charged ? 1.25 : 1;
                const foresight=attacker.damageBuffUntil>now ? 1.18 : 1;
                const base=8+attacker.power*.43;
                let criticalChance=.075+attacker.arcane*.0012+(attacker.critBuffUntil>now?.20:0);
                const critical=Math.random()<Math.min(.38,criticalChance);
                const levelIndex=Math.max(0,Math.min(10,Math.round(attacker.level)||0));
                const balanceFactor=arenaOutputMultiplier(attacker);
                let damage=base*multiplier*mitigation*random*surge*finalBoost*charge*foresight*(critical?1.4:1)*balanceFactor;
                attacker.charged=false;
                return {damage:Math.max(3,Math.round(damage)),critical};
            }

            function applyBattleDamage(attacker,target,amount,options={}) {
                if (!battleState.running || !target.alive) return {damage:0,blocked:true};
                const now=SceneRuntime.now();
                if (target.invulnerableUntil>now) {
                    target.damageBlocked+=amount; createImpact(target,'#facc15',0,{blocked:true,label:'IMMUNE',attackerId:attacker.id});
                    return {damage:0,blocked:true};
                }
                let damage=amount*(options.resistance??1);
                let defended = false;
                if (target.wardUntil>now) { damage*=.80; defended=true; }
                if (target.guardUntil>now) {
                    defended=true;
                    const guardFactor=target.guardWeakenedUntil>now?.68:.50;
                    target.damageBlocked+=damage*(1-guardFactor); damage*=guardFactor;
                }
                if (target.shieldHP>0) {
                    defended=true;
                    const absorbed=Math.min(target.shieldHP,damage);
                    target.shieldHP-=absorbed; target.damageBlocked+=absorbed; damage-=absorbed;
                }
                damage=damage<=0?0:Math.max(options.minimum??1,Math.round(damage));
                target.hp=Math.max(0,target.hp-damage);
                target.damageTaken+=damage; attacker.damageDealt+=damage;
                target.lastAttacker=attacker.id; attacker.lastTarget=target.id;
                if (options.critical) attacker.criticals++;
                updateBattleHUD(target);
                createImpact(target,attacker.color,damage,{critical:options.critical,defended,blocked:damage===0,attackerId:attacker.id});
                if (options.critical) { playSound('critical'); shakeArena(); }
                if (target.hp<=0) knockOutFighter(target,attacker);
                return {damage,blocked:false};
            }

            function knockOutFighter(target,attacker) {
                if (!target.alive) return;
                target.alive=false; target.knockedOutAt=SceneRuntime.now(); target.hp=0; updateBattleHUD(target);
                const fighter=fighterElement(target.id); const shell=shellElement(target.id);
                fighter?.classList.add('is-ko'); shell?.classList.add('is-knocked-out');
                battleAnnounce(`${target.name} knocked out!`, '#f87171');
                setArenaTeamFlare(attacker?.id || target.id,1000); playSound('knockout');
                const alive=battleState.fighters.filter(f=>f.alive);
                if (alive.length===1 && battleState.elapsed>11000) {
                    battleState.earlyWinnerAt=SceneRuntime.now()+1200;
                }
            }

            function healFighter(f,amount) {
                if (!f.alive) return;
                const actual=Math.min(amount,f.maxHP-f.hp); f.hp+=actual; updateBattleHUD(f);
                createImpact(f,'#86efac',actual,{heal:true});
            }

            function performGuard(f) {
                const now=SceneRuntime.now(); f.guardUntil=now+1050; f.energy=Math.min(3,f.energy+1); f.actions++;
                const shell=shellElement(f.id); shell?.classList.add('guarded'); animateShell(f,'action-guard',820);
                setBattleStatus(f,'Guard',850); updateBattleHUD(f);
                scheduleBattleTask(()=>shell?.classList.remove('guarded'),1080);
            }

            function performCharge(f) {
                f.energy=Math.min(3,f.energy+2); f.charged=true; f.actions++;
                animateShell(f,'action-charge',1020); setBattleStatus(f,'Charge',950); updateBattleHUD(f);
            }

            function performBasicAttack(f,target) {
                if (!target) return;
                const prior=registerTargetPressure(target.id);
                const resistance=resistanceMultiplier(prior);
                if (prior>=1) { target.wardUntil=SceneRuntime.now()+1050; const shell=shellElement(target.id); shell?.classList.add('guarded'); scheduleBattleTask(()=>shell?.classList.remove('guarded'),1060); }
                f.energy=Math.min(3,f.energy+1); f.actions++; updateBattleHUD(f); setArenaTeamFlare(f.id,650);
                setMotionVector(f,target);
                showTargetIndicator(f,target,false);
                const element=battleProfiles[f.id].element;

                if (f.id==='gryffindor' && Math.random()<.36) {
                    f._arenaImpactDelay=500; setBattleStatus(f,'Ember Burst',720); createProjectile(f,target,'#f97316','fire');
                    scheduleBattleTask(()=>{
                        if (canEvade(target)) return performEvade(target,f.id);
                        const result=computeBattleDamage(f,target,1);
                        applyBattleDamage(f,target,result.damage,{critical:result.critical,resistance});
                        createElementalBurst(target,'fire');
                    },500);
                    return;
                }
                if (f.id==='slytherin' && Math.random()<.38) {
                    f._arenaImpactDelay=500; setBattleStatus(f,'Thorn Volley',720); createProjectile(f,target,'#22c55e','leaf');
                    scheduleBattleTask(()=>{
                        if (canEvade(target)) return performEvade(target,f.id);
                        const result=computeBattleDamage(f,target,.82);
                        applyBattleDamage(f,target,result.damage,{critical:result.critical,resistance});
                        createElementalBurst(target,'nature');
                        if (target.alive) applyPoison(f,target,Math.max(2,Math.round(target.maxHP*.012)),2500);
                    },500);
                    return;
                }
                if (f.id==='hufflepuff' && Math.random()<.34) {
                    f._arenaImpactDelay=500; setBattleStatus(f,'Wind Cutter',720); createProjectile(f,target,'#bae6fd','wind');
                    scheduleBattleTask(()=>{
                        if (canEvade(target)) return performEvade(target,f.id);
                        const result=computeBattleDamage(f,target,1);
                        applyBattleDamage(f,target,result.damage,{critical:result.critical,resistance});
                        createElementalBurst(target,'air');
                    },500);
                    return;
                }
                if (f.id==='ravenclaw' && Math.random()<.34) {
                    f._arenaImpactDelay=620;setBattleStatus(f,'Tidal Blades',750);
                    for (let i=0;i<3;i++) scheduleBattleTask(()=>createProjectile(f,target,'#38bdf8','water'),i*90);
                    scheduleBattleTask(()=>{
                        if (canEvade(target)) return performEvade(target,f.id);
                        const result=computeBattleDamage(f,target,1.06);
                        applyBattleDamage(f,target,result.damage,{critical:result.critical,resistance});
                        createElementalBurst(target,'water');
                    },620);
                    return;
                }
                f._arenaImpactDelay=420;
                const movement=f.id==='slytherin'||f.id==='ravenclaw'?'action-arc':f.id==='hufflepuff'?'action-lunge':'action-lunge';
                setBattleStatus(f,battleProfiles[f.id].basic,720); animateShell(f,movement,920);
                scheduleBattleTask(()=>{
                    if (canEvade(target)) return performEvade(target,f.id);
                    const result=computeBattleDamage(f,target,1);
                    applyBattleDamage(f,target,result.damage,{critical:result.critical,resistance});
                    createElementalBurst(target,element);
                    if (f.id==='hufflepuff') shakeArena();
                },movement==='action-slam'?560:420);
            }

            function applyPoison(attacker,target,tickDamage,duration=3600,strong=false) {
                const now=SceneRuntime.now();
                target.poisonUntil=Math.max(target.poisonUntil,now+duration);
                target.poisonTickDamage=Math.max(target.poisonTickDamage,tickDamage);
                target.poisonSourceId=attacker.id;
                if (strong) target.guardWeakenedUntil=Math.max(target.guardWeakenedUntil,now+duration);
                createFog(target,strong?'rgba(21,128,61,.78)':'rgba(34,197,94,.58)');

                // Reapplying poison refreshes and strengthens one active effect instead of
                // spawning parallel tick chains. This removes Slytherin's former late-level
                // exponential stacking while keeping poison persistent and dangerous.
                if (target.poisonTickScheduled) return;
                target.poisonTickScheduled=true;target.poisonCarry=.5;
                const tick=()=>{
                    if (!battleState?.running || !target.alive) {
                        target.poisonTickScheduled=false;
                        return;
                    }
                    const tickNow=SceneRuntime.now();
                    if (tickNow>target.poisonUntil) {
                        target.poisonTickScheduled=false;
                        target.poisonTickDamage=0;target.poisonCarry=.5;
                        target.poisonSourceId=null;
                        return;
                    }
                    const poisonOwner=battleState.fighters.find(f=>f.id===target.poisonSourceId) || attacker;
                    const levelIndex=Math.max(0,Math.min(10,Math.round(poisonOwner.level)||0));
                    const balanceFactor=arenaOutputMultiplier(poisonOwner);
                    // Carry fractional output within this poison chain to avoid large
                    // per-tick rounding cliffs while keeping actual HP damage integral.
                    const scaledTick=target.poisonTickDamage*balanceFactor+(target.poisonCarry??.5);
                    let damage=Math.max(1,Math.floor(scaledTick));
                    target.poisonCarry=scaledTick-damage;
                    let defended=false;
                    // Poison bypasses armor/guard, but never invulnerability or shield HP.
                    if(target.invulnerableUntil>tickNow){target.damageBlocked+=damage;damage=0;defended=true;}
                    else if(target.shieldHP>0){const absorbed=Math.min(target.shieldHP,damage);target.shieldHP-=absorbed;target.damageBlocked+=absorbed;damage-=absorbed;defended=true;}
                    damage=Math.min(target.hp,Math.max(0,Math.round(damage)));
                    target.hp=Math.max(0,target.hp-damage); target.damageTaken+=damage; poisonOwner.damageDealt+=damage;
                    updateBattleHUD(target); createImpact(target,'#22c55e',damage,{defended,blocked:damage===0});
                    if (target.hp<=0) {
                        target.poisonTickScheduled=false;
                        knockOutFighter(target,poisonOwner);
                    } else {
                        scheduleBattleTask(tick,1050);
                    }
                };
                scheduleBattleTask(tick,950);
            }

            // Final Arena fairness pass (Monte Carlo calibrated):
            // randomized action order, non-stacking poison, consistent area-charge handling,
            // and small level-based output normalization keep equal teams competitively even.
            function performSignature(f,target) {
                if (!target || f.energy<3) return performBasicAttack(f,target);
                f.energy-=3; f.signatureUses++; f.actions++; f.signatureCooldownUntil=SceneRuntime.now()+6800; updateBattleHUD(f);
                setArenaTeamFlare(f.id,1400); battleAnnounce(`${f.name}: ${battleProfiles[f.id].signature}`,f.color); playSound('signature');
                f._arenaImpactDelay={gryffindor:720,slytherin:710,hufflepuff:680,ravenclaw:720}[f.id];
                setMotionVector(f,target);
                showSignatureSpotlight(f,920);
                if (f.id==='hufflepuff') {
                    battleState.fighters.filter(other=>other.alive&&other.id!==f.id).forEach(other=>showTargetIndicator(f,other,true));
                } else {
                    showTargetIndicator(f,target,true);
                }

                if (f.id==='gryffindor') {
                    setBattleStatus(f,'Inferno Assault',1200); animateShell(f,'action-slam',1250); screenFlash('rgba(249,115,22,.58)');
                    const prior=registerTargetPressure(target.id,1400); const resistance=resistanceMultiplier(prior);
                    scheduleBattleTask(()=>{
                        if (canEvade(target,true)) return performEvade(target,f.id);
                        const execute=f.hp/f.maxHP<.40?1.24:1;
                        const result=computeBattleDamage(f,target,1.92*execute,.34);
                        applyBattleDamage(f,target,result.damage,{critical:result.critical,resistance}); createElementalBurst(target,'fire',true); shakeArena();
                    },720);
                } else if (f.id==='slytherin') {
                    setBattleStatus(f,'Verdant Ambush',1250); animateShell(f,'action-arc',1250); createFog(target,'rgba(34,197,94,.68)'); createElementalBurst(target,'nature',true);
                    const prior=registerTargetPressure(target.id,1450); const resistance=resistanceMultiplier(prior);
                    scheduleBattleTask(()=>{
                        if (canEvade(target,true)) return performEvade(target,f.id);
                        const result=computeBattleDamage(f,target,1.26,.12);
                        applyBattleDamage(f,target,result.damage,{critical:result.critical,resistance});
                        createElementalBurst(target,'nature',true);
                        if (target.alive) applyPoison(f,target,Math.max(3,Math.round(target.maxHP*.022)),4100,true);
                    },710);
                } else if (f.id==='hufflepuff') {
                    setBattleStatus(f,'Cyclone Bastion',1250); animateShell(f,'action-arc',1250); screenFlash('rgba(186,230,253,.34)');
                    battleState.fighters.filter(t=>t.alive&&t.id!==f.id&&t.id!==target.id).forEach(t=>ArenaMotion.extraTarget(f,t,680));
                    scheduleBattleTask(()=>{
                        const p=battleCenterFor(f); addBattleEffect('battle-shockwave',p.x,p.y,'#bae6fd'); createElementalBurst(f,'air',true); shakeArena();
                        const carriedCharge=f.charged;
                        shuffledBattleOrder(battleState.fighters.filter(t=>t.alive&&t.id!==f.id)).forEach(targetF=>{
                            // A charged Cyclone now applies the same charge value to every target,
                            // instead of consuming it on whichever team occupied the first slot.
                            f.charged=carriedCharge;
                            const result=computeBattleDamage(f,targetF,.42);
                            applyBattleDamage(f,targetF,result.damage,{critical:result.critical,resistance:.82});
                        });
                        f.charged=false;
                        const newShield=Math.max(10,Math.round(f.maxHP*.04));
                        f.shieldHP=Math.max(f.shieldHP,newShield); const shell=shellElement(f.id); shell?.classList.add('guarded');
                        scheduleBattleTask(()=>shell?.classList.remove('guarded'),1750);
                    },680);
                } else if (f.id==='ravenclaw') {
                    setBattleStatus(f,'Maelstrom Dive',1200); animateShell(f,'action-dive',1250); screenFlash('rgba(14,165,233,.48)');
                    const prior=registerTargetPressure(target.id,1350); const resistance=resistanceMultiplier(prior);
                    scheduleBattleTask(()=>{
                        if (canEvade(target,true)) return performEvade(target,f.id);
                        const result=computeBattleDamage(f,target,1.98,.18);
                        applyBattleDamage(f,target,result.damage,{critical:result.critical,resistance}); createElementalBurst(target,'water',true); shakeArena();
                        f.dodgeUntil=SceneRuntime.now()+2200;
                    },720);
                }
            }

            function activateRelic(f,target=null) {
                if (!f.hasRelic || f.relicUsed) return false;
                f.relicUsed=true; const now=SceneRuntime.now();
                const relicEl=document.getElementById(`battle-relic-${f.id}`); if (relicEl) relicEl.textContent=`${teamRelics[f.id].icon} USED`;
                battleAnnounce(`${teamRelics[f.id].name}: ${battleProfiles[f.id].relic}`, '#fde68a');
                setBattleStatus(f,battleProfiles[f.id].relic,1300); setArenaTeamFlare(f.id,1450); playSound('relic'); screenFlash('rgba(250,204,21,.32)');
                const shell=shellElement(f.id);
                if (f.id==='gryffindor') {
                    f.invulnerableUntil=now+1650; createElementalBurst(f,'fire',true); shell?.classList.add('invulnerable');
                    scheduleBattleTask(()=>shell?.classList.remove('invulnerable'),1700);
                } else if (f.id==='slytherin') {
                    const victim=target||chooseBattleTarget(f);
                    if (victim) { createFog(victim,'rgba(34,197,94,.78)'); createElementalBurst(victim,'nature',true); applyPoison(f,victim,Math.max(4,Math.round(victim.maxHP*.03)),4300,true); }
                } else if (f.id==='hufflepuff') {
                    healFighter(f,Math.max(28,Math.round(f.maxHP*.11))); createElementalBurst(f,'air',true); f.invulnerableUntil=now+430; shell?.classList.add('invulnerable');
                    scheduleBattleTask(()=>shell?.classList.remove('invulnerable'),480);
                } else if (f.id==='ravenclaw') {
                    createElementalBurst(f,'water',true);
                    f.damageBuffUntil=now+3200; f.critBuffUntil=now+3200; f.dodgeUntil=now+3200;
                    animateShell(f,'is-evading',580);
                }
                return true;
            }

            function maybeUseRelic(f) {
                if (!f.hasRelic || f.relicUsed || !f.alive) return false;
                const ratio=f.hp/f.maxHP; const elapsed=battleState.elapsed;
                // During the Final Clash, every unlocked unused relic is guaranteed a chance
                // to appear, so the level-5 reward is not hidden by a lucky high-HP battle.
                if (battleState.finalClash) return activateRelic(f, f.id==='slytherin' ? chooseBattleTarget(f) : null);
                if (f.id==='gryffindor' && ratio<.38) return activateRelic(f);
                if (f.id==='hufflepuff' && ratio<.40) return activateRelic(f);
                if (f.id==='slytherin' && elapsed>8500 && (ratio<.72 || Math.random()<.20)) return activateRelic(f,chooseBattleTarget(f));
                if (f.id==='ravenclaw' && elapsed>7200 && f.energy>=2 && Math.random()<.48) return activateRelic(f);
                return false;
            }

            function chooseAndPerformAction(f,now) {
                if (!f.alive || now<f.busyUntil) return;
                if (maybeUseRelic(f)) { f.busyUntil=now+900; return; }
                const target=chooseBattleTarget(f); if (!target) return;
                const pressure=activeTargetPressure(f.id,now);
                if (f.energy>=3 && now>=f.signatureCooldownUntil && (battleState.finalClash || battleState.elapsed>6200 && Math.random()<.58)) {
                    f.busyUntil=now+1250; performSignature(f,target); return;
                }
                if ((pressure>0 && Math.random()<.48) || (f.hp/f.maxHP<.34 && Math.random()<.30)) {
                    f.busyUntil=now+850; performGuard(f); return;
                }
                if (f.energy<2 && Math.random()<.18) {
                    f.busyUntil=now+1000; performCharge(f); return;
                }
                f.busyUntil=now+880; performBasicAttack(f,target);
            }

            function nextActionDelay(f) {
                let delay=Math.max(900,2050-f.speed*18);
                if (battleState.surge) delay*=.75;
                if (battleState.finalClash) delay*=.58;
                return delay*(.86+Math.random()*.28);
            }

            function determineArenaWinner() {
                return [...battleState.fighters].sort(compareArenaFighters)[0];
            }

            function finishFinalBattle() {
                if (!battleState?.running) return;
                battleState.running=false;clearBattleTasks();currentEvent=null;LeagueScenes.phase('arena','results');
                stopBattleMusic(0.22);
                const arenaWinner=determineArenaWinner();
                const leagueMax=Math.max(...battleState.fighters.map(f=>f.points));
                const leagueWinners=battleState.fighters.filter(f=>f.points===leagueMax);
                const soleLeagueWinner=leagueWinners.length===1?leagueWinners[0]:null;
                const grand=soleLeagueWinner?.id===arenaWinner.id;
                document.getElementById('battle-phase').textContent='Battle complete';
                document.getElementById('battle-clock').textContent='0.0';
                battleAnnounce(`${arenaWinner.name} wins the Final Arena!`,arenaWinner.color);
                playSound('win'); addHistoryLog(`⚔️ ${arenaWinner.name} won the Final Arena`,arenaWinner.color);

                arenaClock.after(()=>{
                    LeagueScenes.leave('arena');
                    const overlay=document.getElementById('battle-overlay'); overlay.classList.remove('visible','arena-surge','final-clash','team-gryffindor','team-slytherin','team-hufflepuff','team-ravenclaw');
                    overlay.setAttribute('aria-hidden','true'); document.body.classList.remove('battle-active');
                    const winnerOverlay=document.getElementById('winner-overlay');
                    winnerOverlay.classList.remove('champion-gryffindor','champion-slytherin','champion-hufflepuff','champion-ravenclaw');
                    winnerOverlay.classList.add(`champion-${arenaWinner.id}`);
                    winnerOverlay.style.setProperty('--champion-color',arenaWinner.color);
                    const leagueColor=leagueWinners.length===1?leagueWinners[0].color:'#e2e8f0';
                    winnerOverlay.style.setProperty('--league-color',leagueColor);
                    const championDuo=document.getElementById('champion-duo');
                    championDuo.classList.toggle('is-grand',grand);
                    document.getElementById('winner-text').textContent=grand?'Grand Champion':'Today’s Champions';
                    document.getElementById('arena-champion-role').textContent=grand?'League & Arena Champion':'Arena Champion';
                    document.getElementById('champion-team-name').textContent=arenaWinner.name;

// SYNC BATTLE OUTCOME TO CONTROLLER
broadcastMatchSummaryToController("BATTLE_OUTCOME", {
    winner: arenaWinner.name,
    remainingHP: arenaWinner.hp,
    damageDealt: arenaWinner.damageDealt
});

const leagueText = leagueWinners.length === 1 ? leagueWinners[0].name : leagueWinners.map(f => f.name).join(' · ');
                    document.getElementById('champion-subtitle').textContent=grand?`${arenaWinner.name} won the League and Final Arena.`:`Arena Champion: ${arenaWinner.name}. League Champion: ${leagueText}.`;
                    document.getElementById('winner-svg-container').innerHTML=getAvatarSVG(arenaWinner.id,arenaWinner.traits);
                    const leagueHost=document.getElementById('league-winner-avatars');
                    leagueHost.classList.toggle('is-tie',leagueWinners.length>1);
                    leagueHost.innerHTML=leagueWinners.map(fighter=>`<span class="league-winner-avatar" style="--league-team-color:${fighter.color}">${getAvatarSVG(fighter.id,fighter.traits)}</span>`).join('');
                    document.getElementById('league-winner-name').textContent=leagueText;
                    renderChampionContributors(arenaWinner,leagueWinners);
                    document.getElementById('winner-card').scrollTop=0;
                    document.getElementById('battle-result-details').innerHTML='';
                    LeagueScenes.enter('results','complete');
                    document.body.classList.add('winner-active');
                    winnerOverlay.classList.add('visible'); winnerOverlay.setAttribute('aria-hidden','false');
                },1500);
            }

            function updateFinalBattle(now) {
                if (!battleState?.running) return;
                battleState.elapsed=now-battleState.startedAt;
                const remaining=Math.max(0,30000-battleState.elapsed);
                document.getElementById('battle-clock').textContent=(remaining/1000).toFixed(1);

                if (!battleState.surge && battleState.elapsed>=22000) {
                    battleState.surge=true; document.getElementById('battle-overlay').classList.add('arena-surge');
                    document.getElementById('battle-phase').textContent='Arena Surge · damage increased';
                    battleAnnounce('Arena Surge — combat accelerates', '#fda4af'); playSound('battleStart');
                }
                if (!battleState.finalClash && battleState.elapsed>=27000) {
                    battleState.finalClash=true; document.getElementById('battle-overlay').classList.add('final-clash');
                    document.getElementById('battle-phase').textContent='Final Clash'; battleAnnounce('Final Clash!', '#fde047'); playSound('signature');
                    shuffledBattleOrder(battleState.fighters.filter(f=>f.alive)).forEach(f=>{
                        f.energy=3;
                        f.nextActionAt=Math.min(f.nextActionAt,now+120+Math.random()*240);
                        updateBattleHUD(f);
                    });
                }

                shuffledBattleOrder(battleState.fighters).forEach(f=>{
                    if (!f.alive) return;
                    if (now>=f.nextActionAt) {
                        chooseAndPerformAction(f,now);
                        f.nextActionAt=now+nextActionDelay(f);
                    }
                });

                if (remaining<=0 || (battleState.earlyWinnerAt && now>=battleState.earlyWinnerAt)) return finishFinalBattle();
                scheduleBattleLoop();
            }

            function startFinalBattle() {
                if (vixarRaidState?.running) return;
                if(LeagueScenes.active&&LeagueScenes.active!=='arena')return;
                if (unityEventRunning || unityEventQueued) {
                    addHistoryLog('Complete or skip the pending Unity Event before entering the Final Arena.', '#60a5fa');
                    return;
                }
                const highestPoints=Math.max(...teamsData.map(t=>t.points));
                if (battleState?.running) return;
                clearBattleTasks();
                AnimatedMode.cancelAll();
                document.querySelectorAll('.modal-overlay.visible').forEach(modal=>modal.classList.remove('visible'));
                document.getElementById('golden-snitch').style.display='none';
                document.getElementById('event-banner').classList.remove('visible');
                document.body.classList.remove('focus-mode'); document.body.classList.add('battle-active');
                currentEvent='FinalBattle';LeagueScenes.enter('arena','combat');
                const fighters=teamsData.map(team=>buildBattleFighter(team,highestPoints));
                const randomizedSpawnSlots=shuffledBattleOrder([0,1,2,3]);
                fighters.forEach((fighter,index)=>{ fighter.arenaSlot=randomizedSpawnSlots[index]; });
                const leagueMax=Math.max(...fighters.map(f=>f.points));
                const leaders=fighters.filter(f=>f.points===leagueMax);
                const now=SceneRuntime.now();
                fighters.forEach(f=>f.nextActionAt=now+1850+Math.random()*540);
                battleState={
                    running:true,startedAt:now,elapsed:0,fighters,startingMeanHP:fighters.reduce((sum,f)=>sum+f.maxHP,0)/fighters.length,targetLocks:[],surge:false,finalClash:false,earlyWinnerAt:null,
                    lightGeometry:null,lightCenterBusyUntil:0,lightEngagementCounter:0
                };
                renderBattleFighters();
                const leaderEl=document.getElementById('battle-league-leader');
                leaderEl.textContent=leaders.length===1?`${leaders[0].name} · ${Math.round(leaders[0].points).toLocaleString()}`:`League draw · ${leaders.map(f=>f.name).join(' / ')}`;
                leaderEl.style.color=leaders.length===1?leaders[0].color:'#f8fafc';
                const leaderCrown=document.getElementById('battle-leader-crown');
                leaderCrown.classList.toggle('visible',leaders.length===1);
                leaderCrown.style.setProperty('--leader-crown-color',leaders.length===1?leaders[0].color:'#facc15');
                document.getElementById('battle-phase').textContent='Combat initializing';
                document.getElementById('battle-clock').textContent='30.0';
                document.getElementById('battle-result-details').innerHTML='';
                const overlay=document.getElementById('battle-overlay');
                overlay.classList.remove('arena-surge','final-clash'); overlay.classList.add('visible'); overlay.setAttribute('aria-hidden','false');
                requestAnimationFrame(() => cacheLightBattleGeometry());
                addHistoryLog('⚔️ The Final Arena battle began','#f43f5e');
                playSound('battleStart');
                startPredatorRunBattleTrack(0);
                scheduleBattleTask(() => {
                    if (battleState?.running && !battleState.surge && !(isLeanMode() && battleState.lightCenterBusyUntil > SceneRuntime.now())) {
                        document.getElementById('battle-phase').textContent = 'Open combat · all teams engaged';
                    }
                }, 2050);
                scheduleBattleLoop();
            }

