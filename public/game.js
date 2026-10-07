        document.addEventListener('DOMContentLoaded', () => {
            // --- DATA & STATE ---
            const BASE_POINT_SLIDER_VALUES = Object.freeze([10, 100, 1000, 10000]);
            const CLASS_STARTING_POINT_TIERS = Object.freeze({
                '5-A':0, '5-C':0, '6-C':1, '7-A':2, '8-B':3
            });
            const SUBJECT_WHEEL_LEVELS = Object.freeze([5, 10]);
            const WHEEL_RESULT_HOLD_MS = 20000;
            const CLASS_MISSION_TARGET = 15;
            let pointSliderValues = [...BASE_POINT_SLIDER_VALUES];
            let selectedPointTierIndex = 0;
            let currentPointValue = pointSliderValues[selectedPointTierIndex];
            let progressionMode = 'soft'; // Every fresh session launches in one-award evolution mode; Hard remains optional.
            let sessionEpoch = 0;
            let sessionId = LeagueRecovery.uid();
            let commandLedger = Object.create(null);
            let recoveryReady = false, recoveryRestoring = false, checkpointQueued = false;
            let recoveryCandidate = LeagueRecovery.read();
            const wheelClock=SceneRuntime.create('wheel');
            const chestClock=SceneRuntime.create('chest');
            const eventClock=SceneRuntime.create('events');
            let wheelVisualAnimation=null;
            let boardSummaries = {};
            let latestRemoteSessionId = null;
            let selectedClass = null;
            let studentContributions = {};
            let secretAgents = LeagueAgent.fresh(), remoteAgents = LeagueAgent.fresh(), shownAgentRequest = null;
            // v10.2.0 Comeback Halo: teams with ×2 points this session, fixed from the first award on.
            let haloTeams = [], haloLocked = false, remoteHaloTeams = [];
            let remoteStudentClass = null, remoteStudentContributions = {}, remoteStudentTracking = false;
            let remotePointValue = 10, pendingRemoteClassSelection = null;
            let evolutionResolutionTimer = null;
            let isSwitchingMode = false;
            let firstTeamToSwitch = null;
            let historyLog = [];
            let historyStack = [];
            let lastTeamClicked = null;
            let comboCount = 0;
            let currentEvent = null;
            let evolutionQueue = []; // Retained for backward-safe snapshots; unopened chests now wait on cards.
            let isEvolving = false;
            let activeEvolutionTeamId = null;
            let evolutionChestTimers = [];
            const avatarReactionControllers = new Map();
            let idleTimer = null;
            let isFocusMode = false;
            const PERFORMANCE_MODE_STORAGE_KEY = 'englishLeaguePerformanceMode';
            const hardwarePrefersLight = Boolean(
                (Number(navigator.deviceMemory) > 0 && Number(navigator.deviceMemory) <= 4)
                || (Number(navigator.hardwareConcurrency) > 0 && Number(navigator.hardwareConcurrency) <= 4)
                || window.matchMedia('(prefers-reduced-motion: reduce)').matches
            );
            // v9.6.0: Performance mode is retired. Animated and Light remain; an older saved or
            // remote 'ultra' (Performance) choice opens in Animated.
            const VISUAL_MODES = ['animated', 'light'];
            const visualModeNames = { animated:'Animated', light:'Light' };
            const visualModeSymbols = { animated:'🎬', light:'⚡' };
            const normalizeVisualMode = mode => mode === 'ultra' ? 'animated' : mode;
            let performanceMode = hardwarePrefersLight ? 'light' : 'animated';
            let deferredPerformanceMode = null;
            let pendingAnimatedWheels = [];
            const deferredAnimatedEvolutions = new Set();
            let activeAnimatedWheel = null;
            // v10.4.0 Challenge Deck: each team's state when it reached each level (the wheel's "go back" point),
            // the student who gave each team its last point, and the cards played this session (saved to Sheets).
            let levelStarts = new Map(), lastAwardStudent = new Map(), challengeLog = [];
            let pendingAnimatedFinish = false;
            let presentationScheduled = false;
            let wheelSpinTimer = null;
            let animatedWheelStartTimer = null;
            let wheelAdvanceTimer = null;
            let wheelSpinEpoch = 0;
            let activeWheelSpin = null;
            function isLeanMode() { return performanceMode !== 'ultra'; }
            try {
                const savedPerformanceMode = normalizeVisualMode(localStorage.getItem(PERFORMANCE_MODE_STORAGE_KEY));
                if (VISUAL_MODES.includes(savedPerformanceMode)) performanceMode = savedPerformanceMode;
            } catch (error) {
                // Storage can be unavailable in strict/private browser modes. The selector still works for this session.
            }
            let lastVortexTime = 0; // Tracks the cooldown of the Vortex

            const classMission = {
                target: CLASS_MISSION_TARGET,
                progress: 0,
                completed: false,
                eventPlayed: false,
                rewardGranted: false
            };
            let unityEventRunning = false;
            let unityEventQueued = false;
            let unityEventQueuedReplay = false;
            let unityEventQueueTimer = null;
            const unityClock=SceneRuntime.create('unity');
            const unityEventTimers=unityClock.tasks;
            let unityAscensionState = null;
            
            // Narrative Relics
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
            // v11.0.0 Vixar Saga: Level 11 (Mythic) wears violet crystal from Violet Vixar's shattered crown; Level 12
            // (Celestial) adds scarlet embers from Scarlet Vixar. Each belongs to its own stage, so the first ten levels
            // keep their evolutionary tree exactly.
            const SAGA_TRAITS = {
                gryffindor: [{ id:'crystal_violet', name:'Violet Crystal Mane', icon:'🔮', stage:11 }, { id:'ember_scarlet', name:'Scarlet Ember Heart', icon:'🔥', stage:12 }],
                slytherin: [{ id:'crystal_violet', name:'Violet Crystal Scales', icon:'🔮', stage:11 }, { id:'ember_scarlet', name:'Scarlet Ember Coils', icon:'🔥', stage:12 }],
                hufflepuff: [{ id:'crystal_violet', name:'Violet Crystal Plates', icon:'🔮', stage:11 }, { id:'ember_scarlet', name:'Scarlet Ember Hide', icon:'🔥', stage:12 }],
                ravenclaw: [{ id:'crystal_violet', name:'Violet Crystal Plumes', icon:'🔮', stage:11 }, { id:'ember_scarlet', name:'Scarlet Ember Wings', icon:'🔥', stage:12 }]
            };
            for (const id of Object.keys(teamTraits)) teamTraits[id].push(...SAGA_TRAITS[id]);
            // The traits a chest can hold for a stage: Levels 1–10 draw from the ten original traits, 11 and 12 from their own.
            function traitsForStage(teamId, stage, owned = []) {
                return teamTraits[teamId].filter(trait => (stage > 10 ? trait.stage === stage : !trait.stage) && !owned.includes(trait.id));
            }
            // The class's level cap comes from its Vixar Saga stage: 10 at Violet, 11 at Scarlet, 12 at Gilded and Freed.
            // A stage won today raises the cap from the next session, so today keeps the stage the class had before the win.
            let sagaSessionWin = null; // {className, sessionId, from, to}
            function sagaStage(className = selectedClass) {
                if (!globalThis.LeagueSaga?.validClass(className)) return 'Violet';
                if (sagaSessionWin?.className === className && sagaSessionWin.sessionId === sessionId) return sagaSessionWin.from;
                return LeagueSaga.stageOf(className);
            }
            function levelCap() { return globalThis.LeagueSaga ? LeagueSaga.cap(sagaStage()) : 10; }



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
            // v11.0.0: the saga trophies add armour (violet crystal) and power (scarlet embers) to every team alike.
            for (const map of Object.values(battleTraitCategories)) Object.assign(map, { crystal_violet:'armor', ember_scarlet:'power' });

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
            // v11.0.0: Levels 11 and 12 keep the Level 10 calibration; their extra HP and damage come from level and traits.
            for (const table of [arenaDamageBalance, arenaDamageBalanceLowHP]) for (const row of Object.values(table)) row.push(row[10], row[10]);
            function arenaOutputMultiplier(fighter){
                const level=Math.max(0,Math.min(12,Math.round(fighter.level)||0));
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

            // --- CANVAS PARTICLE ENGINE ---
            const canvas = document.getElementById('particle-canvas');
            const ctx = canvas.getContext('2d');
            let particles = [];
            let particleAnimationFrame = 0;
            
            function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
            window.addEventListener('resize', resizeCanvas); resizeCanvas();

            function spawnParticles(x, y, color, count, isMajor = false) {
                if(SceneRuntime.fastForwarding||SceneRuntime.paused||LeaguePerformance.level===2)return;
                count=LeaguePerformance.limit(count);
                // Strict Light mode never starts the canvas loop, including level-ups.
                if (isLeanMode()) return;
                const effectiveCount = count;
                const baseSpeed = isMajor ? 15 : 6;
                const baseLife = isMajor ? 100 : 50;
                for(let i=0; i<effectiveCount; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * baseSpeed + 2;
                    particles.push({
                        x: x, y: y,
                        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - (isMajor ? 2 : 0),
                        life: Math.random() * (baseLife/2) + (baseLife/2), maxLife: baseLife,
                        color: color, size: Math.random() * (isMajor ? 8 : 4) + 2,
                        gravity: isMajor ? 0.2 : 0.05
                    });
                }
                if (!particleAnimationFrame && particles.length) particleAnimationFrame = requestAnimationFrame(animateParticles);
            }

            function animateParticles() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                for(let i = particles.length - 1; i >= 0; i--) {
                    let p = particles[i];
                    p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.life--;
                    
                    if(p.life <= 0) { particles.splice(i, 1); continue; }
                    
                    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
                    ctx.fillStyle = p.color;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
                }
                ctx.globalAlpha = 1;
                if (particles.length) {
                    particleAnimationFrame = requestAnimationFrame(animateParticles);
                } else {
                    particleAnimationFrame = 0;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }

            function stopParticles() {
                particles = [];
                if (particleAnimationFrame) cancelAnimationFrame(particleAnimationFrame);
                particleAnimationFrame = 0;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            // --- LEADER ENVIRONMENT GENERATOR ---
            function initializeElementalScenery() {
                if(LeaguePerformance.level===2)return;
                const gryffindor = document.getElementById('gryffindor-bg-effect');
                const slytherin = document.getElementById('slytherin-bg-effect');
                const hufflepuff = document.getElementById('hufflepuff-bg-effect');
                const ravenclaw = document.getElementById('ravenclaw-bg-effect');

                // Prevent duplicate scenery if initialization is called more than once.
                [gryffindor, slytherin, hufflepuff, ravenclaw].forEach(layer => {
                    layer.querySelectorAll('.ember,.leaf,.cloud,.wind-streak,.rain-drop,.water-ripple,.water-bubble').forEach(node => node.remove());
                });

                // Gryffindor — Fire
                for (let i = 0; i < 40; i++) {
                    const ember = document.createElement('span');
                    ember.className = 'ember';
                    ember.style.left = `${Math.random() * 100}%`;
                    ember.style.animationDuration = `${5.5 + Math.random() * 8}s`;
                    ember.style.animationDelay = `${-Math.random() * 12}s`;
                    ember.style.opacity = `${0.25 + Math.random() * 0.7}`;
                    ember.style.transform = `scale(${0.5 + Math.random() * 1.7})`;
                    gryffindor.appendChild(ember);
                }

                // Slytherin — Nature and Leaves
                for (let i = 0; i < 30; i++) {
                    const leaf = document.createElement('span');
                    leaf.className = 'leaf';
                    leaf.style.left = `${Math.random() * 100}%`;
                    leaf.style.animationDuration = `${9 + Math.random() * 13}s`;
                    leaf.style.animationDelay = `${-Math.random() * 20}s`;
                    leaf.style.opacity = `${0.22 + Math.random() * 0.58}`;
                    const size = 10 + Math.random() * 17;
                    leaf.style.width = `${size}px`;
                    leaf.style.height = `${size}px`;
                    slytherin.appendChild(leaf);
                }

                // Hufflepuff — Air, clouds and wind streaks
                for (let i = 0; i < 9; i++) {
                    const cloud = document.createElement('span');
                    cloud.className = 'cloud';
                    cloud.innerHTML = `<svg viewBox="0 0 180 70" aria-hidden="true"><path d="M25 55 C8 55 5 31 23 26 C29 5 61 4 71 22 C87 4 119 12 122 34 C151 26 170 58 145 65 L29 65 C17 65 12 58 25 55 Z"/></svg>`;
                    cloud.style.top = `${4 + Math.random() * 67}%`;
                    cloud.style.left = `${-30 - Math.random() * 45}%`;
                    cloud.style.width = `${145 + Math.random() * 240}px`;
                    cloud.style.animationName = 'drift-1';
                    cloud.style.animationDuration = `${22 + Math.random() * 30}s`;
                    cloud.style.animationDelay = `${-Math.random() * 42}s`;
                    hufflepuff.appendChild(cloud);
                }
                for (let i = 0; i < 13; i++) {
                    const streak = document.createElement('span');
                    streak.className = 'wind-streak';
                    streak.style.top = `${8 + Math.random() * 82}%`;
                    streak.style.animationDuration = `${5 + Math.random() * 8}s`;
                    streak.style.animationDelay = `${-Math.random() * 10}s`;
                    streak.style.opacity = `${0.12 + Math.random() * 0.30}`;
                    hufflepuff.appendChild(streak);
                }

                // Ravenclaw — Water, rain, ripples and bubbles
                for (let i = 0; i < 46; i++) {
                    const drop = document.createElement('span');
                    drop.className = 'rain-drop';
                    drop.style.left = `${Math.random() * 100}%`;
                    drop.style.animationDuration = `${0.62 + Math.random() * 0.82}s`;
                    drop.style.animationDelay = `${-Math.random() * 2}s`;
                    drop.style.opacity = `${0.15 + Math.random() * 0.52}`;
                    ravenclaw.appendChild(drop);
                }
                for (let i = 0; i < 4; i++) {
                    const ripple = document.createElement('span');
                    ripple.className = 'water-ripple';
                    ripple.style.left = `${28 + Math.random() * 44}%`;
                    ripple.style.animationDelay = `${-i * 1.75}s`;
                    ripple.style.animationDuration = `${6 + Math.random() * 2.5}s`;
                    ravenclaw.appendChild(ripple);
                }
                for (let i = 0; i < 18; i++) {
                    const bubble = document.createElement('span');
                    bubble.className = 'water-bubble';
                    const size = 7 + Math.random() * 19;
                    bubble.style.width = `${size}px`;
                    bubble.style.height = `${size}px`;
                    bubble.style.left = `${Math.random() * 100}%`;
                    bubble.style.animationDuration = `${8 + Math.random() * 9}s`;
                    bubble.style.animationDelay = `${-Math.random() * 14}s`;
                    bubble.style.opacity = `${0.12 + Math.random() * 0.38}`;
                    ravenclaw.appendChild(bubble);
                }
            }

            function removeElementalScenery() {
                document.querySelectorAll('.ember,.leaf,.cloud,.wind-streak,.rain-drop,.water-ripple,.water-bubble').forEach(node => node.remove());
            }

            // --- SVG GENERATOR (Edgy Aesthetic) ---
            function getAvatarSVG(teamId, traits, displayLevel = null) {
                if (performanceMode === 'animated' && window.AnimatedMode) {
                    const team = teamsData.find(item => item.id === teamId);
                    return AnimatedMode.markup(teamId, displayLevel ?? team?.level ?? traits.length);
                }
                let c = ''; const hasTrait = (t) => traits.includes(t);
                const defs = `
                    <defs>
                        <linearGradient id="fireGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fde047"/><stop offset="50%" stop-color="#ea580c"/><stop offset="100%" stop-color="#7f1d1d"/></linearGradient>
                        <linearGradient id="iceGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e0f2fe"/><stop offset="100%" stop-color="#0284c7"/></linearGradient>
                        <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fef08a"/><stop offset="50%" stop-color="#eab308"/><stop offset="100%" stop-color="#854d0e"/></linearGradient>
                        <linearGradient id="poisonGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#86efac"/><stop offset="100%" stop-color="#065f46"/></linearGradient>
                        <linearGradient id="voidGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#d8b4fe"/><stop offset="100%" stop-color="#4c1d95"/></linearGradient>
                        <linearGradient id="silverGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fafc"/><stop offset="50%" stop-color="#94a3b8"/><stop offset="100%" stop-color="#334155"/></linearGradient>
                        <linearGradient id="stoneGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#d6d3d1"/><stop offset="50%" stop-color="#78716c"/><stop offset="100%" stop-color="#292524"/></linearGradient>
                        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
                        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#000000" flood-opacity="0.6"/></filter>
                        <linearGradient id="violetCrystalGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f5d0fe"/><stop offset="55%" stop-color="#a855f7"/><stop offset="100%" stop-color="#4c1d95"/></linearGradient>
                        <radialGradient id="scarletEmberGlow" cx="50%" cy="55%" r="50%"><stop offset="0%" stop-color="#fb7185" stop-opacity=".75"/><stop offset="60%" stop-color="#e11d48" stop-opacity=".32"/><stop offset="100%" stop-color="#7f1d1d" stop-opacity="0"/></radialGradient>
                    </defs>
                `;

                if (teamId === 'gryffindor') {
                    if (hasTrait('aura_light')) c += `<polygon points="100,0 120,80 200,100 120,120 100,200 80,120 0,100 80,80" fill="#fde047" opacity="0.3" filter="url(#neonGlow)"/><polygon points="100,20 110,90 180,100 110,110 100,180 90,110 20,100 90,90" fill="#fef08a" opacity="0.5"/>`;
                    if (hasTrait('wings_eagle')) c += `<path d="M 80 120 L 20 50 L 10 90 L 40 130 Z" fill="url(#silverGrad)" stroke="#64748b" stroke-width="2"/><path d="M 120 120 L 180 50 L 190 90 L 160 130 Z" fill="url(#silverGrad)" stroke="#64748b" stroke-width="2"/><path d="M 70 130 L 10 70 L 0 100 L 30 140 Z" fill="#334155"/><path d="M 130 130 L 190 70 L 200 100 L 170 140 Z" fill="#334155"/>`;
                    if (hasTrait('tail_manticore')) c += `<path d="M 110 140 L 180 150 L 160 70 L 180 50 Z" fill="none" stroke="#78350f" stroke-width="12" stroke-linejoin="round"/><polygon points="180,50 195,20 170,45" fill="url(#fireGrad)"/>`;
                    if (hasTrait('mane_fire')) c += `<path d="M 100 20 L 140 0 L 130 40 L 180 30 L 160 70 L 200 90 L 160 120 L 180 170 L 130 150 L 100 200 L 70 150 L 20 170 L 40 120 L 0 90 L 40 70 L 20 30 L 70 40 L 60 0 Z" fill="url(#fireGrad)" filter="url(#shadow)"/>`;
                    else if (hasTrait('mane_ice')) c += `<polygon points="100,10 120,40 150,20 140,60 180,50 150,90 190,110 140,120 160,170 120,140 100,190 80,140 40,170 60,120 10,110 50,90 20,50 60,60 50,20 80,40" fill="url(#iceGrad)" filter="url(#shadow)"/>`;
                    else c += `<polygon points="100,30 130,50 150,90 130,140 100,170 70,140 50,90 70,50" fill="#7f1d1d" filter="url(#shadow)"/>`;
                    if (hasTrait('horns_ram')) c += `<path d="M 80 70 C 40 20 10 90 40 110 C 20 80 50 60 70 75" fill="url(#stoneGrad)"/><path d="M 120 70 C 160 20 190 90 160 110 C 180 80 150 60 130 75" fill="url(#stoneGrad)"/>`;
                    c += `<polygon points="100,150 60,100 50,60 100,40 150,60 140,100" fill="#450a0a" stroke="#dc2626" stroke-width="3" filter="url(#shadow)"/><polygon points="100,150 80,100 100,80 120,100" fill="#7f1d1d"/>`; 
                    if (hasTrait('armor_gold')) c += `<polygon points="100,100 65,70 100,50 135,70" fill="url(#goldGrad)"/><polygon points="100,100 80,120 100,140 120,120" fill="url(#goldGrad)"/>`;
                    if (hasTrait('crown_celestial')) c += `<polygon points="100,5 105,25 125,25 110,35 115,55 100,40 85,55 90,35 75,25 95,25" fill="#fef08a" filter="url(#neonGlow)"/>`;
                    let eColor = hasTrait('eyes_glowing') ? '#22d3ee' : '#fef08a'; let eFilter = hasTrait('eyes_glowing') ? 'filter="url(#neonGlow)"' : '';
                    c += `<polygon points="70,85 95,100 80,95" fill="${eColor}" ${eFilter}/><polygon points="130,85 105,100 120,95" fill="${eColor}" ${eFilter}/><polygon points="100,150 90,135 110,135" fill="#1c1917"/>`; 
                    if (hasTrait('fangs_saber')) c += `<polygon points="85,135 90,175 95,135" fill="#f8fafc" filter="url(#shadow)"/><polygon points="115,135 110,175 105,135" fill="#f8fafc" filter="url(#shadow)"/>`;
                
                } else if (teamId === 'slytherin') {
                    if (hasTrait('aura_poison')) c += `<circle cx="100" cy="100" r="70" fill="#22c55e" opacity="0.3" filter="blur(15px)"/><polygon points="100,20 140,60 160,120 100,180 40,120 60,60" fill="url(#poisonGrad)" opacity="0.5" filter="url(#neonGlow)"/>`;
                    if (hasTrait('hood_cobra')) c += `<path d="M 100 20 Q 180 20 170 100 Q 160 150 100 150 Q 40 150 30 100 Q 20 20 100 20 Z" fill="#022c22" stroke="#047857" stroke-width="4" filter="url(#shadow)"/>`;
                    if (hasTrait('heads_hydra')) c += `<path d="M 100 130 Q 50 130 40 80 Q 20 120 60 160" fill="none" stroke="#059669" stroke-width="12" stroke-linecap="square"/><polygon points="40,80 20,50 60,60" fill="#047857"/><path d="M 100 130 Q 150 130 160 80 Q 180 120 140 160" fill="none" stroke="#059669" stroke-width="12" stroke-linecap="square"/><polygon points="160,80 180,50 140,60" fill="#047857"/>`;
                    if (hasTrait('wings_feathered')) c += `<polygon points="80,120 20,80 10,20 50,60" fill="#064e3b"/><polygon points="120,120 180,80 190,20 150,60" fill="#064e3b"/><polygon points="80,100 10,50 0,0 40,40" fill="#10b981"/><polygon points="120,100 190,50 200,0 160,40" fill="#10b981"/>`;
                    if (hasTrait('tail_rattle')) c += `<polygon points="140,160 160,140 180,170 150,190" fill="url(#goldGrad)"/><polygon points="160,150 180,130 190,150 170,170" fill="url(#stoneGrad)"/>`;
                    c += `<polygon points="100,170 70,120 60,70 100,50 140,70 130,120" fill="#022c22" stroke="#10b981" stroke-width="3" filter="url(#shadow)"/><polygon points="100,50 85,90 100,170 115,90" fill="#064e3b"/>`; 
                    if (hasTrait('scales_crystal')) c += `<polygon points="100,60 90,80 100,100 110,80" fill="url(#iceGrad)" opacity="0.8"/><polygon points="100,110 90,130 100,150 110,130" fill="url(#iceGrad)" opacity="0.8"/>`;
                    if (hasTrait('horns_dragon')) c += `<polygon points="85,65 60,10 95,50" fill="url(#stoneGrad)"/><polygon points="115,65 140,10 105,50" fill="url(#stoneGrad)"/>`;
                    if (hasTrait('armor_bone')) c += `<polygon points="100,110 75,70 100,50 125,70" fill="url(#silverGrad)"/><polygon points="85,80 80,110 95,100" fill="url(#silverGrad)"/><polygon points="115,80 120,110 105,100" fill="url(#silverGrad)"/>`;
                    let eColor = hasTrait('eyes_void') ? '#a855f7' : '#fef08a'; let eFilter = hasTrait('eyes_void') ? 'filter="url(#neonGlow)"' : '';
                    c += `<polygon points="70,80 90,95 80,92" fill="${eColor}" ${eFilter}/><polygon points="130,80 110,95 120,92" fill="${eColor}" ${eFilter}/><path d="M 95 160 L 100 170 L 105 160" fill="#ef4444"/>`;
                    if (hasTrait('fangs_venom')) c += `<polygon points="85,150 90,185 95,155" fill="#f8fafc" filter="url(#shadow)"/><polygon points="115,150 110,185 105,155" fill="#f8fafc" filter="url(#shadow)"/><circle cx="90" cy="190" r="4" fill="#4ade80"/><circle cx="110" cy="190" r="4" fill="#4ade80"/>`;
                
                } else if (teamId === 'hufflepuff') {
                    if (hasTrait('aura_earth')) c += `<polygon points="30,170 50,130 60,180" fill="#78350f" filter="url(#shadow)"/><polygon points="170,150 190,120 180,180" fill="#78350f" filter="url(#shadow)"/><polygon points="20,100 40,70 30,120" fill="url(#goldGrad)" filter="url(#shadow)"/><polygon points="180,90 200,60 190,110" fill="url(#goldGrad)" filter="url(#shadow)"/>`;
                    if (hasTrait('wings_gargoyle')) c += `<polygon points="70,120 20,70 10,10 60,60" fill="#44403c"/><polygon points="130,120 180,70 190,10 140,60" fill="#44403c"/><polygon points="60,110 0,60 20,20 40,70" fill="#292524"/><polygon points="140,110 200,60 180,20 160,70" fill="#292524"/>`;
                    if (hasTrait('fur_moss')) c += `<polygon points="30,130 100,80 170,130 150,180 100,160 50,180" fill="#14532d" filter="url(#shadow)"/><polygon points="40,140 100,90 160,140 140,170 100,150 60,170" fill="#166534"/>`; else c += `<polygon points="40,130 100,90 160,130 140,170 100,160 60,170" fill="#271404" filter="url(#shadow)"/>`;
                    if (hasTrait('spikes_rock')) c += `<polygon points="60,90 40,40 70,70" fill="url(#stoneGrad)"/><polygon points="140,90 160,40 130,70" fill="url(#stoneGrad)"/><polygon points="80,80 90,30 100,70" fill="url(#stoneGrad)"/><polygon points="120,80 110,30 100,70" fill="url(#stoneGrad)"/>`;
                    if (hasTrait('crown_antlers')) c += `<path d="M 80,60 L 40,20 L 50,40 L 30,10" fill="none" stroke="#78350f" stroke-width="6" stroke-linecap="square"/><path d="M 120,60 L 160,20 L 150,40 L 170,10" fill="none" stroke="#78350f" stroke-width="6" stroke-linecap="square"/>`;
                    c += `<polygon points="100,160 50,140 40,80 100,60 160,80 150,140" fill="#422006" stroke="#b45309" stroke-width="3" filter="url(#shadow)"/><polygon points="100,160 70,140 100,90 130,140" fill="#78350f"/>`; 
                    if (hasTrait('armor_stone')) c += `<polygon points="100,170 60,130 100,110 140,130" fill="url(#stoneGrad)" filter="url(#shadow)"/><polygon points="100,60 70,80 100,100 130,80" fill="url(#stoneGrad)" filter="url(#shadow)"/>`;
                    if (hasTrait('runes_glowing')) c += `<polygon points="90,75 100,85 110,75 100,95" fill="none" stroke="#38bdf8" stroke-width="4" filter="url(#neonGlow)"/>`;
                    let eColor = hasTrait('eyes_berserk') ? '#ef4444' : '#f8fafc'; let eFilter = hasTrait('eyes_berserk') ? 'filter="url(#neonGlow)"' : '';
                    c += `<polygon points="75,100 90,110 80,105" fill="${eColor}" ${eFilter}/><polygon points="125,100 110,110 120,105" fill="${eColor}" ${eFilter}/><polygon points="100,150 90,140 110,140" fill="#1c1917"/>`;
                    if (hasTrait('tusks_mammoth')) c += `<path d="M 85 140 Q 40 180 30 100" fill="none" stroke="url(#silverGrad)" stroke-width="8" stroke-linecap="round" filter="url(#shadow)"/><path d="M 115 140 Q 160 180 170 100" fill="none" stroke="url(#silverGrad)" stroke-width="8" stroke-linecap="round" filter="url(#shadow)"/>`;
                    if (hasTrait('claws_diamond')) c += `<polygon points="20,180 10,150 30,160" fill="url(#iceGrad)"/><polygon points="40,190 30,160 50,170" fill="url(#iceGrad)"/><polygon points="60,180 50,150 70,160" fill="url(#iceGrad)"/><polygon points="180,180 190,150 170,160" fill="url(#iceGrad)"/><polygon points="160,190 170,160 150,170" fill="url(#iceGrad)"/><polygon points="140,180 150,150 130,160" fill="url(#iceGrad)"/>`;

                } else if (teamId === 'ravenclaw') {
                    if (hasTrait('aura_lightning')) c += `<path d="M 10 50 L 40 80 L 20 110 L 60 140 M 190 50 L 160 80 L 180 110 L 140 140" fill="none" stroke="#fde047" stroke-width="4" filter="url(#neonGlow)"/><polygon points="100,0 200,100 100,200 0,100" fill="#fde047" opacity="0.1"/>`;
                    if (hasTrait('wings_extra')) c += `<polygon points="70,110 10,40 30,120" fill="url(#silverGrad)"/><polygon points="130,110 190,40 170,120" fill="url(#silverGrad)"/><polygon points="60,130 0,80 20,140" fill="#64748b"/><polygon points="140,130 200,80 180,140" fill="#64748b"/>`;
                    if (hasTrait('feathers_storm')) c += `<polygon points="90,100 30,30 20,110 60,130" fill="#0f172a"/><polygon points="110,100 170,30 180,110 140,130" fill="#0f172a"/>`; else c += `<polygon points="90,100 40,50 30,100 70,120" fill="#334155"/><polygon points="110,100 160,50 170,100 130,120" fill="#334155"/>`;
                    if (hasTrait('tail_peacock')) c += `<polygon points="100,160 60,200 80,180" fill="url(#iceGrad)"/><polygon points="100,160 140,200 120,180" fill="url(#iceGrad)"/><polygon points="100,160 100,200 110,190" fill="url(#iceGrad)"/>`;
                    if (hasTrait('flames_blue')) c += `<path d="M 40 110 Q 10 80 20 130 Q 0 100 40 110 M 160 110 Q 190 80 180 130 Q 200 100 160 110" fill="none" stroke="#38bdf8" stroke-width="6" filter="url(#neonGlow)"/>`;
                    c += `<polygon points="100,180 60,100 70,50 100,30 130,50 140,100" fill="#0f172a" stroke="#38bdf8" stroke-width="3" filter="url(#shadow)"/><polygon points="100,180 80,100 100,50 120,100" fill="#1e293b"/>`; 
                    if (hasTrait('armor_silver')) c += `<polygon points="100,80 75,50 100,30 125,50" fill="url(#silverGrad)" filter="url(#shadow)"/><polygon points="100,80 85,95 100,110 115,95" fill="url(#silverGrad)" filter="url(#shadow)"/>`;
                    if (hasTrait('crown_stars')) c += `<polygon points="100,5 105,15 115,15 107,22 110,32 100,25 90,32 93,22 85,15 95,15" fill="#fde047" filter="url(#neonGlow)"/><circle cx="75" cy="20" r="4" fill="#fde047" filter="url(#neonGlow)"/><circle cx="125" cy="20" r="4" fill="#fde047" filter="url(#neonGlow)"/>`;
                    let bColor = hasTrait('beak_golden') ? 'url(#goldGrad)' : '#64748b';
                    c += `<polygon points="100,180 85,110 115,110" fill="${bColor}" filter="url(#shadow)"/><polygon points="80,90 95,100 85,95" fill="#f8fafc"/><polygon points="120,90 105,100 115,95" fill="#f8fafc"/>`;
                    if (hasTrait('eyes_third')) c += `<polygon points="100,55 95,70 100,65 105,70" fill="#ef4444" filter="url(#neonGlow)"/>`;
                    if (hasTrait('talons_crystal')) c += `<polygon points="80,140 70,180 85,160" fill="url(#iceGrad)"/><polygon points="90,150 85,190 95,170" fill="url(#iceGrad)"/><polygon points="120,140 130,180 115,160" fill="url(#iceGrad)"/><polygon points="110,150 115,190 105,170" fill="url(#iceGrad)"/>`;
                }
                // v11.0.0 saga trophies (Light mode): a scarlet glow under the creature (Level 12) and violet crystal
                // plates on the shoulders and brow (Level 11). Plain shapes, no new filters.
                if (hasTrait('ember_scarlet')) c = `<circle cx="100" cy="108" r="92" fill="url(#scarletEmberGlow)"/>` + c;
                if (hasTrait('crystal_violet')) c += `<polygon points="100,12 108,30 100,40 92,30" fill="url(#violetCrystalGrad)" stroke="#f5d0fe" stroke-width="1.5"/><polygon points="52,92 40,70 58,78 64,96" fill="url(#violetCrystalGrad)" stroke="#f5d0fe" stroke-width="1.5"/><polygon points="148,92 160,70 142,78 136,96" fill="url(#violetCrystalGrad)" stroke="#f5d0fe" stroke-width="1.5"/>`;

                return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">${defs}${c}</svg>`;
            }

            // --- OPTIMIZED UI UPDATES (Targeted DOM Mutation) ---
            function createInitialTeamCards() {
                const grid = document.getElementById('teams-grid');
                grid.innerHTML = ''; document.getElementById('team-select').innerHTML = '';
                teamsData.forEach((team) => {
                    const el = document.createElement('div');
                    el.className = 'team-container p-5 flex flex-col items-center';
                    el.id = `team-${team.id}`;
                    team.cachedSVG = getAvatarSVG(team.id, team.traits);
                    
                    el.innerHTML = `
                        <div class="powerups-container">
                            <button class="powerup-btn" data-team="${team.id}" data-type="doubleUp" title="Double Points">x2</button>
                            <button class="powerup-btn" data-team="${team.id}" data-type="halfDown" title="Half Points">½</button>
                            <button class="powerup-btn" data-team="${team.id}" data-type="shield" title="Shield — blocks one new Half Down or Secret Agent attempt" aria-label="Shield for ${team.name}: one protection">🛡️</button>
                            <button class="powerup-btn" data-team="${team.id}" data-type="secretAgent" title="Secret Agent — choose privately on the remote" aria-label="Secret Agent for ${team.name}">${LeagueAgent.icon}</button>
                        </div>
                        <div id="relic-${team.id}" class="relic-badge">
                            <span id="relic-icon-${team.id}"></span>
                            <div id="relic-tooltip-${team.id}" class="relic-tooltip"></div>
                        </div>
                        <h2 class="team-card-title text-2xl font-black uppercase tracking-widest pt-6 mb-2" style="text-shadow: 0 2px 4px rgba(0,0,0,0.28);">${team.name}</h2>
                        <div id="level-display-${team.id}" class="team-level-display" data-level="0" aria-label="${team.name} Level 0">
                            <div class="team-level-badge"><span>Level</span><strong id="level-${team.id}">0</strong></div>
                        </div>
                        <div class="mascot-area">
                            <div id="mascot-${team.id}" class="animal-mascot" style="--glow-color: ${team.color};">${team.cachedSVG}</div>
                            <div id="constellation-${team.id}" class="teamwork-constellation" role="img" hidden></div>
                            <div id="reaction-fx-${team.id}" class="avatar-reaction-fx"><span id="reaction-label-${team.id}" class="avatar-reaction-label"></span></div>
                            <button id="evolution-chest-${team.id}" class="evolution-chest-btn btn-evolution-chest" data-team-id="${team.id}" type="button" aria-label="Open ${team.name} Mystery Evolution Chest" title="Evolution Ready — open the chest">
                                <span class="chest-card-shell"><span class="chest-card-lid"></span><span class="chest-card-base"></span><span class="chest-card-lock"></span></span>
                                <span class="chest-ready-label">Evolution Ready</span>
                            </button>
                            <div class="evolution-bar-container">
                                <div class="evolution-bar-level"><div id="evo-3-${team.id}" class="evolution-bar-fill" style="background: ${team.color};"></div></div>
                                <div class="evolution-bar-level"><div id="evo-2-${team.id}" class="evolution-bar-fill" style="background: ${team.color};"></div></div>
                                <div class="evolution-bar-level"><div id="evo-1-${team.id}" class="evolution-bar-fill" style="background: ${team.color};"></div></div>
                            </div>
                        </div>
                        <div id="score-panel-${team.id}" class="team-score-panel text-center my-2" title="0 points">
                            <span class="team-score-label text-sm uppercase tracking-widest">Score</span>
                            <div class="team-score-display">
                                <span id="points-${team.id}" class="team-score-value team-score-number text-3xl font-mono font-bold">0</span>
                                <span id="points-crest-${team.id}" class="score-crest" aria-hidden="true"><span></span></span>
                            </div>
                            <div id="score-feedback-${team.id}" class="score-feedback" aria-hidden="true">
                                <div id="score-delta-${team.id}" class="score-delta"></div>
                                <div id="score-modifiers-${team.id}" class="score-modifier-strip"></div>
                            </div>
                        </div>
                        <div class="w-full flex flex-col gap-2 relative">
                            <button class="btn btn-add-points flex-1 py-3 rounded-lg font-bold uppercase tracking-wider relative overflow-hidden" style="background-color: ${team.color};" data-team-id="${team.id}">Add Points</button>
                            <button class="team-reset-control btn-reset-team hover:text-red-400 text-xs font-semibold uppercase tracking-widest transition-colors mt-1" data-team-id="${team.id}">Reset Team</button>
                        </div>`;
                    grid.appendChild(el);
                    
                    const opt = document.createElement('option'); opt.value = team.id; opt.textContent = team.name; 
                    document.getElementById('team-select').appendChild(opt);
                });
                window.LeaguePassportSeals?.render();
            }

            const cardLevelCoverage = [0, 10, 18, 27, 37, 48, 59, 70, 80, 90, 100, 100, 100];

            function parseHexColor(hex) {
                const normalized = String(hex || '#64748b').replace('#', '');
                const value = normalized.length === 3
                    ? normalized.split('').map(char => char + char).join('')
                    : normalized.padEnd(6, '0').slice(0, 6);
                return {
                    r: parseInt(value.slice(0, 2), 16),
                    g: parseInt(value.slice(2, 4), 16),
                    b: parseInt(value.slice(4, 6), 16)
                };
            }

            function rgbToHex({ r, g, b }) {
                const channel = value => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
                return `#${channel(r)}${channel(g)}${channel(b)}`;
            }

            function mixCardColor(fromHex, toHex, amount) {
                const from = parseHexColor(fromHex);
                const to = parseHexColor(toHex);
                const t = Math.max(0, Math.min(1, amount));
                return rgbToHex({
                    r: from.r + (to.r - from.r) * t,
                    g: from.g + (to.g - from.g) * t,
                    b: from.b + (to.b - from.b) * t
                });
            }

            function applyTeamCardEvolutionTheme(team) {
                const el = document.getElementById(`team-${team.id}`);
                if (!el) return;
                const level = Math.max(0, Math.min(12, Number(team.level) || 0));
                const coverage = cardLevelCoverage[level];
                const element = parseHexColor(team.color);
                const darkText = level < 6;
                const stage = level <= 2 ? 'initiation' : level <= 5 ? 'awakening' : level <= 8 ? 'ascension' : 'legendary';
                const saturation = 0.18 + (coverage / 100) * 0.82;
                // Every team now uses the same soft infusion model. Color strength grows
                // through opacity, avoiding a visible bottom-to-top fill boundary.
                const infusionAlpha = level === 0 ? 0 : (coverage / 100) * 0.95;
                const textureOpacity = Math.max(0, (coverage - 18) / 82) * 0.24;

                el.dataset.cardStage = stage;
                // v11.0.0: Mythic (11) and Celestial (12) frames; a Freed class keeps a faint gold edge at Level 12.
                el.dataset.sagaTier = level >= 12 ? 'celestial' : level >= 11 ? 'mythic' : '';
                el.classList.toggle('saga-freed-edge', level >= 12 && sagaStage() === 'Freed');
                el.style.setProperty('--element-rgb', `${element.r}, ${element.g}, ${element.b}`);
                el.style.setProperty('--infusion-coverage', `${coverage}%`);
                el.style.setProperty('--infusion-alpha', infusionAlpha.toFixed(3));
                el.style.setProperty('--texture-opacity', textureOpacity.toFixed(3));
                el.style.setProperty('--card-border', mixCardColor('#cbd5e1', team.color, saturation));
                el.style.setProperty('--card-text', darkText ? '#172033' : '#f8fafc');
                el.style.setProperty('--card-title', darkText ? mixCardColor(team.color, '#172033', level === 0 ? 0.08 : 0) : '#ffffff');
                el.style.setProperty('--card-muted', darkText ? '#64748b' : 'rgba(241,245,249,.80)');
                el.style.setProperty('--score-panel-bg', darkText ? 'rgba(255,255,255,.72)' : 'rgba(2,6,23,.42)');
                el.style.setProperty('--score-panel-border', darkText ? 'rgba(100,116,139,.25)' : 'rgba(255,255,255,.20)');
                el.style.setProperty('--avatar-well-bg', darkText
                    ? `radial-gradient(circle at 50% 46%, rgba(${element.r},${element.g},${element.b},.14), rgba(15,23,42,.07) 58%, transparent 76%)`
                    : `radial-gradient(circle at 50% 46%, rgba(2,6,23,.38), rgba(${element.r},${element.g},${element.b},.15) 56%, transparent 78%)`);
            }

            function formatExactPoints(points) {
                return Math.round(points).toLocaleString('en-US');
            }

            function formatCompactPoints(points) {
                const absolute = Math.abs(Number(points) || 0);
                const sign = points < 0 ? '-' : '';
                const tiers = [
                    { unit: 'T', value: 1e12 },
                    { unit: 'B', value: 1e9 },
                    { unit: 'M', value: 1e6 }
                ];

                function formatTier(index) {
                    const tier = tiers[index];
                    let scaled = absolute / tier.value;
                    const decimals = scaled < 100 ? 1 : 0;
                    let rounded = Number(scaled.toFixed(decimals));
                    if (rounded >= 1000 && index > 0) return formatTier(index - 1);
                    let text = decimals === 0 ? String(Math.round(rounded)) : rounded.toFixed(1).replace(/\.0$/, '');
                    text = text.replace('.', ',');
                    return { number: sign + text, unit: tier.unit };
                }

                for (let i = 0; i < tiers.length; i++) {
                    if (absolute >= tiers[i].value) return formatTier(i);
                }
                return { number: sign + formatExactPoints(absolute), unit: '' };
            }

            function renderTeamScoreDisplay(teamId, points) {
                const formatted = formatCompactPoints(points);
                const exact = formatExactPoints(points);
                const numberEl = document.getElementById(`points-${teamId}`);
                const crestEl = document.getElementById(`points-crest-${teamId}`);
                const panelEl = document.getElementById(`score-panel-${teamId}`);
                if (!numberEl || !crestEl || !panelEl) return;

                numberEl.textContent = formatted.number;
                panelEl.title = `${exact} points`;
                panelEl.setAttribute('aria-label', `${exact} points`);

                crestEl.className = 'score-crest';
                const inner = crestEl.querySelector('span');
                if (formatted.unit) {
                    panelEl.classList.add('has-crest');
                    crestEl.classList.add(`score-crest-${formatted.unit.toLowerCase()}`);
                    inner.textContent = formatted.unit;
                } else {
                    panelEl.classList.remove('has-crest');
                    inner.textContent = '';
                }
            }

            const scoreAnimationControllers = new Map();

            function cancelTeamScoreAnimation(teamId, { settle = true } = {}) {
                const controller = scoreAnimationControllers.get(teamId);
                if (!controller) return;
                cancelAnimationFrame(controller.raf);
                clearTimeout(controller.cleanupTimer);
                scoreAnimationControllers.delete(teamId);
                const numberEl = document.getElementById(`points-${teamId}`);
                numberEl?.classList.remove('score-counting', 'score-light-flash', 'score-light-feedback');
                if (settle) renderTeamScoreDisplay(teamId, controller.targetValue);
                const deltaEl = document.getElementById(`score-delta-${teamId}`);
                const modifiersEl = document.getElementById(`score-modifiers-${teamId}`);
                deltaEl?.classList.remove('visible');
                if (modifiersEl) modifiersEl.innerHTML = '';
            }

            function cancelAllScoreAnimations({ settle = true } = {}) {
                [...scoreAnimationControllers.keys()].forEach(teamId => cancelTeamScoreAnimation(teamId, { settle }));
            }

            // v10.3.0: restart a CSS animation without reading the layout in the middle of an award (an offsetWidth
            // read makes the browser lay out the whole board at once): if the class is on, it comes off for one
            // drawn frame and goes back on.
            function restartClass(el, cls) {
                if (!el) return;
                if (!el.classList.contains(cls)) { el.classList.add(cls); return; }
                el.classList.remove(cls);
                const token = (el._restartToken = (el._restartToken || 0) + 1);
                requestAnimationFrame(() => requestAnimationFrame(() => { if (el._restartToken === token) el.classList.add(cls); }));
            }
            function animateTeamScore(teamId, { fromValue, targetValue, delta, modifiers = [] }) {
                const active = scoreAnimationControllers.get(teamId);
                const visualStart = active ? active.currentValue : fromValue;
                if (active) cancelTeamScoreAnimation(teamId, { settle: false });

                const numberEl = document.getElementById(`points-${teamId}`);
                const deltaEl = document.getElementById(`score-delta-${teamId}`);
                const modifiersEl = document.getElementById(`score-modifiers-${teamId}`);
                if (!numberEl) {
                    renderTeamScoreDisplay(teamId, targetValue);
                    return;
                }

                const duration = Math.abs(targetValue - visualStart) > 1000000 ? 720 : 620;
                const controller = {
                    raf: 0,
                    cleanupTimer: 0,
                    currentValue: visualStart,
                    targetValue
                };
                scoreAnimationControllers.set(teamId, controller);

                // v9.5.0: Animated mode counts the score up as Performance does; Light stays instant.
                if (isLeanMode() && performanceMode !== 'animated') {
                    renderTeamScoreDisplay(teamId, targetValue);
                    controller.currentValue = targetValue;
                    numberEl.classList.remove('score-counting', 'score-light-flash');
                    numberEl.classList.add('score-light-feedback');
                    if (deltaEl) {
                        deltaEl.textContent = `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toLocaleString()}`;
                        deltaEl.classList.add('visible');
                    }
                    if (modifiersEl) {
                        modifiersEl.innerHTML = modifiers.slice(0, 2).map(modifier =>
                            `<span class="score-modifier-chip">${modifier.icon} ${modifier.label}</span>`
                        ).join('');
                    }
                    controller.cleanupTimer = setTimeout(() => {
                        if (scoreAnimationControllers.get(teamId) !== controller) return;
                        scoreAnimationControllers.delete(teamId);
                        numberEl.classList.remove('score-light-feedback');
                        deltaEl?.classList.remove('visible');
                        if (modifiersEl) modifiersEl.innerHTML = '';
                    }, 360);
                    return;
                }

                restartClass(numberEl, 'score-counting');

                if (deltaEl) {
                    deltaEl.textContent = `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toLocaleString()}`;
                    restartClass(deltaEl, 'visible');
                }
                if (modifiersEl) {
                    modifiersEl.innerHTML = modifiers.map((modifier, index) =>
                        `<span class="score-modifier-chip" style="animation-delay:${index * 85}ms">${modifier.icon} ${modifier.label}</span>`
                    ).join('');
                }
                // Animated mode disables board CSS animations; play the same cues through Web Animations.
                if (performanceMode === 'animated' && window.LeagueBoardFX) {
                    LeagueBoardFX.flash(deltaEl, 'delta');
                    modifiersEl?.querySelectorAll('.score-modifier-chip').forEach((chip, index) => LeagueBoardFX.flash(chip, 'chip', index * 85));
                }

                const startedAt = SceneRuntime.now();
                const step = now => {
                    const progress = Math.min(1, (now - startedAt) / duration);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    controller.currentValue = Math.round(visualStart + (targetValue - visualStart) * eased);
                    renderTeamScoreDisplay(teamId, controller.currentValue);
                    if (progress < 1) {
                        controller.raf = requestAnimationFrame(step);
                        return;
                    }
                    renderTeamScoreDisplay(teamId, targetValue);
                    numberEl.classList.remove('score-counting');
                    controller.currentValue = targetValue;
                    controller.cleanupTimer = setTimeout(() => {
                        if (scoreAnimationControllers.get(teamId) !== controller) return;
                        scoreAnimationControllers.delete(teamId);
                        deltaEl?.classList.remove('visible');
                        if (modifiersEl) modifiersEl.innerHTML = '';
                    }, Math.max(980, modifiers.length * 85 + 920));
                };
                controller.raf = requestAnimationFrame(step);
            }

            const avatarReactionDefinitions = Object.freeze({
                standard:       { priority:10, duration:720,  label:'' },
                'mission-small':{ priority:12, duration:720,  label:'' },
                'mission-large':{ priority:20, duration:1180, label:'Class Power' },
                large:          { priority:20, duration:1450, label:'Power Award' },
                powerup:        { priority:30, duration:1400, label:'Powerup' },
                shield:         { priority:32, duration:1500, label:'Shield Active' },
                debuff:         { priority:30, duration:760,  label:'Effect Applied' },
                negative:       { priority:30, duration:760,  label:'' },
                'near-evolution':{priority:40,duration:1550, label:'One More Award' },
                'chest-ready':  { priority:45, duration:1750, label:'Evolution Ready' },
                'rank-up':      { priority:50, duration:1550, label:'Rank Up' },
                leader:         { priority:60, duration:2600, label:'League Leader' },
                relic:          { priority:85, duration:2700, label:'Relic Unlocked' },
                evolution:      { priority:80, duration:3000, label:'Evolution Complete' }
            });
            const avatarReactionClassNames = Object.keys(avatarReactionDefinitions).map(type => `reaction-${type}`);

            function reactionsUseReducedMotion() {
                return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            }

            function clearAvatarReaction(teamId) {
                const controller = avatarReactionControllers.get(teamId);
                if (controller?.timer) clearTimeout(controller.timer);
                avatarReactionControllers.delete(teamId);
                const card = document.getElementById(`team-${teamId}`);
                if (!card) return;
                card.classList.remove('avatar-reacting','reaction-reduced',...avatarReactionClassNames);
                const label = document.getElementById(`reaction-label-${teamId}`);
                if (label) label.textContent = '';
            }

            function clearAllAvatarReactions() {
                teamsData.forEach(team => clearAvatarReaction(team.id));
            }

            function reactionParticleBurst(teamId, type) {
                if (isLeanMode()) return;
                const mascot = document.getElementById(`mascot-${teamId}`);
                const team = teamsData.find(item => item.id === teamId);
                if (!mascot || !team || reactionsUseReducedMotion()) return;
                const rect = mascot.getBoundingClientRect();
                const major = ['large','rank-up','leader','relic','evolution','chest-ready'].includes(type);
                spawnParticles(rect.left + rect.width/2, rect.top + rect.height*.48, team.color, major ? 26 : 9, major);
            }

            async function playElementReactionSound(teamId, tier = 1) {
                if(SceneRuntime.fastForwarding||SceneRuntime.paused)return;
                if (isMuted) return;
                const ctx = await unlockAudio();
                if (!ctx || ctx.state !== 'running') return;
                const medium = tier >= 2;
                if (isLeanMode()) {
                    const frequencies = { gryffindor:392, slytherin:330, hufflepuff:523.25, ravenclaw:659.25 };
                    scheduleTone(ctx,{frequency:frequencies[teamId] || 440,endFrequency:(frequencies[teamId] || 440) * 1.08,duration:medium?.13:.075,type:'sine',volume:medium?.022:.014});
                    return;
                }
                if (teamId === 'gryffindor') {
                    scheduleNoise(ctx,{duration:medium?.32:.16,volume:medium?.020:.010,highpass:medium?700:1200});
                    scheduleTone(ctx,{frequency:medium?190:330,endFrequency:medium?470:520,duration:medium?.42:.16,type:'sawtooth',volume:medium?.026:.014});
                } else if (teamId === 'slytherin') {
                    scheduleTone(ctx,{frequency:medium?196:293.66,endFrequency:medium?294:392,duration:medium?.48:.18,type:'triangle',volume:medium?.026:.014});
                    scheduleNoise(ctx,{start:.04,duration:medium?.36:.14,volume:medium?.014:.007,highpass:medium?480:900});
                } else if (teamId === 'hufflepuff') {
                    scheduleNoise(ctx,{duration:medium?.42:.18,volume:medium?.018:.008,highpass:medium?1200:1900});
                    scheduleTone(ctx,{start:.04,frequency:medium?440:660,endFrequency:medium?720:880,duration:medium?.4:.16,type:'sine',volume:medium?.024:.012});
                } else if (teamId === 'ravenclaw') {
                    scheduleTone(ctx,{frequency:medium?330:587.33,endFrequency:medium?660:783.99,duration:medium?.46:.2,type:'sine',volume:medium?.025:.013});
                    scheduleTone(ctx,{start:.08,frequency:medium?494:880,duration:medium?.32:.16,type:'triangle',volume:medium?.015:.008});
                }
            }

            function playAvatarReaction(teamId, type, options = {}) {
                globalThis.CreaturePoses?.board(teamId,type);
                if (isLeanMode()) return false;
                const definition = avatarReactionDefinitions[type];
                const card = document.getElementById(`team-${teamId}`);
                if (!definition || !card) return false;
                if ((unityEventRunning || battleState?.running || vixarRaidState?.running) && definition.priority < 70) return false;

                const active = avatarReactionControllers.get(teamId);
                if (active && active.priority > definition.priority) return false;
                clearAvatarReaction(teamId);

                const useReducedReaction = reactionsUseReducedMotion();
                const duration = useReducedReaction ? Math.min(700, definition.duration) : (options.duration || definition.duration);
                card.classList.add('avatar-reacting', `reaction-${type}`);
                if (useReducedReaction) card.classList.add('reaction-reduced');
                const label = document.getElementById(`reaction-label-${teamId}`);
                if (label) label.textContent = options.label ?? definition.label;
                reactionParticleBurst(teamId, type);
                if (options.sound !== false && !['mission-small','mission-large','negative','debuff'].includes(type)) {
                    playElementReactionSound(teamId, definition.priority >= 20 ? 2 : 1);
                }
                const timer = setTimeout(() => clearAvatarReaction(teamId), duration);
                avatarReactionControllers.set(teamId, { priority:definition.priority, timer, type });
                return true;
            }

            function captureRankingSnapshot() {
                const order = [...teamsData].sort((a,b) => b.points - a.points).map(team => team.id);
                const max = Math.max(...teamsData.map(team => team.points));
                const leaders = max > 0 ? teamsData.filter(team => team.points === max) : [];
                return { order, soleLeader:leaders.length === 1 ? leaders[0].id : null };
            }

            function scheduleRankingReactions(before) {
                if (!before) return;
                if (performanceMode === 'animated') {
                    const next=captureRankingSnapshot();
                    if(next.soleLeader && next.soleLeader!==before.soleLeader) globalThis.CreaturePoses?.boardLater(next.soleLeader,'leader',830);
                }
                if (isLeanMode()) return;
                const after = captureRankingSnapshot();
                after.order.forEach((teamId,index) => {
                    const previousIndex = before.order.indexOf(teamId);
                    if (previousIndex > index) setTimeout(() => playAvatarReaction(teamId,'rank-up'), 560);
                });
                if (after.soleLeader && after.soleLeader !== before.soleLeader) {
                    setTimeout(() => playAvatarReaction(after.soleLeader,'leader'), 830);
                }
            }

            function normalizeTeamRuntimeState(team) {
                if (!team.powerups) team.powerups = { doubleUp:false, halfDown:false, shield:false };
                if (!Array.isArray(team.traits)) team.traits = [];
                if (!Array.isArray(team.wheelMilestonesReached)) team.wheelMilestonesReached = [];
                if (!('pendingEvolution' in team)) team.pendingEvolution = null;
                team.evolutionProgress = Math.max(0, Math.min(3, Number(team.evolutionProgress) || 0));
            }

            function updateProgressionModeUI() {
                const button = document.getElementById('progression-mode-btn');
                if (!button) return;
                const isSoft = progressionMode === 'soft';
                button.dataset.mode = progressionMode;
                button.classList.toggle('soft', isSoft);
                button.classList.toggle('hard', !isSoft);
                button.setAttribute('aria-pressed', isSoft ? 'true' : 'false');
                button.setAttribute('aria-label', isSoft
                    ? 'Progression mode: Soft. One point award unlocks an evolution chest.'
                    : 'Progression mode: Hard. Three point awards unlock an evolution chest.');
                button.title = isSoft
                    ? 'Soft mode: 1 point award per level. Click for Hard mode.'
                    : 'Hard mode: 3 point awards per level. Click for Soft mode.';
                const name = button.querySelector('.progression-mode-name');
                const steps = button.querySelector('.progression-mode-steps');
                if (name) name.textContent = isSoft ? 'Soft' : 'Hard';
                if (steps) steps.textContent = isSoft ? '1 Step' : '3 Steps';
            }

            function awardEvolutionProgress(team) {
                normalizeTeamRuntimeState(team);
                if (team.level >= levelCap() || team.pendingEvolution) return false;
                // Soft mode completes the same three-step internal bar in one scoring action.
                // Hard mode preserves the original one-step-per-scoring-action behavior.
                team.evolutionProgress = progressionMode === 'soft'
                    ? 3
                    : Math.min(3, team.evolutionProgress + 1);
                return prepareEvolutionChest(team, { autoApply:performanceMode === 'animated' });
            }

            function setProgressionMode(mode, { announce = true, convertExisting = false } = {}) {
                if (!['soft','hard'].includes(mode)) return;
                progressionMode = mode;
                const newlyReadyTeams = [];

                // A partially charged Hard-mode bar already represents at least one award.
                // On entering Soft mode, honor that award and make the chest ready immediately.
                if (progressionMode === 'soft' && convertExisting) {
                    teamsData.forEach(team => {
                        normalizeTeamRuntimeState(team);
                        if (team.level < levelCap() && !team.pendingEvolution && team.evolutionProgress > 0) {
                            team.evolutionProgress = 3;
                            if (prepareEvolutionChest(team, { announce:false })) newlyReadyTeams.push(team.id);
                        }
                    });
                }

                updateProgressionModeUI();
                updateGameState({ updateVisuals:true, updateAvatar:false });
                if (announce) {
                    const message = progressionMode === 'soft'
                        ? 'Soft progression enabled — one point award now unlocks the next evolution chest.'
                        : 'Hard progression enabled — three point awards are required for the next evolution chest.';
                    addHistoryLog(message, progressionMode === 'soft' ? '#22d3ee' : '#f59e0b');
                }
                if (newlyReadyTeams.length) {
                    playSound('chestReady');
                    if (!isLeanMode()) {
                        newlyReadyTeams.forEach((teamId, index) => {
                            setTimeout(() => playAvatarReaction(teamId, 'chest-ready', { sound:false }), 160 + index * 130);
                        });
                    }
                }
            }

            function shuffleTraits(items) {
                const copy = [...items];
                for (let i = copy.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [copy[i], copy[j]] = [copy[j], copy[i]];
                }
                return copy;
            }

            function prepareEvolutionChest(team, { announce = true, autoApply = false } = {}) {
                normalizeTeamRuntimeState(team);
                if (team.level >= levelCap() || team.evolutionProgress < 3 || team.pendingEvolution) return false;
                let available = traitsForStage(team.id, team.level + 1, team.traits);
                if (autoApply && unityEventRunning && unityAscensionState) {
                    // Reserve Unity's planned traits so an incoming phone award cannot
                    // consume a later reward wave. At the level cap no extra level is due.
                    const reserved = unityAscensionState.teamPlans.get(team.id)?.traitIds || [];
                    available = available.filter(trait => !reserved.includes(trait.id));
                }
                if (!available.length) return false;

                // Preserve the old mechanic's evolutionary tree exactly: generate the same
                // two valid remaining candidates that the choice modal would have displayed,
                // then securely store one automatic result inside the chest.
                const candidates = shuffleTraits(available).slice(0, Math.min(2, available.length));
                const selected = candidates[Math.floor(Math.random() * candidates.length)];
                team.pendingEvolution = {
                    stage: team.level + 1,
                    candidateIds: candidates.map(trait => trait.id),
                    selectedTraitId: selected.id,
                    createdAt: Date.now()
                };
                team.evolutionProgress = 3;
                if (autoApply) {
                    if (unityEventRunning || battleState?.running || vixarRaidState?.running) {
                        deferredAnimatedEvolutions.add(team.id);
                        return true;
                    }
                    return applyAnimatedEvolution(team);
                }
                if (announce) {
                    addHistoryLog(`🎁 ${team.name} unlocked a Stage ${team.level + 1} Mystery Evolution Chest.`, team.color);
                    playSound('chestReady');
                }
                return true;
            }

            // The artwork is presentation. Trait selection, relics and the point economy
            // use the same rules as the legacy chest; no reward depends on animation timing.
            function applyAnimatedEvolution(team) {
                deferredAnimatedEvolutions.delete(team.id);
                const trait = teamTraits[team.id].find(item => item.id === team.pendingEvolution?.selectedTraitId);
                if (!trait || team.level >= levelCap() || team.traits.includes(trait.id)) return false;
                const previousLevel = team.level;
                team.traits.push(trait.id);
                team.level++;
                team.evolutionProgress = 0;
                team.pendingEvolution = null;
                team.cachedSVG = '';
                noteLevelStart(team);
                const relic = teamRelics[team.id];
                if (!team.hasRelic && team.level >= relic.unlockLevel) {
                    team.hasRelic = true;
                    addHistoryLog(`✨ ${team.name} reached Level ${relic.unlockLevel} and unlocked the ${relic.name}! (${relic.effect})`, 'gold');
                }
                addHistoryLog(`🌟 ${team.name} evolved to Level ${team.level}: ${trait.name}.`, team.color);
                pointSliderValues = pointSliderValues.map(value => value * 2);
                handlePointChange();
                if (SUBJECT_WHEEL_LEVELS.includes(team.level)) queueSubjectWheel(team.id,team.level);
                AnimatedMode.enqueue(team.id, previousLevel, team.level);
                updateTeamDOM(team, true, true);
                playSound('evolve');
                return true;
            }

            function queueSubjectWheel(teamId,stage) {
                const team = teamsData.find(item => item.id === teamId);
                if (!team || !SUBJECT_WHEEL_LEVELS.includes(stage)) return;
                normalizeTeamRuntimeState(team);
                if (team.wheelMilestonesReached.includes(stage)) return;
                if (activeAnimatedWheel?.teamId === teamId && activeAnimatedWheel.stage === stage) return;
                if (pendingAnimatedWheels.some(item => item.teamId === teamId && item.stage === stage)) return;
                team.wheelMilestonesReached.push(stage);
                scheduleCheckpoint();
                const student = lastAwardStudent.get(teamId) || null;
                pendingAnimatedWheels.push({teamId,stage,restore:levelStarts.get(`${teamId}:${stage - 1}`) || null,student});
                pumpPresentation();
            }

            // The team as it was when it reached this level: a wrong Challenge Deck answer at the next wheel level
            // takes the team back here (points, level, traits, relic, milestones).
            function noteLevelStart(team) {
                levelStarts.set(`${team.id}:${team.level}`, cleanTeam(team));
            }

            function presentationBlocked() {
                return isEvolving || unityEventRunning || Boolean(battleState?.running) || Boolean(vixarRaidState?.running)
                    || Boolean(LeagueScenes.active&&LeagueScenes.active!=='evolution') || Boolean(document.querySelector('.modal-overlay.visible'))
                    || document.body.classList.contains('unity-event-active') || document.body.classList.contains('battle-active')
                    || document.body.classList.contains('vixar-raid-active');
            }

            function pumpPresentation() {
                if(recoveryReady&&presentationHeld)return;
                if (presentationScheduled) return;
                presentationScheduled = true;
                queueMicrotask(() => {
                    presentationScheduled = false;
                    if (deferredPerformanceMode && !presentationBlocked()) {
                        const mode = deferredPerformanceMode;
                        deferredPerformanceMode = null;
                        setPerformanceMode(mode, { initializeScenery:true });
                    }
                    if (performanceMode === 'animated' && deferredAnimatedEvolutions.size && !presentationBlocked()) {
                        const ready = [...deferredAnimatedEvolutions];
                        ready.forEach(id => {
                            deferredAnimatedEvolutions.delete(id);
                            const team = teamsData.find(item => item.id === id);
                            if (team?.pendingEvolution) applyAnimatedEvolution(team);
                        });
                        updateGameState({updateVisuals:true, updateAvatar:true});
                    }
                    // An active wheel owns presentation until it has produced one
                    // result and advanced. Returning before AnimatedMode.pump()
                    // prevents its idle callback from creating an endless microtask
                    // loop while another team's wheel is waiting.
                    if (document.hidden || SceneRuntime.paused || activeAnimatedWheel || activeWheelSpin || wheelSpinTimer || wheelAdvanceTimer) return;
                    AnimatedMode.pump();
                    const visual = AnimatedMode.getDiagnostics();
                    if (presentationBlocked() || visual.active || visual.queued || LeagueScenes.active) return;
                    if (pendingAnimatedWheels.length) {
                        activeAnimatedWheel = pendingAnimatedWheels.shift();
                        const team = teamsData.find(item => item.id === activeAnimatedWheel.teamId);
                        openWheelModal();
                        addHistoryLog(`🌟 ${team.name} reached Level ${activeAnimatedWheel.stage}! The Wheel of Subjects is activated!`, team.color);
                        animatedWheelStartTimer = wheelClock.after(() => {
                            animatedWheelStartTimer = null;
                            if (activeAnimatedWheel) document.getElementById('spin-btn').click();
                        }, 100);
                    } else if (pendingAnimatedFinish) {
                        pendingAnimatedFinish = false;
                        document.getElementById('finish-btn').click();
                    }
                });
            }

            function cancelAnimatedPresentation(teamId = null) {
                if (teamId) {
                    deferredAnimatedEvolutions.delete(teamId);
                    AnimatedMode.cancelTeam(teamId);
                    pendingAnimatedWheels = pendingAnimatedWheels.filter(item => item.teamId !== teamId);
                    if (activeAnimatedWheel?.teamId !== teamId) return;
                } else {
                    AnimatedMode.cancelAll();
                    deferredAnimatedEvolutions.clear();
                    pendingAnimatedWheels = [];
                    pendingAnimatedFinish = false;
                }
                wheelClock.cancel(animatedWheelStartTimer);
                animatedWheelStartTimer = null;
                wheelClock.cancel(wheelSpinTimer);
                wheelSpinTimer = null;
                wheelClock.cancel(wheelAdvanceTimer);
                wheelAdvanceTimer = null;
                wheelSpinEpoch++;
                wheelVisualAnimation?.cancel();wheelVisualAnimation=null;LeagueScenes.leave('wheel');
                LeagueChallenge.dismiss();
                activeWheelSpin = null;
                activeAnimatedWheel = null;
                document.getElementById('spin-btn').disabled = false;
                document.getElementById('wheel-modal').classList.remove('visible');
            }

            function clearEvolutionChestTimers() {
                evolutionChestTimers.forEach(timer => chestClock.cancel(timer));
                evolutionChestTimers = [];
                if (evolutionResolutionTimer) { chestClock.cancel(evolutionResolutionTimer); evolutionResolutionTimer = null; }
            }

            function scheduleEvolutionChest(fn, delay, epoch = sessionEpoch) {
                const timer = chestClock.after(() => {
                    evolutionChestTimers = evolutionChestTimers.filter(item => item !== timer);
                    if (epoch !== sessionEpoch) return;
                    fn();
                }, delay);
                evolutionChestTimers.push(timer);
                return timer;
            }

            function traitRevealRank(stage) {
                if (stage >= 12) return 'Celestial Ascension';
                if (stage >= 11) return 'Mythic Ascension';
                if (stage >= 10) return 'Legendary Ascension';
                if (stage >= 7) return 'Elite Evolution';
                if (stage >= 4) return 'Advanced Evolution';
                return 'Evolved Trait';
            }

            function openEvolutionChest(teamId) {
                const team = teamsData.find(item => item.id === teamId);
                if (!team?.pendingEvolution || isEvolving || unityEventRunning || battleState?.running || vixarRaidState?.running || (LeagueScenes.active&&LeagueScenes.active!=='evolution')) return;
                if (document.querySelector('.modal-overlay.visible')) return;

                if (performanceMode === 'animated') {
                    saveState();
                    applyAnimatedEvolution(team);
                    updateGameState({teamId:team.id, updateVisuals:true, updateAvatar:true});
                    return;
                }

                if(!LeagueScenes.enter('chest','revealing'))return;
                // This separate snapshot makes Undo restore the unopened chest with the same
                // stored result instead of undoing the point award or rerolling the trait.
                saveState();
                clearEvolutionChestTimers();
                isEvolving = true;
                activeEvolutionTeamId = team.id;
                const epoch = sessionEpoch;
                const pending = team.pendingEvolution;
                const trait = teamTraits[team.id].find(item => item.id === pending.selectedTraitId);
                if (!trait) {
                    isEvolving = false;
                    activeEvolutionTeamId = null;
                    return;
                }

                clearAllAvatarReactions();
                const modal = document.getElementById('evolution-modal');
                const card = document.getElementById('evolution-chest-modal-card');
                card.className = `modal-content evolution-chest-modal-content team-${team.id}`;
                document.getElementById('evolution-stage-kicker').textContent = `${team.name} · Stage ${pending.stage}`;
                document.getElementById('evolution-chest-subtitle').textContent = 'The stored evolution is awakening from this stage’s existing evolutionary tree.';
                document.getElementById('evolution-preview-base').innerHTML = team.cachedSVG || getAvatarSVG(team.id, team.traits);
                document.getElementById('evolution-preview-new').innerHTML = getAvatarSVG(team.id, [...team.traits, trait.id]);
                document.getElementById('evolution-modal-lock').textContent = team.id === 'gryffindor' ? 'G' : team.id === 'slytherin' ? 'S' : team.id === 'hufflepuff' ? 'H' : 'R';
                document.getElementById('evolution-trait-icon').textContent = '✦';
                document.getElementById('evolution-trait-name').textContent = 'Unknown Evolution';
                document.getElementById('evolution-trait-rank').textContent = `Stage ${pending.stage} Evolution`;
                document.getElementById('evolution-chest-status').textContent = 'Elemental energy is gathering around the chest…';
                modal.classList.add('visible');
                modal.setAttribute('aria-hidden','false');

                if (isLeanMode()) {
                    card.classList.add('light-fast','is-open','is-revealed');
                    document.getElementById('evolution-trait-icon').textContent = trait.icon;
                    document.getElementById('evolution-trait-name').textContent = trait.name;
                    document.getElementById('evolution-trait-rank').textContent = traitRevealRank(pending.stage);
                    document.getElementById('evolution-chest-status').textContent = `${trait.name} selected · applying evolution…`;
                    playSound('traitReveal');

                    scheduleEvolutionChest(() => {
                        if (!team.traits.includes(trait.id)) team.traits.push(trait.id);
                        team.level++;
                        team.evolutionProgress = 0;
                        team.pendingEvolution = null;
                        noteLevelStart(team);
                        pointSliderValues = pointSliderValues.map(value => value * 2);
                        handlePointChange();
                        if (SUBJECT_WHEEL_LEVELS.includes(team.level)) queueSubjectWheel(team.id,team.level);
                        team.cachedSVG = '';
                        const relic = teamRelics[team.id];
                        if (!team.hasRelic && team.level >= relic.unlockLevel) {
                            team.hasRelic = true;
                            addHistoryLog(`✨ ${team.name} reached Level ${relic.unlockLevel} and unlocked the ${relic.name}! (${relic.effect})`, 'gold');
                        }
                        addHistoryLog(`🌟 ${team.name} evolved to Level ${team.level}: ${trait.name}.`, team.color);
                        updateTeamDOM(team, true, true);
                        card.classList.add('is-complete');
                        document.getElementById('evolution-chest-status').textContent = `Evolution complete · Level ${team.level}`;
                        playSound('evolve');
                    }, 120, epoch);

                    evolutionResolutionTimer = scheduleEvolutionChest(() => {
                        evolutionResolutionTimer = null;
                        modal.classList.remove('visible');
                        modal.setAttribute('aria-hidden','true');
                        card.className = `modal-content evolution-chest-modal-content team-${team.id}`;
                        isEvolving = false;
                        activeEvolutionTeamId = null;
                        LeagueScenes.leave('chest');
                        updateGameState({ teamId:team.id, updateVisuals:true, updateAvatar:false });

                        if (SUBJECT_WHEEL_LEVELS.includes(team.level)) {
                            queueSubjectWheel(team.id,team.level);
                        }
                        if (unityEventQueued) scheduleUnityQueueCheck();
                    }, 900, epoch);
                    return;
                }

                card.classList.add('is-charging');
                playSound('chestCharge');
                playAvatarReaction(team.id,'evolution',{label:'Chest Opening',sound:false,duration:3300});

                scheduleEvolutionChest(() => {
                    card.classList.remove('is-charging');
                    card.classList.add('is-open');
                    document.getElementById('evolution-chest-status').textContent = 'The chest has selected its permanent evolution…';
                    playSound('chestOpen');
                }, 1050, epoch);

                scheduleEvolutionChest(() => {
                    card.classList.add('is-revealed');
                    document.getElementById('evolution-trait-icon').textContent = trait.icon;
                    document.getElementById('evolution-trait-name').textContent = trait.name;
                    document.getElementById('evolution-trait-rank').textContent = traitRevealRank(pending.stage);
                    document.getElementById('evolution-chest-status').textContent = `${trait.name} has been revealed.`;
                    playSound('traitReveal');
                }, 2050, epoch);

                scheduleEvolutionChest(() => {
                    // Apply the stored result only after the reveal begins.
                    if (!team.traits.includes(trait.id)) team.traits.push(trait.id);
                    team.level++;
                    team.evolutionProgress = 0;
                    team.pendingEvolution = null;
                    noteLevelStart(team);
                        pointSliderValues = pointSliderValues.map(value => value * 2);
                        handlePointChange();
                        if (SUBJECT_WHEEL_LEVELS.includes(team.level)) queueSubjectWheel(team.id,team.level);
                    team.cachedSVG = '';
                    let unlockedRelic = false;
                    const relic = teamRelics[team.id];
                    if (!team.hasRelic && team.level >= relic.unlockLevel) {
                        team.hasRelic = true;
                        unlockedRelic = true;
                        addHistoryLog(`✨ ${team.name} reached Level ${relic.unlockLevel} and unlocked the ${relic.name}! (${relic.effect})`, 'gold');
                    }
                    addHistoryLog(`🌟 ${team.name} evolved to Level ${team.level}: ${trait.name}.`, team.color);
                    updateTeamDOM(team,true);
                    card.classList.add('is-complete');
                    document.getElementById('evolution-chest-status').textContent = `Evolution complete · Level ${team.level}`;
                    playSound('evolve');
                    playAvatarReaction(team.id,'evolution',{label:`${trait.name} Unlocked`,sound:false,duration:3100});
                    const mascot = document.getElementById(`mascot-${team.id}`);
                    if (mascot) {
                        const rect = mascot.getBoundingClientRect();
                        spawnParticles(rect.left+rect.width/2,rect.top+rect.height/2,team.color,66,true);
                    }
                    if (unlockedRelic) {
                        scheduleEvolutionChest(() => {
                            playSound('relic');
                            playAvatarReaction(team.id,'relic',{label:relic.name,sound:false});
                            spawnParticles(window.innerWidth/2,window.innerHeight/2,'gold',90,true);
                        }, 620, epoch);
                    }
                }, 2950, epoch);

                evolutionResolutionTimer = scheduleEvolutionChest(() => {
                    evolutionResolutionTimer = null;
                    modal.classList.remove('visible');
                    modal.setAttribute('aria-hidden','true');
                    card.className = `modal-content evolution-chest-modal-content team-${team.id}`;
                    isEvolving = false;
                    activeEvolutionTeamId = null;

                    // Preserve the existing evolution economy and stage milestones.
                    LeagueScenes.leave('chest');
                    updateGameState({ teamId:team.id, updateVisuals:true, updateAvatar:false });

                    if (SUBJECT_WHEEL_LEVELS.includes(team.level)) {
                        queueSubjectWheel(team.id,team.level);
                    }
                    if (unityEventQueued) scheduleUnityQueueCheck();
                }, 4800, epoch);
            }

            function updateTeamDOM(team, updateVisuals = false, updateAvatar = updateVisuals) {
                scheduleCheckpoint();
                const el = document.getElementById(`team-${team.id}`);
                if (!el) return;
                applyTeamCardEvolutionTheme(team);
                LeagueStudentUI.renderConstellation(document.getElementById(`constellation-${team.id}`),team,selectedClass,studentContributions);
                
                // Preserve an in-progress score count-up while other card visuals update.
                if (!scoreAnimationControllers.has(team.id)) renderTeamScoreDisplay(team.id, team.points);
                
                // Update Classes
                el.classList.toggle('powerup-x2-active', team.powerups.doubleUp);
                el.classList.toggle('powerup-50-active', team.powerups.halfDown);
                el.classList.toggle('legendary', team.level >= 10);
                el.classList.toggle('mythic', team.level >= 11);
                el.classList.toggle('celestial', team.level >= 12);
                
                // Update Powerup Buttons
                el.querySelectorAll('.powerup-btn').forEach(btn => {
                    if (btn.dataset.type === 'secretAgent') {
                        const a=secretAgents.assignments[team.id];
                        btn.classList.toggle('active',a?.status==='active'||secretAgents.request?.teamId===team.id);
                        btn.classList.toggle('used',a?.status==='revealed');
                        btn.setAttribute('aria-pressed',String(a?.status==='active'));
                        btn.title=a?.status==='revealed'?'Secret Agent completed':'Secret Agent — choose privately on the remote';
                        return;
                    }
                    btn.classList.toggle('active', btn.dataset.type !== 'halfDown' && team.powerups[btn.dataset.type]);
                    btn.classList.toggle('debuff', btn.dataset.type === 'halfDown' && team.powerups[btn.dataset.type]);
                });

                // Relic logic
                const relicEl = document.getElementById(`relic-${team.id}`);
                if (team.hasRelic) {
                    relicEl.classList.add('visible');
                    document.getElementById(`relic-icon-${team.id}`).textContent = teamRelics[team.id].icon;
                    document.getElementById(`relic-tooltip-${team.id}`).innerHTML = `<div class="text-center"><span class="font-bold text-yellow-400">${teamRelics[team.id].name}</span><br><span class="text-xs text-slate-300">${teamRelics[team.id].effect}</span></div>`;
                } else {
                    relicEl.classList.remove('visible');
                }

                const chestButton = document.getElementById(`evolution-chest-${team.id}`);
                if (chestButton) {
                    const ready = Boolean(team.pendingEvolution) && team.level < levelCap();
                    chestButton.classList.toggle('visible', ready);
                    chestButton.disabled = !ready || isEvolving || unityEventRunning || Boolean(battleState?.running) || Boolean(vixarRaidState?.running);
                    chestButton.setAttribute('aria-hidden', ready ? 'false' : 'true');
                }

                // Visual updates only when necessary
                if (updateVisuals) {
                    const levelDisplay = document.getElementById(`level-display-${team.id}`);
                    const levelNumber = document.getElementById(`level-${team.id}`);
                    const previousDisplayedLevel = Number(levelDisplay?.dataset.level) || 0;
                    if (levelNumber) levelNumber.textContent = String(team.level);
                    if (levelDisplay) {
                        levelDisplay.dataset.level = String(team.level);
                        levelDisplay.setAttribute('aria-label', `${team.name} Level ${team.level}${team.level >= 10 ? ` · ${LeagueSaga.tierName(team.level)}` : ''}`);
                        levelDisplay.dataset.tier = team.level >= 10 ? LeagueSaga.tierName(team.level).toLowerCase() : '';
                        const badgeWord = levelDisplay.querySelector('.team-level-badge span');
                        if (badgeWord) badgeWord.textContent = team.level >= 11 ? LeagueSaga.tierName(team.level) : 'Level';
                        if (team.level > previousDisplayedLevel && !recoveryRestoring) {
                            restartClass(levelDisplay, 'level-up');
                            setTimeout(() => levelDisplay.classList.remove('level-up'), 900);
                        }
                    }
                    let fills = [0, 0, 0];
                    if (team.level < levelCap()) {
                        if (team.evolutionProgress >= 1) fills[0] = 100;
                        if (team.evolutionProgress >= 2) fills[1] = 100;
                        if (team.evolutionProgress >= 3 || team.pendingEvolution) fills[2] = 100;
                    } else { fills = [100, 100, 100]; }
                    document.getElementById(`evo-1-${team.id}`).style.height = `${fills[0]}%`;
                    document.getElementById(`evo-2-${team.id}`).style.height = `${fills[1]}%`;
                    document.getElementById(`evo-3-${team.id}`).style.height = `${fills[2]}%`;
                    
                    if (updateAvatar) {
                        const displayedLevel = performanceMode === 'animated' ? AnimatedMode.displayLevel(team.id, team.level) : null;
                        const newSvg = getAvatarSVG(team.id, team.traits, displayedLevel);
                        if (newSvg !== team.cachedSVG) {
                            team.cachedSVG = newSvg;
                            document.getElementById(`mascot-${team.id}`).innerHTML = newSvg;
                            if (performanceMode === 'animated') AnimatedMode.warmNext(team.id, team.level);
                        }
                    }
                }
                globalThis.LeagueHalo?.paint(team, haloTeams.includes(team.id));
            }

            // --- MAIN LOGIC & EVENTS ---
            // Self-contained Web Audio effects. No MP3 files or audio CDN are required.
            // Browsers unlock audio after the first click/tap/key press; every sound call also
            // attempts to resume the context so opening this HTML locally works reliably.
            let isMuted = false;
            const sceneAudioSources=new Set();
            let audioContext = null;
            let audioMasterGain = null;
            let audioCompressor = null;
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;

            function getAudioContext() {
                if (!AudioContextClass) return null;
                if (!audioContext) {
                    audioContext = new AudioContextClass();
                    audioMasterGain = audioContext.createGain();
                    audioCompressor = audioContext.createDynamicsCompressor();
                    audioCompressor.threshold.value = -14;
                    audioCompressor.knee.value = 18;
                    audioCompressor.ratio.value = 4;
                    audioCompressor.attack.value = 0.004;
                    audioCompressor.release.value = 0.18;
                    audioMasterGain.gain.value = isMuted ? 0 : 1;
                    audioMasterGain.connect(audioCompressor);
                    audioCompressor.connect(audioContext.destination);
                }
                return audioContext;
            }

            function setAudioMuted(muted, rampSeconds = 0.035) {
                const ctx = getAudioContext();
                if (!ctx || !audioMasterGain) return;
                const now = ctx.currentTime;
                audioMasterGain.gain.cancelScheduledValues(now);
                audioMasterGain.gain.setValueAtTime(Math.max(0.0001, audioMasterGain.gain.value || 0.0001), now);
                if (muted) {
                    audioMasterGain.gain.exponentialRampToValueAtTime(0.0001, now + rampSeconds);
                } else {
                    audioMasterGain.gain.exponentialRampToValueAtTime(1, now + rampSeconds);
                }
            }

            async function unlockAudio() {
                const ctx = getAudioContext();
                if (!ctx) return null;
                if (ctx.state === 'suspended' && !SceneRuntime.paused) {
                    try { await ctx.resume(); } catch (error) { console.warn('Audio could not be resumed:', error); }
                }
                return ctx;
            }

            function scheduleTone(ctx, {
                start = 0,
                duration = 0.12,
                frequency = 440,
                endFrequency = null,
                type = 'sine',
                volume = 0.055,
                attack = 0.008,
                release = 0.08
            } = {}) {
                const now = ctx.currentTime;
                const begin = now + start;
                const end = begin + duration;
                const oscillator = ctx.createOscillator();
                sceneAudioSources.add(oscillator);oscillator.onended=()=>{sceneAudioSources.delete(oscillator);oscillator.disconnect();};
                const gain = ctx.createGain();

                oscillator.type = type;
                oscillator.frequency.setValueAtTime(Math.max(1, frequency), begin);
                if (endFrequency) {
                    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), end);
                }

                gain.gain.setValueAtTime(0.0001, begin);
                gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), begin + attack);
                gain.gain.setValueAtTime(Math.max(0.0002, volume), Math.max(begin + attack, end - release));
                gain.gain.exponentialRampToValueAtTime(0.0001, end);

                oscillator.connect(gain);
                gain.connect(audioMasterGain || ctx.destination);
                oscillator.start(begin);
                oscillator.stop(end + 0.02);
            }

            function scheduleNoise(ctx, { start = 0, duration = 0.25, volume = 0.035, highpass = 700 } = {}) {
                const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
                const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
                const channel = buffer.getChannelData(0);
                for (let i = 0; i < sampleCount; i++) {
                    channel[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
                }

                const source = ctx.createBufferSource();
                sceneAudioSources.add(source);source.onended=()=>{sceneAudioSources.delete(source);source.disconnect();};
                const filter = ctx.createBiquadFilter();
                const gain = ctx.createGain();
                const begin = ctx.currentTime + start;
                const end = begin + duration;

                source.buffer = buffer;
                filter.type = 'highpass';
                filter.frequency.setValueAtTime(highpass, begin);
                gain.gain.setValueAtTime(0.0001, begin);
                gain.gain.exponentialRampToValueAtTime(volume, begin + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.0001, end);

                source.connect(filter);
                filter.connect(gain);
                gain.connect(audioMasterGain || ctx.destination);
                source.start(begin);
                source.stop(end + 0.02);
            }


            // Final Arena background track: Option 4 — Predator Run.
            // This is a fully self-contained Web Audio composition with no external files.
            let battleMusicGain = null;
            let battleMusicNodes = [];
            let battleMusicEndTimer = null;
            let battleMusicGeneration = 0;
            const battleMusicCleanupTimers = new Set();

            function rememberBattleMusicNode(node) {
                battleMusicNodes.push(node);
                return node;
            }

            function stopBattleMusic(fadeOut = 0.16) {
                battleMusicGeneration++;
                if (battleMusicEndTimer) {
                    clearTimeout(battleMusicEndTimer);
                    battleMusicEndTimer = null;
                }
                const oldGain = battleMusicGain;
                const oldNodes = battleMusicNodes.slice();
                battleMusicGain = null;
                battleMusicNodes = [];
                if (oldGain) {
                    try {
                        const now = oldGain.context.currentTime;
                        const currentValue = Math.max(0.0001, oldGain.gain.value || 0.0001);
                        oldGain.gain.cancelScheduledValues(now);
                        oldGain.gain.setValueAtTime(currentValue, now);
                        oldGain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.02, fadeOut));
                    } catch (error) {}
                }
                if (!oldGain && oldNodes.length === 0) return;
                const cleanupDelay = Math.max(80, Math.round((fadeOut + 0.08) * 1000));
                const cleanupTimer = setTimeout(() => {
                    battleMusicCleanupTimers.delete(cleanupTimer);
                    oldNodes.forEach(node => {
                        try { node.stop?.(); } catch (error) {}
                        try { node.disconnect?.(); } catch (error) {}
                    });
                    try { oldGain?.disconnect?.(); } catch (error) {}
                }, cleanupDelay);
                battleMusicCleanupTimers.add(cleanupTimer);
            }

            function battleMusicFrequency(root, semitones) {
                return root * Math.pow(2, semitones / 12);
            }

            function scheduleBattleMusicOsc(ctx, output, {
                when,
                duration = 0.16,
                frequency = 440,
                type = 'sawtooth',
                volume = 0.04,
                detune = 0,
                attack = 0.009,
                release = 0.08,
                endFrequency = null
            } = {}) {
                const oscillator = rememberBattleMusicNode(ctx.createOscillator());
                const gain = ctx.createGain();
                oscillator.type = type;
                oscillator.detune.value = detune;
                oscillator.frequency.setValueAtTime(Math.max(1, frequency), when);
                if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), when + duration);
                gain.gain.setValueAtTime(0.0001, when);
                gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), when + attack);
                gain.gain.setValueAtTime(Math.max(0.0002, volume), Math.max(when + attack, when + duration - release));
                gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
                oscillator.connect(gain);
                gain.connect(output);
                oscillator.start(when);
                oscillator.stop(when + duration + 0.03);
            }

            function scheduleBattleMusicNoise(ctx, output, { when, duration = 0.1, volume = 0.06, highpass = 900 } = {}) {
                const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
                const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
                const source = rememberBattleMusicNode(ctx.createBufferSource());
                const filter = ctx.createBiquadFilter();
                const gain = ctx.createGain();
                source.buffer = buffer;
                filter.type = 'highpass';
                filter.frequency.setValueAtTime(highpass, when);
                gain.gain.setValueAtTime(0.0001, when);
                gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), when + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
                source.connect(filter);
                filter.connect(gain);
                gain.connect(output);
                source.start(when);
                source.stop(when + duration + 0.03);
            }

            function scheduleBattleMusicKick(ctx, output, when, gain = 0.3, pitch = 165) {
                const oscillator = rememberBattleMusicNode(ctx.createOscillator());
                const amp = ctx.createGain();
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(pitch, when);
                oscillator.frequency.exponentialRampToValueAtTime(42, when + 0.18);
                amp.gain.setValueAtTime(gain, when);
                amp.gain.exponentialRampToValueAtTime(0.0001, when + 0.21);
                oscillator.connect(amp);
                amp.connect(output);
                oscillator.start(when);
                oscillator.stop(when + 0.23);
            }

            function scheduleBattleMusicTom(ctx, output, when, frequency = 95, gain = 0.18, duration = 0.25) {
                const oscillator = rememberBattleMusicNode(ctx.createOscillator());
                const amp = ctx.createGain();
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(frequency * 1.35, when);
                oscillator.frequency.exponentialRampToValueAtTime(frequency, when + duration);
                amp.gain.setValueAtTime(gain, when);
                amp.gain.exponentialRampToValueAtTime(0.0001, when + duration);
                oscillator.connect(amp);
                amp.connect(output);
                oscillator.start(when);
                oscillator.stop(when + duration + 0.03);
            }

            function scheduleBattleMusicMetallic(ctx, output, when, gain = 0.08) {
                [190, 264, 351, 477].forEach((frequency, index) => {
                    scheduleBattleMusicOsc(ctx, output, { when, duration: 0.24, frequency, type: 'square', volume: gain / (index + 1), detune: index * 5 });
                });
                scheduleBattleMusicNoise(ctx, output, { when, duration: 0.19, volume: gain * 0.6, highpass: 1600 });
            }

            function scheduleBattleMusicBoom(ctx, output, when, gain = 0.26) {
                scheduleBattleMusicKick(ctx, output, when, gain, 90);
                scheduleBattleMusicNoise(ctx, output, { when, duration: 0.42, volume: gain * 0.33, highpass: 100 });
                scheduleBattleMusicOsc(ctx, output, { when, duration: 0.7, frequency: 46, type: 'sine', volume: gain * 0.38 });
            }

            async function startPredatorRunBattleTrack(offsetSeconds = 0) {
                if (isMuted || isLeanMode()) {
                    stopBattleMusic(0.02);
                    return;
                }
                const ctx = await unlockAudio();
                if (!ctx || ctx.state !== 'running') return;
                stopBattleMusic(0.04);
                const trackGeneration = ++battleMusicGeneration;

                const totalDuration = 30;
                const bpm = 132;
                const beat = 60 / bpm;
                const step = beat / 4;
                const scale = [0, 3, 5, 7, 10, 12];
                const horn = [0, 3, 5, 3, 4, 2, 5, 1];
                const clampedOffset = Math.max(0, Math.min(totalDuration - 0.08, offsetSeconds || 0));
                const startAt = ctx.currentTime + 0.06;
                const totalSteps = Math.ceil(totalDuration / step);

                battleMusicGain = ctx.createGain();
                battleMusicGain.gain.setValueAtTime(0.0001, startAt);
                battleMusicGain.gain.exponentialRampToValueAtTime(0.14, startAt + 0.06);
                battleMusicGain.connect(audioMasterGain || ctx.destination);

                for (let i = Math.floor(clampedOffset / step); i < totalSteps; i++) {
                    const relative = i * step;
                    if (relative + 0.0001 < clampedOffset) continue;
                    const when = startAt + (relative - clampedOffset);
                    const section = i % 16;

                    if (section === 0 || section === 8) scheduleBattleMusicKick(ctx, battleMusicGain, when, section === 0 ? 0.30 : 0.22, 165);
                    if (section === 4 || section === 12) scheduleBattleMusicNoise(ctx, battleMusicGain, { when, duration: 0.07, volume: 0.055, highpass: 1200 });
                    if (section === 2 || section === 6 || section === 10 || section === 14) {
                        scheduleBattleMusicTom(ctx, battleMusicGain, when, section % 8 === 2 ? 120 : 88, 0.11, 0.14);
                    }

                    if (i % 8 === 0) {
                        const semitone = scale[horn[Math.floor(i / 8) % horn.length]];
                        scheduleBattleMusicOsc(ctx, battleMusicGain, { when, duration: beat * 0.8, frequency: battleMusicFrequency(110, semitone), type: 'sawtooth', volume: 0.036, detune: -7 });
                        scheduleBattleMusicOsc(ctx, battleMusicGain, { when, duration: beat * 0.8, frequency: battleMusicFrequency(110, semitone), type: 'square', volume: 0.02, detune: 8 });
                    }

                    if (i % 4 === 0) {
                        const bass = [0, 0, 3, 4, 0, 5, 3, 2][Math.floor(i / 4) % 8];
                        scheduleBattleMusicOsc(ctx, battleMusicGain, { when, duration: beat * 0.9, frequency: battleMusicFrequency(55, scale[bass % scale.length]), type: 'square', volume: 0.04 });
                    }

                    if (relative > 21) {
                        if (i % 2 === 1) scheduleBattleMusicNoise(ctx, battleMusicGain, { when, duration: 0.045, volume: 0.026, highpass: 2800 });
                        if (i % 4 === 2) scheduleBattleMusicTom(ctx, battleMusicGain, when, 145, 0.09, 0.09);
                    }

                    if (relative > 27) {
                        if (i % 2 === 0) scheduleBattleMusicKick(ctx, battleMusicGain, when, 0.22, 185);
                        if (i % 2 === 1) scheduleBattleMusicTom(ctx, battleMusicGain, when, 165, 0.10, 0.10);
                    }
                }

                if (29.25 >= clampedOffset) scheduleBattleMusicBoom(ctx, battleMusicGain, startAt + (29.25 - clampedOffset), 0.32);
                if (29.32 >= clampedOffset) scheduleBattleMusicMetallic(ctx, battleMusicGain, startAt + (29.32 - clampedOffset), 0.08);

                const fadeStart = startAt + Math.max(0.1, totalDuration - clampedOffset - 0.22);
                battleMusicGain.gain.setValueAtTime(0.14, fadeStart);
                battleMusicGain.gain.exponentialRampToValueAtTime(0.0001, fadeStart + 0.22);
                battleMusicEndTimer = setTimeout(() => {
                    battleMusicEndTimer = null;
                    if (trackGeneration === battleMusicGeneration) stopBattleMusic(0.02);
                }, Math.max(300, Math.round((totalDuration - clampedOffset + 0.25) * 1000)));
            }

            async function playSound(name, detail = 0) {
                if(SceneRuntime.fastForwarding||SceneRuntime.paused)return;
                if (isMuted) return;
                const ctx = await unlockAudio();
                if (!ctx || ctx.state !== 'running') return;
                // v11.0.0 saga sounds keep their character in Light mode too (they carry the story), at low cost.
                if (playSagaSound(ctx, name, detail)) return;

                if (isLeanMode()) {
                    const lightCue = {
                        point:620, chestReady:740, chestCharge:330, chestOpen:440, traitReveal:660,
                        evolve:784, win:880, wheel:523.25, timer:880, vortex:196,
                        battleStart:220, signature:659.25, relic:784, critical:330,
                        knockout:165, negative:196, unityComplete:659.25, unityAwaken:523.25,
                        unityForge:392, unityAssemble:587.33, unityReveal:783.99,
                        unityAscend:698.46, test:523.25
                    };
                    const frequency = lightCue[name] || 440;
                    scheduleTone(ctx,{frequency,endFrequency:frequency * (name === 'negative' || name === 'knockout' ? .78 : 1.08),duration:name === 'timer' ? .16 : .11,type:'sine',volume:.022});
                    return;
                }

                switch (name) {
                    case 'point':
                        // Quiet confirmation tick for normal classroom scoring.
                        scheduleTone(ctx, { frequency: 520, endFrequency: 690, duration: 0.075, type: 'triangle', volume: 0.035 });
                        scheduleTone(ctx, { start: 0.055, frequency: 780, duration: 0.08, type: 'sine', volume: 0.025 });
                        break;
                    case 'chestReady':
                        scheduleTone(ctx,{frequency:392,endFrequency:587.33,duration:.28,type:'triangle',volume:.026});
                        scheduleTone(ctx,{start:.18,frequency:783.99,duration:.36,type:'sine',volume:.022});
                        break;
                    case 'chestCharge':
                        scheduleTone(ctx,{frequency:110,endFrequency:330,duration:1.25,type:'sawtooth',volume:.028,release:.25});
                        scheduleNoise(ctx,{start:.1,duration:.8,volume:.012,highpass:900});
                        break;
                    case 'chestOpen':
                        scheduleTone(ctx,{frequency:170,endFrequency:85,duration:.42,type:'square',volume:.035});
                        scheduleNoise(ctx,{duration:.34,volume:.022,highpass:420});
                        break;
                    case 'traitReveal':
                        [392,523.25,659.25,880].forEach((frequency,i)=>scheduleTone(ctx,{start:i*.085,frequency,endFrequency:frequency*1.06,duration:.42,type:'sine',volume:.034}));
                        break;
                    case 'evolve':
                        [220, 330, 440, 660, 880].forEach((frequency, i) => {
                            scheduleTone(ctx, { start: i * 0.085, frequency, endFrequency: frequency * 1.16, duration: 0.32, type: i < 2 ? 'triangle' : 'sine', volume: 0.055 });
                        });
                        scheduleNoise(ctx, { start: 0.18, duration: 0.42, volume: 0.028, highpass: 1100 });
                        break;
                    case 'win':
                        [261.63, 329.63, 392.00, 523.25].forEach((frequency, i) => {
                            scheduleTone(ctx, { start: i * 0.13, frequency, duration: 0.5, type: 'triangle', volume: 0.065 });
                        });
                        [523.25, 659.25, 783.99].forEach(frequency => {
                            scheduleTone(ctx, { start: 0.58, frequency, duration: 0.8, type: 'sine', volume: 0.045 });
                        });
                        break;
                    case 'snitch':
                        [1250, 1580, 1975, 1540].forEach((frequency, i) => {
                            scheduleTone(ctx, { start: i * 0.075, frequency, endFrequency: frequency * 1.18, duration: 0.15, type: 'sine', volume: 0.042 });
                        });
                        scheduleNoise(ctx, { start: 0, duration: 0.34, volume: 0.018, highpass: 2400 });
                        break;
                    case 'wheel':
                        scheduleTone(ctx, { frequency: 392, duration: 0.16, type: 'triangle', volume: 0.045 });
                        scheduleTone(ctx, { start: 0.10, frequency: 523.25, duration: 0.24, type: 'sine', volume: 0.04 });
                        break;
                    case 'timer':
                        [0, 0.20, 0.40].forEach(start => {
                            scheduleTone(ctx, { start, frequency: 880, endFrequency: 700, duration: 0.15, type: 'square', volume: 0.04 });
                        });
                        break;
                    case 'vortex':
                        scheduleTone(ctx, { frequency: 150, endFrequency: 52, duration: 1.2, type: 'sawtooth', volume: 0.045, release: 0.3 });
                        scheduleNoise(ctx, { start: 0.05, duration: 0.9, volume: 0.022, highpass: 180 });
                        break;
                    case 'battleStart':
                        scheduleTone(ctx, { frequency: 92, endFrequency: 46, duration: .62, type: 'sawtooth', volume: .045, release:.25 });
                        scheduleTone(ctx, { start:.18, frequency: 220, endFrequency: 440, duration: .42, type:'triangle', volume:.035 });
                        scheduleNoise(ctx, { start:0, duration:.48, volume:.025, highpass:280 });
                        break;
                    case 'signature':
                        scheduleTone(ctx, { frequency: 180, endFrequency: 720, duration: .44, type:'sawtooth', volume:.045 });
                        scheduleTone(ctx, { start:.16, frequency: 880, duration:.32, type:'triangle', volume:.035 });
                        scheduleNoise(ctx, { start:.19, duration:.34, volume:.025, highpass:850 });
                        break;
                    case 'relic':
                        [392,523.25,659.25,783.99].forEach((frequency,i)=>scheduleTone(ctx,{start:i*.07,frequency,duration:.38,type:'sine',volume:.035}));
                        break;
                    case 'critical':
                        scheduleTone(ctx, { frequency: 130, endFrequency: 65, duration:.24, type:'square', volume:.04 });
                        scheduleNoise(ctx, { start:0, duration:.18, volume:.025, highpass:500 });
                        break;
                    case 'knockout':
                        scheduleTone(ctx, { frequency: 180, endFrequency: 48, duration:.72, type:'sawtooth', volume:.052, release:.28 });
                        scheduleNoise(ctx, { start:.04, duration:.38, volume:.025, highpass:220 });
                        break;
                    case 'unityComplete':
                        [392,523.25,659.25,783.99].forEach((frequency,i)=>scheduleTone(ctx,{start:i*.11,frequency,endFrequency:frequency*1.08,duration:.52,type:'triangle',volume:.04}));
                        scheduleNoise(ctx,{start:.18,duration:.55,volume:.016,highpass:1600});
                        break;
                    case 'unityAwaken':
                        scheduleTone(ctx,{frequency:220,endFrequency:440,duration:.56,type:'triangle',volume:.035});
                        scheduleTone(ctx,{start:.18,frequency:660,duration:.42,type:'sine',volume:.028});
                        break;
                    case 'unityForge':
                        scheduleTone(ctx,{frequency:96,endFrequency:192,duration:1.15,type:'sawtooth',volume:.034,release:.28});
                        scheduleTone(ctx,{start:.25,frequency:288,endFrequency:432,duration:.9,type:'triangle',volume:.026});
                        scheduleNoise(ctx,{start:.12,duration:.82,volume:.015,highpass:500});
                        break;
                    case 'unityAssemble':
                        [330,440,554.37].forEach((frequency,i)=>scheduleTone(ctx,{start:i*.07,frequency,endFrequency:frequency*1.12,duration:.44,type:'sine',volume:.026}));
                        break;
                    case 'unityReveal':
                        [196,246.94,293.66,392,523.25].forEach((frequency,i)=>scheduleTone(ctx,{start:i*.09,frequency,duration:.82,type:i<2?'triangle':'sine',volume:.042}));
                        scheduleNoise(ctx,{start:.18,duration:.65,volume:.021,highpass:900});
                        break;
                    case 'unityAscend':
                        [261.63,392,523.25,783.99].forEach((frequency,i)=>scheduleTone(ctx,{start:i*.065,frequency,endFrequency:frequency*1.1,duration:.48,type:i<2?'triangle':'sine',volume:.034}));
                        scheduleNoise(ctx,{start:.1,duration:.36,volume:.014,highpass:1500});
                        break;
                    case 'test':
                        scheduleTone(ctx, { frequency: 523.25, duration: 0.12, type: 'triangle', volume: 0.045 });
                        scheduleTone(ctx, { start: 0.10, frequency: 783.99, duration: 0.2, type: 'sine', volume: 0.04 });
                        break;
                }
            }

            // v11.0.0 Vixar Saga sounds, synthesised like the rest of the palette (no audio files).
            function playSagaSound(ctx, name, detail) {
                switch (name) {
                    case 'heartbeat':
                        // Two low thumps: lub-dub.
                        [0, .24].forEach((start, i) => {
                            scheduleTone(ctx, { start, frequency:i ? 58 : 66, endFrequency:38, duration:.22, type:'sine', volume:i ? .09 : .12, release:.14 });
                            scheduleNoise(ctx, { start, duration:.05, volume:.012, highpass:120 });
                        });
                        return true;
                    case 'shatterCrystal':
                        [2093, 2637, 3136, 2349, 2794].forEach((frequency, i) => scheduleTone(ctx, { start:i * .045, frequency, endFrequency:frequency * .82, duration:.32, type:'triangle', volume:.03 }));
                        scheduleNoise(ctx, { duration:.4, volume:.03, highpass:3200 });
                        return true;
                    case 'shatterEmber':
                        scheduleNoise(ctx, { duration:.9, volume:.04, highpass:600 });
                        scheduleTone(ctx, { frequency:220, endFrequency:70, duration:.8, type:'sawtooth', volume:.03, release:.3 });
                        [0, .12, .26, .41].forEach(start => scheduleNoise(ctx, { start, duration:.06, volume:.03, highpass:2400 }));
                        return true;
                    case 'shatterMetal':
                        [523.25, 739.99, 1046.5].forEach((frequency, i) => scheduleTone(ctx, { start:i * .03, frequency, endFrequency:frequency * .97, duration:1.1, type:'triangle', volume:.035, release:.6 }));
                        scheduleNoise(ctx, { duration:.3, volume:.035, highpass:1800 });
                        return true;
                    case 'goldCrack':
                        scheduleTone(ctx, { frequency:1567.98, endFrequency:1174.66, duration:.9, type:'sine', volume:.03, release:.5 });
                        scheduleNoise(ctx, { duration:.18, volume:.025, highpass:4000 });
                        return true;
                    case 'mergeOpen':
                        scheduleTone(ctx, { frequency:130.81, endFrequency:196, duration:1.2, type:'triangle', volume:.04, release:.4 });
                        scheduleTone(ctx, { start:.3, frequency:261.63, duration:.9, type:'sine', volume:.03 });
                        return true;
                    case 'mergeStep': {
                        // The merge chord rises one step with each correct answer of the pair.
                        const steps = [261.63, 329.63, 392, 493.88, 523.25];
                        const root = steps[Math.max(0, Math.min(4, Number(detail) || 0))];
                        [root, root * 1.5].forEach((frequency, i) => scheduleTone(ctx, { start:i * .06, frequency, duration:.55, type:i ? 'sine' : 'triangle', volume:.04 }));
                        return true;
                    }
                    case 'mergeResolve':
                        [523.25, 659.25, 783.99, 1046.5].forEach((frequency, i) => scheduleTone(ctx, { start:i * .07, frequency, duration:1.1, type:i < 2 ? 'triangle' : 'sine', volume:.04, release:.5 }));
                        scheduleNoise(ctx, { start:.2, duration:.5, volume:.015, highpass:2000 });
                        return true;
                    case 'curseBreak':
                        scheduleNoise(ctx, { duration:1.4, volume:.03, highpass:900 });
                        [196, 293.66, 392, 587.33].forEach((frequency, i) => scheduleTone(ctx, { start:.2 + i * .12, frequency, duration:1.6, type:'sine', volume:.035, release:.8 }));
                        return true;
                    case 'finaleTheme': {
                        // A warm major-key motif under the thank-you: C E G E | F A C' A | G…
                        const notes = [[261.63,0],[329.63,.42],[392,.84],[329.63,1.26],[349.23,1.68],[440,2.1],[523.25,2.52],[440,2.94],[392,3.36]];
                        notes.forEach(([frequency, start]) => scheduleTone(ctx, { start, frequency, duration:.7, type:'triangle', volume:.03, release:.35 }));
                        [[130.81,0],[174.61,1.68],[196,3.36]].forEach(([frequency, start]) => scheduleTone(ctx, { start, frequency, duration:1.6, type:'sine', volume:.03, release:.8 }));
                        return true;
                    }
                    default: return false;
                }
            }
            // The cut: a sudden stop of all sound at the false victory (music, scene sounds and anything already scheduled).
            function cutAllSound() {
                stopSceneSound();
                const ctx = audioContext;
                if (!ctx || !audioMasterGain) return;
                const now = ctx.currentTime;
                audioMasterGain.gain.cancelScheduledValues(now);
                audioMasterGain.gain.setValueAtTime(0, now);
                audioMasterGain.gain.setValueAtTime(isMuted ? 0 : 1, now + .9);
            }

            // Prime the audio context at the first genuine interaction. The actual effects are
            // still played only by their corresponding game actions.
            ['pointerdown', 'keydown', 'touchstart'].forEach(eventName => {
                window.addEventListener(eventName, unlockAudio, { once: true, passive: true });
            });

            let ultraFontRequested = false;
            function ensureUltraFont() {
                if (ultraFontRequested || isLeanMode()) return;
                ultraFontRequested = true;
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap';
                link.onload = () => document.body.classList.add('poppins-ready');
                link.onerror = () => { ultraFontRequested = false; };
                document.head.appendChild(link);
            }

            function updatePerformanceModeUI() {
                document.body.classList.toggle('performance-light', isLeanMode());
                document.body.classList.toggle('performance-animated', performanceMode === 'animated');
                document.body.dataset.performanceMode = performanceMode;
                document.querySelectorAll('.performance-option').forEach(option => {
                    option.setAttribute('aria-pressed', option.dataset.mode === performanceMode ? 'true' : 'false');
                });
                const indicator = document.getElementById('performance-mode-indicator');
                if (indicator) indicator.textContent = `${visualModeSymbols[performanceMode]} ${visualModeNames[performanceMode].toUpperCase()} MODE`;
                const toggleButton = document.getElementById('performance-mode-btn');
                if (toggleButton) {
                    toggleButton.textContent = visualModeSymbols[performanceMode];
                    const next = VISUAL_MODES[(VISUAL_MODES.indexOf(performanceMode) + 1) % VISUAL_MODES.length];
                    toggleButton.title = `Visual mode: ${visualModeNames[performanceMode]} — click for ${visualModeNames[next]}`;
                    toggleButton.setAttribute('aria-label', toggleButton.title);
                }
            }

            function setPerformanceMode(mode, { persist = true, initializeScenery = false } = {}) {
                mode = normalizeVisualMode(mode);
                if (!VISUAL_MODES.includes(mode)) return performanceMode;
                if (mode !== performanceMode && (LeagueScenes.active || isEvolving || unityEventRunning || battleState?.running || vixarRaidState?.running
                    || document.body.classList.contains('battle-active') || document.body.classList.contains('unity-event-active')
                    || document.body.classList.contains('vixar-raid-active') || document.getElementById('winner-overlay').classList.contains('visible'))) {
                    deferredPerformanceMode = mode;
                    if (window.syncStateToController) window.syncStateToController();
                    return performanceMode;
                }
                deferredPerformanceMode = null;
                const changed = mode !== performanceMode;
                performanceMode = mode;
                if (mode !== 'animated') deferredAnimatedEvolutions.clear();
                AnimatedMode.setEnabled(mode === 'animated');
                updatePerformanceModeUI();
                if (isLeanMode()) {
                    removeElementalScenery();
                    stopParticles();
                    stopBattleMusic(0.02);
                    cancelAllScoreAnimations({ settle:true });
                    clearAllAvatarReactions();
                    clearTimeout(idleTimer);
                    isFocusMode = false;
                    document.body.classList.remove('focus-mode');
                    document.getElementById('golden-snitch').style.display = 'none';
                    document.getElementById('battle-fx-layer')?.replaceChildren();
                    document.getElementById('vixar-fx-layer')?.replaceChildren();
                    clearTimeout(snitchTimer);
                    snitchTimer = null;
                } else {
                    ensureUltraFont();
                    if (initializeScenery) initializeElementalScenery();
                    if (document.body.classList.contains('session-started')) resetIdle();
                    scheduleSnitchCheck();
                }
                if (changed) teamsData.forEach(team => {
                    team.cachedSVG = '';
                    updateTeamDOM(team, true, true);
                    const spirit = document.getElementById(`unity-spirit-${team.id}`);
                    if (spirit) spirit.innerHTML = getAvatarSVG(team.id, team.traits);
                });
                if (persist) {
                    try { localStorage.setItem(PERFORMANCE_MODE_STORAGE_KEY, performanceMode); } catch (error) {}
                }
                if (window.syncStateToController) window.syncStateToController();
                // Also releases rewards earned before changing modes.
                if (changed) pumpPresentation();
                return performanceMode;
            }

            window.selectPerformanceMode = function(mode) {
                setPerformanceMode(mode, {
                    persist:true,
                    initializeScenery:document.body.classList.contains('session-started')
                });
            };

            // Class and student choices use the board's authoritative session state.
            function beginAgent(teamId) {
                if(LeagueScenes.active||currentEvent||pendingAnimatedFinish)return {ok:false,message:'Wait for the current event to finish.'};
                if(!selectedClass)return {ok:false,message:'Choose the class on the remote first.'};
                if(!teamsData.some(t=>t.id===teamId))return {ok:false,message:'Unknown team'};
                if(secretAgents.assignments[teamId])return {ok:false,message:'This team has already chosen its Secret Agent.'};
                if(secretAgents.request&&secretAgents.request.teamId!==teamId)return {ok:false,message:'Finish the open Secret Agent selection first.'};
                secretAgents.request={teamId,id:LeagueRecovery.uid()};
                teamsData.forEach(t=>updateTeamDOM(t));window.syncStateToController();scheduleCheckpoint();return {ok:true};
            }
            function revealAgents(teamId=null,finish=false) {
                if(LeagueScenes.active||currentEvent)return {ok:false,message:'Wait for the current event to finish.'};
                if(secretAgents.request)return {ok:false,message:'Choose or cancel the pending Secret Agent first.'};
                const ids=(teamId?[teamId]:Object.keys(secretAgents.assignments)).filter(id=>secretAgents.assignments[id]?.status==='active');
                if(!ids.length)return {ok:false,message:'No active Secret Agent.'};
                saveState();LeagueStudentUI.close(true);LeagueAgent.close();cancelAllScoreAnimations({settle:true});
                const revealed=LeagueAgent.transfer(secretAgents,ids,teamsData,studentContributions);
                secretAgents.reveal={teams:revealed,finish};
                LeagueAgent.renderReveal(secretAgents,selectedClass,teamsData,t=>getAvatarSVG(t.id,t.traits));LeagueScenes.enter('agent','reveal');
                for(const id of revealed){const a=secretAgents.assignments[id],p=LeagueAgent.person(selectedClass,a.studentId),target=teamsData.find(t=>t.id===id),source=teamsData.find(t=>t.id===a.sourceTeam);addHistoryLog(`Secret Agent revealed: ${p.name} · ${a.points.toLocaleString()} points from ${source.name} to ${target.name}.`,target.color);}
                // No award/evolution logic: only balances and their presentation change.
                teamsData.forEach(t=>updateTeamDOM(t));updateDynamicBackground();reorderUI('rank');
                checkpointNow();window.syncStateToController();document.getElementById('agent-continue').focus();return {ok:true};
            }
            function continueAgentReveal() {
                if(!secretAgents.reveal||LeagueScenes.active!=='agent')return {ok:false,message:'No reveal is open.'};
                const finish=secretAgents.reveal.finish;secretAgents.reveal=null;
                if(finish)pendingAnimatedFinish=true;
                LeagueScenes.leave('agent');checkpointNow();window.syncStateToController();pumpPresentation();return {ok:true};
            }
            function syncRemoteAgents(data) {
                remoteAgents=LeagueAgent.restore(remoteStudentClass,data.secretAgents);
                document.getElementById('agent-remote-reveal').hidden=data.scene!=='agent';
                for(const t of teamsData){
                    const button=document.getElementById(`mobile-agent-${t.id}`),a=remoteAgents.assignments[t.id];
                    button.classList.toggle('active',a?.status==='active'||remoteAgents.request?.teamId===t.id);button.classList.toggle('used',a?.status==='revealed');
                    button.setAttribute('aria-label',`${t.name} Secret Agent${a?.status==='active'?' — active':a?.status==='revealed'?' — completed':''}`);
                    button.disabled=remoteConnectionState!=='connected'||Boolean(remoteScene);
                }
                if(!remoteAgents.request){shownAgentRequest=null;if(document.getElementById('agent-picker')?.dataset.kind==='selection')LeagueAgent.close();return;}
                const r=remoteAgents.request;
                if(shownAgentRequest===r.id||remoteScene||remoteConnectionState!=='connected')return;
                shownAgentRequest=r.id;LeagueStudentUI.close(true);
                const sid=latestRemoteSessionId,c=remoteStudentClass;
                LeagueAgent.choose({className:c,team:teamsData.find(t=>t.id===r.teamId),teams:teamsData,state:remoteAgents,
                    onSelect:p=>{if(sid===latestRemoteSessionId&&c===remoteStudentClass)remoteCommands.enqueue('AGENT_ASSIGN',r.teamId,{className:c,studentId:p.id,requestId:r.id});},
                    onCancel:()=>remoteCommands.enqueue('AGENT_CANCEL',r.teamId,{requestId:r.id})});
                document.getElementById('agent-picker').dataset.kind='selection';
            }
            window.openRemoteAgent = function(teamId) {
                if(remoteConnectionState!=='connected'||remoteScene)return;
                const a=remoteAgents.assignments[teamId];
                if(a){LeagueAgent.details({className:remoteStudentClass,team:teamsData.find(t=>t.id===teamId),assignment:a,onReveal:()=>remoteCommands.enqueue('AGENT_REVEAL',teamId)});document.getElementById('agent-picker').dataset.kind='details';}
                else remoteCommands.enqueue('AGENT_BEGIN',teamId);
            };
            function updateStudentSessionUI() {
                window.LeagueIslandProgress?.select(remoteRole==='controller'?remoteStudentClass:selectedClass,remoteRole==='controller'||!window.remoteConnection?.open);
                window.LeaguePassportSeals?.render();
                document.getElementById('board-selected-class').textContent = selectedClass || 'Choose';
                document.getElementById('mobile-selected-class').textContent = remoteStudentClass || 'Choose';
                document.getElementById('mobile-class-btn').setAttribute('aria-label', remoteStudentClass ? `Class ${remoteStudentClass}` : 'Choose class');
                for (const teamId of LeagueStudents.teams) {
                    LeagueStudentUI.renderNextToInvite(document.getElementById(`mobile-invite-${teamId}`),remoteStudentClass,teamId,remoteStudentContributions);
                }
            }
            // v10.2.0 Comeback Halo: every team that won neither the League title nor the Final Arena in this class's
            // last session earns ×2 this session. Chosen with the class; a result that arrives later (Load islands, or
            // passed on by the phone) still counts until the first award, then the halo stays for the whole session.
            function refreshHalo() {
                if (remoteRole === 'controller') return;
                const last = LeagueStudents.validClass(selectedClass) ? globalThis.LeagueHalo?.result(selectedClass) : null;
                if (!haloLocked && last?.sessionId !== sessionId) haloTeams = LeagueStudents.validClass(selectedClass) && globalThis.LeagueHalo ? LeagueHalo.teams(selectedClass, sessionId) : [];
                paintHalos();
            }
            function paintHalos() { for (const team of teamsData) globalThis.LeagueHalo?.paint(team, haloTeams.includes(team.id)); }
            function lockHalo() { if (LeagueStudents.validClass(selectedClass)) haloLocked = true; }
            document.addEventListener('league-halo-result', () => { if (remoteRole !== 'controller') { refreshHalo(); window.syncStateToController?.(); } });
            function setSessionClass(className) {
                if (!LeagueStudents.validClass(className)) return {ok:false,message:'Unknown class'};
                if(selectedClass!==className&&(secretAgents.request||Object.keys(secretAgents.assignments).length))return {ok:false,message:'Start a new session to change class after choosing Secret Agent.'};
                if (selectedClass !== className && LeagueStudents.hasCredits(studentContributions)) {
                    return {ok:false,message:'Start a new session to change class'};
                }
                const classChanged = selectedClass !== className;
                selectedClass = className;
                if (classChanged) { handlePointChange(CLASS_STARTING_POINT_TIERS[className]); haloLocked = false; refreshHalo(); }
                // v11.0.0: the Rift belongs to the class it was opened for; a new class shows its own level cap.
                if (classChanged) { riftOpen = false; updateGameState(true); }
                updateStudentSessionUI(); scheduleCheckpoint();
                window.syncStateToController?.();
                return {ok:true};
            }
            window.openStudentClassPicker = function(afterAward = null) {
                const remote = remoteRole === 'controller';
                if (remote && (remoteConnectionState !== 'connected' || !remoteStudentTracking)) {
                    document.getElementById('mobile-command-status').textContent = remoteStudentTracking ? 'Wait for the board connection' : 'Update the board and phone to v8.5.1';
                    return;
                }
                if (['arena','raid','results','agent','finale'].includes(remote ? remoteScene : LeagueScenes.active)) return;
                const current = remote ? remoteStudentClass : selectedClass;
                LeagueStudentUI.chooseClass({selected:current,locked:LeagueStudents.hasCredits(remote ? remoteStudentContributions : studentContributions)||Object.keys((remote?remoteAgents:secretAgents).assignments).length>0,
                    onCancel:() => {pendingRemoteClassSelection = null;},
                    onSelect:className => {
                        if (remote) {
                            if (className === remoteStudentClass) { if (afterAward) requestStudentAward(afterAward.teamId,afterAward.options); return; }
                            pendingRemoteClassSelection = {className,afterAward,sessionId:latestRemoteSessionId};
                            if (!remoteCommands.enqueue('SET_CLASS',null,{className})) pendingRemoteClassSelection = null;
                        } else if (setSessionClass(className).ok && afterAward) requestStudentAward(afterAward.teamId,afterAward.options);
                    }
                });
            };
            function requestStudentAward(teamId, options = {}) {
                const remote = Boolean(options.remote);
                const className = remote ? remoteStudentClass : selectedClass;
                const sid = remote ? latestRemoteSessionId : sessionId;
                const scene = remote ? remoteScene : LeagueScenes.active;
                if (['arena','raid','results','agent','finale'].includes(scene)) return false;
                if (remote && (remoteConnectionState !== 'connected' || !remoteStudentTracking)) {
                    document.getElementById('mobile-command-status').textContent = remoteStudentTracking ? 'Wait for the board connection' : 'Update the board and phone to v8.5.1';
                    return false;
                }
                if (!className) { window.openStudentClassPicker({teamId,options}); return false; }
                const team = teamsData.find(t => t.id === teamId); if (!team) return false;
                const totals = remote ? remoteStudentContributions : studentContributions;
                LeagueStudentUI.chooseStudent({className,team,totals,pointValue:options.customPoints ?? (remote ? remotePointValue : currentPointValue),
                    onBack:LeagueStudents.hasCredits(totals) ? null : () => window.openStudentClassPicker({teamId,options}),
                    onSelect:person => {
                        if (sid !== (remote ? latestRemoteSessionId : sessionId) || className !== (remote ? remoteStudentClass : selectedClass)) return;
                        if (remote) remoteCommands.enqueue('ADD',teamId,{className,studentId:person.id,studentTrackingVersion:1});
                        else if (!['arena','raid','results','agent','finale'].includes(LeagueScenes.active)) {
                            if (options.customPoints !== undefined) applyCustomPoints(team,options.customPoints,person);
                            else applyTeamAward(teamId,{...options,studentId:person.id});
                        }
                    }
                });
                return true;
            }
            function syncStudentState(data) {
                // The board's lesson snapshot wins over this phone's newer editable catalogue.
                try {
                    if(data.rosterCatalog)LeagueRoster.accept(data.rosterCatalog);
                    LeagueStudents.useRoster(data.rosterSnapshot || LeagueStudents.defaults());
                } catch { document.getElementById('mobile-command-status').textContent='Roster sync failed. Reconnect both devices.';return false; }
                const localCatalog=LeagueRoster.current();
                if(localCatalog && localCatalog.version>(data.rosterCatalog?.version||0))safeRemoteSend({type:'ROSTER_CATALOG',catalog:localCatalog});
                const className = LeagueStudents.validClass(data.selectedClass) ? data.selectedClass : null;
                if (remoteStudentClass !== className) LeagueStudentUI.close(true);
                remoteStudentTracking = data.studentTrackingVersion === 1;
                remoteStudentClass = className;
                remoteStudentContributions = LeagueStudents.restore(className,data.studentContributions);
                remotePointValue = Number.isFinite(data.pointValue) ? data.pointValue : 10;
                updateStudentSessionUI();
                const pending = pendingRemoteClassSelection;
                if (pending && pending.sessionId === latestRemoteSessionId && pending.className === className) {
                    pendingRemoteClassSelection = null;
                    if (pending.afterAward) requestStudentAward(pending.afterAward.teamId,pending.afterAward.options);
                }
            }
            function recordStudentAward(team, person, points, detail = '') {
                if (!person || !Number.isFinite(points) || points <= 0) return;
                const firstContribution = !(studentContributions[person.id]?.awards > 0);
                LeagueStudents.credit(studentContributions,person,points);
                LeagueStudentUI.renderConstellation(document.getElementById(`constellation-${team.id}`),team,selectedClass,studentContributions,{animate:!recoveryRestoring});
                syncParticipationMission();
                LeagueStudentUI.celebrate(team,person,points,detail,{first:firstContribution&&!recoveryRestoring});
            }
            function renderChampionContributors(arenaWinner, leagueWinners) {
                LeagueStudentUI.renderContributors(document.getElementById('arena-contributors'),[arenaWinner],selectedClass,studentContributions);
                LeagueStudentUI.renderContributors(document.getElementById('league-contributors'),leagueWinners,selectedClass,studentContributions);
                LeagueStudentUI.renderTeamRecognition(document.getElementById('all-team-recognition-grid'),teamsData,selectedClass,studentContributions,
                    team => getAvatarSVG(team.id,team.traits));
                const label = document.getElementById('winner-session-class');
                label.hidden = !selectedClass;
                label.textContent = selectedClass ? `CLASS ${selectedClass} · PARTICIPATION THIS SESSION` : '';
            }

            function applyTeamAward(teamId,{remote=false,origin=null,studentId=null}={}) {
                const button=origin||document.getElementById(`mascot-${teamId}`);

                        const team = teamsData.find(t => t.id === teamId); if (!team) return;
                        const person = LeagueStudents.student(selectedClass,teamId,studentId);
                        if (selectedClass && !person) return;
                        if (person) lastAwardStudent.set(team.id, {id:person.id, name:person.name});
                        const previousLevel = team.level;
                        const rankingBefore = captureRankingSnapshot();
                        saveState();
                        
                        const previousPoints = team.points;
                        const award = LeagueRules.award({team,teams:teamsData,base:currentPointValue,lastTeam:lastTeamClicked,combo:comboCount,event:currentEvent,halo:haloTeams.includes(team.id)});
                        lockHalo();
                        comboCount=award.combo;lastTeamClicked=award.lastTeam;
                        const pts=award.points,scoreModifiers=award.modifiers;
                        team.points += pts;
                        const largeAward = Math.abs(pts) >= Math.max(1, currentPointValue * 2);
                        playElementReactionSound(team.id, largeAward ? 2 : 1);
                        
                        // Hardware Accelerated Particles
                        if (!isLeanMode() && button) {
                            const rect = button.getBoundingClientRect();
                            spawnParticles(rect.left + rect.width/2, rect.top, team.color, largeAward ? 25 : 15, largeAward);
                        }
                        
                        addHistoryLog(`+${pts.toLocaleString()} to ${team.name}${person ? ` · ${person.name} (${selectedClass})` : ''}${remote?' (via Remote)':''}`, team.color);
                        const beforeMilestones = team.points;
                        checkMilestones(team);
                        const milestoneBonus = team.points - beforeMilestones;
                        if (milestoneBonus > 0) scoreModifiers.push({ icon:'🏆', label:`Milestone +${milestoneBonus.toLocaleString()}` });
                        const chestBecameReady = awardEvolutionProgress(team);
                        recordStudentAward(team,person,team.points-previousPoints,team.level > previousLevel ? `Level ${team.level} unlocked` : chestBecameReady ? 'Evolution ready' : '');
                        animateTeamScore(team.id, {
                            fromValue: previousPoints,
                            targetValue: team.points,
                            delta: team.points - previousPoints,
                            modifiers: scoreModifiers
                        });
                        updateGameState({ teamId:team.id, updateVisuals:true, updateAvatar:false });
                        playAvatarReaction(team.id, largeAward ? 'large' : 'standard', { sound:false });
                        if (!isLeanMode()) {
                            if (chestBecameReady) setTimeout(() => playAvatarReaction(team.id,'chest-ready',{sound:false}), 440);
                            else if (progressionMode === 'hard' && team.evolutionProgress === 2) setTimeout(() => playAvatarReaction(team.id,'near-evolution',{sound:false}), 380);
                        }
                        scheduleRankingReactions(rankingBefore);
                        
                        if (isLeanMode()) LeagueMotion.channel('score',4).play(document.getElementById(`points-${team.id}`),team.id,[{transform:'scale(1)'},{transform:'scale(1.045)',offset:.35},{transform:'scale(1)'}],{duration:LeagueMotion.timing.point});
            }
            function resetTeamAction(teamId,{remote=false}={}) {
                const team=teamsData.find(t=>t.id===teamId);if(!team)return;
                saveState();cancelTeamScoreAnimation(team.id,{settle:false});LeagueRules.resetTeam(team);
                // Earned student contributions are a session achievement record. Resetting
                // a team's live game state must not erase the students' earlier work.
                LeagueStudentUI.clearCelebration(teamId);
                clearAvatarReaction(team.id);cancelAnimatedPresentation(team.id);LeagueMotion.channel('score',4).cancel(team.id);
                addHistoryLog(`${team.name} has been reset${remote?' (via Remote)':''}. Student contributions were preserved.`,'#ef4444');
                updateGameState({teamId:team.id,updateVisuals:true,updateAvatar:true});
            }

            function init() {
                teamsData.forEach(normalizeTeamRuntimeState);
                setPerformanceMode(performanceMode, { persist:false, initializeScenery:false });
                createInitialTeamCards();
                updateDynamicBackground();
                updateClassMissionUI();
                updateProgressionModeUI();
                updateVixarRaidAccess();
                resetIdle();

                document.getElementById('performance-mode-btn')?.addEventListener('click', () => {
                    setPerformanceMode(VISUAL_MODES[(VISUAL_MODES.indexOf(performanceMode) + 1) % VISUAL_MODES.length], {
                        persist:true,
                        initializeScenery:true
                    });
                });
                
                document.getElementById('teams-grid').addEventListener('click', (e) => {
                    const teamContainer = e.target.closest('.team-container');
                    if (isSwitchingMode && teamContainer) { handleSwitchSelection(teamContainer.id.replace('team-', '')); return; }
                    
                    const button = e.target.closest('button'); if (!button) return;
                    
                    if (button.classList.contains('btn-evolution-chest')) {
                        openEvolutionChest(button.dataset.teamId);
                        return;
                    }

                    if (button.classList.contains('btn-add-points')) {
                        requestStudentAward(button.dataset.teamId,{origin:button});
                    } else if (button.classList.contains('btn-reset-team')) {
                        resetTeamAction(button.dataset.teamId);
                    } else if (button.classList.contains('powerup-btn')) {
                        const team = teamsData.find(t => t.id === button.dataset.team);
                        if(button.dataset.type==='secretAgent'){const result=beginAgent(team.id);if(!result.ok)addHistoryLog(result.message,'#fbbf24');return;}
                        saveState();
                        const type = button.dataset.type;
                        const powerupResult=LeagueRules.togglePowerup(team,type);
                        if(powerupResult.blocked){
                            playAvatarReaction(team.id,'shield',{label:'Half Down blocked'});
                            addHistoryLog(`${team.name}: Shield blocked Half Down and was consumed.`,team.color);
                        }
                        updateTeamDOM(team);
                        window.syncStateToController();
                        if (team.powerups[type]) {
                            if (type === 'shield') playAvatarReaction(team.id,'shield');
                            else if (type === 'halfDown') playAvatarReaction(team.id,'debuff');
                            else playAvatarReaction(team.id,'powerup');
                        }
                    }
                });
            }

            // Focus Mode activates after a calm period and exits on any meaningful interaction.
            function activateFocusMode() {
                isFocusMode = true;
                document.body.classList.add('focus-mode');
            }
            function resetIdle() {
                if (isLeanMode()) {
                    clearTimeout(idleTimer);
                    isFocusMode = false;
                    if (document.body.classList.contains('focus-mode')) document.body.classList.remove('focus-mode');
                    return;
                }
                isFocusMode = false;
                if (document.body.classList.contains('focus-mode')) document.body.classList.remove('focus-mode');
                clearTimeout(idleTimer);
                idleTimer = setTimeout(activateFocusMode, 12000);
            }
            ['mousemove', 'mousedown', 'keydown', 'touchstart'].forEach(eventName => {
                document.addEventListener(eventName, resetIdle, { passive: true });
            });

            function checkMilestones(team) {
                for (const m of milestones) {
                    if (team.points >= m.points && !team.milestonesReached.includes(m.points)) {
                        team.milestonesReached.push(m.points); team.points += m.bonus;
                        addHistoryLog(`🏆 ${team.name} reached a milestone! +${m.bonus.toLocaleString()}`, 'gold');
                        if (!isLeanMode()) {
                            const rect = document.getElementById(`mascot-${team.id}`).getBoundingClientRect();
                            spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, 'gold', 30, true);
                        }
                    }
                }
            }

            function processEvolutionQueue() {
                // The old forced choice queue is intentionally retired. Ready chests remain
                // on their corresponding cards until the teacher or a student opens them.
                evolutionQueue = [];
                reorderUI();
            }

            window.selectEvolution = function() {
                // Backward-safe no-op for older cached inline handlers. New evolutions are
                // resolved only through openEvolutionChest().
            };

            function updateGameState(options = false) {
                scheduleCheckpoint();
                const normalizedOptions = typeof options === 'object'
                    ? {
                        updateVisuals:Boolean(options.updateVisuals),
                        updateAvatar:Boolean(options.updateAvatar),
                        teamId:options.teamId || null,
                        cardMotion:options.cardMotion || 'rank'
                    }
                    : { updateVisuals:Boolean(options), updateAvatar:Boolean(options), teamId:null, cardMotion:'rank' };
                teamsData.forEach(team => {
                    normalizeTeamRuntimeState(team);
                    if (team.evolutionProgress >= 3 && team.level < levelCap() && !team.pendingEvolution) prepareEvolutionChest(team,{announce:false});
                    if (!normalizedOptions.teamId || normalizedOptions.teamId === team.id) {
                        updateTeamDOM(team, normalizedOptions.updateVisuals, normalizedOptions.updateAvatar);
                    }
                });
                
                updateDynamicBackground();
                reorderUI(normalizedOptions.cardMotion);
                updateVixarRaidAccess();
                
                pumpPresentation();
                // Vortex check based on the new balancing rule AND Level 3 threshold
                const sortedTeams = [...teamsData].sort((a, b) => b.points - a.points);
                const leadingPoints = sortedTeams[0].points + sortedTeams[1].points;
                const losingPoints = sortedTeams[2].points + sortedTeams[3].points;
                const totalGamePoints = leadingPoints + losingPoints;
                
                // Check if ALL teams are at least Level 3
                const allTeamsLevel3 = teamsData.every(team => team.level >= 3);
                
                // New Vortex Rules: Cooldown, Dynamic Percentage Gap, and 30% Random Chance
                const now = Date.now();
                const VORTEX_COOLDOWN = 3 * 60 * 1000; // 3 minutes in milliseconds
                
                // The gap must be at least 15% of all points on the board (with a 5000 minimum safety net)
                const REQUIRED_GAP = Math.max(5000, totalGamePoints * 0.15); 
                
                if (!recoveryRestoring && !LeagueScenes.active && !currentEvent && allTeamsLevel3 && (now - lastVortexTime > VORTEX_COOLDOWN)) {
                    if (leadingPoints > 0 && leadingPoints > (losingPoints * 2) && (leadingPoints - losingPoints > REQUIRED_GAP)) {
                        // 30% chance to spawn per click (increased for more unpredictability)
                        if (Math.random() < 0.30) {
                            lastVortexTime = now; // Reset the cooldown timer
                            startVortexEvent();
                        }
                    }
                }
            }

            // v10.3.0: the four card places are measured whenever the grid changes size (the browser has just laid it
            // out, so reading them costs nothing), not in the middle of an award.
            let gridSlots = null;
            function measureGridSlots() {
                const grid = document.getElementById('teams-grid');
                if (!grid || !grid.offsetWidth || grid.children.length !== 4) { gridSlots = null; return; }
                gridSlots = Array.from(grid.children).map(el => ({ left: el.offsetLeft, top: el.offsetTop }));
            }
            if (typeof ResizeObserver === 'function') {
                const watchGrid = () => { const grid = document.getElementById('teams-grid'); if (grid) new ResizeObserver(measureGridSlots).observe(grid); else requestAnimationFrame(watchGrid); };
                watchGrid();
            }
            function reorderUI(motionReason='rank') {
                const grid = document.getElementById('teams-grid');
                if (!grid) return;
                const teamElements = Array.from(grid.children);
                const currentOrder = teamElements.map(el => el.id);
                teamsData.sort((a, b) => b.points - a.points);
                const desiredOrder = teamsData.map(team => `team-${team.id}`);
                const orderChanged = desiredOrder.some((id, index) => id !== currentOrder[index]);

                // Most score clicks do not change rank. Avoid layout reads and DOM moves in that case.
                if (!orderChanged) return;

                // Light restores only the meaningful card movement. Four layout reads occur
                // exclusively when the ranking actually changes; Web Animations then handles
                // one short transform-only FLIP with no shadows, filters or queued motion.
                if (isLeanMode()) {
                    const firstPositions = {};
                    // v10.1.1: the four team cards share one grid, so a card's new place is the old place of the slot
                    // it moves into. Without a slide in flight, layout offsets give both ends with a single layout
                    // pass and no second (forced) layout after the cards are moved.
                    if (!gridSlots && teamElements.every(el => !el._lightOrderMotion)) measureGridSlots();
                    // Places known (cards at rest, grid on screen): no layout reads at all. Otherwise measure the cards.
                    const settled = Boolean(gridSlots) && teamElements.every(el => !el._lightOrderMotion);
                    const slots = settled ? gridSlots : null;
                    teamElements.forEach((el, index) => {
                        firstPositions[el.id] = settled ? slots[index] : el.getBoundingClientRect();
                        el._lightOrderMotion?.cancel();
                        el._lightOrderMotion = null;
                        el.style.zIndex = '';
                    });
                    desiredOrder.forEach(id => grid.appendChild(document.getElementById(id)));
                    const duration = motionReason === 'switch' ? LeagueMotion.timing.switch : LeagueMotion.timing.reorder;
                    // v10.1.1: a student card on screen fades first; the slide waits for it (fill keeps the old places).
                    const hold = LeagueStudentUI.beforeSlide(duration);
                    teamElements.forEach(el => {
                        const firstPos = firstPositions[el.id];
                        const lastPos = settled ? slots[desiredOrder.indexOf(el.id)] : el.getBoundingClientRect();
                        const deltaX = firstPos.left - lastPos.left;
                        const deltaY = firstPos.top - lastPos.top;
                        if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;
                        el.style.zIndex = '12';
                        const motion = el.animate([
                            { transform:`translate3d(${deltaX}px,${deltaY}px,0)` },
                            { transform:'translate3d(0,0,0)' }
                        ],{
                            duration,
                            delay:hold,
                            fill:'backwards',
                            easing:'cubic-bezier(.2,.78,.22,1)'
                        });
                        el._lightOrderMotion = motion;
                        const cleanup = () => {
                            if (el._lightOrderMotion !== motion) return;
                            el._lightOrderMotion = null;
                            el.style.zIndex = '';
                        };
                        motion.addEventListener('finish',cleanup,{once:true});
                        motion.addEventListener('cancel',cleanup,{once:true});
                    });
                    return;
                }

                const firstPositions = {};
                teamElements.forEach(el => { firstPositions[el.id] = el.getBoundingClientRect(); });
                desiredOrder.forEach(id => grid.appendChild(document.getElementById(id)));
                const hold = LeagueStudentUI.beforeSlide(500);

                // Ultra preserves the existing animated FLIP reorder when ranking changes.
                teamElements.forEach(el => {
                    const lastPos = el.getBoundingClientRect();
                    const firstPos = firstPositions[el.id];
                    const deltaX = firstPos.left - lastPos.left;
                    const deltaY = firstPos.top - lastPos.top;

                    if (deltaX !== 0 || deltaY !== 0) {
                        // Invert: Apply reverse transform immediately without transition
                        el.style.transition = 'none';
                        el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                        
                        // Force reflow so the browser registers the inverted state
                        el.offsetWidth;
                        
                        // Play: Restore transition and slide to actual spot (0,0)
                        el.style.transition = `transform 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${hold}ms, box-shadow 0.3s ease, border-color 0.3s ease`;
                        el.style.transform = 'translate(0, 0)';
                        
                        // Cleanup after animation completes to restore normal hover effects
                        setTimeout(() => {
                            el.style.transition = '';
                            el.style.transform = '';
                        }, 500 + hold);
                    }
                });
            }

            function updateDynamicBackground() {
                // v10.3.0: the page's leader class changes only when the leader changes. Taking it off and putting it back
                // on every award made the browser re-check the style of every element on the board.
                const leaderClasses = ['leader-gryffindor', 'leader-slytherin', 'leader-hufflepuff', 'leader-ravenclaw'];
                const max = Math.max(...teamsData.map(t => t.points));
                const leaders = max > 0 ? teamsData.filter(t => t.points === max) : [];
                const wanted = leaders.length === 1 ? `leader-${leaders[0].id}` : null;
                for (const name of leaderClasses) if (name !== wanted && document.body.classList.contains(name)) document.body.classList.remove(name);
                if (wanted && !document.body.classList.contains(wanted)) document.body.classList.add(wanted);
                if (document.body.classList.contains('focus-mode') !== isFocusMode) document.body.classList.toggle('focus-mode', isFocusMode);
            }

            function showFloatingText(el, text, color) {
                if (isLeanMode()) return;
                const rect = el.getBoundingClientRect();
                const float = document.createElement('div');
                float.className = 'floating-text'; float.style.color = color; float.textContent = text;
                float.style.left = `${rect.left + rect.width/2 - 40}px`; float.style.top = `${rect.top}px`;
                document.body.appendChild(float); setTimeout(() => float.remove(), 1000);
            }

            // Utilities & Setup
            function saveState() {
                LeagueSession.push(historyStack,{
                    // SVG markup is derived data. Excluding it keeps the 20-step Undo stack
                    // small on low-memory classroom computers; avatars rebuild on restore.
                    teamsData,lastTeamClicked,comboCount,selectedClass,studentContributions,secretAgents,rosterSnapshot:LeagueStudents.snapshot(),
                    pointSliderValues,
                    sliderIndex: selectedPointTierIndex,
                    currentPointValue,
                    progressionMode,
                    animatedWheels: [...(activeAnimatedWheel ? [activeAnimatedWheel] : []), ...pendingAnimatedWheels],
                    deferredAnimatedEvolutions: [...deferredAnimatedEvolutions],
                    classMission: {
                        target: classMission.target,
                        progress: classMission.progress,
                        completed: classMission.completed,
                        eventPlayed: classMission.eventPlayed,
                        rewardGranted: classMission.rewardGranted
                    }
                });
                document.getElementById('undo-btn').disabled = false;
            }
            document.getElementById('undo-btn').addEventListener('click', () => {
                if (historyStack.length === 0) return;
                const snapshot = LeagueSession.pop(historyStack);
                lastTeamClicked=snapshot.lastTeamClicked??null;comboCount=snapshot.comboCount??0;
                LeagueStudents.useRoster(snapshot.rosterSnapshot || LeagueStudents.defaults());
                selectedClass = LeagueStudents.validClass(snapshot.selectedClass) ? snapshot.selectedClass : null;
                studentContributions = LeagueStudents.restore(selectedClass,snapshot.studentContributions);
                secretAgents=LeagueAgent.restore(selectedClass,snapshot.secretAgents);LeagueAgent.close();
                if(LeagueScenes.active==='agent')LeagueScenes.leave('agent');
                LeagueStudentUI.close(true);LeagueStudentUI.clearCelebrations();updateStudentSessionUI();
                cancelAnimatedPresentation();
                pendingAnimatedWheels = Array.isArray(snapshot.animatedWheels) ? snapshot.animatedWheels : [];
                (snapshot.deferredAnimatedEvolutions || []).forEach(id => deferredAnimatedEvolutions.add(id));
                if (Array.isArray(snapshot)) {
                    teamsData = snapshot;
                } else {
                    teamsData = snapshot.teamsData;
                    if (snapshot.classMission) {
                        Object.assign(classMission, snapshot.classMission);
                        classMission.rewardGranted = Boolean(snapshot.classMission.rewardGranted);
                    }
                    if (Array.isArray(snapshot.pointSliderValues)) pointSliderValues = snapshot.pointSliderValues;
                    if (Number.isInteger(snapshot.sliderIndex)) selectedPointTierIndex = snapshot.sliderIndex;
                    currentPointValue = snapshot.currentPointValue ?? pointSliderValues[selectedPointTierIndex];
                    if (snapshot.progressionMode === 'soft' || snapshot.progressionMode === 'hard') progressionMode = snapshot.progressionMode;
                }
                teamsData.forEach(normalizeTeamRuntimeState);
                cancelAllScoreAnimations({ settle: false });
                clearEvolutionChestTimers();
                clearAllAvatarReactions();
                cancelUnityEvent({ preserveCompletion: true, immediate: true });
                syncParticipationMission({allowCompletion:false});
                updateClassMissionUI();
                updateProgressionModeUI();
                addHistoryLog('⏪ Last action undone.', '#94a3b8');
                
                // Safely reset the queue so we don't accidentally evaluate invalid states 
                // leftover from the undone action.
                evolutionQueue = [];
                isEvolving = false;
                activeEvolutionTeamId = null;
                document.getElementById('evolution-modal').classList.remove('visible');
                document.getElementById('evolution-modal').setAttribute('aria-hidden','true');
                handlePointChange();
                updateGameState(true);
                document.getElementById('undo-btn').disabled = historyStack.length === 0;
            });

            function renderFullHistory() {
                const log = document.getElementById('history-log');
                if (!historyLog.length) {
                    log.innerHTML = '<div class="history-empty">No league activity yet.</div>';
                    return;
                }
                log.innerHTML = historyLog.map(i => `
                    <div class="history-entry" style="border-color: ${i.color}">
                        <div class="text-xs font-mono text-slate-500 mb-1">${i.d}</div>
                        <div class="text-sm font-semibold text-slate-200">${i.msg}</div>
                    </div>`).join('');
            }

            function addHistoryLog(msg, color) {
                scheduleCheckpoint();
                const d = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                historyLog.unshift({ msg, color, d });
                if (historyLog.length > 120) historyLog.length = 120;
                if (document.getElementById('history-modal')?.classList.contains('visible')) renderFullHistory();

                const ticker = document.getElementById('ticker-message');
                document.getElementById('ticker-time').textContent = d;
                const tickerText = document.getElementById('ticker-text');
                tickerText.textContent = msg;
                if (isLeanMode()) {
                    tickerText.style.textShadow = 'none';
                    ticker.classList.remove('ticker-refresh');
                } else {
                    tickerText.style.textShadow = `0 0 14px ${color}`;
                    ticker.classList.remove('ticker-refresh');
                    void ticker.offsetWidth;
                    ticker.classList.add('ticker-refresh');
                }
            }

            document.getElementById('full-history-btn').addEventListener('click', () => {
                renderFullHistory();
                document.getElementById('history-modal').classList.add('visible');
            });
            document.getElementById('close-history-btn').addEventListener('click', () => {
                document.getElementById('history-modal').classList.remove('visible');
            });
            document.getElementById('history-modal').addEventListener('click', (event) => {
                if (event.target.id === 'history-modal') event.currentTarget.classList.remove('visible');
            });

            // Events
            const pointTierButtons = [...document.querySelectorAll('.point-tier-btn')];
            function formatPointTierButton(value) {
                const numeric = Number(value) || 0;
                const absolute = Math.abs(numeric);
                const sign = numeric < 0 ? '-' : '';
                const tiers = [
                    { suffix: 'T', value: 1e12 },
                    { suffix: 'B', value: 1e9 },
                    { suffix: 'M', value: 1e6 }
                ];
                const tier = tiers.find(item => absolute >= item.value);
                if (!tier) return Math.round(numeric).toLocaleString('en-US');
                const scaled = absolute / tier.value;
                const decimals = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
                return `${sign}${scaled.toFixed(decimals).replace(/\.?0+$/, '')}${tier.suffix}`;
            }
            function handlePointChange(index = selectedPointTierIndex) {
                scheduleCheckpoint();
                selectedPointTierIndex = Math.max(0, Math.min(pointSliderValues.length - 1, Number(index) || 0));
                currentPointValue = pointSliderValues[selectedPointTierIndex];
                pointTierButtons.forEach((button, buttonIndex) => {
                    const active = buttonIndex === selectedPointTierIndex;
                    const exactValue = pointSliderValues[buttonIndex];
                    button.textContent = formatPointTierButton(exactValue);
                    button.title = `${exactValue.toLocaleString('en-US')} points`;
                    button.setAttribute('aria-label', `Add ${exactValue.toLocaleString('en-US')} points`);
                    button.classList.toggle('active', active);
                    button.setAttribute('aria-pressed', active ? 'true' : 'false');
                });
            }
            pointTierButtons.forEach(button => button.addEventListener('click', () => handlePointChange(button.dataset.tierIndex)));
            handlePointChange();

            function updateClassMissionUI() {
                scheduleCheckpoint();
                const panel = document.getElementById('class-mission-panel');
                if (!panel) return;
                const progress = Math.max(0, Math.min(classMission.target, Number(classMission.progress) || 0));
                classMission.progress = progress;
                const percentage = classMission.target > 0 ? (progress / classMission.target) * 100 : 0;
                panel.style.setProperty('--mission-progress', `${percentage}%`);
                panel.classList.toggle('completed', classMission.completed);
                const meter = panel.querySelector('.class-mission-meter');
                meter?.setAttribute('aria-valuemax', String(classMission.target));
                meter?.setAttribute('aria-valuenow', String(progress));
                document.getElementById('class-mission-count').textContent = `${progress} / ${classMission.target}`;
                document.getElementById('class-mission-status').textContent = classMission.completed
                    ? (unityEventQueued
                        ? 'Mission completed · ascension waiting for a clear moment'
                        : classMission.rewardGranted
                            ? 'Mission completed · team ascensions granted'
                            : 'Mission completed · Unity Ascension ready')
                    : '15 different students contributing together';
                document.getElementById('class-mission-reward').textContent = classMission.completed
                    ? (classMission.rewardGranted ? '✓ +3 Evolutions Granted' : 'Unity Ascension Ready')
                    : 'Reward: +3 Evolutions per Team';
                document.getElementById('class-mission-replay').disabled = !classMission.completed || unityEventRunning || unityEventQueued;
                updateVixarRaidAccess();
                if (typeof window.syncStateToController === 'function') window.syncStateToController();
            }

            function resetClassMissionState({ silent = false } = {}) {
                cancelUnityEvent({ preserveCompletion: false, immediate: true });
                classMission.target = CLASS_MISSION_TARGET;
                classMission.progress = 0;
                classMission.completed = false;
                classMission.eventPlayed = false;
                classMission.rewardGranted = false;
                unityAscensionState = null;
                unityEventQueued = false;
                unityEventQueuedReplay = false;
                if (unityEventQueueTimer) { clearTimeout(unityEventQueueTimer); unityEventQueueTimer = null; }
                updateClassMissionUI();
                if (!silent) addHistoryLog('Class Mission reset.', '#60a5fa');
            }

            function syncParticipationMission({allowCompletion = true} = {}) {
                classMission.target = CLASS_MISSION_TARGET;
                const count = LeagueStudents.uniqueCount(selectedClass,studentContributions);
                // Preserve an already-earned mission when resuming an older version.
                classMission.progress = classMission.completed ? CLASS_MISSION_TARGET : Math.min(CLASS_MISSION_TARGET,count);
                if (allowCompletion && !classMission.completed && count >= CLASS_MISSION_TARGET) {
                    completeClassMission({skipSave:true});
                    return;
                }
                updateClassMissionUI();
            }

            function completeClassMission({ skipSave = false } = {}) {
                if (classMission.completed) return;
                if (LeagueStudents.uniqueCount(selectedClass,studentContributions) < CLASS_MISSION_TARGET) return;
                if (!skipSave) saveState();
                classMission.progress = classMission.target;
                classMission.completed = true;
                addHistoryLog('🤝 Class Mission completed — Unity Guardian will grant up to three evolutions to every team!', '#60a5fa');
                updateClassMissionUI();
                playSound('unityComplete');
                requestUnityEvent(false);
            }

            function unityEventIsBlocked() {
                if (presentationHeld || unityEventRunning || LeagueScenes.active || AnimatedMode.getDiagnostics().active || AnimatedMode.getDiagnostics().queued) return true;
                if (battleState?.running || vixarRaidState?.running || document.body.classList.contains('battle-active') || document.body.classList.contains('vixar-raid-active')) return true;
                if (isEvolving || currentEvent === 'Vortex' || currentEvent === 'PointRush') return true;
                if (document.querySelector('.modal-overlay.visible')) return true;
                return false;
            }

            function scheduleUnityQueueCheck() {
                if (unityEventQueueTimer) return;
                unityEventQueueTimer = setTimeout(() => {
                    unityEventQueueTimer = null;
                    if (!unityEventQueued) return;
                    if (!unityEventIsBlocked()) startUnityEvent(unityEventQueuedReplay);
                    else scheduleUnityQueueCheck();
                }, 450);
            }

            function requestUnityEvent(isReplay = false) {
                if (!classMission.completed || unityEventRunning) return;
                if (unityEventIsBlocked()) {
                    unityEventQueued = true;
                    unityEventQueuedReplay = Boolean(isReplay);
                    updateClassMissionUI();
                    scheduleUnityQueueCheck();
                    return;
                }
                unityEventQueued = false;
                unityEventQueuedReplay = false;
                updateClassMissionUI();
                startUnityEvent(isReplay);
            }

            function unitySchedule(callback,delay) {return unityClock.after(callback,delay);}
            function clearUnityEventTimers() {unityClock.clear();}

            function setUnityCaption(title, subtitle) {
                const overlay = document.getElementById('unity-event-overlay');
                overlay.classList.remove('caption-visible');
                unitySchedule(() => {
                    document.getElementById('unity-event-title').textContent = title;
                    document.getElementById('unity-event-subtitle').textContent = subtitle;
                    overlay.classList.add('caption-visible');
                }, 80);
            }

            function buildUnityEventGeometry() {
                const svg = document.getElementById('unity-stream-svg');
                const width = window.innerWidth;
                const height = window.innerHeight;
                const centerX = width / 2;
                const centerY = height * .52;
                svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

                teamsData.forEach(team => {
                    const card = document.getElementById(`team-${team.id}`);
                    const rect = card?.getBoundingClientRect();
                    const animatedSlot = { gryffindor:[.14,.40], slytherin:[.86,.40], hufflepuff:[.14,.73], ravenclaw:[.86,.73] }[team.id];
                    const startX = performanceMode === 'animated' ? width * animatedSlot[0] : rect ? rect.left + rect.width / 2 : width / 2;
                    const startY = performanceMode === 'animated' ? height * animatedSlot[1] : rect ? rect.top + rect.height * .47 : height * .72;
                    const side = startX < centerX ? -1 : 1;
                    const control1X = startX + side * Math.min(130, Math.abs(centerX - startX) * .28);
                    const control1Y = startY - Math.min(150, Math.abs(centerY - startY) * .38 + 40);
                    const control2X = centerX - side * 150;
                    const control2Y = centerY + (startY > centerY ? 95 : -75);
                    const pathData = `M ${startX} ${startY} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${centerX} ${centerY}`;

                    const path = document.getElementById(`unity-stream-${team.id}`);
                    const flow = document.getElementById(`unity-flow-${team.id}`);
                    path.setAttribute('d', pathData);
                    flow.setAttribute('d', pathData);
                    const spirit = document.getElementById(`unity-spirit-${team.id}`);
                    spirit.style.left = `${startX}px`;
                    spirit.style.top = `${startY}px`;
                    spirit.innerHTML = getAvatarSVG(team.id, team.traits);
                    const badge = document.getElementById(`unity-ascension-badge-${team.id}`);
                    if (badge) {
                        badge.style.left = `${startX}px`;
                        badge.style.top = `${Math.min(height - 82, startY + Math.max(72, Math.min(112, height * .11)))}px`;
                    }

                    requestAnimationFrame(() => {
                        const length = Math.max(1, path.getTotalLength());
                        path.style.strokeDasharray = `${length}`;
                        path.style.strokeDashoffset = `${length}`;
                    });
                });
            }

            const unityGuardianPartIds = ['unity-guardian-base','unity-guardian-nature','unity-guardian-water','unity-guardian-fire','unity-guardian-air','unity-guardian-unity'];

            function setUnityGuardianPartVisible(id, visible = true) {
                document.getElementById(id)?.classList.toggle('show', visible);
            }

            function setAllUnityGuardianPartsVisible(visible = true) {
                unityGuardianPartIds.forEach(id => setUnityGuardianPartVisible(id, visible));
                document.querySelectorAll('#unity-guardian-animated-art .guardian-piece').forEach(part => part.classList.toggle('show', visible));
            }

            function resetUnityEventVisuals() {
                document.body.classList.remove('unity-reward-active');
                const overlay = document.getElementById('unity-event-overlay');
                overlay.classList.remove('active', 'closing', 'caption-visible', 'light-cinematic');
                overlay.setAttribute('aria-hidden', 'true');
                LeagueScenes.leave('unity');GuardianAssembly.stop();
                document.querySelectorAll('.team-container.unity-source-awake').forEach(el => el.classList.remove('unity-source-awake'));
                document.querySelectorAll('.unity-spirit').forEach(el => { el.classList.remove('visible','charged','dissolve','ascension-target','ascension-pulse'); el.innerHTML = ''; });
                document.querySelectorAll('.unity-stream,.unity-stream-flow').forEach(el => el.classList.remove('show','granting'));
                document.querySelectorAll('.unity-ascension-badge').forEach(el => {
                    el.classList.remove('show','maxed');
                    el.querySelector('.unity-ascension-step').textContent = '';
                    el.querySelector('.unity-ascension-trait').textContent = '';
                    el.querySelector('.unity-ascension-level').textContent = '';
                });
                document.getElementById('unity-forge').classList.remove('active');
                document.getElementById('unity-guardian-stage').classList.remove('revealed','victory','granting');
                setAllUnityGuardianPartsVisible(false);
                document.getElementById('unity-screen-flash').classList.remove('active');
                document.querySelectorAll('.unity-final-wave').forEach(el => { el.classList.remove('go'); void el.offsetWidth; });
            }

            function cancelUnityEvent({ preserveCompletion = true, immediate = false } = {}) {
                clearUnityEventTimers();
                unityEventRunning = false;
                unityEventQueued = false;
                unityEventQueuedReplay = false;
                unityAscensionState = null;
                if (currentEvent === 'Unity') currentEvent = null;
                if (!preserveCompletion) {
                    classMission.completed = false;
                    classMission.eventPlayed = false;
                    classMission.rewardGranted = false;
                }
                const overlay = document.getElementById('unity-event-overlay');
                if (!overlay) return;
                if (immediate) resetUnityEventVisuals();
                else {
                    overlay.classList.add('closing');
                    unitySchedule(resetUnityEventVisuals, 480);
                }
                updateClassMissionUI();
            }

            function createUnityAscensionPlan() {
                const plan = { wave: 0, totalGranted: 0, teamPlans: new Map() };
                teamsData.forEach(team => {
                    normalizeTeamRuntimeState(team);
                    const remainingLevels = Math.max(0, levelCap() - team.level);
                    const grantCount = Math.min(3, remainingLevels);
                    const pendingTraitId = team.pendingEvolution?.selectedTraitId || null;
                    // Levels up to 10 draw from the original traits (the chest's stored trait last, as before); Levels 11
                    // and 12 take their own saga trophy.
                    const baseCount = Math.max(0, Math.min(grantCount, 10 - team.level));
                    const unowned = traitsForStage(team.id, Math.min(10, team.level + 1), team.traits);
                    const nonReserved = shuffleTraits(unowned.filter(trait => trait.id !== pendingTraitId));
                    const reserved = pendingTraitId ? unowned.find(trait => trait.id === pendingTraitId) : null;
                    const ordered = reserved ? [...nonReserved, reserved] : nonReserved;
                    const sagaIds = [];
                    for (let stage = Math.max(11, team.level + 1); stage <= team.level + grantCount; stage++) {
                        const trophy = traitsForStage(team.id, stage, team.traits)[0];
                        if (trophy) sagaIds.push(trophy.id);
                    }
                    plan.teamPlans.set(team.id, {
                        traitIds: [...ordered.slice(0, baseCount).map(trait => trait.id), ...sagaIds],
                        applied: 0,
                        originalProgress: team.evolutionProgress,
                        pendingTraitId,
                        grantedNames: []
                    });
                });
                return plan;
            }

            function prepareUnityAscensionVisuals() {
                document.body.classList.add('unity-reward-active');
                setUnityCaption('Threefold Ascension', 'The Guardian grants three consecutive levels');
                teamsData.forEach(team => {
                    const spirit = document.getElementById(`unity-spirit-${team.id}`);
                    if (spirit) {
                        spirit.classList.remove('dissolve','charged');
                        spirit.classList.add('visible','ascension-target');
                        spirit.innerHTML = getAvatarSVG(team.id, team.traits);
                    }
                    document.getElementById(`unity-stream-${team.id}`)?.classList.add('show');
                    document.getElementById(`unity-flow-${team.id}`)?.classList.add('show');
                });
            }

            function refreshPendingEvolutionAfterUnity(team, consumedPendingTrait) {
                if (team.level >= levelCap()) {
                    team.pendingEvolution = null;
                    team.evolutionProgress = 0;
                    return;
                }
                if (!team.pendingEvolution) return;
                if (consumedPendingTrait || team.traits.includes(team.pendingEvolution.selectedTraitId)) {
                    team.pendingEvolution = null;
                    team.evolutionProgress = 0;
                    return;
                }
                const selectedTraitId = team.pendingEvolution.selectedTraitId;
                // A stored trait that no longer belongs to the next stage (Level 10 → 11) is replaced by that stage's own.
                if (!traitsForStage(team.id, team.level + 1, team.traits).some(trait => trait.id === selectedTraitId)) {
                    const fresh = traitsForStage(team.id, team.level + 1, team.traits);
                    if (!fresh.length) { team.pendingEvolution = null; team.evolutionProgress = 0; return; }
                    const candidates = shuffleTraits(fresh).slice(0, 2);
                    team.pendingEvolution = { ...team.pendingEvolution, stage:team.level + 1, candidateIds:candidates.map(trait => trait.id), selectedTraitId:candidates[0].id };
                    team.evolutionProgress = 3;
                    return;
                }
                const availableOther = shuffleTraits(traitsForStage(team.id, team.level + 1, team.traits).filter(trait => trait.id !== selectedTraitId))[0];
                team.pendingEvolution = {
                    ...team.pendingEvolution,
                    stage: team.level + 1,
                    candidateIds: availableOther ? [selectedTraitId, availableOther.id] : [selectedTraitId]
                };
                team.evolutionProgress = 3;
            }

            function applyUnityAscensionWave(waveIndex, { animate = true } = {}) {
                if (!unityAscensionState) return 0;
                const guardian = document.getElementById('unity-guardian-stage');
                if (animate) {
                    guardian?.classList.remove('granting');
                    void guardian?.offsetWidth;
                    guardian?.classList.add('granting');
                    document.querySelectorAll('.unity-stream,.unity-stream-flow').forEach(el => el.classList.add('granting'));
                    document.getElementById('unity-screen-flash')?.classList.add('active');
                    unitySchedule(() => document.getElementById('unity-screen-flash')?.classList.remove('active'), 230);
                }

                let grantsThisWave = 0;
                teamsData.forEach(team => {
                    const teamPlan = unityAscensionState.teamPlans.get(team.id);
                    const traitId = teamPlan?.traitIds[waveIndex];
                    const badge = document.getElementById(`unity-ascension-badge-${team.id}`);
                    const spirit = document.getElementById(`unity-spirit-${team.id}`);
                    if (!traitId || team.level >= levelCap()) {
                        if (animate && badge && waveIndex === 0 && team.level >= levelCap()) {
                            badge.querySelector('.unity-ascension-step').textContent = 'Unity Reward';
                            badge.querySelector('.unity-ascension-trait').textContent = 'Maximum Ascension';
                            badge.querySelector('.unity-ascension-level').textContent = `Level ${levelCap()}`;
                            badge.classList.add('maxed','show');
                        }
                        return;
                    }

                    const trait = teamTraits[team.id].find(item => item.id === traitId);
                    if (!trait || team.traits.includes(trait.id)) return;
                    const previousLevel = team.level;
                    team.traits.push(trait.id);
                    team.level = Math.min(levelCap(), team.level + 1);
                    teamPlan.applied += 1;
                    teamPlan.grantedNames.push(trait.name);
                    unityAscensionState.totalGranted += 1;
                    grantsThisWave += 1;

                    const relic = teamRelics[team.id];
                    if (!team.hasRelic && previousLevel < relic.unlockLevel && team.level >= relic.unlockLevel) {
                        team.hasRelic = true;
                        addHistoryLog(`🏺 ${team.name} received ${relic.name} during Unity Ascension.`, 'gold');
                    }

                    refreshPendingEvolutionAfterUnity(team, teamPlan.pendingTraitId === trait.id);
                    noteLevelStart(team);

                    // Let updateTeamDOM compare the newly generated form against the previous
                    // cached form. Pre-writing cachedSVG here would make the comparison appear
                    // unchanged and leave the card mascot one evolution behind.
                    updateTeamDOM(team, true);

                    if (spirit) {
                        spirit.innerHTML = team.cachedSVG || getAvatarSVG(team.id, team.traits);
                        spirit.classList.remove('ascension-pulse');
                        void spirit.offsetWidth;
                        if (animate) spirit.classList.add('ascension-pulse');
                    }
                    if (animate && badge) {
                        badge.classList.remove('show','maxed');
                        void badge.offsetWidth;
                        badge.querySelector('.unity-ascension-step').textContent = `Ascension ${waveIndex + 1} of 3`;
                        badge.querySelector('.unity-ascension-trait').textContent = `${trait.icon} ${trait.name}`;
                        badge.querySelector('.unity-ascension-level').textContent = `Level ${team.level}`;
                        badge.classList.add('show');
                    }
                });

                if (grantsThisWave > 0) {
                    pointSliderValues = pointSliderValues.map(value => value * Math.pow(2, grantsThisWave));
                    handlePointChange();
                    updateDynamicBackground();
                    playSound('unityAscend');
                }
                unityAscensionState.wave = Math.max(unityAscensionState.wave, waveIndex + 1);

                if (animate) {
                    unitySchedule(() => {
                        guardian?.classList.remove('granting');
                        document.querySelectorAll('.unity-stream,.unity-stream-flow').forEach(el => el.classList.remove('granting'));
                    }, 1160);
                }
                return grantsThisWave;
            }

            function completeUnityAscensionImmediately() {
                if (!unityAscensionState || classMission.rewardGranted) return;
                for (let wave = unityAscensionState.wave; wave < 3; wave++) applyUnityAscensionWave(wave, { animate: false });
                classMission.rewardGranted = true;
            }

            function finalizeUnityAscensionHistory() {
                if (!unityAscensionState) return;
                teamsData.forEach(team => {
                    const teamPlan = unityAscensionState.teamPlans.get(team.id);
                    if (!teamPlan?.applied) {
                        addHistoryLog(`✨ ${team.name} is already at maximum ascension.`, team.color);
                        return;
                    }
                    addHistoryLog(`✨ ${team.name} ascended ${teamPlan.applied} level${teamPlan.applied === 1 ? '' : 's'} to Level ${team.level}: ${teamPlan.grantedNames.join(', ')}.`, team.color);
                });
            }

            function triggerUnityWaves() {
                ['unity-wave-fire','unity-wave-nature','unity-wave-air','unity-wave-water'].forEach((id,index) => {
                    unitySchedule(() => {
                        const wave = document.getElementById(id);
                        wave.classList.remove('go'); void wave.offsetWidth; wave.classList.add('go');
                    }, index * 105);
                });
            }

            function finishUnityEvent({ skipped = false, replay = false } = {}) {
                if (!unityEventRunning) return;
                clearUnityEventTimers();
                const wasRewardPending = !replay && !classMission.rewardGranted;
                if (wasRewardPending) {
                    completeUnityAscensionImmediately();
                    finalizeUnityAscensionHistory();
                    classMission.rewardGranted = true;
                }
                classMission.eventPlayed = true;
                unityEventRunning = false;
                if (currentEvent === 'Unity') currentEvent = null;
                const overlay = document.getElementById('unity-event-overlay');
                overlay.classList.add('closing');
                unitySchedule(() => {
                    resetUnityEventVisuals();
                    updateGameState({ updateVisuals:true, updateAvatar:false });
                    updateClassMissionUI();
                    unityAscensionState = null;
                }, isLeanMode() ? 300 : 520);
                if (!replay) addHistoryLog(skipped ? 'Unity animation skipped — the evolution reward was still granted.' : '✨ The Unity Guardian granted the Class Mission evolution reward.', '#93c5fd');
            }

            function startUnityEvent(isReplay = false) {
                if (unityEventRunning || !classMission.completed) return;
                if(LeagueScenes.active&&LeagueScenes.active!=='unity')return;
                AnimatedMode.cancelAll();
                clearAllAvatarReactions();
                clearUnityEventTimers();
                resetUnityEventVisuals();
                if(!LeagueScenes.enter('unity','assembling'))return;
                unityEventRunning = true;
                unityEventQueued = false;
                unityEventQueuedReplay = false;
                currentEvent = 'Unity';
                unityAscensionState = (!isReplay && !classMission.rewardGranted) ? (resumeUnityPlan || createUnityAscensionPlan()) : null;
                resumeUnityPlan=null;
                updateClassMissionUI();

                buildUnityEventGeometry();

                document.getElementById('golden-snitch').style.display = 'none';
                document.getElementById('event-banner').classList.remove('visible');
                const overlay = document.getElementById('unity-event-overlay');
                void overlay.offsetWidth;
                overlay.classList.add('active');
                overlay.setAttribute('aria-hidden', 'false');
                document.body.classList.add('unity-event-active');
                requestAnimationFrame(() => overlay.classList.add('caption-visible'));
                setUnityCaption('Class Mission Complete', 'Four teams answer as one');
                playSound('unityComplete');

                if (isLeanMode()) {
                    // A fixed 16-second compositor-friendly sequence: no particles, blur,
                    // continuous loops or bulk reward jump. Each wave applies one real level.
                    overlay.classList.add('light-cinematic');
                    teamsData.forEach((team,index) => {
                        unitySchedule(() => {
                            document.getElementById(`unity-spirit-${team.id}`).classList.add('visible','charged');
                            playSound('unityAwaken');
                        }, 420 + index * 230);
                    });
                    unitySchedule(() => {
                        setUnityCaption('Elemental Convergence', 'Four team streams awaken the Unity Forge');
                        document.getElementById('unity-forge').classList.add('active');
                        playSound('unityForge');
                    }, 1500);
                    teamsData.forEach((team,index) => {
                        unitySchedule(() => {
                            document.getElementById(`unity-stream-${team.id}`).classList.add('show');
                            document.getElementById(`unity-flow-${team.id}`).classList.add('show');
                        }, 1750 + index * 300);
                    });
                    if (performanceMode === 'animated') {
                        // Four complete transparent assets, assembled at anatomical joints.
                        [['body',4200],['head',5500],['tail',6800],['wings',8100]].forEach(([part,at]) => unitySchedule(() => {
                            GuardianAssembly.reveal(part);
                            setUnityCaption('Unity Guardian', '');
                            playSound('unityAssemble');
                        }, at));
                    } else {
                    unitySchedule(() => {
                        setUnityCaption('Unity Guardian Formation', 'Body and elemental armor assemble');
                        setUnityGuardianPartVisible('unity-guardian-base');
                        playSound('unityAssemble');
                    }, 4200);
                    [
                        ['unity-guardian-nature',5000],
                        ['unity-guardian-water',5800],
                        ['unity-guardian-fire',6600],
                        ['unity-guardian-air',7400],
                        ['unity-guardian-unity',8200]
                    ].forEach(([id,at]) => unitySchedule(() => {
                        setUnityGuardianPartVisible(id);
                        playSound('unityAssemble');
                    }, at));
                    }
                    unitySchedule(() => {
                        document.getElementById('unity-guardian-stage').classList.add('revealed','victory');
                        setUnityCaption('The Unity Ascendant', unityAscensionState ? 'Preparing three gradual evolution rewards' : 'Unity celebration replay');
                        playSound('unityReveal');
                    }, 9000);

                    if (unityAscensionState) {
                        unitySchedule(() => prepareUnityAscensionVisuals(), 9450);
                        [10100,11800,13500].forEach((at,wave) => unitySchedule(() => {
                            setUnityCaption(`Ascension ${wave + 1} of 3`, 'One new evolution is granted to every eligible team');
                            applyUnityAscensionWave(wave);
                        }, at));
                        unitySchedule(() => {
                            triggerUnityWaves();
                            setUnityCaption('Ascension Complete', 'Three gradual evolution levels have been granted');
                            playSound('unityReveal');
                        }, 14800);
                        unitySchedule(() => finishUnityEvent({ replay:false }), 16000);
                    } else {
                        unitySchedule(() => {
                            triggerUnityWaves();
                            setUnityCaption('Elemental Unity', 'Four teams stand together');
                        }, 13500);
                        unitySchedule(() => finishUnityEvent({ replay:isReplay }), 16000);
                    }
                    return;
                }

                const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                if (reduced) {
                    teamsData.forEach(team => {
                        document.getElementById(`team-${team.id}`)?.classList.add('unity-source-awake');
                        document.getElementById(`unity-spirit-${team.id}`).classList.add('visible');
                        document.getElementById(`unity-stream-${team.id}`).classList.add('show');
                        document.getElementById(`unity-flow-${team.id}`).classList.add('show');
                    });
                    unitySchedule(() => {
                        document.getElementById('unity-forge').classList.add('active');
                        setAllUnityGuardianPartsVisible();
                        document.getElementById('unity-guardian-stage').classList.add('revealed','victory');
                        setUnityCaption('The Unity Ascendant', isReplay ? 'Unity celebration replay' : 'Preparing the threefold evolution reward');
                        playSound('unityReveal');
                    }, 900);
                    if (unityAscensionState) {
                        unitySchedule(() => prepareUnityAscensionVisuals(), 1450);
                        [0,1,2].forEach((wave,index) => unitySchedule(() => {
                            setUnityCaption(`Ascension ${wave + 1} of 3`, 'The Guardian grants a new evolution to every eligible team');
                            applyUnityAscensionWave(wave);
                        }, 1750 + index * 850));
                        unitySchedule(() => triggerUnityWaves(), 4300);
                        unitySchedule(() => finishUnityEvent({ replay: false }), 5000);
                    } else {
                        unitySchedule(() => triggerUnityWaves(), 1900);
                        unitySchedule(() => finishUnityEvent({ replay: isReplay }), 3600);
                    }
                    return;
                }

                // 18.2-second full cinematic sequence.
                teamsData.forEach((team,index) => {
                    unitySchedule(() => {
                        document.getElementById(`team-${team.id}`)?.classList.add('unity-source-awake');
                        document.getElementById(`unity-spirit-${team.id}`).classList.add('visible','charged');
                        playSound('unityAwaken');
                    }, 1200 + index * 620);
                });

                unitySchedule(() => {
                    setUnityCaption('Elemental Convergence', 'Fire · Nature · Air · Water awaken the Unity Forge');
                    document.getElementById('unity-forge').classList.add('active');
                    playSound('unityForge');
                }, 3900);

                teamsData.forEach((team,index) => {
                    unitySchedule(() => {
                        document.getElementById(`unity-stream-${team.id}`).classList.add('show');
                        document.getElementById(`unity-flow-${team.id}`).classList.add('show');
                    }, 4400 + index * 260);
                });
                unitySchedule(() => document.querySelectorAll('.unity-spirit').forEach(el => el.classList.add('dissolve')), 6100);

                unitySchedule(() => {
                    setUnityCaption('Unity Guardian Formation', 'Elemental magic shapes the body and armor');
                    setUnityGuardianPartVisible('unity-guardian-base');
                    playSound('unityAssemble');
                }, 7050);
                unitySchedule(() => { setUnityGuardianPartVisible('unity-guardian-nature'); playSound('unityAssemble'); }, 8050);
                unitySchedule(() => { setUnityGuardianPartVisible('unity-guardian-water'); playSound('unityAssemble'); }, 9650);
                unitySchedule(() => { setUnityGuardianPartVisible('unity-guardian-fire'); playSound('unityAssemble'); }, 11250);
                unitySchedule(() => { setUnityGuardianPartVisible('unity-guardian-air'); playSound('unityAssemble'); }, 12850);
                unitySchedule(() => { setUnityGuardianPartVisible('unity-guardian-unity'); playSound('unityAssemble'); }, 14150);

                unitySchedule(() => {
                    document.getElementById('unity-screen-flash').classList.add('active');
                    document.getElementById('unity-guardian-stage').classList.add('revealed');
                    setUnityCaption('The Unity Ascendant', 'Mission accomplished · one class, one force');
                    playSound('unityReveal');
                }, 15000);
                unitySchedule(() => document.getElementById('unity-screen-flash').classList.remove('active'), 15550);
                unitySchedule(() => document.getElementById('unity-guardian-stage').classList.add('victory'), 15750);
                if (unityAscensionState) {
                    unitySchedule(() => {
                        prepareUnityAscensionVisuals();
                        setUnityCaption('Threefold Ascension', 'The Unity Guardian turns class achievement into evolution');
                    }, 16250);
                    [0,1,2].forEach((wave,index) => unitySchedule(() => {
                        setUnityCaption(`Ascension ${wave + 1} of 3`, 'Every eligible team receives one automatic evolution');
                        applyUnityAscensionWave(wave);
                    }, 16900 + index * 1750));
                    unitySchedule(() => {
                        triggerUnityWaves();
                        setUnityCaption('Ascension Complete', 'Three new evolutions have been granted to every eligible team');
                        playSound('unityReveal');
                    }, 22200);
                    unitySchedule(() => finishUnityEvent({ replay: false }), 23400);
                } else {
                    unitySchedule(() => triggerUnityWaves(), 16250);
                    unitySchedule(() => setUnityCaption('Elemental Unity', isReplay ? 'Unity celebration replay' : 'The achievement returns to every team'), 16900);
                    unitySchedule(() => finishUnityEvent({ replay: isReplay }), 18200);
                }
            }

            document.getElementById('class-mission-replay').addEventListener('click', () => requestUnityEvent(true));
            document.getElementById('unity-event-skip').addEventListener('click', () => finishUnityEvent({ skipped: true }));
            window.addEventListener('keydown', event => {
                if (event.key === 'Escape' && unityEventRunning) finishUnityEvent({ skipped: true });
            });

            function resetSessionState({ saveUndo = true, clearUndo = false, message = 'Season Reset', sliderIndex = 0 } = {}) {
                if (saveUndo) saveState();
                sessionEpoch++;
                LeagueStudents.useRoster(LeagueRoster.current()?.students || LeagueStudents.defaults());
                selectedClass=null;studentContributions={};pendingRemoteClassSelection=null;haloTeams=[];haloLocked=false;
                levelStarts=new Map();lastAwardStudent=new Map();challengeLog=[];
                // v11.0.0: a new session starts with the Rift closed; a stage won earlier now raises the level cap.
                riftOpen=false;sagaSessionWin=null;
                secretAgents=LeagueAgent.fresh();LeagueAgent.close();
                LeagueStudentUI.close(true);LeagueStudentUI.clearCelebrations();updateStudentSessionUI();
                abandonScenes();
                sessionId=LeagueRecovery.uid();commandLedger=Object.create(null);boardSummaries={};
                lastMatchSummaryPayload=null;cachedLeaderboardRecord=null;cachedBattleRecord=null;
                clearTimeout(summaryRetryTimer);clearTimeout(remoteFinishTimeout);pendingRemoteFinish=false;
                historyLog=[];
                cancelAnimatedPresentation();
                cancelAllScoreAnimations({ settle: false });
                clearEvolutionChestTimers();
                clearAllAvatarReactions();
                resetClassMissionState({ silent: true });
                progressionMode = 'soft';
                updateProgressionModeUI();

                teamsData.forEach(team => {
                    team.points = 0;
                    team.level = 0;
                    team.evolutionProgress = 0;
                    team.milestonesReached = [];
                    team.wheelMilestonesReached = [];
                    team.powerups = { doubleUp: false, halfDown: false, shield: false };
                    team.traits = [];
                    team.hasRelic = false;
                    team.pendingEvolution = null;
                    team.cachedSVG = '';
                });

                // Restore the base point scale while preserving the requested slider tier.
                // The tier index is retained rather than the inflated numeric value, so an
                // evolved 8,000 selection correctly becomes the base 1,000 tier next session.
                const restoredSliderIndex = Math.max(0, Math.min(BASE_POINT_SLIDER_VALUES.length - 1, Number(sliderIndex) || 0));
                pointSliderValues = [...BASE_POINT_SLIDER_VALUES];
                selectedPointTierIndex = restoredSliderIndex;
                currentPointValue = pointSliderValues[restoredSliderIndex];
                handlePointChange();

                lastTeamClicked = null;
                comboCount = 0;
                currentEvent = null;
                lastVortexTime = 0;
                evolutionQueue = [];
                isEvolving = false;
                activeEvolutionTeamId = null;
                firstTeamToSwitch = null;
                isSwitchingMode = false;

                const switchButton = document.getElementById('switch-btn');
                switchButton.textContent = 'Switch';
                switchButton.classList.remove('btn-accent-blue');
                switchButton.classList.add('btn-neutral');
                document.querySelectorAll('.team-container').forEach(element => {
                    element.classList.remove('ring-4', 'ring-blue-500', 'ring-yellow-400');
                });
                document.getElementById('evolution-modal').classList.remove('visible');
                document.getElementById('wheel-modal').classList.remove('visible');
                document.getElementById('custom-points-modal').classList.remove('visible');

                if (clearUndo) {
                    historyStack = [];
                    document.getElementById('undo-btn').disabled = true;
                }

                updateGameState(true);
                addHistoryLog(message, '#ef4444');
            }

            document.getElementById('reset-all-btn').addEventListener('click', () => {
                resetSessionState({ saveUndo: true, clearUndo: false, message: 'Season Reset' });
            });

            function toggleSwitchMode() {
                isSwitchingMode = !isSwitchingMode; 
                firstTeamToSwitch = null; 
                const btn = document.getElementById('switch-btn');
                btn.textContent = isSwitchingMode ? 'Cancel' : 'Switch'; 
                btn.classList.toggle('btn-accent-blue', isSwitchingMode); btn.classList.toggle('btn-neutral', !isSwitchingMode);
                document.querySelectorAll('.team-container').forEach(e => { 
                    e.classList.toggle('ring-4', isSwitchingMode); 
                    e.classList.toggle('ring-blue-500', isSwitchingMode);
                    e.classList.remove('ring-yellow-400');
                });
            }
            document.getElementById('switch-btn').addEventListener('click', toggleSwitchMode);

            function handleSwitchSelection(teamId) {
                if (!firstTeamToSwitch) { 
                    firstTeamToSwitch = teamId; 
                    document.getElementById(`team-${teamId}`).classList.replace('ring-blue-500', 'ring-yellow-400'); 
                }
                else if (firstTeamToSwitch !== teamId) {
                    saveState();
                    const t1 = teamsData.find(t => t.id === firstTeamToSwitch);
                    const t2 = teamsData.find(t => t.id === teamId);
                    
                    if (t1 && t2) {
                        [t1.points, t2.points] = [t2.points, t1.points]; 
                        [t1.evolutionProgress, t2.evolutionProgress] = [t2.evolutionProgress, t1.evolutionProgress];
                        // The evolution charge may switch teams, but a hidden trait result may
                        // never cross into another team's evolutionary tree. Rebuild any ready
                        // chest from the receiving team's own remaining traits.
                        t1.pendingEvolution = null;
                        t2.pendingEvolution = null;
                        if (t1.evolutionProgress >= 3) prepareEvolutionChest(t1,{announce:false});
                        if (t2.evolutionProgress >= 3) prepareEvolutionChest(t2,{announce:false});
                        addHistoryLog(`Switched points and evolution charge: ${t1.name} & ${t2.name}`, '#3b82f6');
                    }
                    toggleSwitchMode(); updateGameState({ updateVisuals:true, updateAvatar:false, cardMotion:'switch' });
                }
            }



            // =================================================================
            // FINAL ARENA ENGINE — continuous, automatic and capped at 30 seconds
            // =================================================================
            let battleState = null;
            let battleRaf = null;
            const arenaClock=SceneRuntime.create('arena',{pause:()=>{ArenaMotion.stop();stopBattleMusic(0);},resume:delta=>SceneRuntime.shiftClock(battleState,delta)});
            const battleTimers=arenaClock.tasks;

            function scheduleBattleTask(fn,delay){return arenaClock.after(()=>{if(battleState?.running)fn();},delay);}
            function clearBattleTasks(){arenaClock.clear();battleRaf=null;clearLightBattleVisuals();}
            function scheduleBattleLoop(){if(battleState?.running)battleRaf=arenaClock.after(()=>updateFinalBattle(SceneRuntime.now()),100);}

            function battleFormName(level) {
                if (level >= 12) return 'Celestial';
                if (level >= 11) return 'Mythic';
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
            const lightBattleLevelScales = Object.freeze([.55,.64,.73,.82,.91,1,1.11,1.22,1.33,1.44,1.55,1.6,1.65]);
            function lightBattleScaleForLevel(level) {
                const index=Math.max(0,Math.min(12,Math.round(Number(level)||0)));
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
                globalThis.CreaturePoses?.healthChanged('arena',f.id,f.hp,f.maxHP);
                hpFill.style.width = `${percentage}%`;
                const loss=document.getElementById(`battle-hp-loss-${f.id}`);if(loss)loss.style.width=`${percentage}%`;
                hpFill.style.background = percentage > 55 ? 'linear-gradient(90deg,#22c55e,#a3e635)' : percentage > 25 ? 'linear-gradient(90deg,#f59e0b,#facc15)' : 'linear-gradient(90deg,#dc2626,#fb7185)';
                hpNumber.textContent = `${Math.max(0, Math.ceil(f.hp))} / ${f.maxHP}`;
                if (energy) energy.textContent = `${'●'.repeat(Math.min(3,f.energy))}${'○'.repeat(Math.max(0,3-f.energy))}`;
            }

            function setBattleStatus(){}
            function battleAnnounce(text,color){window.LeagueArenaFX?.announce(text,color);}

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
            function createImpact(target,color,damage,options={}){ArenaMotion.impact(target,color,options);window.LeagueArenaFX?.impact(target.id,damage,{...options,color});
                // v11.0.0 fight feel: a spark where the blow lands; a critical also holds the attacker for a few frames.
                if(target&&damage>0&&!options.blocked&&!options.heal){globalThis.LeagueFightFX?.spark(shellElement(target.id)?.querySelector('.battle-avatar-pose'),color,{big:Boolean(options.critical)});
                    if(options.critical&&options.attackerId)globalThis.LeagueFightFX?.hitStop(shellElement(options.attackerId));}}
            function createProjectile(attacker,target,color,type=''){animateShell(attacker,'action-arc',920);}
            function createFog(target,color){ArenaMotion.effect(target.id,'poison',color);}
            function createElementalBurst(target,element,large=false){if(target){const profile=Object.values(battleProfiles).find(p=>p.element===element);ArenaMotion.effect(target.id,'impact',profile?.elementColor||'#f8fafc',large);}}
            function shakeArena(){window.LeagueArenaFX?.shake();}
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
                window.LeagueArenaFX?.impact(target.id,0,{label:'EVADE',color:target.color,blocked:true});
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
                const levelIndex=Math.max(0,Math.min(12,Math.round(attacker.level)||0));
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
                    // v11.0.0 fight feel: a shield that breaks shatters.
                    if(target.shieldHP<=0)globalThis.LeagueFightFX?.shieldBreak(shellElement(target.id)?.querySelector('.battle-avatar-pose'),target.color);
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
                globalThis.CreaturePoses?.arena(target.id,'knockout');
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
                    const levelIndex=Math.max(0,Math.min(12,Math.round(poisonOwner.level)||0));
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
                // v9.6.0: attack names stay off screen; the flare and sound carry the moment.
                setArenaTeamFlare(f.id,1400); playSound('signature');
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
                // v10.2.0: this class's result decides next session's Comeback Halo.
                if(globalThis.LeagueStudents?.validClass(selectedClass))globalThis.LeagueHalo?.record(selectedClass,{sessionId,at:Date.now(),league:leagueWinners.map(f=>f.id),arena:arenaWinner.id});
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
                    leagueHost.setAttribute?.('data-tie-count',String(leagueWinners.length));
                    leagueHost.innerHTML=leagueWinners.map(fighter=>`<span class="league-winner-avatar" style="--league-team-color:${fighter.color}">${getAvatarSVG(fighter.id,fighter.traits)}</span>`).join('');
                    // v9.5.0: a shared title lines its champions up in a row, each name in its team colour.
                    const leagueNameEl=document.getElementById('league-winner-name');
                    leagueNameEl.textContent=leagueText;leagueNameEl.classList?.toggle('is-tie',leagueWinners.length>1);
                    if(leagueWinners.length>1&&typeof leagueNameEl.replaceChildren==='function'&&typeof document.createTextNode==='function'){leagueNameEl.replaceChildren(...leagueWinners.flatMap((fighter,index)=>{const span=document.createElement('span');span.textContent=fighter.name;span.style.color=fighter.color;return index?[document.createTextNode(' · '),span]:[span];}));}
                    const leagueRole=document.querySelector?.('#league-champion-panel .champion-role');
                    if(leagueRole)leagueRole.textContent=leagueWinners.length>1?'Shared League Title':'League Champion';
                    renderChampionContributors(arenaWinner,leagueWinners);
                    document.getElementById('winner-card').scrollTop=0;
                    document.getElementById('battle-result-details').innerHTML='';
                    LeagueScenes.enter('results','complete');
                    globalThis.CreaturePoses?.results(teamsData.map(t=>({id:t.id,points:t.points})),arenaWinner.id,leagueWinners.map(t=>t.id));
                    LeagueIslandRun.refresh();
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

            // =================================================================
            // VIXAR SECRET RAID ENGINE — cooperative endgame encounter
            // =================================================================
            let vixarRaidState = null;
            let vixarRaidRaf = null;
            let vixarDefeatedThisSession = false;
            let vixarUnlockAnnounced = false;
            const raidClock=SceneRuntime.create('raid',{pause:()=>{RaidMotion.stop();stopBattleMusic(0);},resume:delta=>{SceneRuntime.shiftClock(vixarRaidState,delta);if(vixarRaidState?.merge)LeagueMergeSpell.shift(vixarRaidState.merge,delta);}});
            const vixarRaidTimers=raidClock.tasks;
            // v11.0.0 Vixar Saga: each act sets VIXAR's HP, seals, fight length and pace (vixar-saga.js). At 10% HP
            // Vixar can only be finished by the Unity Guardian's second claw, in every act.
            const VIXAR_EXECUTION_RATIO = 0.10;
            function vixarExecutionHP() { return Math.round((vixarRaidState?.boss.maxHP || LeagueSaga.ACTS.Violet.bossHP) * VIXAR_EXECUTION_RATIO); }
            // The Rift: Mr. Saymaz opens this session's fight from the phone. Nothing changes on the board when it opens;
            // the raid sigil appears only when the Rift is open and all four teams have reached the act's level.
            let riftOpen = false;
            const sagaClass = () => LeagueSaga.validClass(selectedClass) ? selectedClass : null;
            // One saga fight per class and session: after a win or a loss the Rift closes until a later session.
            const sagaFoughtToday = (className = selectedClass) => Boolean(LeagueSaga.validClass(className) && LeagueSaga.get(className).fightSessions.includes(sessionId));
            function sagaFightAct() { const c = sagaClass(); return c ? LeagueSaga.act(LeagueSaga.stageOf(c)) : null; }
            function sagaFightReady() { const act = sagaFightAct(); return Boolean(act && riftOpen && !sagaFoughtToday() && allTeamsAtLeastLevel(act.level)); }
            // Boss art and seal targets: the Violet form keeps the Light mode drawing; Scarlet and Gilded always use their art.
            const raidUsesArt = () => performanceMode === 'animated' || (vixarRaidState?.act?.act || 1) > 1;
            const VIXAR_LEGENDARY_DAMAGE_MULTIPLIER = 1.38;
            const VIXAR_COORDINATED_ASSAULT_MULTIPLIER = 1.32;
            const VIXAR_LEGENDARY_OVERDRIVE_MULTIPLIER = 1.55;
            const VIXAR_LEGENDARY_RESOLVE_MULTIPLIER = 0.82;
            // v11.0.0 balance-lab values (tests/saga-balance.cjs; one object so the lab can sweep them).
            const sagaBalance = {
                brandHeal: 0.30,       // Scarlet Brand: share of the marked team's damage that heals Vixar
                fusionDamage: 1.18,    // a fused pair's strike, on top of its combined power
                fusionPower: 0.62,     // fused power = (both houses' power) × this
                silenceFused: 0.30,    // Gilded Vixar's Fifth Silence: share of max HP, fused pair
                silenceApart: 0.20,    // … teams that fight on apart
                partialOverdrive: 1.0, // Act III Overdrive when only one pair fused (both pairs: 1.55)
                apartLastStands: 2,    // Act III after a failed Merge Spell: how often each team can endure at 1 HP
                apartLastStandsPartial: 1 // … for the pair that did not fuse when the other pair did
            };
            const VIXAR_BRAND_MS = 6000;
            const MERGE_CIRCLE_MS = 120000, MERGE_SECOND_MS = 60000;
            const vixarTeamSlots = Object.freeze({ gryffindor:0, slytherin:1, hufflepuff:2, ravenclaw:3 });

            function vixarSchedule(fn,delay){return raidClock.after(()=>{if(vixarRaidState&&(vixarRaidState.running||vixarRaidState.finishing))fn();},delay);}
            function clearVixarRaidTasks(){RaidMotion.stop();raidClock.clear();vixarRaidRaf=null;}
            function scheduleVixarRaidLoop(){if(vixarRaidState?.running)vixarRaidRaf=raidClock.after(()=>updateVixarRaid(SceneRuntime.now()),100);}

            function allTeamsAtLeastLevel(level) {
                return teamsData.every(team => Number(team.level) >= level);
            }

            function vixarGuardianIsEligible() {
                return Boolean(classMission.completed && classMission.rewardGranted);
            }

            function updateVixarRaidAccess() {
                const button = document.getElementById('vixar-raid-btn');
                if (!button) return;
                const c = sagaClass(), stage = c ? LeagueSaga.stageOf(c) : '', act = LeagueSaga.act(stage);
                // Epilogue: a Freed class sees Mr. Saymaz, as an ally, where the raid sigil was.
                const freed = stage === 'Freed';
                const unlocked = sagaFightReady();
                const unityReady = vixarGuardianIsEligible();
                button.classList.toggle('visible', unlocked || freed);
                button.classList.toggle('saga-ally', freed);
                button.dataset.sagaStage = stage;
                if (freed && !button.querySelector('.saga-ally-portrait')) button.prepend(LeagueSagaScenes.allyPortrait());
                if (!freed) button.querySelector('.saga-ally-portrait')?.remove();
                button.classList.toggle('unity-ready', unlocked && unityReady);
                button.classList.toggle('conquered', vixarDefeatedThisSession);
                button.disabled = !(unlocked || freed) || Boolean(battleState?.running) || Boolean(vixarRaidState?.running) || unityEventRunning || unityEventQueued || (freed && Boolean(LeagueScenes.active));
                button.setAttribute('aria-hidden', unlocked || freed ? 'false' : 'true');
                button.setAttribute('aria-label', freed ? 'Mr. Saymaz, your ally · Replay the Finale' : `Enter the ${act?.title || 'VIXAR'} raid`);
                button.title = freed
                    ? 'Mr. Saymaz · your ally · Replay the Finale'
                    : !unlocked
                        ? 'The Rift is closed'
                        : unityReady
                            ? `${act.title} can now be fought`
                            : `${act.title} discovered — complete the Class Mission to summon the Unity Guardian`;
                if (unlocked && !vixarUnlockAnnounced) {
                    vixarUnlockAnnounced = true;
                    addHistoryLog(`◈ The Rift is open: ${act.title} stirs beyond the Final Arena.`, act.color);
                }
                if (!unlocked) vixarUnlockAnnounced = false;
                document.querySelectorAll('.team-container').forEach(el => el.classList.toggle('saga-freed-edge', freed && Number(el.querySelector('.team-level-display')?.dataset.level) >= 12));
            }

            function cloneExistingUnityGuardianForRaid() {
                if (performanceMode === 'animated') {
                    const puppet = document.getElementById('unity-guardian-animated-art').cloneNode(true);
                    puppet.id = 'vixar-unity-guardian-svg';
                    puppet.classList.add('guardian-complete');
                    puppet.removeAttribute('aria-hidden');
                    puppet.setAttribute('role', 'img');
                    puppet.setAttribute('aria-label', 'Unity Guardian fighting VIXAR');
                    return puppet;
                }
                const source = document.getElementById('unity-guardian-svg');
                if (!source) return null;
                const clone = source.cloneNode(true);
                clone.id = 'vixar-unity-guardian-svg';
                clone.setAttribute('aria-label', 'English League Unity Ascendant Guardian fighting VIXAR');
                const idMap = new Map();
                clone.querySelectorAll('[id]').forEach(node => {
                    const oldId = node.id;
                    const newId = `vixar-raid-${oldId}`;
                    idMap.set(oldId, newId);
                    node.dataset.unityId = oldId;
                    node.id = newId;
                });
                clone.querySelectorAll('*').forEach(node => {
                    for (const attrName of node.getAttributeNames()) {
                        let value = node.getAttribute(attrName);
                        if (!value) continue;
                        idMap.forEach((newId, oldId) => {
                            value = value.replaceAll(`url(#${oldId})`, `url(#${newId})`);
                            if (value === `#${oldId}`) value = `#${newId}`;
                        });
                        node.setAttribute(attrName, value);
                    }
                });
                clone.querySelectorAll('.unity-part').forEach(part => {
                    part.classList.remove('unity-part', 'show');
                    part.classList.add('vixar-unity-part');
                });
                return clone;
            }

            function createVixarRaidState() {
                const act = sagaFightAct() || LeagueSaga.ACTS.Violet;
                const highestPoints = Math.max(1, ...teamsData.map(team => Math.max(0, team.points)));
                const fighters = teamsData.map(team => {
                    const fighter = buildBattleFighter(team, highestPoints);
                    fighter.maxHP = Math.round(400 + fighter.armor * 2.4 + fighter.level * 12);
                    fighter.hp = fighter.maxHP;
                    fighter.shieldHP = 0;
                    fighter.silenceUntil = 0;
                    fighter.slowUntil = 0;
                    fighter.damageBuffUntil = 0;
                    fighter.invulnerableUntil = 0;
                    fighter.nextActionAt = 0;
                    fighter.relicUsed = false;
                    fighter.revived = false;
                    fighter.revivePending = false;
                    fighter.lastStandTriggered = false;
                    fighter.raidDamage = 0;
                    fighter.sealDamage = 0;
                    fighter.arenaSlot = vixarTeamSlots[team.id];
                    return fighter;
                });
                const seals = {};
                fighters.forEach(fighter => {
                    seals[fighter.id] = {
                        id: fighter.id,
                        hp: act.sealHP,
                        maxHP: act.sealHP,
                        broken: false,
                        locked: fighter.level < act.level,
                        lockAnnounced: false
                    };
                });
                const guardianEnabled = vixarGuardianIsEligible();
                const allReady = fighters.every(fighter => fighter.level >= act.level);
                return {
                    act, className: selectedClass, stage: act.stage, duration: act.duration,
                    originalFighters: fighters, merge: null, edictCast: false, mergedPairs: [],
                    running: true,
                    finishing: false,
                    finaleStage: null,
                    finalAttackUsed: false,
                    completed: false,
                    startedAt: SceneRuntime.now(),
                    combatBeginsAt: SceneRuntime.now() + 2900,
                    elapsed: 0,
                    fighters,
                    seals,
                    boss: {
                        hp: act.bossHP,
                        maxHP: act.bossHP,
                        armor: act.armor,
                        power: 128,
                        arcane: 148,
                        shieldHP: 0,
                        phase: 1,
                        nextActionAt: SceneRuntime.now() + 4300,
                        actionIndex: 0,
                        invertedTeamId: null,
                        inversionUntil: 0,
                        fifthSilenceUsed: false,
                        emptyCrownTriggered: false,
                        lastAttackerId: null,
                        brandTeamId: null,
                        brandUntil: 0
                    },
                    guardianEnabled,
                    guardianJoined: false,
                    guardianNextActionAt: 0,
                    // "Legendary" now means every team reached this act's level (10, 11 or 12).
                    allLegendary: allReady,
                    eligibleVictory: allReady && guardianEnabled,
                    legendaryOverdrive: false,
                    overtimeGranted: false,
                    lockMessageAt: 0,
                    earlyFailureReason: null
                };
            }

            // v11.0.0: a fused pair (Slyffindor, Huffleclaw) shows its own art once it is added to assets/animated;
            // until then both Level 12 creatures stand together inside one fighter.
            function vixarFighterArt(fighter) {
                if (!fighter.merged) return getAvatarSVG(fighter.id, fighter.traits);
                const pair = fighter.members.map(id => vixarRaidState.originalFighters.find(f => f.id === id));
                return `<div class="merged-fighter-art" data-pair="${fighter.id}">${LeagueSagaScenes.mergedArt(fighter.id)}${pair.map((member, i) => `<div class="merged-member merged-member-${i}">${getAvatarSVG(member.id, member.traits)}</div>`).join('')}</div>`;
            }
            function vixarFighterName(fighter) {
                if (!fighter.merged) return `<span class="vixar-team-name" style="color:${fighter.color}">${fighter.name}</span>`;
                const cut = Math.ceil(fighter.name.length / 2);
                return `<span class="vixar-team-name merged-name"><span style="color:${fighter.colors[0]}">${fighter.name.slice(0, cut)}</span><span style="color:${fighter.colors[1]}">${fighter.name.slice(cut)}</span></span>`;
            }
            function renderVixarRaidFighters() {
                const host = document.getElementById('vixar-team-layer');
                host.innerHTML = vixarRaidState.fighters.map(fighter => {
                    const rightSide = fighter.arenaSlot === 1 || fighter.arenaSlot === 3;
                    const relicText = fighter.hasRelic ? `${fighter.merged ? '✦' : teamRelics[fighter.id].icon} ${fighter.relicUsed ? 'USED' : 'READY'}` : 'RELIC LOCKED';
                    return `
                        <section id="vixar-team-${fighter.id}" class="vixar-team-fighter ${rightSide ? 'right-side' : ''} ${fighter.merged ? 'is-merged' : ''}" data-team="${fighter.id}" data-slot="${fighter.arenaSlot}" style="--team-color:${fighter.color}${fighter.merged ? `;--team-color-b:${fighter.colors[1]}` : ''}">
                            <div class="vixar-team-panel">
                                <div class="vixar-team-line">
                                    ${vixarFighterName(fighter)}
                                    <span class="vixar-team-meta">LV.${fighter.level} · ${fighter.form}</span>
                                </div>
                                <div class="vixar-team-hp-row">
                                    <span class="vixar-team-hp-label">HP</span>
                                    <div class="vixar-team-hp-track"><div id="vixar-team-hp-fill-${fighter.id}" class="vixar-team-hp-fill"></div></div>
                                    <span id="vixar-team-hp-number-${fighter.id}" class="vixar-team-hp-number"></span>
                                </div>
                                <div class="vixar-team-stats">
                                    <span class="vixar-team-stat">STR ${fighter.power}</span>
                                    <span class="vixar-team-stat">ARM ${fighter.armor}</span>
                                    <span class="vixar-team-stat">ARC ${fighter.arcane}</span>
                                    <span id="vixar-team-energy-${fighter.id}" class="vixar-team-stat vixar-team-energy">○○○</span>
                                    <span id="vixar-team-relic-${fighter.id}" class="vixar-team-stat vixar-team-relic">${relicText}</span>
                                </div>
                            </div>
                            <div id="vixar-team-status-${fighter.id}" class="vixar-team-status"></div>
                            <div id="vixar-avatar-shell-${fighter.id}" class="vixar-avatar-shell" style="--team-color:${fighter.color}">
                                <div class="raid-travel"><div class="raid-pose">${vixarFighterArt(fighter)}</div></div>
                                <div class="saga-brand-mark" aria-hidden="true"></div>
                            </div>
                            <div class="vixar-team-ko">Knocked Out</div>
                        </section>`;
                }).join('');
                vixarRaidState.fighters.forEach(updateVixarTeamHUD);
            }

            function renderVixarSealStrip() {
                const teamById = Object.fromEntries(vixarRaidState.fighters.map(fighter => [fighter.id, fighter]));
                const labels = { gryffindor:'Fire Seal', slytherin:'Nature Seal', hufflepuff:'Air Seal', ravenclaw:'Water Seal' };
                document.getElementById('vixar-seal-strip').innerHTML = Object.values(vixarRaidState.seals).map(seal => {
                    const fighter = teamById[seal.id];
                    return `
                        <div id="vixar-seal-chip-${seal.id}" class="vixar-seal-chip ${seal.locked ? 'locked' : ''}" style="--seal-color:${fighter.color}">
                            <div class="vixar-seal-chip-top"><span>${labels[seal.id]}</span><span id="vixar-seal-number-${seal.id}">${seal.hp}</span></div>
                            <div class="vixar-seal-chip-track"><div id="vixar-seal-fill-${seal.id}" class="vixar-seal-chip-fill"></div></div>
                        </div>`;
                }).join('');
                const positions = { gryffindor:[205,145], slytherin:[895,145], hufflepuff:[150,535], ravenclaw:[950,535] };
                const glyphs = {
                    gryffindor:'<path d="M0 -27 C29 -3 22 22 0 29 C-25 17 -21 -1 -10 -13 C-11 3 1 7 0 -27Z"/>',
                    slytherin:'<path d="M0 -28 C35 -13 28 22 -2 28 C-30 10 -26 -17 0 -28Z"/><path d="M-2 23 L9 -16" fill="none" stroke="#fff" stroke-width="2"/>',
                    hufflepuff:'<path d="M-26 -9 H12 Q29 -9 22 -23 M-29 3 H25 M-20 15 H8 Q27 15 17 29" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>',
                    ravenclaw:'<path d="M0 -29 C12 -11 24 1 22 12 C19 34 -18 34 -22 12 C-24 1 -12 -11 0 -29Z"/>'
                };
                document.getElementById('vixar-element-seals').innerHTML = '<circle id="vixar-animated-core" cx="550" cy="385" r="9" opacity="0"/>' + vixarRaidState.fighters.map(fighter => {
                    const [x,y] = positions[fighter.id];
                    return `<g id="vixar-art-seal-${fighter.id}" class="vixar-element-seal" transform="translate(${x} ${y})" style="color:${fighter.color}">
                        <circle r="51" fill="#101224" stroke="currentColor" stroke-width="4"/>
                        <path d="M0 -63 L12 -49 L35 -46 L46 -35 L49 -12 L63 0 L49 12 L46 35 L35 46 L12 49 L0 63 L-12 49 L-35 46 L-46 35 L-49 12 L-63 0 L-49 -12 L-46 -35 L-35 -46 L-12 -49Z" fill="none" stroke="currentColor" stroke-width="3"/>
                        <circle r="39" fill="none" stroke="currentColor" stroke-width="2"/>
                        <g fill="currentColor">${glyphs[fighter.id]}</g>
                    </g>`;
                }).join('');
                Object.values(vixarRaidState.seals).forEach(updateVixarSealHUD);
            }

            function prepareVixarGuardian() {
                const host = document.getElementById('vixar-guardian-host');
                host.innerHTML = '';
                host.className = '';
                if (!vixarRaidState.guardianEnabled) return;
                const guardian = cloneExistingUnityGuardianForRaid();
                if (guardian) host.appendChild(guardian);
                // Staged invisibly until VIXAR's final attack at 10% HP.
                host.classList.add('finisher-ready');
            }

            function layoutVixarGuardian() {
                if (!vixarRaidState) return;
                const stage = document.getElementById('vixar-boss-stage').getBoundingClientRect();
                const animated = performanceMode === 'animated';
                const image = document.getElementById('vixar-boss-animated-art');
                const viewBox = document.getElementById('vixar-boss-svg').viewBox.baseVal;
                const ratio = animated || raidUsesArt() ? (image.naturalWidth / image.naturalHeight || 1100 / 890) : viewBox.width / viewBox.height;
                const height = Math.min(stage.height, stage.width / ratio) * .5;
                const host = document.getElementById('vixar-guardian-host');
                host.style.setProperty('--raid-guardian-height', `${height}px`);
                host.style.setProperty('--raid-guardian-width', `${height * (animated ? 1000 / 900 : 420 / 520)}px`);
            }
            window.addEventListener('resize', layoutVixarGuardian);
            document.getElementById('vixar-boss-animated-art').addEventListener('load', layoutVixarGuardian);

            function updateVixarTeamHUD(fighter) {
                const fill = document.getElementById(`vixar-team-hp-fill-${fighter.id}`);
                const number = document.getElementById(`vixar-team-hp-number-${fighter.id}`);
                const energy = document.getElementById(`vixar-team-energy-${fighter.id}`);
                const teamEl = document.getElementById(`vixar-team-${fighter.id}`);
                if (!fill || !number || !teamEl) return;
                const percentage = Math.max(0, Math.min(100, fighter.hp / fighter.maxHP * 100));
                globalThis.CreaturePoses?.healthChanged('raid',fighter.id,fighter.hp,fighter.maxHP);
                fill.style.width = `${percentage}%`;
                fill.style.background = percentage > 55 ? 'linear-gradient(90deg,#22c55e,#a3e635)' : percentage > 25 ? 'linear-gradient(90deg,#f59e0b,#facc15)' : 'linear-gradient(90deg,#dc2626,#fb7185)';
                number.textContent = `${Math.ceil(fighter.hp)} / ${fighter.maxHP}`;
                if (energy) energy.textContent = `${'●'.repeat(Math.min(3, fighter.energy))}${'○'.repeat(Math.max(0, 3 - fighter.energy))}`;
                document.getElementById(`vixar-avatar-shell-${fighter.id}`)?.classList.toggle('has-raid-shield', fighter.shieldHP > 0 && fighter.alive);
                teamEl.classList.toggle('is-ko', !fighter.alive);
            }

            function updateVixarSealHUD(seal) {
                const fill = document.getElementById(`vixar-seal-fill-${seal.id}`);
                const number = document.getElementById(`vixar-seal-number-${seal.id}`);
                const chip = document.getElementById(`vixar-seal-chip-${seal.id}`);
                const svgSeal = document.getElementById(`vixar-svg-seal-${seal.id}`);
                if (fill) fill.style.width = `${Math.max(0, Math.min(100, seal.hp / seal.maxHP * 100))}%`;
                if (number) number.textContent = seal.broken ? '0' : Math.max(1, Math.ceil(seal.hp));
                if (chip) {
                    chip.classList.toggle('locked', seal.locked && !seal.broken);
                    chip.classList.toggle('broken', seal.broken);
                }
                const exposed=Object.values(vixarRaidState.seals).every(item=>item.broken),bossStage=document.getElementById('vixar-boss-stage');
                bossStage.classList.toggle('seals-intact',!exposed);bossStage.classList.toggle('seals-broken',exposed);
                if(exposed&&!vixarRaidState.finishing)LeagueScenes.phase('raid','core');
                svgSeal?.classList.toggle('broken', seal.broken);
                document.getElementById(`vixar-art-seal-${seal.id}`)?.classList.toggle('broken', seal.broken);
                if (chip) {
                    const description = `${seal.id} seal: ${seal.broken ? 'broken' : seal.locked ? 'locked until level 10' : `${Math.ceil(seal.hp)} HP`}`;
                    chip.setAttribute('aria-label', description);
                    chip.title = description;
                }
            }

            function updateVixarBossHUD() {
                if (!vixarRaidState) return;
                const boss = vixarRaidState.boss;
                const percentage = Math.max(0, Math.min(100, boss.hp / boss.maxHP * 100));
                const fill = document.getElementById('vixar-boss-hp-fill');
                document.getElementById('vixar-boss-stage').classList.toggle('has-raid-shield', boss.shieldHP > 0);
                fill.style.width = `${percentage}%`;
                fill.style.background = percentage > 34
                    ? 'linear-gradient(90deg,#4c1d95,#8b5cf6 48%,#f0abfc)'
                    : 'linear-gradient(90deg,#7f1d1d,#be123c 48%,#f0abfc)';
                document.getElementById('vixar-boss-hp-number').textContent = `${Math.max(0, Math.ceil(boss.hp))} / ${boss.maxHP}`;
                document.getElementById('vixar-aegis-status').textContent = `Aegis ${Math.ceil(boss.shieldHP)}`;
                const phases = vixarRaidState.act.phases;
                document.getElementById('vixar-phase').textContent = vixarRaidState.merge && !vixarRaidState.merge.done
                    ? 'The Edict of Separation · Merge Spell'
                    : boss.phase === 1
                    ? `Phase I · ${phases[0]}`
                    : boss.phase === 2
                        ? `Phase II · ${phases[1]}`
                        : percentage <= 10
                        ? 'Execution Threshold · Final 10% Protected'
                        : `Phase III · ${phases[2]}`;
            }

            function vixarAnnounce() {
                // Intentionally disabled: attack names and explanatory raid narration
                // no longer cover the center of the VIXAR battlefield.
            }

            function setVixarTeamStatus() {
                // Combat is conveyed by motion, HP, shields and KO labels.
            }

            function vixarArenaCenterForElement(element) {
                const arena = document.getElementById('vixar-raid-arena');
                if (!element || !arena) return { x:0, y:0 };
                const er = element.getBoundingClientRect();
                const ar = arena.getBoundingClientRect();
                return { x:er.left + er.width / 2 - ar.left, y:er.top + er.height / 2 - ar.top };
            }

            function vixarTargetSealForFighter(fighter) {
                const own = vixarRaidState.seals[fighter.id];
                if (own && !own.broken) return own;
                // Help the remaining seals before anyone targets the boss itself.
                return Object.values(vixarRaidState.seals).filter(seal => !seal.broken).sort((a,b) => Number(a.locked) - Number(b.locked) || a.hp - b.hp)[0] || null;
            }

            function vixarSealElement(id) {
                return document.getElementById(`${raidUsesArt() ? 'vixar-art-seal-' : 'vixar-svg-seal-'}${id}`);
            }

            function vixarBossTarget() {
                return raidUsesArt() ? document.getElementById('vixar-animated-core') : document.querySelector('#vixar-boss-svg .vixar-core');
            }

            function vixarTargetElementForFighter(fighter) {
                const seal = vixarTargetSealForFighter(fighter);
                return seal ? vixarSealElement(seal.id) : vixarBossTarget();
            }

            function createVixarProjectile(from,to,color,{duration=520}={}){RaidMotion.bolt(from,to,color,Math.min(duration,590));}
            // v11.0.0 fight feel: every blow shows its number and a spark; criticals are larger. Words (SHATTERED, AEGIS,
            // SHIELD, IMMUNE, LAST STAND) appear as short callouts.
            function createVixarImpact(target,color,label='',options={}){
                RaidMotion.ring(target,color);
                const fx=globalThis.LeagueFightFX,text=String(label||'');if(!fx||!target||!text)return;
                if(text==='CRITICAL'){fx.spark(target,'#fff',{big:true});return;}
                const damage=/^−/.test(text);
                fx.number(target,text,{color:options.heal?'#fb7185':damage?color:'#f5f3ff',kind:options.heal?'heal':damage&&options.critical?'critical':damage?'damage':'word'});
                if(damage)fx.spark(target,color,{big:Boolean(options.critical||options.big)});
            }
            function vixarScreenFlash(){}
            // Only the heaviest blows (Gravity Collapse, the Fifth Silence) shake the arena, by a few pixels.
            function shakeVixarArena(ms){if(ms)globalThis.LeagueFightFX?.shake(document.getElementById('vixar-raid-arena'),ms>600?7:5,Math.min(320,ms));}
            function createVixarCastRing(element,color='#e9d5ff'){RaidMotion.ring(element,color,true);}
            function createVixarLineEffect(className,from,to,duration=720){RaidMotion.stream(from,to,className==='vixar-concordance-beam'?'#fff7c2':'#c4b5fd',duration,true);return null;}
            function createVixarImpactWave(element){RaidMotion.wave(element);}
            function createVixarElementStream(from,to,color,duration=2050){RaidMotion.stream(from,to,color,duration);return null;}

            function animateVixarTeam(fighter, className, duration = 780, target = null) {
                const kind = className === 'action' ? 'attack' : className === 'guard' ? 'guard' : className === 'convergence' ? 'cast' : 'hit';
                RaidMotion.move(fighter.id,kind,target,{impact:duration>1000?620:520});
                if (kind === 'guard') RaidMotion.ring(document.getElementById(`vixar-avatar-shell-${fighter.id}`), fighter.color, true);
            }

            function vixarBossHitAnimation(){RaidMotion.move('boss','hit');}

            function vixarAllSealsBroken() {
                return Object.values(vixarRaidState.seals).every(seal => seal.broken);
            }

            function vixarBossHpFloor() {
                if (!vixarAllSealsBroken()) return Math.round(vixarRaidState.boss.maxHP * .34);
                if (!vixarRaidState.allLegendary) return Math.round(vixarRaidState.boss.maxHP * .18);
                // v11.0.0 Act III: Gilded Vixar casts the Edict of Separation at 70% HP; it cannot fall further until the
                // Merge Spell has been cast.
                if (vixarRaidState.act.merge && !vixarRaidState.edictCast) return Math.round(vixarRaidState.boss.maxHP * .70);
                // Legendary teams can break every seal and reduce VIXAR to exactly
                // 10% HP. The protected final tenth belongs exclusively to the
                // Unity Guardian's divine finishing strike.
                return vixarExecutionHP();
            }

            function vixarDamageSeal(fighter, rawDamage, source = 'team', sealId = fighter.id) {
                if (!vixarRaidState?.running || vixarRaidState.finishing) return 0;
                const seal = vixarRaidState.seals[sealId];
                if (!seal || seal.broken) return 0;
                const damage = Math.max(1, Math.round(rawDamage));
                const target = vixarSealElement(sealId);
                // Capture the hit before hiding the broken target.
                RaidMotion.strike(target, fighter.color, fighter.id);
                if (seal.locked) {
                    seal.hp = Math.max(1, seal.hp - damage);
                    if (seal.hp <= 1 && !seal.lockAnnounced) {
                        seal.lockAnnounced = true;
                        setVixarTeamStatus(fighter, 'Legendary Lock', 1300);
                        vixarAnnounce(`${fighter.name} must reach Level ${vixarRaidState.act.level}`, fighter.color);
                        playSound('shield');
                    }
                } else {
                    seal.hp = Math.max(0, seal.hp - damage);
                    if (seal.hp <= 0) {
                        seal.broken = true;
                        vixarRaidState.boss.armor = Math.max(86, vixarRaidState.boss.armor - 11);
                        setVixarTeamStatus(fighter, 'Seal Broken', 1300);
                        vixarAnnounce(`${fighter.name} shattered the ${fighterElementName(fighter.id)} Seal`, fighter.color);
                        vixarScreenFlash(`${fighter.color}55`);
                        playSound('signature');
                        addHistoryLog(`◇ ${fighter.name} broke VIXAR's ${fighterElementName(sealId)} Seal.`, fighter.color);
                    }
                }
                fighter.sealDamage += damage;
                updateVixarSealHUD(seal);
                createVixarImpact(target, fighter.color, seal.broken ? 'SHATTERED' : `−${damage}`);
                return damage;
            }

            function fighterElementName(id) {
                return id === 'gryffindor' ? 'Fire' : id === 'slytherin' ? 'Nature' : id === 'hufflepuff' ? 'Air' : 'Water';
            }

            function vixarApplyBossDamage(fighter, rawDamage, options = {}) {
                if (!vixarRaidState?.running || vixarRaidState.finishing || !vixarAllSealsBroken()) return 0;
                const boss = vixarRaidState.boss;
                const now = SceneRuntime.now();
                if (boss.invertedTeamId === fighter?.id && boss.inversionUntil > now && !options.guardian) rawDamage *= .42;
                const mitigation = options.ignoreArmor ? 1 : 100 / (100 + boss.armor * .72);
                let damage = Math.max(1, Math.round(rawDamage * mitigation));
                const hadShield=boss.shieldHP>0;
                if (boss.shieldHP > 0) {
                    const absorbed = Math.min(boss.shieldHP, damage);
                    boss.shieldHP -= absorbed;
                    damage -= absorbed;
                    if (absorbed > 0) {
                        createVixarImpact(document.getElementById('vixar-boss-stage'), '#c4b5fd', `AEGIS ${Math.round(absorbed)}`);
                        RaidMotion.move('boss', 'guard');
                        RaidMotion.ring(document.getElementById('vixar-boss-stage'), '#c4b5fd', true);
                        if (boss.shieldHP <= 0) globalThis.LeagueFightFX?.shieldBreak(vixarBossTarget(), '#c4b5fd');
                    }
                }
                if(fighter)RaidMotion.resolve(fighter.id,damage<=0?'blocked':hadShield?'partial':'hit');
                if (damage <= 0) {
                    updateVixarBossHUD();
                    return 0;
                }
                const floor = vixarBossHpFloor();
                const oldHp = boss.hp;
                boss.hp = Math.max(floor, boss.hp - damage);
                const dealt = oldHp - boss.hp;
                if (fighter) {
                    fighter.raidDamage += dealt;
                    boss.lastAttackerId = fighter.id;
                }
                createVixarImpact(document.getElementById('vixar-boss-stage'), fighter?.color || '#f8fafc', dealt > 0 ? `−${Math.round(dealt)}` : 'CROWN LOCK', { critical:options.critical, big:options.signature });
                // v11.0.0 Scarlet Brand: damage dealt by the marked team heals Vixar slightly (never past the 10% threshold).
                if (fighter && dealt > 0 && boss.brandTeamId === fighter.id && boss.brandUntil > now && boss.hp > vixarExecutionHP()) {
                    const heal = Math.min(boss.maxHP - boss.hp, Math.max(1, Math.round(dealt * sagaBalance.brandHeal)));
                    if (heal > 0) { boss.hp += heal; createVixarImpact(document.getElementById('vixar-boss-stage'), '#fb7185', `+${heal}`, { heal:true }); }
                }
                vixarBossHitAnimation();
                updateVixarBossHUD();
                updateVixarPhase();
                if (vixarRaidState.act.merge && !vixarRaidState.edictCast && boss.hp <= Math.round(boss.maxHP * .70) && vixarAllSealsBroken()) {
                    beginVixarEdict();
                    return dealt;
                }
                if (boss.hp <= vixarExecutionHP() && vixarAllSealsBroken()) {
                    beginVixarFinalAttack();
                }
                return dealt;
            }


            function computeVixarTeamDamage(fighter, signature = false) {
                const now = SceneRuntime.now();
                const random = .92 + Math.random() * .18;
                const criticalChance = Math.min(.46, .09 + fighter.arcane * .0022 + (fighter.damageBuffUntil > now ? .18 : 0));
                const critical = Math.random() < criticalChance;
                const base = 12 + fighter.power * .53;
                const signatureMultiplier = signature ? 2.18 : 1;
                const buff = fighter.damageBuffUntil > now ? 1.24 : 1;
                const legendaryPower = fighter.level >= vixarRaidState.act.level ? VIXAR_LEGENDARY_DAMAGE_MULTIPLIER : 1;
                // A fused pair strikes with both houses' power (its own power stat already sums them).
                const fusion = fighter.merged ? sagaBalance.fusionDamage : 1;
                const coordinatedAssault = vixarRaidState?.allLegendary && vixarAllSealsBroken()
                    ? VIXAR_COORDINATED_ASSAULT_MULTIPLIER
                    : 1;
                const legendaryOverdrive = vixarRaidState?.legendaryOverdrive
                    ? (vixarRaidState.act.merge && vixarRaidState.mergedPairs.length < 2 ? sagaBalance.partialOverdrive : VIXAR_LEGENDARY_OVERDRIVE_MULTIPLIER)
                    : 1;
                return {
                    damage:Math.round(base * signatureMultiplier * buff * legendaryPower * fusion * coordinatedAssault * legendaryOverdrive * random * (critical ? 1.5 : 1)),
                    critical
                };
            }

            const raidProfile = fighter => battleProfiles[fighter.id] || battleProfiles[fighter.members?.[0]] || battleProfiles.gryffindor;
            function maybeUseVixarRelic(fighter, now) {
                if (!fighter.hasRelic || fighter.relicUsed || vixarRaidState.elapsed < 14500) return false;
                const ratio = fighter.hp / fighter.maxHP;
                if (ratio > .62 && Math.random() > .16) return false;
                fighter.relicUsed = true;
                const relicEl = document.getElementById(`vixar-team-relic-${fighter.id}`);
                if (relicEl) relicEl.textContent = `${fighter.merged ? '✦' : teamRelics[fighter.id].icon} USED`;
                setVixarTeamStatus(fighter, raidProfile(fighter).relic, 1400);
                playSound('relic');
                if (fighter.merged) {
                    // A fused pair's relic: both houses' relics as one, a shield and a burst of power.
                    fighter.shieldHP += Math.round(fighter.maxHP * .12);
                    fighter.damageBuffUntil = now + 5200;
                    fighter.energy = 3;
                    animateVixarTeam(fighter, 'guard', 1200);
                    updateVixarTeamHUD(fighter);
                } else if (fighter.id === 'gryffindor') {
                    fighter.invulnerableUntil = now + 2600;
                    fighter.shieldHP += 90;
                    animateVixarTeam(fighter, 'guard', 1200);
                } else if (fighter.id === 'slytherin') {
                    const seal = vixarTargetSealForFighter(fighter);
                    if (seal) {
                        const target = vixarSealElement(seal.id);
                        animateVixarTeam(fighter, 'action', 780, target);
                        createVixarProjectile(document.getElementById(`vixar-avatar-shell-${fighter.id}`), target, fighter.color);
                        vixarSchedule(() => vixarDamageSeal(fighter, 105, 'relic', seal.id), 520);
                    }
                    else {
                        for (let index = 0; index < 4; index++) vixarSchedule(() => vixarApplyBossDamage(fighter, 62, { ignoreArmor:index === 3 }), index * 620);
                    }
                } else if (fighter.id === 'hufflepuff') {
                    vixarRaidState.fighters.forEach(ally => {
                        if (!ally.alive) return;
                        ally.hp = Math.min(ally.maxHP, ally.hp + Math.round(ally.maxHP * .13));
                        ally.shieldHP += 34;
                        updateVixarTeamHUD(ally);
                    });
                } else if (fighter.id === 'ravenclaw') {
                    fighter.damageBuffUntil = now + 5200;
                    fighter.energy = 3;
                    updateVixarTeamHUD(fighter);
                }
                return true;
            }

            function performVixarTeamAction(fighter, now) {
                if (!vixarRaidState?.running || vixarRaidState.finishing) return;
                if (!fighter.alive || fighter.revivePending || now < fighter.busyUntil) return;
                if (now < fighter.silenceUntil) {
                    setVixarTeamStatus(fighter, 'Silenced', 600);
                    return;
                }
                if (maybeUseVixarRelic(fighter, now)) {
                    fighter.busyUntil = now + 1050;
                    return;
                }
                if (fighter.hp / fighter.maxHP < .28 && Math.random() < .24) {
                    fighter.shieldHP += Math.round(fighter.maxHP * .08);
                    updateVixarTeamHUD(fighter);
                    fighter.busyUntil = now + 780;
                    animateVixarTeam(fighter, 'guard', 760);
                    setVixarTeamStatus(fighter, 'Guard', 720);
                    playSound('shield');
                    return;
                }
                const signature = fighter.energy >= 3;
                const targetSeal = vixarTargetSealForFighter(fighter);
                const target = vixarTargetElementForFighter(fighter);
                const shell = document.getElementById(`vixar-avatar-shell-${fighter.id}`);
                const attack = computeVixarTeamDamage(fighter, signature);
                setVixarTeamStatus(fighter, signature ? raidProfile(fighter).signature : raidProfile(fighter).basic, signature ? 1150 : 720);
                animateVixarTeam(fighter, 'action', signature ? 1050 : 760, target);
                // Release after the approach. Damage and the visible impact share a deadline.
                const impactDelay = signature ? 620 : 520;
                vixarSchedule(() => {
                    if (!fighter.alive || vixarRaidState.finishing) return;
                    createVixarProjectile(RaidMotion.node(fighter.id) || shell, target, fighter.color, { signature, duration:impactDelay - 230 });
                }, 230);
                fighter.busyUntil = now + (signature ? 1120 : 760);
                if (signature) {
                    fighter.energy = 0;
                    fighter.signatureUses += 1;
                    playSound('signature');
                } else {
                    fighter.energy = Math.min(3, fighter.energy + 1);
                    playSound('attack');
                }
                updateVixarTeamHUD(fighter);
                vixarSchedule(() => {
                    if (!fighter.alive || !vixarRaidState?.running || vixarRaidState.finishing) return;
                    // A projectile aimed at a seal never silently redirects into VIXAR.
                    if (targetSeal){RaidMotion.resolve(fighter.id,'hit');vixarDamageSeal(fighter, attack.damage * (signature ? 1.24 : 1), 'team', targetSeal.id);}
                    else {
                        RaidMotion.strike(target, fighter.color, fighter.id);
                        vixarApplyBossDamage(fighter, attack.damage, { signature, critical:attack.critical });
                    }
                    if (attack.critical) {
                        fighter.criticals += 1;
                        createVixarImpact(target, '#fff', 'CRITICAL', { critical:true });
                        globalThis.LeagueFightFX?.hitStop(RaidMotion.node(fighter.id));
                    }
                }, impactDelay);
            }

            function vixarApplyTeamDamage(target, amount, label = '', options = {}) {
                if (!target.alive || target.revivePending || !vixarRaidState?.running || vixarRaidState.finishing) return 0;
                const now = SceneRuntime.now();
                const targetEl = document.getElementById(`vixar-team-${target.id}`);
                const fill = document.getElementById(`vixar-team-hp-fill-${target.id}`);
                if(!options.presented){
                    RaidMotion.move('boss','attack',document.getElementById(`vixar-avatar-shell-${target.id}`));
                    const travel = 420;
                    // A red ground mark warns the team just before the blow lands.
                    globalThis.LeagueFightFX?.telegraph(document.getElementById(`vixar-avatar-shell-${target.id}`), vixarRaidState.act.color === '#a78bfa' ? '#f472b6' : '#f43f5e', travel);
                    RaidMotion.bossShot(vixarBossTarget(),document.getElementById(`vixar-avatar-shell-${target.id}`),label,travel);
                    vixarSchedule(()=>vixarApplyTeamDamage(target,amount,label,{...options,presented:true}),travel);return 0;
                }
                if (target.invulnerableUntil > now) {
                    animateVixarTeam(target, 'guard');
                    createVixarImpact(targetEl, '#fef08a', 'IMMUNE');
                    return 0;
                }

                const armorScale = options.trueDamage ? 1 : 100 / (100 + Math.max(0, target.armor) * (options.piercing ? .20 : .42));
                const legendaryResolve = vixarRaidState.allLegendary && target.level >= vixarRaidState.act.level
                    ? VIXAR_LEGENDARY_RESOLVE_MULTIPLIER
                    : 1;
                let damage = Math.max(1, Math.round(amount * armorScale * legendaryResolve));
                if (target.shieldHP > 0 && !options.ignoreShield) {
                    const absorbed = Math.min(target.shieldHP, damage);
                    target.shieldHP -= absorbed;
                    damage -= absorbed;
                    if (absorbed > 0) {
                        createVixarImpact(targetEl, target.color, `SHIELD ${Math.round(absorbed)}`);
                        animateVixarTeam(target, 'guard');
                        if (target.shieldHP <= 0) globalThis.LeagueFightFX?.shieldBreak(document.getElementById(`vixar-avatar-shell-${target.id}`), target.color);
                    }
                }
                damage = Math.max(0, Math.round(damage));
                if (damage <= 0) {
                    updateVixarTeamHUD(target);
                    return 0;
                }

                target.hp = Math.max(0, target.hp - damage);
                target.damageTaken += damage;
                animateVixarTeam(target, options.rend ? 'void-rended' : 'hit', options.rend ? 560 : 440);
                if (label) setVixarTeamStatus(target, label, 920);
                createVixarImpact(targetEl, '#fda4af', `−${damage}`);
                if (!isLeanMode()) {
                    targetEl?.classList.add('boss-hit');
                    fill?.classList.remove('damage-pulse');
                    void fill?.offsetWidth;
                    fill?.classList.add('damage-pulse');
                    vixarSchedule(() => {
                        targetEl?.classList.remove('boss-hit');
                        fill?.classList.remove('damage-pulse');
                    }, 560);
                }

                if (target.hp <= 0) {
                    // v11.0.0 Act III: after the Edict, only a fused pair can endure at 1 HP; teams that fight on apart can fall.
                    const apart = vixarRaidState.act.merge && vixarRaidState.edictCast && !target.merged;
                    const legendaryLastStand = vixarRaidState.allLegendary
                        && vixarRaidState.boss.hp > vixarExecutionHP()
                        && !vixarRaidState.finishing
                        && (!apart || (target.apartStands || 0) < (vixarRaidState.mergedPairs.length ? sagaBalance.apartLastStandsPartial : sagaBalance.apartLastStands));
                    if (legendaryLastStand && apart) target.apartStands = (target.apartStands || 0) + 1;
                    if (legendaryLastStand) {
                        target.hp = 1;
                        target.alive = true;
                        target.revivePending = false;
                        target.invulnerableUntil = now + 1050;
                        setVixarTeamStatus(target, 'Legendary Last Stand', 1450);
                        if (!target.lastStandTriggered) {
                            target.lastStandTriggered = true;
                            addHistoryLog(`✦ ${target.name} endured at 1 HP to challenge VIXAR’s final attack.`, target.color);
                        }
                        createVixarImpact(targetEl, '#fff7c2', '1 HP · LAST STAND');
                        playSound('shield');
                    } else {
                        target.alive = false;
                        target.revivePending = false;
                        setVixarTeamStatus(target, 'Fallen', 1200);
                        addHistoryLog(`☠ ${target.name} was defeated by VIXAR.`, target.color);
                        playSound('negative');
                    }
                }
                updateVixarTeamHUD(target);
                return damage;
            }

            function vixarGuardianRevive(target) {
                if (!target || vixarRaidState?.finaleStage !== 'restoring') return;
                target.hp = target.maxHP;
                target.alive = true;
                target.revived = true;
                target.revivePending = false;
                target.shieldHP = 0;
                target.silenceUntil = target.slowUntil = target.invulnerableUntil = target.busyUntil = 0;
                updateVixarTeamHUD(target);
                RaidMotion.move(target.id, 'revive');
                RaidMotion.ring(document.getElementById(`vixar-avatar-shell-${target.id}`), target.color, true);
            }

            function chooseLivingVixarFighter() {
                const living = vixarRaidState.fighters.filter(fighter => fighter.alive && !fighter.revivePending);
                return living[Math.floor(Math.random() * living.length)] || null;
            }

            function performVixarNullLance() {
                const living = vixarRaidState.fighters.filter(fighter => fighter.alive && !fighter.revivePending);
                if (!living.length) return;
                const target = living.sort((a, b) => (a.hp / a.maxHP) - (b.hp / b.maxHP))[0];
                const targetEl = document.getElementById(`vixar-team-${target.id}`);
                const targetAvatar = document.getElementById(`vixar-avatar-shell-${target.id}`);
                const bossStage = document.getElementById('vixar-boss-stage');
                targetEl.classList.add('is-targeted');
                bossStage.classList.add('casting');
                createVixarCastRing(bossStage, '#f0abfc');
                vixarAnnounce('Null Lance · Execution Mark', '#f0abfc');
                vixarSchedule(() => {
                    targetEl.classList.remove('is-targeted');
                    bossStage.classList.remove('casting');
                    createVixarLineEffect('vixar-null-lance-beam', bossStage, targetAvatar, 700);
                    createVixarImpactWave(targetAvatar);
                    const damage = 138 + vixarRaidState.boss.phase * 32;
                    vixarApplyTeamDamage(target, damage, 'NULL LANCE', { piercing:true });
                    vixarScreenFlash('rgba(139,92,246,.30)');
                    shakeVixarArena();
                    playSound('signature');
                }, 900);
            }

            function performVixarCrownfall() {
                vixarAnnounce('Crownfall · Imperial Ruin', '#e9d5ff');
                const layer = document.getElementById('vixar-fx-layer');
                const living = vixarRaidState.fighters.filter(fighter => fighter.alive);
                living.forEach((fighter, index) => {
                    const target = document.getElementById(`vixar-avatar-shell-${fighter.id}`);
                    if (!isLeanMode()) {
                        const point = vixarArenaCenterForElement(target);
                        const shard = document.createElement('div');
                        shard.className = 'vixar-crownfall-shard';
                        shard.style.left = `${point.x - 9}px`;
                        shard.style.animationDelay = `${index * .12}s`;
                        layer.appendChild(shard);
                        vixarSchedule(() => shard.remove(), 1650);
                    }
                    vixarSchedule(() => {
                        if (!fighter.alive) return;
                        createVixarImpactWave(target);
                        vixarApplyTeamDamage(fighter, 76 + vixarRaidState.boss.phase * 27, 'CROWNFALL');
                        shakeVixarArena();
                    }, 720 + index * 115);
                });
                vixarSchedule(() => vixarScreenFlash('rgba(196,181,253,.26)'), 860);
                playSound('signature');
            }

            function createVixarChainToFighter(fighter) {
                if (isLeanMode()) {
                    RaidMotion.stream(vixarBossTarget(), document.getElementById(`vixar-avatar-shell-${fighter.id}`), '#c4b5fd', 600);
                    return;
                }
                const layer = document.getElementById('vixar-fx-layer');
                const start = vixarArenaCenterForElement(document.getElementById('vixar-boss-stage'));
                const end = vixarArenaCenterForElement(document.getElementById(`vixar-avatar-shell-${fighter.id}`));
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const chain = document.createElement('div');
                chain.className = 'vixar-chain';
                chain.style.left = `${start.x}px`;
                chain.style.top = `${start.y}px`;
                chain.style.width = `${Math.hypot(dx, dy)}px`;
                chain.style.transform = `rotate(${Math.atan2(dy, dx) * 180 / Math.PI}deg)`;
                layer.appendChild(chain);
                vixarSchedule(() => chain.remove(), 1450);
            }

            function performVixarEdict() {
                const now = SceneRuntime.now();
                vixarAnnounce('Edict of Separation · Unity Severed', '#c4b5fd');
                vixarRaidState.fighters.forEach((fighter, index) => {
                    if (!fighter.alive) return;
                    createVixarChainToFighter(fighter);
                    fighter.silenceUntil = now + 2550;
                    fighter.slowUntil = now + 5100;
                    vixarSchedule(() => vixarApplyTeamDamage(fighter, 48 + vixarRaidState.boss.phase * 18, 'SEPARATED', { piercing:true }), 260 + index * 80);
                });
                vixarSchedule(() => shakeVixarArena(), 520);
                playSound('vortex');
            }

            function performVixarAegis() {
                RaidMotion.move('boss', 'guard');
                RaidMotion.ring(document.getElementById('vixar-boss-stage'), '#c4b5fd', true);
                const boss = vixarRaidState.boss;
                boss.shieldHP += 250 + boss.phase * 85;
                if (!isLeanMode()) {
                    const aegis = document.createElement('div');
                    aegis.className = 'vixar-aegis active';
                    document.getElementById('vixar-fx-layer').appendChild(aegis);
                    vixarSchedule(() => aegis.remove(), 1900);
                }
                updateVixarBossHUD();
                vixarAnnounce('Astral Aegis', '#d8b4fe');
                playSound('shield');
            }

            function performVixarInversion() {
                const target = vixarRaidState.fighters.find(fighter => fighter.id === vixarRaidState.boss.lastAttackerId && fighter.alive) || chooseLivingVixarFighter();
                if (!target) return;
                vixarRaidState.boss.invertedTeamId = target.id;
                vixarRaidState.boss.inversionUntil = SceneRuntime.now() + 5800;
                setVixarTeamStatus(target, 'Element Inverted', 1500);
                vixarAnnounce(`${fighterElementName(target.id)} Inversion · Power Reflected`, target.color);
                const remainingSeal = vixarTargetSealForFighter(target);
                const seal = remainingSeal ? vixarSealElement(remainingSeal.id) : vixarBossTarget();
                seal?.classList.add('inverted');
                createVixarCastRing(seal || document.getElementById('vixar-boss-stage'), target.color);
                vixarSchedule(() => {
                    seal?.classList.remove('inverted');
                    vixarApplyTeamDamage(target, 112 + vixarRaidState.boss.phase * 24, 'INVERTED', { piercing:true });
                    createVixarImpactWave(document.getElementById(`vixar-avatar-shell-${target.id}`));
                }, 700);
                playSound('debuff');
            }

            function performVixarGravityCollapse() {
                const living = vixarRaidState.fighters.filter(fighter => fighter.alive);
                if (!living.length) return;
                vixarAnnounce('Gravity Collapse · Event Horizon', '#d8b4fe');
                let well = null;
                if (!isLeanMode()) {
                    well = document.createElement('div');
                    well.className = 'vixar-gravity-well';
                    document.getElementById('vixar-fx-layer').appendChild(well);
                    living.forEach(fighter => document.getElementById(`vixar-avatar-shell-${fighter.id}`)?.classList.add('gravity-pulled'));
                }
                vixarSchedule(() => {
                    living.forEach(fighter => {
                        document.getElementById(`vixar-avatar-shell-${fighter.id}`)?.classList.remove('gravity-pulled');
                        if (fighter.alive) vixarApplyTeamDamage(fighter, 88 + vixarRaidState.boss.phase * 29, 'GRAVITY COLLAPSE', { piercing:true });
                    });
                    vixarScreenFlash('rgba(76,29,149,.42)');
                    shakeVixarArena(560);
                    playSound('vortex');
                }, 1250);
                if (well) vixarSchedule(() => well.remove(), 1800);
            }

            function performVixarOblivionSweep() {
                const living = vixarRaidState.fighters.filter(fighter => fighter.alive);
                if (!living.length) return;
                const targetCount = vixarRaidState.boss.phase >= 3 ? living.length : Math.min(2, living.length);
                const targets = shuffledBattleOrder(living).slice(0, targetCount);
                let sweep = null;
                if (!isLeanMode()) {
                    const averageY = targets.reduce((sum, fighter) => {
                        const el = document.getElementById(`vixar-avatar-shell-${fighter.id}`);
                        return sum + vixarArenaCenterForElement(el).y;
                    }, 0) / targets.length;
                    sweep = document.createElement('div');
                    sweep.className = 'vixar-void-sweep';
                    sweep.style.top = `${averageY}px`;
                    document.getElementById('vixar-fx-layer').appendChild(sweep);
                }
                vixarAnnounce('Oblivion Sweep', '#f0abfc');
                vixarSchedule(() => {
                    targets.forEach(fighter => vixarApplyTeamDamage(fighter, 105 + vixarRaidState.boss.phase * 28, 'OBLIVION SWEEP', { piercing:true }));
                    vixarScreenFlash('rgba(217,70,239,.28)');
                    shakeVixarArena();
                }, 620);
                if (sweep) vixarSchedule(() => sweep.remove(), 1400);
                playSound('signature');
            }

            function performVixarSoulRend() {
                const living = vixarRaidState.fighters.filter(fighter => fighter.alive);
                if (!living.length) return;
                const target = living.sort((a, b) => (a.hp / a.maxHP) - (b.hp / b.maxHP))[0];
                const targetAvatar = document.getElementById(`vixar-avatar-shell-${target.id}`);
                const point = isLeanMode() ? null : vixarArenaCenterForElement(targetAvatar);
                vixarAnnounce('Soul Rend · Threefold Execution', '#f9a8d4');
                for (let index = 0; index < 3; index++) {
                    vixarSchedule(() => {
                        if (!target.alive) return;
                        if (point) {
                            const slash = document.createElement('div');
                            slash.className = 'vixar-rend-slash';
                            slash.style.left = `${point.x + (index - 1) * 8}px`;
                            slash.style.top = `${point.y + (index - 1) * 7}px`;
                            slash.style.setProperty('--slash-angle', `${index === 1 ? -42 : index === 2 ? 18 : 52}deg`);
                            document.getElementById('vixar-fx-layer').appendChild(slash);
                            vixarSchedule(() => slash.remove(), 600);
                        }
                        vixarApplyTeamDamage(target, 52 + vixarRaidState.boss.phase * 13, 'SOUL REND', { rend:true, piercing:index === 2, ignoreShield:index === 2 });
                        playSound('attack');
                    }, index * 310);
                }
            }

            // v11.0.0 Act II: Scarlet Brand marks one team for 6 seconds. Damage dealt by the marked team heals Vixar
            // slightly. The mark is large and readable from the back row.
            function performVixarScarletBrand() {
                const living = vixarRaidState.fighters.filter(fighter => fighter.alive && !fighter.revivePending);
                if (!living.length) return;
                const target = living.find(fighter => fighter.id === vixarRaidState.boss.lastAttackerId) || living.sort((a, b) => b.raidDamage - a.raidDamage)[0];
                const boss = vixarRaidState.boss, now = SceneRuntime.now();
                document.querySelectorAll('.vixar-team-fighter.is-branded').forEach(el => el.classList.remove('is-branded'));
                boss.brandTeamId = target.id;
                boss.brandUntil = now + VIXAR_BRAND_MS;
                const el = document.getElementById(`vixar-team-${target.id}`);
                el?.classList.add('is-branded');
                RaidMotion.bossShot(vixarBossTarget(), document.getElementById(`vixar-avatar-shell-${target.id}`), 'SCARLET BRAND', 420);
                globalThis.LeagueFightFX?.telegraph(document.getElementById(`vixar-avatar-shell-${target.id}`), '#fb7185', 420);
                vixarSchedule(() => { if (boss.brandTeamId === target.id && boss.brandUntil <= SceneRuntime.now() + 20) { boss.brandTeamId = null; el?.classList.remove('is-branded'); } }, VIXAR_BRAND_MS);
                addHistoryLog(`♦ Scarlet Brand marked ${target.name}: its attacks heal Vixar for six seconds.`, '#fb7185');
                playSound('debuff');
            }

            function performVixarFifthSilence() {
                const boss = vixarRaidState.boss;
                if (boss.fifthSilenceUsed) return false;
                boss.fifthSilenceUsed = true;
                vixarAnnounce('The Fifth Silence · Extinction Channel', '#fff');
                const overlay = document.getElementById('vixar-raid-overlay');
                overlay.classList.add('empty-crown');
                vixarRaidState.fighters.forEach(fighter => {
                    if (!fighter.alive) return;
                    fighter.energy = 3;
                    fighter.nextActionAt = Math.min(fighter.nextActionAt, SceneRuntime.now() + 160 + Math.random() * 160);
                    updateVixarTeamHUD(fighter);
                });
                vixarSchedule(() => {
                    overlay.classList.remove('empty-crown');
                    vixarRaidState.fighters.forEach(fighter => {
                        if (!fighter.alive) return;
                        // Gilded Vixar's strongest phase: survivable for a fused pair, harsh for teams that fight on apart.
                        const gilded = vixarRaidState.act.merge;
                        const extinctionDamage = Math.round(fighter.maxHP * (gilded ? (fighter.merged ? sagaBalance.silenceFused : sagaBalance.silenceApart) : .23)) + 42;
                        vixarApplyTeamDamage(fighter, extinctionDamage, 'FIFTH SILENCE', { trueDamage:true });
                    });
                    vixarScreenFlash('rgba(255,255,255,.48)');
                    shakeVixarArena(650);
                    playSound('negative');
                }, 3600);
                playSound('unityForge');
                return true;
            }

            function performVixarBossAction(now) {
                if (!vixarRaidState?.running || vixarRaidState.finishing) return;
                const boss = vixarRaidState.boss;
                if (!vixarRaidState.fighters.some(fighter => fighter.alive)) return;
                if (boss.phase === 3 && !boss.fifthSilenceUsed) {
                    RaidMotion.move('boss', 'cast');
                    performVixarFifthSilence();
                    boss.actionIndex += 1;
                    return;
                }
                const act = vixarRaidState.act;
                let phaseActions = boss.phase === 1
                    ? [performVixarNullLance, performVixarCrownfall, performVixarGravityCollapse, performVixarAegis]
                    : boss.phase === 2
                        ? [performVixarEdict, performVixarOblivionSweep, performVixarNullLance, performVixarInversion, performVixarCrownfall, performVixarGravityCollapse, performVixarAegis]
                        : [performVixarSoulRend, performVixarOblivionSweep, performVixarGravityCollapse, performVixarNullLance, performVixarCrownfall, performVixarEdict, performVixarInversion, performVixarAegis];
                // Act II adds Scarlet Brand to every phase. Act III's Edict is the Merge Spell's moment, not a repeated attack.
                if (act.brand) phaseActions = [...phaseActions.slice(0, 1), performVixarScarletBrand, ...phaseActions.slice(1)];
                if (act.merge) phaseActions = phaseActions.filter(action => action !== performVixarEdict);
                const action = phaseActions[boss.actionIndex % phaseActions.length];
                boss.actionIndex += 1;
                if (action !== performVixarAegis) RaidMotion.move('boss', 'attack');
                action();
            }

            function vixarBossActionDelay() {
                const phase = vixarRaidState.boss.phase;
                // VIXAR remains devastating, but the wider attack windows allow a
                // fully Legendary party enough coordinated turns to reach 10% HP.
                return (phase === 1 ? 3150 : phase === 2 ? 2520 : 1960) * vixarRaidState.act.pace * (.92 + Math.random() * .16);
            }

            function performVixarGuardianPulse(now) {
                // The Unity Guardian no longer participates in ordinary raid combat.
                // It is reserved exclusively for beginVixarUnityFinisher().
                return false;
            }

            // Overdrive and the one overtime belong to a class that meets the act's requirements; in Act III, to a class that
            // fused both pairs in the Merge Spell.
            function vixarSupportsOvertime() {
                return Boolean(vixarRaidState?.allLegendary && (!vixarRaidState.act.merge || vixarRaidState.mergedPairs.length === 2));
            }
            // The late-fight Overdrive: in Act III, a class that fused at least one pair.
            function vixarSupportsOverdrive() {
                return Boolean(vixarRaidState?.allLegendary && (!vixarRaidState.act.merge || vixarRaidState.mergedPairs.length > 0));
            }
            function activateVixarLegendaryOverdrive(now, overtime = false) {
                if (!(overtime ? vixarSupportsOvertime() : vixarSupportsOverdrive()) || vixarRaidState.finishing) return false;
                if (vixarRaidState.legendaryOverdrive && !overtime) return false;
                vixarRaidState.legendaryOverdrive = true;
                vixarRaidState.boss.armor = Math.min(vixarRaidState.boss.armor, overtime ? 68 : 78);
                vixarRaidState.boss.shieldHP = 0;
                vixarRaidState.fighters.forEach((fighter, index) => {
                    if (!fighter.alive) return;
                    fighter.energy = 3;
                    fighter.damageBuffUntil = Math.max(fighter.damageBuffUntil, now + (overtime ? 26000 : 22000));
                    fighter.nextActionAt = Math.min(fighter.nextActionAt, now + 180 + index * 90);
                    updateVixarTeamHUD(fighter);
                    animateVixarTeam(fighter, 'convergence', 1200);
                });
                document.getElementById('vixar-raid-overlay')?.classList.add('legendary-overdrive');
                document.getElementById('vixar-raid-condition').textContent = overtime
                    ? 'Legendary Overtime · all four teams focus everything on the final 10% threshold'
                    : 'Legendary Overdrive · coordinated damage increased until VIXAR reaches 10% HP';
                vixarAnnounce(overtime ? 'Legendary Overtime · Break the Final Threshold' : 'Four Legendary Powers · Coordinated Overdrive', '#fff7c2');
                vixarScreenFlash('rgba(254,240,138,.34)');
                playSound('unityForge');
                return true;
            }

            function updateVixarPhase() {
                if (!vixarRaidState || vixarRaidState.finishing) return;
                const boss = vixarRaidState.boss;
                const ratio = boss.hp / boss.maxHP;
                const scale = vixarRaidState.duration / 85000;
                let nextPhase = 1;
                if (ratio <= .70 || vixarRaidState.elapsed >= 23000 * scale) nextPhase = 2;
                if (ratio <= .35 || vixarRaidState.elapsed >= 47000 * scale) nextPhase = 3;
                // Act III: Phase II is the fused fight, after the Edict and the Merge Spell.
                if (vixarRaidState.act.merge && !vixarRaidState.edictCast) nextPhase = 1;
                if (vixarRaidState.act.merge && vixarRaidState.merge && !vixarRaidState.merge.done) return;
                if (nextPhase === boss.phase) return;
                boss.phase = nextPhase;
                const overlay = document.getElementById('vixar-raid-overlay');
                overlay.classList.toggle('phase-two', nextPhase >= 2);
                overlay.classList.toggle('phase-three', nextPhase >= 3);
                const poseId = vixarRaidState.act.art;
                if (nextPhase === 2) {
                    globalThis.CreaturePoses?.show(document.getElementById('vixar-animated-actor'),'proud',{id:poseId,duration:1500,priority:40});
                    vixarAnnounce('VIXAR reveals six astral arms', '#c4b5fd');
                    playSound('battleStart');
                } else if (nextPhase === 3) {
                    document.getElementById('vixar-chest-armor')?.setAttribute('opacity', '.28');
                    globalThis.CreaturePoses?.show(document.getElementById('vixar-animated-actor'),'exposed',{id:poseId,duration:2000,priority:40});
                    vixarAnnounce('The true void core is exposed', '#f0abfc');
                    vixarScreenFlash('rgba(217,70,239,.26)');
                    playSound('signature');
                }
                updateVixarBossHUD();
            }

            function setVixarFinaleStage(stage) {
                vixarRaidState.finaleStage=stage;LeagueScenes.phase('raid',stage);
                document.getElementById('vixar-raid-overlay').dataset.finaleStage = stage;
            }

            function beginVixarFinalAttack() {
                const state = vixarRaidState;
                if (!state?.running || state.finishing || state.finalAttackUsed || !vixarAllSealsBroken() || state.boss.hp > vixarExecutionHP()) return;
                state.finalAttackUsed = true;
                state.finishing = true;
                // Cancel in-flight damage, relic ticks and boss casts before the finale.
                // Its own tracked timers are the sole authority for the remaining HP changes.
                clearVixarRaidTasks();
                document.getElementById('vixar-fx-layer').replaceChildren();
                document.querySelectorAll('.vixar-team-fighter.is-targeted').forEach(el => el.classList.remove('is-targeted'));
                const stage = document.getElementById('vixar-boss-stage');
                stage.classList.remove('casting', 'is-hit');
                const overlay = document.getElementById('vixar-raid-overlay');
                overlay.classList.remove('empty-crown', 'legendary-overdrive');
                overlay.classList.add('phase-three', 'final-assault');
                state.boss.hp = vixarExecutionHP();
                state.boss.shieldHP = 0;
                state.boss.brandTeamId = null;
                document.querySelectorAll('.vixar-team-fighter.is-branded').forEach(el => el.classList.remove('is-branded'));
                updateVixarBossHUD();
                setVixarFinaleStage('charging');
                RaidMotion.move('boss', 'ultimate');
                RaidMotion.wave(vixarBossTarget(), '#c4b5fd', 900, true);
                playSound('unityForge');

                vixarSchedule(() => {
                    setVixarFinaleStage('blast');
                    RaidMotion.wave(vixarBossTarget(), '#d8b4fe', 700);
                    state.fighters.forEach(fighter => {
                        RaidMotion.bossShot(vixarBossTarget(), document.getElementById(`vixar-avatar-shell-${fighter.id}`), 'FINAL BLAST', 420);
                    });
                    playSound('signature');
                }, 900);

                vixarSchedule(() => {
                    setVixarFinaleStage('fallen');
                    state.fighters.forEach(fighter => {
                        fighter.damageTaken += fighter.hp;
                        fighter.hp = 0;
                        fighter.alive = false;
                        fighter.revivePending = false;
                        fighter.shieldHP = 0;
                        fighter.invulnerableUntil = 0;
                        fighter.busyUntil = 0;
                        updateVixarTeamHUD(fighter);
                        RaidMotion.move(fighter.id, 'knockout');
                    });
                    playSound('negative');
                    // The rescue is earned by the completed Class Mission.
                    if (state.eligibleVictory) {
                        vixarSchedule(beginVixarUnityFinisher, 300);
                    } else {
                        vixarSchedule(() => finishVixarRaid(false, 'VIXAR’s final attack overwhelmed the teams. Complete the Class Mission to summon the Unity Guardian.'), 1600);
                    }
                }, 1320);
            }

            // =================================================================
            // v11.0.0 ACT III · THE EDICT OF SEPARATION AND THE MERGE SPELL
            // At 70% HP Gilded Vixar casts the Edict and the fight freezes. The class answers English questions in turn
            // until old rivals fuse: Slyffindor (Gryffindor + Slytherin) and Huffleclaw (Hufflepuff + Ravenclaw).
            // No fight timer runs during the spell; its ritual circle is the only timer. No student is ever named for a miss.
            // =================================================================
            const MERGE_TYPES = ['Vocabulary', 'Translation', 'Grammar', 'Sentence Repair', 'Ask a Question'];
            function beginVixarEdict() {
                const state = vixarRaidState;
                if (!state?.running || state.finishing || state.edictCast) return;
                state.edictCast = true;
                state.edictAt = SceneRuntime.now();
                clearVixarRaidTasks();
                document.getElementById('vixar-fx-layer').replaceChildren();
                state.boss.shieldHP = 0;
                state.boss.brandTeamId = null;
                const overlay = document.getElementById('vixar-raid-overlay');
                overlay.classList.add('edict-cast');
                LeagueScenes.phase('raid', 'edict');
                RaidMotion.move('boss', 'ultimate');
                state.fighters.forEach(fighter => { if (fighter.alive) createVixarChainToFighter(fighter); });
                updateVixarBossHUD();
                addHistoryLog('⛓ Gilded Vixar cast the Edict of Separation. The class answers together with the Merge Spell.', '#fbbf24');
                playSound('vortex');
                vixarSchedule(startMergeSpell, 1500);
            }
            function mergeHouseOrder(house) {
                // "Next to invite" order: fewest contributions first, then roster order.
                return LeagueStudents.members(selectedClass, house)
                    .map((person, order) => ({ ...person, awards:studentContributions[person.id]?.awards || 0, order }))
                    .sort((a, b) => a.awards - b.awards || a.order - b.order);
            }
            function mergeDeal(house) {
                const team = teamsData.find(t => t.id === house);
                const ctx = challengeContext(team);
                if (!ctx) return null;
                const types = shuffleTraits(MERGE_TYPES);
                for (const type of types) {
                    const card = LeagueChallenge.deal(type, ctx);
                    if (card?.choice) return { ...card, island:ctx.island };
                }
                return null;
            }
            function dealMergeTurn() {
                const state = vixarRaidState, merge = state?.merge;
                if (!merge || merge.done || !merge.turn) { state.mergeCard = null; return; }
                const house = merge.turn.house;
                // The student chosen for this turn (suggested, or changed by Mr. Saymaz while the last card was showing).
                if (state.mergeStudent?.turn !== merge.turn.n) suggestMergeStudent(state);
                const card = mergeDeal(house);
                state.mergeCard = card ? { ...card, id:`merge-${merge.turns}` } : null;
                state.mergeOutcome = null;
                if (!card) {
                    // No island content for this class: the turn passes on so the spell can still finish.
                    addHistoryLog('No Merge Spell card could be dealt from this class’s islands; the turn passes on.', '#fbbf24');
                    vixarSchedule(() => { if (vixarRaidState === state && merge.turn) { LeagueMergeSpell.answer(merge, false, { at:Date.now() }); dealMergeTurn(); renderMergeView(); } }, 900);
                }
            }
            function suggestMergeStudent(state) {
                const merge = state.merge;
                if (!merge?.turn) { state.mergeStudent = null; return; }
                const person = LeagueMergeSpell.suggest(merge, mergeHouseOrder(merge.turn.house));
                state.mergeStudent = person ? { id:person.id, name:person.name, turn:merge.turn.n } : null;
            }
            function mergeView() {
                const state = vixarRaidState, merge = state?.merge;
                if (!merge) return null;
                const now = SceneRuntime.now(), card = state.mergeCard, outcome = state.mergeOutcome;
                return {
                    casting:merge.casting, remainingMs:LeagueMergeSpell.remaining(merge, now), totalMs:merge.casting === 2 ? merge.secondMs : merge.circleMs,
                    done:merge.done, success:merge.success, shattered:merge.shattered,
                    pairs:Object.fromEntries(Object.keys(LeagueMergeSpell.PAIRS).map(id => [id, { meter:LeagueMergeSpell.meter(merge, id), merged:merge.pairs[id].merged }])),
                    turn:merge.turn ? { house:merge.turn.house, rescue:merge.turn.rescue, n:merge.turn.n, student:state.mergeStudent?.name || '', studentId:state.mergeStudent?.id || '' } : null,
                    card:card ? { id:card.id, type:card.type, icon:card.icon, prompt:card.prompt, context:card.context || '', instruction:card.instruction || '', options:card.options } : null,
                    outcome:outcome ? (outcome.ok ? 'right' : 'wrong') : null, chosen:outcome?.chosen ?? null, answer:outcome ? card?.answer : null,
                    answerText:outcome && !outcome.ok && card ? card.options[card.answer] : '',
                    message:merge.done ? (merge.success ? 'Both pairs fused!' : LeagueMergeSpell.result(merge).merged.length ? 'One pair fused. The other fights on as two teams.' : 'The teams fight on apart.') : '',
                    students:merge.turn ? LeagueMergeSpell.choices(merge, mergeHouseOrder(merge.turn.house)) : []
                };
            }
            function renderMergeView() { LeagueMergeSpell.update(mergeView()); window.syncStateToController?.(); }
            function startMergeSpell() {
                const state = vixarRaidState;
                if (!state?.running || state.finishing || state.merge) return;
                const now = SceneRuntime.now();
                state.merge = LeagueMergeSpell.create({ now, circleMs:MERGE_CIRCLE_MS, secondMs:MERGE_SECOND_MS });
                state.mergeStartedAt = now;
                document.getElementById('vixar-raid-overlay').classList.add('merge-active');
                LeagueScenes.phase('raid', 'merge');
                LeagueMergeSpell.mount(document.getElementById('vixar-raid-arena'), {
                    avatar:house => { const team = teamsData.find(t => t.id === house); return getAvatarSVG(house, team.traits); },
                    onChoose:(cardId, index) => chooseMergeOption(cardId, index)
                });
                LeagueMergeSpell.start(state.merge);
                dealMergeTurn();
                scheduleMergeExpiry();
                updateVixarBossHUD();
                renderMergeView();
                playSound('mergeOpen');
            }
            function scheduleMergeExpiry() {
                const state = vixarRaidState, merge = state?.merge;
                if (!merge || merge.done) return;
                const casting = merge.casting;
                vixarSchedule(() => {
                    // The scene clock already waits while the scene is paused, so its timer is the circle's timer.
                    if (vixarRaidState !== state || merge.done || merge.casting !== casting) return;
                    const result = LeagueMergeSpell.expire(merge, SceneRuntime.now());
                    if (result.second) {
                        // The circle emptied: Vixar shatters the spell once. A pair that already fused stays fused.
                        LeagueMergeSpell.shatter();
                        playSound('shatterMetal');
                        addHistoryLog('✦ The ritual circle emptied. Gilded Vixar shattered the spell once: a second casting begins.', '#fbbf24');
                        dealMergeTurn();
                        scheduleMergeExpiry();
                        renderMergeView();
                        return;
                    }
                    finishMergeSpell();
                }, Math.max(0, LeagueMergeSpell.remaining(merge, SceneRuntime.now())));
            }
            // A correct Merge answer counts as a contribution for that student, like a point award, with no house points.
            function creditMergeContribution(person) {
                if (!person) return;
                const previous = studentContributions[person.id] || { points:0, awards:0 };
                studentContributions[person.id] = { points:previous.points, awards:previous.awards + 1 };
                syncParticipationMission();
            }
            function chooseMergeOption(cardId, index) {
                const state = vixarRaidState, merge = state?.merge, card = state?.mergeCard;
                if (!merge || merge.done || !card || !merge.turn) return { ok:false, message:'No Merge Spell card is open' };
                if (cardId !== card.id) return { ok:false, message:'That card has already closed' };
                if (state.mergeOutcome) return { ok:false, message:'This card is answered' };
                if (![0, 1, 2].includes(index)) return { ok:false, message:'Choose A, B or C' };
                const ok = index === card.answer, house = merge.turn.house, student = state.mergeStudent;
                const person = student ? LeagueStudents.student(selectedClass, house, student.id) : null;
                state.mergeOutcome = { ok, chosen:index };
                const name = teamsData.find(t => t.id === house)?.name || house;
                // Every Merge question goes to the Challenge_Log tab, marked as Merge, with the session and the answer.
                challengeLog.push({ id:`${sessionId}-m${challengeLog.filter(row => row.merge).length + 1}`, at:Date.now(), className:selectedClass || '', team:name,
                    studentId:person?.id || '', student:person?.name || '', level:12, type:`Merge · ${card.type}`, merge:true,
                    word:`${card.word || ''}${card.word ? ' · ' : ''}answered: ${card.options[index]}`.slice(0, 120), island:card.island || 1, result:ok ? 'right' : 'wrong' });
                if (challengeLog.length > 200) challengeLog.shift();
                if (ok) creditMergeContribution(person);
                const result = LeagueMergeSpell.answer(merge, ok, { studentId:person?.id || '', student:person?.name || '', at:Date.now() });
                // The banner moves on to the next house and its student at once: nobody is named for a miss.
                suggestMergeStudent(state);
                if (ok) playSound('mergeStep', LeagueMergeSpell.meter(merge, LeagueMergeSpell.pairOf(house)));
                else playSound('timer');
                if (result.fused) {
                    LeagueMergeSpell.flash(result.fused);
                    playSound('mergeResolve');
                    addHistoryLog(`✦ ${LeagueMergeSpell.PAIRS[result.fused].name} fused: ${LeagueMergeSpell.PAIRS[result.fused].houses.map(h => LeagueMergeSpell.NAMES[h]).join(' and ')} are one.`, LeagueMergeSpell.PAIRS[result.fused].colors[0]);
                }
                scheduleCheckpoint();
                renderMergeView();
                const turn = merge.turn?.n;
                vixarSchedule(() => {
                    if (vixarRaidState !== state || state.mergeOutcome?.chosen !== index) return;
                    if (merge.done) { finishMergeSpell(); return; }
                    if (merge.turn?.n !== turn) return;
                    dealMergeTurn();
                    renderMergeView();
                }, ok ? 1300 : 1900);
                return { ok:true, message:ok ? '✓ Right' : `✗ ${result.rescueBy ? LeagueMergeSpell.NAMES[result.rescueBy] + ' can rescue the pair' : 'The turn passes on'}` };
            }
            function chooseMergeStudent(studentId, turn) {
                const merge = vixarRaidState?.merge;
                if (!merge || merge.done || !merge.turn || (turn !== undefined && turn !== merge.turn.n)) return { ok:false, message:'That turn has ended' };
                const person = LeagueStudents.student(selectedClass, merge.turn.house, studentId);
                if (!person) return { ok:false, message:'Choose a student from this house' };
                vixarRaidState.mergeStudent = { id:person.id, name:person.name, turn:merge.turn.n };
                renderMergeView();
                return { ok:true, message:`${person.name} answers` };
            }
            function finishMergeSpell() {
                const state = vixarRaidState, merge = state?.merge;
                if (!merge || state.mergeFinished) return;
                state.mergeFinished = true;
                if (!merge.done) LeagueMergeSpell.expire(merge, SceneRuntime.now());
                const fused = LeagueMergeSpell.result(merge).merged;
                const spellMs = SceneRuntime.now() - state.mergeStartedAt;
                state.mergeCard = null;
                renderMergeView();
                addHistoryLog(fused.length === 2 ? '✦ Both pairs fused. Slyffindor and Huffleclaw fight Gilded Vixar.' : fused.length ? `✦ ${LeagueMergeSpell.PAIRS[fused[0]].name} fused; the other pair fights on as two teams.` : 'The four teams fight on apart.', '#fbbf24');
                vixarSchedule(() => {
                    if (vixarRaidState !== state) return;
                    // The fight froze at the Edict: the fight timer and every status carry on from where they stopped.
                    SceneRuntime.shiftClock(state, SceneRuntime.now() - state.edictAt);
                    buildMergedFighters(fused);
                    LeagueMergeSpell.unmount();
                    const overlay = document.getElementById('vixar-raid-overlay');
                    overlay.classList.remove('merge-active', 'edict-cast');
                    overlay.classList.toggle('fused-fight', fused.length > 0);
                    renderVixarRaidFighters();
                    state.fighters.forEach(fighter => { if (fighter.merged) RaidMotion.move(fighter.id, 'arrive'); });
                    state.boss.phase = 1;
                    updateVixarPhase();
                    const now = SceneRuntime.now();
                    state.boss.nextActionAt = now + 1800;
                    state.fighters.forEach((fighter, index) => { fighter.nextActionAt = now + 500 + index * 160; });
                    LeagueScenes.phase('raid', 'core');
                    updateVixarBossHUD();
                    scheduleVixarRaidLoop();
                }, 1700);
                return spellMs;
            }
            function buildMergedFighters(pairs) {
                const state = vixarRaidState, now = SceneRuntime.now();
                const fusedFighters = pairs.map((pairId, slot) => {
                    const def = LeagueMergeSpell.PAIRS[pairId];
                    const [a, b] = def.houses.map(id => state.fighters.find(f => f.id === id));
                    const maxHP = a.maxHP + b.maxHP;
                    return { ...a, id:pairId, name:def.name, merged:true, members:[a.id, b.id], colors:[a.color, b.color], color:a.color, traits:[],
                        level:Math.max(a.level, b.level), form:'Fused', arenaSlot:slot === 0 ? 'm0' : 'm1',
                        power:Math.round((a.power + b.power) * sagaBalance.fusionPower), armor:Math.round(Math.max(a.armor, b.armor) * 1.12),
                        speed:Math.round((a.speed + b.speed) / 2) + 8, arcane:Math.round((a.arcane + b.arcane) / 2) + 8,
                        maxHP, hp:maxHP, alive:true, energy:3, shieldHP:0, silenceUntil:0, slowUntil:0, damageBuffUntil:0, invulnerableUntil:0, busyUntil:0,
                        nextActionAt:now + 400, hasRelic:a.hasRelic || b.hasRelic, relicUsed:false, revived:false, revivePending:false, lastStandTriggered:false,
                        raidDamage:0, sealDamage:0, damageTaken:0, signatureUses:0, criticals:0 };
                });
                const fusedHouses = fusedFighters.flatMap(f => f.members);
                state.fighters = [...fusedFighters, ...state.fighters.filter(f => !fusedHouses.includes(f.id))];
                state.mergedPairs = pairs;
            }

            // =================================================================
            // v11.0.0 THE FINALE · a scene, not a fight. Mr. Saymaz advances it from the phone; Replay the Finale
            // (epilogue) plays it again with no fight and changes nothing.
            // =================================================================
            let finaleVoice = false;
            // A form's traits for the Light avatars: the ten original traits, then the saga trophies up to that level.
            function sagaFormTraits(teamId, level) {
                return [...teamTraits[teamId].filter(trait => !trait.stage).slice(0, Math.min(10, level)), ...teamTraits[teamId].filter(trait => trait.stage && trait.stage <= level)].map(trait => trait.id);
            }
            function houseId(name) { const n = String(name || '').toLowerCase(); return LeagueStudents.teams.find(id => id === n || teamsData.find(t => t.id === id)?.name.toLowerCase() === n) || null; }
            // Who is named: up to three students per house, from the class's saga sessions (Google Sheets and today), its
            // Island Run navigators and its correct Merge Spell answers. Names are shown only for what they gave.
            function sagaFinaleNames(c) {
                const extras = LeagueSaga.extras(c);
                const today = LeagueSaga.get(c).fightSessions.includes(sessionId);
                const contributions = extras.contributions.filter(row => !today || row.sessionId !== sessionId);
                if (today) for (const team of LeagueStudents.teams) for (const person of LeagueStudents.members(c, team)) {
                    const awards = studentContributions[person.id]?.awards || 0;
                    if (awards) contributions.push({ team, name:person.name, contributions:awards, sessionId });
                }
                const navigators = [...extras.navigators, ...(globalThis.LeagueNavigatorSeals?.rows(c) || []).map(row => ({ team:row.team, student:row.student }))];
                const seen = new Set(), merge = [];
                for (const row of [...extras.merge, ...challengeLog.filter(r => r.merge && r.className === c)]) {
                    if (row.id && seen.has(row.id)) continue; if (row.id) seen.add(row.id);
                    merge.push({ team:houseId(row.team), student:row.student, result:row.result });
                }
                return LeagueSaga.finaleNames({ contributions, navigators, merge });
            }
            function startSagaFinale({ replay = false } = {}) {
                const c = sagaClass();
                if (!c) return false;
                if (!replay) closeVixarRaid({ silent:true });
                else if (LeagueScenes.active) return false;
                currentEvent = null;
                const row = LeagueSaga.get(c), when = new Date(row.won.Gilded || Date.now());
                const date = `${String(when.getDate()).padStart(2, '0')}/${String(when.getMonth() + 1).padStart(2, '0')}/${when.getFullYear()}`;
                const order = ['gryffindor', 'slytherin', 'hufflepuff', 'ravenclaw'];
                LeagueSagaScenes.finale.start({
                    className:c, date, replay, voice:finaleVoice, lines:LeagueSaga.lines(Number(c[0])), names:sagaFinaleNames(c),
                    teams:order.map(id => { const team = teamsData.find(t => t.id === id); return { id, name:team.name, color:team.color, markup:getAvatarSVG(id, sagaFormTraits(id, 12), 12) }; }),
                    still:isLeanMode() && performanceMode !== 'animated' || window.matchMedia('(prefers-reduced-motion: reduce)').matches,
                    sound:name => playSound(name),
                    onChange:() => { window.syncStateToController?.(); updateSceneControls(); },
                    onEnd:() => { updateVixarRaidAccess(); updateGameState(true); }
                });
                addHistoryLog(replay ? `✦ Replay the Finale · ${c}` : `✦ The curse is broken. ${c} freed Mr. Saymaz.`, '#fde68a');
                return true;
            }
            function requestFinaleReplay(fromRemote = false) {
                const c = sagaClass();
                if (!c || LeagueSaga.stageOf(c) !== 'Freed') return { ok:false, message:'Replay the Finale opens after the curse is broken.' };
                if (LeagueScenes.active) return { ok:false, message:'Return to the scoreboard first.' };
                if (!fromRemote && !window.confirm(`Replay the Finale for ${c}? There is no fight.`)) return { ok:false };
                return { ok:startSagaFinale({ replay:true }) };
            }
            // What the phone's Vixar Saga panel shows: the class's row (also saved to Sheets by the phone), the Rift and
            // the readiness line, and the live Merge Spell or Finale controls.
            function sagaRemoteState() {
                const c = sagaClass();
                if (!c) return null;
                const row = LeagueSaga.get(c), act = LeagueSaga.act(row.stage);
                return {
                    className:c, stage:row.stage, row, stamp:LeagueSaga.stamp(row), cap:levelCap(), riftOpen, fought:sagaFoughtToday(c),
                    readiness:LeagueSaga.readiness(row.stage, Object.fromEntries(teamsData.map(t => [t.id, t.level])), classMission.completed),
                    act:act ? { level:act.level, title:act.title, kicker:act.kicker } : null,
                    fighting:Boolean(vixarRaidState && !vixarRaidState.completed && vixarRaidState.className === c),
                    progressionMode, merge:vixarRaidState?.merge && !vixarRaidState.mergeFinished ? mergeView() : null,
                    finale:LeagueSagaScenes.finale.view(),
                    mergeLog:challengeLog.filter(r => r.merge && r.className === c).slice(-60),
                    linesStamp:LeagueSaga.linesStamp(Number(c[0]))
                };
            }
            globalThis.LeagueSagaCap = levelCap;

            function beginVixarUnityFinisher() {
                const state = vixarRaidState;
                if (!state?.running || !state.finishing || state.finaleStage !== 'fallen' || !state.eligibleVictory) return;
                const overlay = document.getElementById('vixar-raid-overlay');
                const host = document.getElementById('vixar-guardian-host');
                const guardian = document.getElementById('vixar-unity-guardian-svg');
                const bossTarget = vixarBossTarget();
                setVixarFinaleStage('summoning');
                overlay.classList.add('unity-finisher');
                layoutVixarGuardian();
                // Four finite beams use the team colours, including fallen teams.
                state.fighters.forEach((fighter, index) => {
                    vixarSchedule(() => {
                        RaidMotion.stream(document.getElementById(`vixar-avatar-shell-${fighter.id}`), host, fighter.color, 1900);
                    }, index * 100);
                });
                playSound('unityReveal');

                vixarSchedule(() => {
                    host.classList.add('present');
                    state.guardianJoined = true;
                    RaidMotion.move('guardian', 'arrive');
                    RaidMotion.wave(host, '#fff1b3', 1000);
                    playSound('unityComplete');
                }, 600);

                vixarSchedule(() => {
                    setVixarFinaleStage('guardian-ready');
                    RaidMotion.move('guardian', 'cast');
                    RaidMotion.core(host);RaidMotion.ring(host,'#fff1b3',true);
                }, 1900);

                vixarSchedule(() => {
                    setVixarFinaleStage('guardian-strike');
                    RaidMotion.move('guardian','attack',bossTarget,{impact:420});
                    RaidMotion.bossShot(guardian || host, bossTarget, 'UNITY', 420);
                }, 2600);

                vixarSchedule(() => {
                    // First claw breaks the protected crown; the second is the final blow.
                    RaidMotion.claw(bossTarget, 0);
                    RaidMotion.move('boss', 'hit');
                    playSound('signature');
                }, 3020);

                vixarSchedule(() => {
                    RaidMotion.claw(bossTarget, 1);
                    RaidMotion.move('boss', 'knockout');
                    state.boss.hp = 0;
                    if (state.act.merge) {
                        // Act III: there is no escape this time. The gold armour cracks open: the Finale begins.
                        setVixarFinaleStage('crack');
                        updateVixarBossHUD();
                        playSound('heartbeat');
                        vixarSchedule(() => finishVixarRaid(true, 'The Unity Guardian’s claw cracked the gold armour open.'), 900);
                        return;
                    }
                    setVixarFinaleStage('restoring');
                    updateVixarBossHUD();
                    RaidMotion.wave(bossTarget, '#fff7c2', 700);
                    overlay.classList.add('raid-victory');
                    state.fighters.forEach(fighter => {
                        RaidMotion.stream(host, document.getElementById(`vixar-avatar-shell-${fighter.id}`), fighter.color, 950);
                        vixarGuardianRevive(fighter);
                    });
                    playSound('unityComplete');
                }, 3480);
                vixarSchedule(() => finishVixarRaid(true, 'The Unity Guardian defeated VIXAR and restored all four teams to full HP.'), 5000);
            }

            function updateVixarRaid(now) {
                if (!vixarRaidState?.running) return;
                if(vixarRaidState.finishing)return;
                // The fight freezes for the Merge Spell; its own ritual circle is the only timer.
                if(vixarRaidState.merge&&!vixarRaidState.merge.done)return;
                if(now<vixarRaidState.combatBeginsAt){scheduleVixarRaidLoop();return;}
                if(!vixarRaidState.combatStarted){vixarRaidState.combatStarted=true;vixarRaidState.startedAt=now;LeagueScenes.phase('raid',vixarAllSealsBroken()?'core':'seals');}
                vixarRaidState.elapsed = now - vixarRaidState.startedAt;
                const remaining = Math.max(0, vixarRaidState.duration - vixarRaidState.elapsed);
                document.getElementById('vixar-clock').textContent = (remaining / 1000).toFixed(1);
                updateVixarPhase();
                if (!vixarRaidState.finishing
                    && vixarSupportsOverdrive()
                    && vixarAllSealsBroken()
                    && vixarRaidState.elapsed >= vixarRaidState.duration * .61
                    && vixarRaidState.boss.hp > vixarExecutionHP()) {
                    activateVixarLegendaryOverdrive(now, false);
                }

                if (!vixarRaidState.finishing && now >= vixarRaidState.combatBeginsAt) {
                    vixarRaidState.fighters.forEach(fighter => {
                        if (!fighter.alive || fighter.revivePending || now < fighter.nextActionAt) return;
                        performVixarTeamAction(fighter, now);
                        const baseDelay = Math.max(820, 1650 - fighter.speed * 10.5);
                        const slow = fighter.slowUntil > now ? 1.52 : 1;
                        const phaseHaste = vixarRaidState.boss.phase === 3 ? .88 : 1;
                        fighter.nextActionAt = now + baseDelay * slow * phaseHaste * (.9 + Math.random() * .18);
                    });

                    if (now >= vixarRaidState.boss.nextActionAt) {
                        performVixarBossAction(now);
                        vixarRaidState.boss.nextActionAt = now + vixarBossActionDelay();
                    }

                }

                const activeOrReviving = vixarRaidState.fighters.some(fighter => fighter.alive || fighter.revivePending);
                if (!activeOrReviving && !vixarRaidState.finishing) {
                    finishVixarRaid(false, 'Every team fell this time, before the crown could be broken.');
                    return;
                }
                if (remaining <= 0 && !vixarRaidState.finishing) {
                    if (vixarSupportsOvertime()
                        && vixarAllSealsBroken()
                        && vixarRaidState.boss.hp > vixarExecutionHP()
                        && !vixarRaidState.overtimeGranted) {
                        vixarRaidState.overtimeGranted = true;
                        // Grant one focused 20-second extension rather than letting
                        // a fully qualified class lose to an unlucky attack sequence.
                        vixarRaidState.startedAt += 20000;
                        activateVixarLegendaryOverdrive(now, true);
                        document.getElementById('vixar-clock').textContent = '20.0';
                        scheduleVixarRaidLoop();
                        return;
                    }
                    // No team, house or student is named as the reason for a loss.
                    const missingLegendary = !vixarRaidState.allLegendary;
                    const missingUnity = !vixarRaidState.guardianEnabled;
                    const reason = missingLegendary
                        ? `One or more elemental seals stayed locked: every team needs Level ${vixarRaidState.act.level}.`
                        : missingUnity
                            ? 'Time ran out before VIXAR’s final attack. The Class Mission is still needed for the Guardian rescue.'
                            : 'VIXAR endured until time ran out. The Rift can open again in a later session.';
                    finishVixarRaid(false, reason);
                    return;
                }
                scheduleVixarRaidLoop();
            }

            // v11.0.0: a finished fight is recorded once for the class (attempts, or the next stage after a win) and saved
            // to Google Sheets through the phone. The Rift closes either way. Stage changes are outside Undo.
            function recordSagaFight(won) {
                const state = vixarRaidState, c = state?.className;
                if (!LeagueSaga.validClass(c)) return null;
                const result = LeagueSaga.recordFight(c, { sessionId, won, stage:state.stage });
                if (result.ok && result.advanced) {
                    sagaSessionWin = { className:c, sessionId, from:result.from, to:result.to };
                    addHistoryLog(`✦ ${c} broke ${LeagueSaga.FORM_NAMES[result.from]}: the class is now at the ${result.to} stage.`, state.act.color);
                }
                riftOpen = false;
                scheduleCheckpoint();
                window.syncStateToController?.();
                return result;
            }
            function vixarResultStats(state, victory) {
                const all = [...state.originalFighters, ...state.fighters.filter(f => f.merged)];
                const totalDamage = Math.round(all.reduce((sum, fighter) => sum + fighter.raidDamage, 0));
                const sealsBroken = Object.values(state.seals).filter(seal => seal.broken).length;
                // The teams are separate again on the result panel: a fused pair standing counts as both of its houses.
                const survivors = state.fighters.reduce((sum, fighter) => sum + (fighter.alive ? (fighter.merged ? 2 : 1) : 0), 0);
                return `
                    <div class="vixar-result-stat"><span>Elemental seals</span><strong>${sealsBroken} / 4 broken</strong></div>
                    <div class="vixar-result-stat"><span>Boss damage</span><strong>${totalDamage.toLocaleString()}</strong></div>
                    <div class="vixar-result-stat"><span>Teams standing</span><strong>${survivors} / 4</strong></div>
                    <div class="vixar-result-stat"><span>Level ${state.act.level} condition</span><strong>${state.allLegendary ? 'Complete' : 'Incomplete'}</strong></div>
                    <div class="vixar-result-stat"><span>Unity Guardian</span><strong>${state.guardianEnabled ? (victory ? 'Final strike delivered' : 'Finisher ready') : 'Unavailable'}</strong></div>
                    ${state.act.merge ? `<div class="vixar-result-stat"><span>Merge Spell</span><strong>${state.mergedPairs.length === 2 ? 'Both pairs fused' : state.mergedPairs.length ? 'One pair fused' : state.edictCast ? 'Not fused' : 'Not cast'}</strong></div>`
                        : `<div class="vixar-result-stat"><span>Raid result</span><strong>${victory ? 'Form broken' : 'VIXAR Survived'}</strong></div>`}`;
            }
            function showVixarResult(state, victory, reason) {
                const act = state.act, c = state.className;
                document.getElementById('vixar-result-title').textContent = victory ? act.winTitle : act.lossTitle;
                const nextCap = LeagueSaga.cap(act.next);
                document.getElementById('vixar-result-subtitle').textContent = victory
                    ? `${act.winLine}. Level ${nextCap} unlocked for every team in ${c}.`
                    : `${reason} ${c} keeps its stage and its level cap.`;
                document.getElementById('vixar-result-stats').innerHTML = vixarResultStats(state, victory);
                // Each team's next form is shown once, as a preview of the reward.
                const preview = document.getElementById('vixar-result-preview');
                if (preview) {
                    preview.hidden = !victory;
                    preview.innerHTML = victory ? `<small>Level ${nextCap} · ${LeagueSaga.tierName(nextCap)} forms</small><div>${teamsData.map(team => `<figure style="--team-color:${team.color}">${getAvatarSVG(team.id, [...team.traits.filter(id => !teamTraits[team.id].find(t => t.id === id)?.stage), ...teamTraits[team.id].filter(t => t.stage && t.stage <= nextCap).map(t => t.id)], nextCap)}<figcaption>${team.name}</figcaption></figure>`).join('')}</div>` : '';
                }
                document.getElementById('vixar-retry-btn').hidden = true;
                document.getElementById('vixar-result-panel').classList.add('visible');
                updateVixarRaidAccess();
            }
            function finishVixarRaid(victory, reason) {
                if (!vixarRaidState || vixarRaidState.completed) return;
                const state = vixarRaidState, act = state.act;
                setVixarFinaleStage(victory ? 'victory' : 'defeat');
                state.completed = true;
                state.running = false;
                state.finishing = false;
                clearVixarRaidTasks();
                LeagueMergeSpell.unmount();
                const overlay = document.getElementById('vixar-raid-overlay');
                overlay.classList.remove('merge-active', 'edict-cast');
                recordSagaFight(victory);
                if (victory) {
                    vixarDefeatedThisSession = true;
                    addHistoryLog(`✦ ${act.title} was defeated — all four teams and the Unity Guardian prevailed together.`, '#fef08a');
                    if (act.merge) {
                        // Act III: no escape this time. The Finale is a scene, not a fight.
                        stopBattleMusic(0.2);
                        startSagaFinale({ replay:false });
                        return;
                    }
                    overlay.classList.add('raid-victory');
                    playSound('win');
                    // Acts I and II: the false victory, the cut, the escape and the eye, then the reward.
                    LeagueSagaScenes.escape({ act, overlay, className:state.className, nextCap:LeagueSaga.cap(act.next), reduced:performanceMode === 'light' || window.matchMedia('(prefers-reduced-motion: reduce)').matches,
                        sound:name => playSound(name), cut:cutAllSound, onDone:() => { if (vixarRaidState === state) showVixarResult(state, true, reason); } });
                    stopBattleMusic(1.6);
                    return;
                }
                stopBattleMusic(0.2);
                addHistoryLog(`◈ ${act.title} raid ended: ${reason}`, '#a78bfa');
                playSound('negative');
                showVixarResult(state, false, reason);
            }

            function setVixarIntroVisible(visible) {
                const curtain = document.querySelector('#vixar-raid-overlay .vixar-intro-curtain');
                if (!curtain) return;
                curtain.hidden = !visible;
                curtain.setAttribute('aria-hidden', visible ? 'false' : 'true');
            }

            // v11.0.0: the act on the board (titles, boss art, pose sheet). The Violet form keeps the Light mode drawing.
            function applyRaidActVisuals(act) {
                const overlay = document.getElementById('vixar-raid-overlay');
                overlay.dataset.act = act.form;
                overlay.classList.toggle('saga-form-art', act.act > 1);
                const art = document.getElementById('vixar-boss-animated-art');
                const src = `./assets/animated/${act.art}.webp?v=${act.act > 1 ? '11.0.0' : '6.7'}`;
                if (!art.getAttribute('src')?.startsWith(`./assets/animated/${act.art}.webp`)) art.src = src;
                document.getElementById('vixar-animated-actor').dataset.poseId = act.art;
                globalThis.CreaturePoses?.preload(act.art);
                overlay.querySelector('.vixar-title').textContent = act.title;
                overlay.querySelector('.vixar-epithet').textContent = act.epithet;
                overlay.querySelector('.vixar-raid-kicker').textContent = `${act.kicker} · ${vixarRaidState.className}`;
                const curtain = overlay.querySelector('.vixar-intro-curtain');
                curtain.dataset.act = act.form;
                curtain.querySelector('.vixar-intro-kicker').textContent = act.kicker;
                curtain.querySelector('.vixar-intro-title').textContent = act.title;
                curtain.querySelector('.vixar-intro-subtitle').textContent = act.act === 1
                    ? 'Four Legendary teams · Unity alone can break the Empty Crown'
                    : act.act === 2 ? 'The scarlet eye opens · four Mythic teams step into the tear' : 'A gold crack opens in the dark · four Celestial teams, one class';
                LeagueSagaScenes.introArt(curtain, act);
            }
            function startVixarRaid() {
                if(LeagueScenes.active&&LeagueScenes.active!=='raid')return;
                const c = sagaClass(), stage = c ? LeagueSaga.stageOf(c) : '', sagaAct = LeagueSaga.act(stage);
                // Epilogue: the raid button of a Freed class offers to replay the Finale, with no fight.
                if (stage === 'Freed') { requestFinaleReplay(); return; }
                if (!c || !sagaAct) { addHistoryLog('Choose the class first: each class plays its own Vixar Saga.', '#a78bfa'); return; }
                if (!riftOpen) { addHistoryLog('The Rift is closed. Mr. Saymaz opens it from the phone.', '#a78bfa'); return; }
                if (sagaFoughtToday(c)) { addHistoryLog(`${c} has fought today. The Rift can open again in a later session.`, '#a78bfa'); return; }
                if (!allTeamsAtLeastLevel(sagaAct.level)) {
                    addHistoryLog(`${sagaAct.title} waits until every team reaches Level ${sagaAct.level}.`, sagaAct.color);
                    return;
                }
                if (unityEventRunning || unityEventQueued) {
                    addHistoryLog('Complete or skip the pending Unity Event before entering the VIXAR raid.', '#60a5fa');
                    return;
                }
                if (battleState?.running || vixarRaidState?.running || currentEvent) return;
                AnimatedMode.cancelAll();
                clearAllAvatarReactions();
                clearVixarRaidTasks();
                document.querySelectorAll('.modal-overlay.visible').forEach(modal => modal.classList.remove('visible'));
                document.getElementById('golden-snitch').style.display = 'none';
                document.getElementById('event-banner').classList.remove('visible');
                document.body.classList.remove('focus-mode');
                document.body.classList.add('vixar-raid-active');
                currentEvent = 'VixarRaid';
                vixarRaidState=createVixarRaidState();LeagueScenes.enter('raid','intro');
                if (vixarRaidState.act.merge) loadChallengeContent(); // the Merge Spell's questions come from the class's islands
                const now = SceneRuntime.now();
                vixarRaidState.fighters.forEach(fighter => fighter.nextActionAt = now + 3200 + Math.random() * 520);
                vixarRaidState.boss.nextActionAt = vixarRaidState.combatBeginsAt + 420;
                renderVixarRaidFighters();
                renderVixarSealStrip();
                prepareVixarGuardian();
                const overlay = document.getElementById('vixar-raid-overlay');
                overlay.className = 'visible';
                overlay.setAttribute('aria-hidden', 'false');
                delete overlay.dataset.finaleStage;
                applyRaidActVisuals(vixarRaidState.act);
                layoutVixarGuardian();
                document.getElementById('vixar-result-panel').classList.remove('visible');
                const showIntro = !isLeanMode() && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                setVixarIntroVisible(showIntro);
                // Full effects retain the entrance, with a timer fallback when CSS
                // animation is unavailable. The lean profiles reveal the stage at once.
                const introDelay=showIntro?3100:0;
                vixarRaidState.combatBeginsAt=now+introDelay+100;
                vixarRaidState.boss.nextActionAt=vixarRaidState.combatBeginsAt+420;
                if(showIntro)vixarSchedule(()=>LeagueScenes.phase('raid','seals'),introDelay);else LeagueScenes.phase('raid','seals');
                document.getElementById('vixar-boss-stage').style.opacity = '';
                document.getElementById('vixar-chest-armor')?.setAttribute('opacity', '1');
                document.getElementById('vixar-clock').textContent = (vixarRaidState.duration / 1000).toFixed(1);
                const act = vixarRaidState.act;
                document.getElementById('vixar-raid-condition').textContent = vixarRaidState.guardianEnabled
                    ? (act.merge ? 'At 70% HP the Edict of Separation falls · answer it together with the Merge Spell.' : 'Reduce VIXAR to 10% HP · the Unity Guardian will descend for the final tenth.')
                    : vixarRaidState.allLegendary
                        ? 'Every team is ready · complete the Class Mission to summon the Unity Guardian.'
                        : `Level ${act.level} is required to destroy each team’s elemental seal.`;
                updateVixarBossHUD();
                addHistoryLog(`◈ ${act.kicker} began for ${vixarRaidState.className}. Four teams entered as allies.`, act.color);
                playSound('battleStart');
                startPredatorRunBattleTrack(0);
                scheduleVixarRaidLoop();
            }

            function closeVixarRaid({ silent = false } = {}) {
                if (vixarRaidState?.running && !silent) {
                    // An interrupted fight is not an attempt: the Rift stays open.
                    const confirmed = window.confirm('Exit the fight and return to the league? It will not count as an attempt.');
                    if (!confirmed) return;
                }
                clearVixarRaidTasks();
                LeagueMergeSpell.unmount();
                LeagueSagaScenes.stopEscape();
                stopBattleMusic(0.08);
                if (vixarRaidState) vixarRaidState.running = false;
                vixarRaidState=null;LeagueScenes.leave('raid');
                currentEvent = null;
                const overlay = document.getElementById('vixar-raid-overlay');
                overlay.className = '';
                overlay.setAttribute('aria-hidden', 'true');
                delete overlay.dataset.finaleStage;
                setVixarIntroVisible(false);
                document.getElementById('vixar-result-panel').classList.remove('visible');
                document.getElementById('vixar-team-layer').innerHTML = '';
                document.getElementById('vixar-guardian-host').innerHTML = '';
                document.getElementById('vixar-fx-layer').innerHTML = '';
                delete overlay.dataset.act;
                document.body.classList.remove('vixar-raid-active');
                document.getElementById('golden-snitch').style.display = '';
                updateDynamicBackground();
                updateVixarRaidAccess();
                if (unityEventQueued) scheduleUnityQueueCheck();
            }

            document.getElementById('vixar-raid-btn').addEventListener('click', startVixarRaid);
            document.getElementById('vixar-raid-close').addEventListener('click', () => closeVixarRaid());
            document.getElementById('vixar-return-btn').addEventListener('click', () => closeVixarRaid({ silent:true }));
            // v11.0.0: one fight per class and session, so there is no immediate retry (kept hidden).
            document.getElementById('vixar-retry-btn').hidden = true;
            window.addEventListener('keydown', event => {
                if (event.key === 'Escape' && document.getElementById('vixar-raid-overlay').classList.contains('visible')) closeVixarRaid();
            });


           document.getElementById('finish-btn').addEventListener('click', () => {
    const presentation = AnimatedMode.getDiagnostics();
    if(['arena','raid','results','agent','finale'].includes(LeagueScenes.active))return;
    if(secretAgents.request){addHistoryLog('Choose or cancel the pending Secret Agent on the remote before finishing.','#fbbf24');return;}
    if (LeagueScenes.active || unityEventQueued || isEvolving || currentEvent || pendingAnimatedWheels.length || activeAnimatedWheel || activeWheelSpin || presentation.active || presentation.queued || wheelSpinTimer || wheelAdvanceTimer || deferredAnimatedEvolutions.size) {
        pendingAnimatedFinish = true;
        pumpPresentation();
        return;
    }
    if(Object.values(secretAgents.assignments).some(a=>a.status==='active')){revealAgents(null,true);return;}
    try {
        if (typeof window.broadcastMatchSummaryToController === 'function') {
            window.broadcastMatchSummaryToController("LEADERBOARD_FINAL");
        } else if (typeof broadcastMatchSummaryToController === 'function') {
            broadcastMatchSummaryToController("LEADERBOARD_FINAL");
        }
    } catch (err) {
        console.warn("Match summary broadcast error:", err);
    }
    
    if (typeof startFinalBattle === 'function') {
        startFinalBattle();
    }
});
            document.getElementById('progression-mode-btn').addEventListener('click', () => {
                saveState();
                const nextMode = progressionMode === 'hard' ? 'soft' : 'hard';
                setProgressionMode(nextMode, { announce:true, convertExisting:true });
            });

            document.getElementById('play-again-btn').addEventListener('click', () => {
                // Remember the selected tier position before resetting the point economy.
                // This preserves the teacher's preferred award tier across sessions.
                const nextSessionSliderIndex = selectedPointTierIndex;
                stopBattleMusic(0.08);
                clearBattleTasks();
                battleState=null;LeagueScenes.leave('arena');
                currentEvent = null;
                document.getElementById('battle-overlay').classList.remove('visible','arena-surge','final-clash','team-gryffindor','team-slytherin','team-hufflepuff','team-ravenclaw');
                document.getElementById('battle-overlay').setAttribute('aria-hidden','true');
                document.body.classList.remove('battle-active');
                const winnerOverlay=document.getElementById('winner-overlay');
                winnerOverlay.classList.remove('visible','champion-gryffindor','champion-slytherin','champion-hufflepuff','champion-ravenclaw');
                winnerOverlay.setAttribute('aria-hidden','true');
                LeagueScenes.leave('results');
                document.body.classList.remove('winner-active');
                document.getElementById('champion-duo').classList.remove('is-grand');
                document.getElementById('winner-svg-container').replaceChildren();
                document.getElementById('league-winner-avatars').replaceChildren();
                document.getElementById('all-team-recognition-grid').replaceChildren();
                document.getElementById('battle-leader-crown').classList.remove('visible');
                document.getElementById('battle-result-details').innerHTML = '';
                resetSessionState({ saveUndo: false, clearUndo: true, message: 'New Session Started', sliderIndex: nextSessionSliderIndex });
            });

            // Utilities & Wheel
            document.getElementById('learn-btn').addEventListener('click', () => document.getElementById('custom-points-modal').classList.add('visible'));
            // v9.6.0: the dialog's × used to call the subject wheel's close function, so it never closed this dialog.
            window.closeCustomPointsModal = function() { document.getElementById('custom-points-modal').classList.remove('visible'); };
            document.addEventListener('keydown', e => {
                if (e.key === 'Escape' && document.getElementById('custom-points-modal').classList.contains('visible')) window.closeCustomPointsModal();
            });
            function applyCustomPoints(t, pts, person = null) {
                if (!Number.isFinite(pts) || pts === 0) return;
                const rankingBefore = captureRankingSnapshot(); saveState();
                // v10.2.0: the Comeback Halo doubles custom points too (never a deduction).
                const halo = pts > 0 && haloTeams.includes(t.id);
                if (halo) pts *= 2;
                if (pts > 0) lockHalo();
                if (pts > 0 && person) lastAwardStudent.set(t.id, {id:person.id, name:person.name});
                const previousPoints = t.points; t.points += pts;
                addHistoryLog(`Awarded ${pts.toLocaleString()} to ${t.name}${halo ? ' (Halo ×2)' : ''}${person ? ` · ${person.name} (${selectedClass})` : ''}`,t.color);
                checkMilestones(t);
                if (pts > 0) recordStudentAward(t,person,t.points-previousPoints);
                animateTeamScore(t.id,{fromValue:previousPoints,targetValue:t.points,delta:t.points-previousPoints,modifiers:[]});
                updateGameState({teamId:t.id,updateVisuals:false,updateAvatar:false});
                playAvatarReaction(t.id,pts < 0 ? 'negative' : Math.abs(pts) >= currentPointValue * 2 ? 'large' : 'standard');
                scheduleRankingReactions(rankingBefore);
            }
            document.getElementById('custom-points-form').addEventListener('submit', e => {
                e.preventDefault();
                const team = teamsData.find(t => t.id === document.getElementById('team-select').value);
                const points = Number(document.getElementById('custom-points-input').value);
                if (!team || !Number.isFinite(points) || points === 0) return;
                document.getElementById('custom-points-modal').classList.remove('visible');
                if (points > 0) requestStudentAward(team.id,{customPoints:Math.round(points)});
                else applyCustomPoints(team,Math.round(points));
            });

            document.getElementById('mute-btn').addEventListener('click', async () => {
                isMuted = !isMuted;
                document.getElementById('sound-on-icon').classList.toggle('hidden', isMuted);
                document.getElementById('sound-off-icon').classList.toggle('hidden', !isMuted);
                document.getElementById('mute-btn').title = isMuted ? 'Sound Off — click to enable' : 'Sound On — click to mute';
                await unlockAudio();
                setAudioMuted(isMuted);
                if (!isMuted) {
                    if (battleState?.running && !battleMusicGain) {
                        startPredatorRunBattleTrack(Math.min(29.6, (battleState.elapsed || 0) / 1000));
                    } else if (!battleState?.running) {
                        playSound('test');
                    }
                }
            });

            const wheelSets = Object.freeze({
                all: {
                    label: 'All Subjects',
                    resultLabel: 'Selected Subject',
                    items: ["English", "Science", "Maths", "Turkish", "Physical Ed", "Social Studies", "Visual Arts", "Religion", "Music"]
                },
                english: {
                    label: 'English Only',
                    resultLabel: 'English Challenge',
                    items: ["Vocabulary", "Grammar", "Pronunciation", "Speaking", "Listening", "Sentence Repair", "Taboo Description", "Translation", "Ask a Question"]
                }
            });
            const subjectColors = ["#e11d48", "#db2777", "#c026d3", "#9333ea", "#4f46e5", "#2563eb", "#06b6d4", "#0d9488", "#10b981"];
            let activeWheelMode = 'all';
            const wheelModeButtons = [...document.querySelectorAll('.wheel-mode-btn')];
            const wCanvas = document.getElementById('wheel-canvas'); const wCtx = wCanvas.getContext('2d');
            const wheelCenter = wCanvas.width / 2;
            const wheelRadius = wheelCenter;

            function activeWheelSet() { return wheelSets[activeWheelMode] || wheelSets.all; }

            function setWheelMode(mode) {
                if (!wheelSets[mode]) return;
                activeWheelMode = mode;
                if (mode === 'english') loadChallengeContent();
                wheelModeButtons.forEach(button => {
                    const active = button.dataset.wheelMode === activeWheelMode;
                    button.classList.toggle('active', active);
                    button.setAttribute('aria-pressed', active ? 'true' : 'false');
                });
                drawSubjectWheel(null);
            }

            function drawSubjectWheel(selectedIndex=null) {
                const subjects = activeWheelSet().items;
                const arc = (Math.PI * 2) / subjects.length;
                wCtx.clearRect(0,0,wCanvas.width,wCanvas.height);
                for(let i=0; i<subjects.length; i++) {
                    const selected=selectedIndex===i;
                    wCtx.save();
                    wCtx.beginPath(); wCtx.moveTo(wheelCenter,wheelCenter); wCtx.arc(wheelCenter,wheelCenter,wheelRadius-2,i*arc,(i+1)*arc); wCtx.closePath();
                    wCtx.globalAlpha=selectedIndex===null||selected?1:.24;
                    wCtx.fillStyle=subjectColors[i % subjectColors.length]; wCtx.fill();
                    if (selected) {
                        wCtx.globalAlpha=1; wCtx.lineWidth=8; wCtx.strokeStyle='#fde047'; wCtx.shadowColor='#facc15'; wCtx.shadowBlur=18; wCtx.stroke();
                    }
                    wCtx.restore();
                    wCtx.save(); wCtx.translate(wheelCenter,wheelCenter); wCtx.rotate(i*arc+arc/2);
                    const longLabel = subjects[i].length > 13;
                    wCtx.globalAlpha=selectedIndex===null||selected?1:.36; wCtx.fillStyle='white'; wCtx.font=`700 ${longLabel ? 13 : activeWheelMode === 'english' ? 15 : 17}px Poppins`; wCtx.textAlign='right';
                    wCtx.shadowColor='rgba(0,0,0,.75)'; wCtx.shadowBlur=4; wCtx.fillText(subjects[i],wheelRadius-28,6); wCtx.restore();
                }
                wCtx.save(); wCtx.beginPath(); wCtx.arc(wheelCenter,wheelCenter,34,0,Math.PI*2); wCtx.fillStyle='#0f172a'; wCtx.fill(); wCtx.lineWidth=3; wCtx.strokeStyle='#cbd5e1'; wCtx.stroke(); wCtx.restore();
            }

            function openWheelModal() {
                if(!LeagueScenes.enter('wheel','ready'))return;
                drawSubjectWheel(null);
                const resultCard=document.getElementById('wheel-result-card'); resultCard.classList.remove('revealed');
                document.getElementById('wheel-result-label').textContent=activeWheelSet().resultLabel;
                document.getElementById('wheel-result').textContent='Awaiting Spin';
                document.getElementById('spin-btn').classList.remove('hidden');
                document.getElementById('spin-btn').disabled=false;
                document.getElementById('wheel-continue-btn').classList.add('hidden');
                document.getElementById('wheel-modal').classList.add('visible');
            }

            wheelModeButtons.forEach(button => button.addEventListener('click', () => setWheelMode(button.dataset.wheelMode)));
            setWheelMode('all');
            document.getElementById('wheel-btn').addEventListener('click', openWheelModal);
            
            let currentWheelRotation = 0; // Maintain rotation state for continuous spins

            function hideWheelModal() {
                LeagueScenes.leave('wheel');
                document.getElementById('wheel-modal').classList.remove('visible');
                if (window.syncStateToController) window.syncStateToController();
            }

            function advanceQueuedWheel() {
                wheelClock.cancel(wheelAdvanceTimer);
                wheelAdvanceTimer = null;
                wheelClock.cancel(animatedWheelStartTimer);
                animatedWheelStartTimer = null;
                activeWheelSpin = null;
                activeAnimatedWheel = null;
                document.getElementById('spin-btn').disabled = false;
                document.getElementById('spin-btn').classList.remove('hidden');
                document.getElementById('wheel-continue-btn').classList.add('hidden');
                hideWheelModal();
                pumpPresentation();
            }

            function finishWheelSpin(epoch,{ advanceImmediately = false } = {}) {
                const spin = activeWheelSpin;
                if (!spin || spin.epoch !== epoch || spin.settled) return;
                spin.settled = true;
                wheelVisualAnimation?.cancel();wheelVisualAnimation=null;
                wheelClock.cancel(wheelSpinTimer);
                wheelSpinTimer = null;
                const subjects = spin.subjects;
                const finalAngle = currentWheelRotation % 360;
                const effectiveAngle = (270 - finalAngle + 360) % 360;
                const index = Math.floor(effectiveAngle / (360 / subjects.length));
                const sub = subjects[index];
                drawSubjectWheel(index);
                document.getElementById('wheel-result').textContent = sub;
                document.getElementById('wheel-result-card').classList.add('revealed');
                document.getElementById('spin-btn').classList.add('hidden');
                document.getElementById('wheel-continue-btn').classList.remove('hidden');
                playSound('wheel');
                addHistoryLog(`Wheel landed on ${sub}`, '#eab308');

                // Preserve the existing Ravenclaw relic reward exactly once,
                // even if the teacher closes an automatic spin early.
                const rcTeam = teamsData.find(t => t.id === 'ravenclaw');
                if (rcTeam && rcTeam.hasRelic) {
                    const previousPoints = rcTeam.points;
                    const bonus = Math.ceil(rcTeam.points * 0.10);
                    rcTeam.points += bonus;
                    animateTeamScore(rcTeam.id, {
                        fromValue:previousPoints,
                        targetValue:rcTeam.points,
                        delta:bonus,
                        modifiers:[{ icon:'👑', label:'Diadem +10%' }]
                    });
                    addHistoryLog(`Rowena's Diadem granted +${bonus.toLocaleString()} to Ravenclaw!`, rcTeam.color);
                    updateGameState({ teamId:rcTeam.id, updateVisuals:false, updateAvatar:false });
                }

                // v10.4.0: the English wheel deals a Challenge Deck card; the wheel waits for its result.
                if (startChallenge(sub, index, activeAnimatedWheel, { delay:advanceImmediately ? 0 : undefined })) {
                    if (window.syncStateToController) window.syncStateToController();
                    return;
                }
                const delay = advanceImmediately ? 0 : WHEEL_RESULT_HOLD_MS;
                wheelAdvanceTimer = wheelClock.after(advanceQueuedWheel,delay);
                if (window.syncStateToController) window.syncStateToController();
            }

            function requestWheelClose() {
                if (LeagueChallenge.active) { LeagueChallenge.command({op:LeagueChallenge.answered ? 'continue' : 'skip'}); return; }
                if (wheelSpinTimer && activeWheelSpin) {
                    finishWheelSpin(activeWheelSpin.epoch,{advanceImmediately:true});
                    return;
                }
                if (wheelAdvanceTimer || activeAnimatedWheel) {
                    if (!activeWheelSpin && activeAnimatedWheel) {
                        wheelClock.cancel(animatedWheelStartTimer);
                        animatedWheelStartTimer = null;
                        document.getElementById('spin-btn').click();
                        if (activeWheelSpin) finishWheelSpin(activeWheelSpin.epoch,{advanceImmediately:true});
                    } else advanceQueuedWheel();
                    return;
                }
                hideWheelModal();
            }

            // ---- v10.4.0 Challenge Deck ----
            // The cards come from the class's island content: the island the team plays next (its current island),
            // then the islands before it. The teacher's Studio edits replace an island's questions.
            function challengeContext(team) {
                const grade = Number(selectedClass?.[0]);
                const units = globalThis.RunnerContent?.grades?.[grade];
                if (!units?.length) return null;
                const progress = LeagueIslandProgress.snapshot(selectedClass);
                const next = id => LeagueAdventure.nextIsland(progress, selectedClass, id);
                const island = Math.min(10, team ? next(team.id) : Math.max(...teamsData.map(t => next(t.id))));
                const banks = units.map((unit, i) => LeagueTeaching.unit(`${grade}-${i + 1}`)?.content?.bank || unit.bank);
                const ask = globalThis.LeagueAskBank?.grades?.[grade] || [];
                return { grade, island, theme:units[island - 1]?.theme || '', current:banks[island - 1], earlier:banks.slice(0, island - 1), gradeBanks:banks,
                    asks:{ current:ask[island - 1] || [], earlier:ask.slice(0, island - 1) } };
            }
            function loadChallengeContent() {
                if (globalThis.RunnerContent?.version === 3) return; // compiled: all 24 word pairs, meanings, gaps and questions
                LeagueTeaching.loadContent().catch(error => console.warn('Challenge Deck content could not load.', error));
            }
            function startChallenge(type, index, wheel, { delay } = {}) {
                if (activeWheelMode !== 'english' || !selectedClass) return false;
                const team = wheel ? teamsData.find(t => t.id === wheel.teamId) : null;
                loadChallengeContent();
                const ctx = challengeContext(team);
                if (!ctx) return false;
                const card = LeagueChallenge.deal(type, ctx);
                if (!card) return false;
                return LeagueChallenge.open(card, {
                    team:team?.name || '', teamColor:team?.color, student:wheel?.student?.name || '', delay,
                    stakes:team ? `✓ Right: keep Level ${team.level} · ✗ Wrong: back to Level ${wheel.restore?.level ?? wheel.stage - 1}` : '',
                    color:subjectColors[index % subjectColors.length],
                    onResolve:ok => resolveChallenge(ok, card, wheel, ctx.island),
                    onClose:advanceQueuedWheel
                });
            }
            // Right keeps everything the team has earned. Wrong takes the team back to the moment it reached the level
            // before this wheel. Skipped changes nothing. Each card is logged for Google Sheets.
            function resolveChallenge(ok, card, wheel, island) {
                const team = wheel ? teamsData.find(t => t.id === wheel.teamId) : null;
                const result = ok === null ? 'skipped' : ok ? 'right' : 'wrong';
                challengeLog.push({ id:`${sessionId}-c${challengeLog.length + 1}`, at:Date.now(), className:selectedClass || '', team:team?.name || 'Practice',
                    studentId:wheel?.student?.id || '', student:wheel?.student?.name || '', level:wheel?.stage || 0, type:card.type, word:card.word || '', island, result });
                if (challengeLog.length > 200) challengeLog.shift();
                scheduleCheckpoint();
                const who = team ? `${wheel.student?.name ? wheel.student.name + ' · ' : ''}${team.name}` : 'Practice card';
                addHistoryLog(`🃏 ${card.type}: ${result === 'right' ? '✓ Right' : result === 'wrong' ? '✗ Wrong' : 'Skipped'} (${who})`, team?.color || '#a78bfa');
                if (ok === null) return '';
                playSound(ok ? 'evolve' : 'timer');
                if (!team) return 'Practice card · no points change.';
                if (ok) return `${team.name} keeps Level ${team.level} and ${team.points.toLocaleString()} points!`;
                return restoreTeamBeforeWheel(team, wheel);
            }
            function restoreTeamBeforeWheel(team, wheel) {
                const back = wheel.restore || { ...cleanTeam(team), level:wheel.stage - 1, traits:team.traits.slice(0, wheel.stage - 1), evolutionProgress:0, pendingEvolution:null };
                saveState(); // Undo puts the team back if a judgement was tapped by mistake.
                const previousPoints = team.points;
                cancelTeamScoreAnimation(team.id, { settle:false });
                AnimatedMode.cancelTeam(team.id);
                deferredAnimatedEvolutions.delete(team.id);
                team.points = back.points;
                team.level = back.level;
                team.evolutionProgress = back.evolutionProgress || 0;
                team.milestonesReached = [...(back.milestonesReached || [])];
                team.traits = (back.traits || []).filter(id => teamTraits[team.id].some(t => t.id === id));
                team.hasRelic = Boolean(back.hasRelic);
                team.pendingEvolution = back.pendingEvolution ? { ...back.pendingEvolution } : null;
                // The wheel waits at this level again; later wheels of this team are gone with the levels.
                team.wheelMilestonesReached = team.wheelMilestonesReached.filter(stage => stage <= team.level);
                pendingAnimatedWheels = pendingAnimatedWheels.filter(item => item.teamId !== team.id || item.stage <= team.level);
                team.cachedSVG = '';
                normalizeTeamRuntimeState(team);
                animateTeamScore(team.id, { fromValue:previousPoints, targetValue:team.points, delta:team.points - previousPoints, modifiers:[{ icon:'🃏', label:'Challenge missed' }] });
                updateTeamDOM(team, true, true);
                updateGameState({ teamId:team.id, updateVisuals:true, updateAvatar:true });
                addHistoryLog(`🃏 ${team.name} goes back to Level ${team.level} (${team.points.toLocaleString()} points).`, team.color);
                return `${team.name} goes back to Level ${team.level} and ${team.points.toLocaleString()} points.`;
            }
            LeagueChallenge.configure({ changed:() => { if (window.syncStateToController) window.syncStateToController(); } });

            document.getElementById('spin-btn').addEventListener('click', () => {
                if (wheelSpinTimer || wheelAdvanceTimer || activeWheelSpin) return;
                const subjects = activeWheelSet().items;
                drawSubjectWheel(null);
                const resultCard=document.getElementById('wheel-result-card'); resultCard.classList.remove('revealed');
                document.getElementById('wheel-result').textContent='Spinning…';
                document.getElementById('spin-btn').classList.remove('hidden');
                document.getElementById('wheel-continue-btn').classList.add('hidden');
                const previousRotation=currentWheelRotation;
                currentWheelRotation = Number.isFinite(activeAnimatedWheel?.rotation)?activeAnimatedWheel.rotation:currentWheelRotation+Math.floor(Math.random() * 360)+1440;
                wCanvas.style.transition='none';
                wCanvas.style.transform = `rotate(${currentWheelRotation}deg)`;
                wheelVisualAnimation?.cancel();
                if(!matchMedia('(prefers-reduced-motion: reduce)').matches)wheelVisualAnimation=wCanvas.animate([{transform:`rotate(${previousRotation}deg)`},{transform:`rotate(${currentWheelRotation}deg)`}],{duration:isLeanMode()?450:5000,easing:'cubic-bezier(.15,.65,.2,1)'});
                document.getElementById('spin-btn').disabled = true;
                const spinDuration = isLeanMode() ? 450 : 5000;
                const epoch = ++wheelSpinEpoch;
                activeWheelSpin = {epoch,subjects:[...subjects],automatic:Boolean(activeAnimatedWheel),settled:false};
                wheelSpinTimer = wheelClock.after(() => finishWheelSpin(epoch), spinDuration);
                if (window.syncStateToController) window.syncStateToController();
            });

            let timerInterval;
            document.getElementById('timer-btn').addEventListener('click', () => {
                const el = document.getElementById('timer-text'); el.classList.remove('hidden', 'text-red-500'); el.classList.add('text-slate-300');
                let t = 300; clearInterval(timerInterval);
                timerInterval = setInterval(() => {
                    t--; const m = Math.floor(t/60).toString().padStart(2,'0'); const s = (t%60).toString().padStart(2,'0');
                    el.textContent = `${m}:${s}`;
                    if(t<=0) {
                        clearInterval(timerInterval);
                        el.classList.remove('text-slate-300');
                        el.classList.add('text-red-500');
                        playSound('timer');
                    }
                }, 1000);
            });

            // Random Snitch Event
            let snitchTimer = null;
            function scheduleSnitchCheck() {
                clearTimeout(snitchTimer);
                snitchTimer = null;
                if (isLeanMode() || !document.body.classList.contains('session-started')) return;
                snitchTimer = setTimeout(() => {
                    snitchTimer = null;
                    if (!isLeanMode() && !currentEvent && !battleState?.running && !unityEventRunning && Math.random() > 0.8 && document.getElementById('golden-snitch').style.display !== 'block') {
                        document.getElementById('golden-snitch').style.display = 'block';
                        const banner = document.getElementById('event-banner'); banner.textContent = "Catch the Golden Snitch!"; banner.classList.add('visible'); setTimeout(()=>banner.classList.remove('visible'), 4000);
                    }
                    scheduleSnitchCheck();
                }, 20000);
            }
            
            document.getElementById('golden-snitch').addEventListener('click', (e) => {
                if (isLeanMode()) { e.currentTarget.style.display='none'; return; }
                e.currentTarget.style.display='none'; playSound('snitch');
                const rankingBefore = captureRankingSnapshot();
                saveState();
                const t = teamsData[Math.floor(Math.random()*teamsData.length)];
                t.points += 5000; checkMilestones(t); updateGameState({ teamId:t.id, updateVisuals:false, updateAvatar:false });
                playAvatarReaction(t.id,'large',{label:'Golden Snitch',sound:false});
                scheduleRankingReactions(rankingBefore);
                addHistoryLog(`✨ ${t.name} caught the Snitch! +5,000`, t.color);
                spawnParticles(window.innerWidth/2, window.innerHeight/2, 'gold', 100, true);
            });
            
            // Vortex Event (Relic Immune Check)
            function startVortexEvent() {
                if(LeagueScenes.active||currentEvent)return;
                const rankingBefore = captureRankingSnapshot();
                saveState(); currentEvent = 'Vortex'; document.getElementById('vortex-overlay').style.display = 'flex';
                playSound('vortex');
                const banner = document.getElementById('event-banner'); banner.textContent = "A Vortex is draining points!"; banner.classList.add('visible');
                
                // Get the top 2 teams safely
                const leaders = [...teamsData].sort((a, b) => b.points - a.points).slice(0, 2);
                const initialPoints = {}; 
                const totalDrains = {};

                leaders.forEach(team => { 
                    cancelTeamScoreAnimation(team.id, { settle: true });
                    initialPoints[team.id] = team.points;
                    if (team.hasRelic && team.id === 'gryffindor') {
                        addHistoryLog(`🛡️ Sword of Godric protected Gryffindor from the vortex!`, team.color);
                        totalDrains[team.id] = 0;
                        playAvatarReaction(team.id,'shield',{label:'Vortex Blocked'});
                    } else {
                        // FIX: Drain exactly 20% of points
                        const drain = Math.ceil(team.points * 0.20);
                        totalDrains[team.id] = drain;
                        if (drain > 0) {
                            addHistoryLog(`👿 Vortex is draining ${drain.toLocaleString()} from ${team.name}!`, '#8b5cf6');
                            playAvatarReaction(team.id,'negative',{label:'Vortex Drain',sound:false});
                        }
                    }
                });

                if (isLeanMode()) {
                    leaders.forEach(team => {
                        if (totalDrains[team.id] <= 0) return;
                        const actualTeam = teamsData.find(item => item.id === team.id);
                        actualTeam.points = initialPoints[team.id] - totalDrains[team.id];
                        renderTeamScoreDisplay(team.id, actualTeam.points);
                    });
                    currentEvent = null;
                    document.getElementById('vortex-overlay').style.display = 'none';
                    banner.classList.remove('visible');
                    reorderUI();
                    updateDynamicBackground();
                    scheduleRankingReactions(rankingBefore);
                    return;
                }
                
                leaders.forEach(team=>{team.points=initialPoints[team.id]-totalDrains[team.id];});
                scheduleCheckpoint();
                const startTime = SceneRuntime.now();
                // Smoothly drain the points over 3 seconds to show them disappearing into the void
                const drainFrame = () => {
                    const progress = Math.min((SceneRuntime.now() - startTime) / 3000, 1);
                    
                    leaders.forEach(team => {
                        if (totalDrains[team.id] > 0) {
                            const actualTeam = teamsData.find(t => t.id === team.id);
                            const displayedPoints = Math.round(initialPoints[team.id] - (totalDrains[team.id] * progress));
                            // Update just the points display to avoid UI stuttering during the drain
                            renderTeamScoreDisplay(team.id, displayedPoints);
                        }
                    });
                    
                    if (progress >= 1) {
                        eventClock.clear();
                        currentEvent = null; 
                        document.getElementById('vortex-overlay').style.display = 'none'; 
                        banner.classList.remove('visible'); 
                        
                        // Using direct UI updates instead of updateGameState() here to prevent an infinite Vortex loop!
                        reorderUI(); 
                        updateDynamicBackground();
                        scheduleRankingReactions(rankingBefore);
                    } else eventClock.after(drainFrame,50);
                };
                eventClock.after(drainFrame,50);
            }

            AnimatedMode.configure({
                render(id) { const team = teamsData.find(item => item.id === id); if (team) updateTeamDOM(team, true, true); },
                level(id) { return teamsData.find(item => item.id === id)?.level || 0; },
                busy: presentationBlocked,
                idle() { if (!activeAnimatedWheel && !activeWheelSpin && !wheelSpinTimer && !wheelAdvanceTimer && (pendingAnimatedWheels.length || pendingAnimatedFinish || deferredPerformanceMode)) pumpPresentation(); }
            });
            // Wake presentation queues only on actual modal/event transitions, never by polling.
            const presentationObserver = new MutationObserver(pumpPresentation);
            document.querySelectorAll('.modal-overlay, #unity-event-overlay, #battle-overlay, #vixar-raid-overlay').forEach(element =>
                presentationObserver.observe(element, { attributes:true, attributeFilter:['class'] }));
            presentationObserver.observe(document.body, { attributes:true, attributeFilter:['class'] });
            document.addEventListener('visibilitychange', () => { if (!document.hidden) pumpPresentation(); });
            init();
            if (performanceMode === 'animated') teamsData.forEach(team => AnimatedMode.warmNext(team.id, team.level));
// --- PEERJS SYNCHRONIZATION LOGIC ---

        const TURN_CONFIG_ENDPOINT = '/api/turn-credentials';
        const DIRECT_ICE_FALLBACK = Object.freeze([
            { urls: ['stun:stun.cloudflare.com:3478'] }
        ]);
        let turnConfigurationPromise = null;
        let turnExpiresAt=0;
        let turnRelayConfigured = false;
        const REMOTE_BUILD = '11.0.0';
        let remoteConnectionState = 'offline';
        let remoteScene = null;
        let remoteScenePaused = false;
        let remoteIslandRun = {open:false,ready:false,canPause:false,paused:false,options:{listening:true,pictures:false},navigator:'',audio:false};
        // v9.7.0: one Island Run navigator per session: a random contributor of the Arena champion team (the
        // whole team if nobody contributed). Kept in the session checkpoint so a reload keeps the same student.
        let sessionNavigator = null, runControlSequence = 0;
        function chooseSessionNavigator(winner) {
            const roster = globalThis.LeagueStudents;
            if (!roster?.validClass(selectedClass) || !winner) return null;
            const kept = sessionNavigator;
            if (kept?.sessionId === sessionId && kept.className === selectedClass && kept.team === winner.id && roster.student(selectedClass, winner.id, kept.id)) return kept;
            const contributors = roster.contributors(selectedClass, winner.id, studentContributions);
            const pool = contributors.length ? contributors : roster.members(selectedClass, winner.id);
            if (!pool.length) return null;
            let index = Math.floor(Math.random() * pool.length);
            if (window.crypto?.getRandomValues) { const value = new Uint32Array(1); window.crypto.getRandomValues(value); index = value[0] % pool.length; }
            const person = pool[index];
            sessionNavigator = { sessionId, className:selectedClass, team:winner.id, id:person.id, name:person.name };
            addHistoryLog(`Island Run navigator for this session: ${person.name} (${winner.name}).`, '#fde68a');
            scheduleCheckpoint();
            return sessionNavigator;
        }
        // Controller side: a student controller press travels as a light message, not a confirmed command.
        function sendRunControl(action) {
            if (remoteRole !== 'controller' || remoteConnectionState !== 'connected' || !latestRemoteSessionId || !['up','down','jump'].includes(action)) return false;
            return safeRemoteSend({ type:'RUN_CONTROL', protocol:7, sessionId:latestRemoteSessionId, control:action, sequence:++runControlSequence });
        }
        let remoteQuestionLogExchange = '';
        let remoteRole = 'none';
        let activeRoomCode = '';
        let pendingIncomingConnection = null;
        let pendingControllerConnection = null;
        let reconnectTimer = null;
        let controllerReconnectAttempts = 0;
        let controllerConnectInProgress = false;
        let heartbeatTimer = null;
        let lastRemoteActivityAt = 0;
        let lastMatchSummaryPayload = null;
        let lastMatchSummaryAcknowledged = true;
        let summaryRetryTimer = null;
        let summaryRetryAttempts = 0;
        let pendingRemoteResetTeam = null;
        let pendingRemoteFinish = false;
        let remoteFinishTimeout = null;
        let mobileClassMissionState = {
            target:CLASS_MISSION_TARGET,
            progress:0,
            completed:false,
            busy:false,
            rewardGranted:false
        };

        function remoteStateLabel(state) {
            return ({
                offline:'REMOTE OFFLINE',
                preparing:'PREPARING SECURE CONNECTION…',
                waiting:'WAITING FOR PHONE',
                connecting:'CONNECTING…',
                reconnecting:'RECONNECTING…',
                connected:'REMOTE CONNECTED',
                failed:'REMOTE CONNECTION FAILED'
            })[state] || 'REMOTE OFFLINE';
        }

        function mobileRemoteStateLabel(state) {
            return ({
                offline:'OFFLINE',
                preparing:'PREPARING…',
                waiting:'WAITING',
                connecting:'SYNCING…',
                reconnecting:'RECONNECTING…',
                connected:'CONNECTED',
                failed:'FAILED'
            })[state] || 'OFFLINE';
        }

        function setRemoteConnectionStatus(state, detail = '') {
            remoteConnectionState = state;
            if(state!=='connected')remoteCommands?.disconnect();
            const label = detail || remoteStateLabel(state);
            const boardIndicator = document.getElementById('remote-connection-indicator');
            const boardText = document.getElementById('remote-connection-text');
            const mobileWrap = document.getElementById('mobile-connection-wrap');
            const mobileText = document.getElementById('mobile-connection-status');
            const startupText = document.getElementById('startup-connection-status');

            if (boardIndicator) boardIndicator.dataset.remoteState = state;
            if (boardText) boardText.textContent = label.toUpperCase();
            if (mobileWrap) mobileWrap.dataset.remoteState = state;
            if (mobileText) {mobileText.textContent = mobileRemoteStateLabel(state);mobileText.title=label;}
            const syncPanel=document.getElementById('mobile-sync-panel');if(syncPanel)syncPanel.hidden=state==='connected';
            const syncDetail=document.getElementById('mobile-sync-detail');if(syncDetail)syncDetail.textContent=state==='connected'?'Board and phone synchronized':label;
            const retrySync=document.getElementById('remote-resync-btn');if(retrySync)retrySync.hidden=state==='connected';
            if (startupText) {
                startupText.textContent = label;
                startupText.classList.toggle('error', state === 'failed');
                startupText.classList.toggle('success', state === 'connected');
            }

            const remoteButtons = document.querySelectorAll('#mobile-controller .mobile-remote-action, #mobile-reset-confirm-btn, #mobile-finish-confirm-btn');
            remoteButtons.forEach(button => { button.disabled = state !== 'connected'; });
            if (state !== 'connected') {
                if (remoteRole === 'controller') {LeagueStudentUI.close(true);pendingRemoteClassSelection=null;}
                if (window.closeRemoteTeamResetModal) window.closeRemoteTeamResetModal();
                if (window.closeRemoteFinishModal) window.closeRemoteFinishModal();
            }
            updateMobileClassMissionUI();
            updateMobileRecordAvailability();
            updateRemoteSceneControls(remoteScene, remoteScenePaused);
        }

        function setSummaryDeliveryStatus(message = '', state = '') {
            const indicator = document.getElementById('summary-delivery-indicator');
            if (!indicator) return;
            indicator.textContent = message;
            indicator.className = message ? `visible ${state}`.trim() : '';
            if (message && state === 'delivered') {
                clearTimeout(indicator._hideTimer);
                indicator._hideTimer = setTimeout(() => { indicator.className = ''; }, 6500);
            }
        }

        function updateMobileClassMissionUI(nextState = null) {
            if (nextState && typeof nextState === 'object') {
                mobileClassMissionState = { ...mobileClassMissionState, ...nextState };
            }

            const target = Math.max(1, Number(mobileClassMissionState.target) || CLASS_MISSION_TARGET);
            const progress = Math.max(0, Math.min(target, Number(mobileClassMissionState.progress) || 0));
            const completed = Boolean(mobileClassMissionState.completed);
            const panel = document.getElementById('mobile-class-mission-panel');
            const count = document.getElementById('mobile-class-mission-count');
            const meter = document.getElementById('mobile-class-mission-progress');
            const fill = document.getElementById('mobile-class-mission-fill');

            panel?.classList.toggle('completed', completed);
            if (count) count.textContent = completed ? '✓ Complete' : `${progress} / ${target}`;
            if (meter) {
                meter.setAttribute('aria-valuemax', String(target));
                meter.setAttribute('aria-valuenow', String(progress));
            }
            if (fill) fill.style.width = `${Math.min(100, (progress / target) * 100)}%`;
        }

        function updateMobileRecordAvailability() {
            const recordButton = document.getElementById('mobile-record-btn');
            const recordLabel = document.getElementById('mobile-record-btn-label');
            const resultActions = document.getElementById('mobile-result-actions');
            const participationButton = document.getElementById('mobile-participation-btn');
            const finishButton = document.getElementById('mobile-finish-btn');
            const finishLabel = document.getElementById('mobile-finish-btn-label');
            const status = document.getElementById('mobile-record-ready-status');
            const ready = Boolean(cachedLeaderboardRecord || cachedBattleRecord);
            const connected = remoteConnectionState === 'connected';

            if (recordButton) {
                recordButton.disabled = !ready;
            }
            if (recordLabel) recordLabel.textContent = '📊 Save Record';
            if (resultActions) resultActions.classList.toggle('hidden', !ready);
            if (participationButton) participationButton.disabled = !ready;
            if (finishButton) {
                finishButton.disabled = !connected || pendingRemoteFinish || ['arena','raid','results','agent','finale'].includes(remoteScene);
                finishButton.classList.toggle('hidden', ready);
            }
            if (finishLabel) finishLabel.textContent = pendingRemoteFinish ? 'FINISHING…' : '🏁 Finish Session';
            if (status) {
                status.textContent = ready
                    ? (LeagueIslandProgress.label(remoteStudentClass)==='Island progress saved online'?'✓ Final results received. Review participation or save the record.':'✓ Final results received · Save session to keep the latest island progress online.')
                    : pendingRemoteFinish
                        ? 'Waiting for final results from the smartboard…'
                        : connected
                            ? 'Finish the session when the class is ready.'
                            : 'Waiting for a connected smartboard.';
            }
        }

        function participationSummaryRecord() {
            return cachedLeaderboardRecord || cachedBattleRecord || null;
        }

        function participationNode(tag, className = '', text = '') {
            const node = document.createElement(tag);
            node.className = className;
            if (text !== '') node.textContent = text;
            return node;
        }

        window.openParticipationSummary = function() {
            const record = participationSummaryRecord();
            if (!record) {
                alert('Finish the session and wait for the final results first.');
                return;
            }

            const summary = record.studentContributions;
            const meta = document.getElementById('mobile-participation-meta');
            const body = document.getElementById('mobile-participation-body');
            const modal = document.getElementById('mobile-participation-modal');
            if (!body || !modal) return;

            const className = summary?.className || record.className || remoteStudentClass || 'Unassigned';
            if (meta) meta.textContent = `Class ${className} · ranked by contribution count, not points.`;
            body.replaceChildren();

            const teamStyles = [
                {id:'gryffindor',name:'Gryffindor',color:'#fb7185'},
                {id:'hufflepuff',name:'Hufflepuff',color:'#fde047'},
                {id:'slytherin',name:'Slytherin',color:'#4ade80'},
                {id:'ravenclaw',name:'Ravenclaw',color:'#38bdf8'}
            ];
            const teams = summary?.teams && typeof summary.teams === 'object' ? summary.teams : {};
            const allRows = teamStyles.flatMap(team => Array.isArray(teams[team.id]) ? teams[team.id] : []);
            const totalContributions = allRows.reduce((sum,person) => sum + Math.max(0,Number(person.awards) || 0),0);
            const overview = participationNode('div','participation-overview');
            overview.append(participationNode('span','',`${totalContributions.toLocaleString('en-US')} total contributions`),
                participationNode('span','',`${allRows.length} contributing students`));
            body.append(overview);

            for (const team of teamStyles) {
                const rawRows = Array.isArray(teams[team.id]) ? teams[team.id] : [];
                const rows = rawRows.filter(person => Number(person?.awards) > 0)
                    .sort((a,b) => Number(b.awards)-Number(a.awards) || String(a.name).localeCompare(String(b.name),'tr'));
                const teamTotal = rows.reduce((sum,person) => sum + Number(person.awards),0);
                const section = participationNode('section','participation-team');
                section.style.setProperty('--student-color',team.color);
                const heading = participationNode('div','participation-team-heading');
                heading.append(participationNode('strong','',team.name),participationNode('span','',`${teamTotal} total`));
                section.append(heading);
                if (!rows.length) {
                    section.append(participationNode('p','participation-empty','No contributions recorded.'));
                } else {
                    const list = participationNode('ol','participation-list');
                    rows.forEach((person,index) => {
                        const row = participationNode('li',`participation-row${index < 3 ? ' is-leader' : ''}`);
                        row.append(participationNode('span','participation-rank',String(person.rank || index + 1)),
                            participationNode('span','participation-name',String(person.name || 'Student')),
                            participationNode('span','participation-count',`${Number(person.awards)}×`));
                        list.append(row);
                    });
                    section.append(list);
                }
                body.append(section);
            }
            modal.classList.remove('hidden');
            modal.querySelector('.mobile-participation-close')?.focus();
        };

        window.closeParticipationSummary = function() {
            document.getElementById('mobile-participation-modal')?.classList.add('hidden');
        };

        async function fetchTurnConfiguration() {
            if (turnConfigurationPromise && Date.now()<turnExpiresAt) return turnConfigurationPromise;
            turnExpiresAt=Date.now()+30000;
            turnConfigurationPromise = (async () => {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 8000);
                try {
                    const response = await fetch(TURN_CONFIG_ENDPOINT, {
                        method:'GET', cache:'no-store', credentials:'same-origin', signal:controller.signal
                    });
                    if (!response.ok) throw new Error(`TURN credential service returned ${response.status}`);
                    const data = await response.json();
                    if (!Array.isArray(data.iceServers) || !data.iceServers.length) throw new Error('No ICE servers returned');
                    const iceServers = data.iceServers.map(server => ({
                        ...server,
                        urls:Array.isArray(server.urls)
                            ? server.urls.filter(url => !String(url).includes(':53'))
                            : server.urls
                    }));
                    turnRelayConfigured = iceServers.some(server => {
                        const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
                        return urls.some(url => String(url).startsWith('turn:') || String(url).startsWith('turns:'));
                    });
                    turnExpiresAt=Date.now()+Math.max(30000,Math.min(21600000,Number(data.expiresIn||300)*1000)-60000);
                    return { iceServers, turnAvailable:turnRelayConfigured };
                } catch (error) {
                    console.warn('TURN credentials unavailable; using direct/STUN connection only.', error);
                    turnRelayConfigured = false;
                    return { iceServers:[...DIRECT_ICE_FALLBACK], turnAvailable:false, error };
                } finally {
                    clearTimeout(timeout);
                }
            })();
            return turnConfigurationPromise;
        }

        async function createConfiguredPeer(peerId = '') {
            if (typeof Peer !== 'function') throw new Error('PeerJS could not be loaded on this network.');
            const turn = await fetchTurnConfiguration();
            const options = { debug:2, config:{ iceServers:turn.iceServers } };
            return peerId ? new Peer(peerId, options) : new Peer(options);
        }

        function safeRemoteSend(message, connection = window.remoteConnection) {
            if (!connection || !connection.open) return false;
            try {
                connection.send(message);
                return true;
            } catch (error) {
                console.warn('Remote send failed.', error);
                return false;
            }
        }

        // A live data channel is not proof that either device applied session state.
        function stopRemoteStateSync(connection=window.remoteConnection){
            if(connection){clearTimeout(connection._stateSyncTimer);connection._stateSyncTimer=null;}
        }
        function rejectRemoteVersion(connection){
            stopRemoteStateSync(connection);connection._stateReady=false;connection._versionMismatch=true;
            setRemoteConnectionStatus('failed','Version mismatch — refresh both devices to v'+REMOTE_BUILD);
            safeRemoteSend({type:'VERSION_MISMATCH',build:REMOTE_BUILD},connection);
        }
        function startRemoteStateSync(connection,role){
            stopRemoteStateSync(connection);
            if(!connection||connection._stateReady||connection._versionMismatch)return;
            let attempts=0;
            const retry=()=>{
                if(window.remoteConnection!==connection||!connection.open||connection._endHandled||connection._stateReady||connection._versionMismatch)return;
                if(attempts++>=10){
                    handleDataConnectionEnded(connection,role,'Session sync timed out — reconnecting');
                    try{connection.close();}catch{}return;
                }
                if(role==='host'){
                    safeRemoteSend({type:'CONNECTION_APPROVED',build:REMOTE_BUILD},connection);
                    try{window.syncStateToController();}catch(error){console.warn('Board state could not be sent.',error);setRemoteConnectionStatus('connecting','Board state could not be sent — retrying');}
                }else{
                    safeRemoteSend({type:'CONTROLLER_READY',build:REMOTE_BUILD},connection);
                    safeRemoteSend({type:'REQUEST_STATE',build:REMOTE_BUILD},connection);
                }
                if(!connection._stateReady&&!connection._versionMismatch)connection._stateSyncTimer=setTimeout(retry,1800);
            };
            retry();
        }
        window.retryRemoteSync=function(){
            if(remoteRole!=='controller')return;
            const connection=window.remoteConnection;
            if(connection?._versionMismatch){location.reload();return;}
            if(connection?.open){connection._stateReady=false;setRemoteConnectionStatus('connecting','Requesting current board state…');startRemoteStateSync(connection,'controller');}
            else if(!window.peer||window.peer.destroyed)createControllerPeer();
            else {controllerConnectInProgress=false;connectControllerToHost();}
        };
        document.addEventListener('visibilitychange',()=>{
            if(!document.hidden&&remoteRole==='controller'&&window.remoteConnection?.open&&!window.remoteConnection._stateReady)startRemoteStateSync(window.remoteConnection,'controller');
        });
        function stopRemoteHeartbeat() {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
        }

        function startRemoteHeartbeat(connection, role) {
            stopRemoteHeartbeat();
            lastRemoteActivityAt = Date.now();
            heartbeatTimer = setInterval(() => {
                if (window.remoteConnection !== connection || !connection.open) {
                    stopRemoteHeartbeat();
                    return;
                }
                if (Date.now() - lastRemoteActivityAt > 32000) {
                    try { connection.close(); } catch (error) {}
                    handleDataConnectionEnded(connection, role, 'Heartbeat timed out');
                    return;
                }
                safeRemoteSend({ type:'PING', sentAt:Date.now() }, connection);
            }, 10000);
        }

        function clearReconnectTimer() {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }

        function scheduleControllerReconnect() {
            if (remoteRole !== 'controller') return;
            clearReconnectTimer();
            controllerReconnectAttempts += 1;
            const delay = Math.min(10000, 1200 * Math.pow(1.65, Math.min(controllerReconnectAttempts - 1, 5)));
            setRemoteConnectionStatus('reconnecting', `Reconnecting in ${Math.ceil(delay / 1000)}s…`);
            reconnectTimer = setTimeout(() => {
                if (remoteRole !== 'controller' || remoteConnectionState === 'connected') return;
                if (window.peer?.destroyed) {
                    createControllerPeer();
                } else if (window.peer?.disconnected) {
                    try { window.peer.reconnect(); } catch (error) { createControllerPeer(); }
                } else {
                    connectControllerToHost();
                }
            }, delay);
        }

        function handleDataConnectionEnded(connection, role, reason = '') {
            if (connection._endHandled) return;
            connection._endHandled = true;
            stopRemoteStateSync(connection);
            clearTimeout(connection._connectTimeout);
            const wasActiveConnection = window.remoteConnection === connection;
            const wasPendingController = pendingControllerConnection === connection;
            if (wasPendingController) pendingControllerConnection = null;
            if (pendingIncomingConnection === connection) pendingIncomingConnection = null;
            if (!wasActiveConnection && !wasPendingController) return;
            if (wasActiveConnection) {
                window.remoteConnection = null;
                stopRemoteHeartbeat();
            }
            if (role === 'controller') {
                controllerConnectInProgress = false;
                scheduleControllerReconnect();
            } else {
                document.getElementById('room-code-container')?.classList.remove('hidden');
                setRemoteConnectionStatus('waiting', reason || 'Phone disconnected — room remains open');
                if (lastMatchSummaryPayload && !lastMatchSummaryAcknowledged) {
                    setSummaryDeliveryStatus('Final results pending — reconnect the phone.', 'pending');
                }
            }
        }

        function activateRemoteConnection(connection, role) {
            if (!connection?.open || connection._activated) return;
            if (connection._endHandled) { try { connection.close(); } catch (error) {} return; }
            clearTimeout(connection._connectTimeout);
            if (pendingControllerConnection === connection) pendingControllerConnection = null;
            connection._activated = true;
            connection._stateReady=false;connection._syncToken=LeagueRecovery.uid();
            connection._endHandled = false;
            if (window.remoteConnection && window.remoteConnection !== connection) {
                try { window.remoteConnection.close(); } catch (error) {}
            }
            window.remoteConnection = connection;
            remoteRole = role;
            clearReconnectTimer();
            controllerReconnectAttempts = 0;
            controllerConnectInProgress = false;
            window.setupConnectionData(connection, role);
            startRemoteHeartbeat(connection, role);
            if (role === 'host') {
                if(!connection._stateReady)setRemoteConnectionStatus('connecting','Phone linked — waiting for session synchronization…');
                document.getElementById('room-code-container')?.classList.add('hidden');
                startRemoteStateSync(connection,role);
                if (lastMatchSummaryPayload) {
                    lastMatchSummaryAcknowledged = false;
                    summaryRetryAttempts = 0;
                    sendMatchSummaryWithRetry(true);
                }
            } else {
                if(!connection._stateReady)setRemoteConnectionStatus('connecting', 'Phone linked — waiting for board approval and session data…');
                startRemoteStateSync(connection,role);
            }
        }

        function attachDataConnectionLifecycle(connection, role, requiresApproval = false) {
            if (!connection || connection._lifecycleAttached) return;
            connection._lifecycleAttached = true;
            connection._approved = !requiresApproval;
            connection.on('open', () => {
                if (connection._endHandled) { try { connection.close(); } catch (error) {} return; }
                if (requiresApproval && !connection._approved) {
                    setRemoteConnectionStatus('waiting', 'Phone is waiting for approval');
                    return;
                }
                activateRemoteConnection(connection, role);
            });
            connection.on('close', () => handleDataConnectionEnded(connection, role));
            connection.on('error', error => {
                console.warn('PeerJS data connection error.', error);
                handleDataConnectionEnded(connection, role, 'Data channel error');
            });
            if (connection.open && connection._approved) activateRemoteConnection(connection, role);
        }

        function connectControllerToHost() {
            if (remoteRole !== 'controller' || !activeRoomCode || controllerConnectInProgress || window.remoteConnection?.open) return;
            if (!window.peer || window.peer.destroyed || window.peer.disconnected) {
                scheduleControllerReconnect();
                return;
            }
            controllerConnectInProgress = true;
            setRemoteConnectionStatus(controllerReconnectAttempts ? 'reconnecting' : 'connecting');
            let connection;
            try {
                // PeerJS's JSON channel rejects messages >=16,300 bytes. Its binary transport
                // chunks/reassembles full rosters, lesson snapshots and result summaries automatically.
                connection = window.peer.connect('class6d-' + activeRoomCode, { reliable:true, serialization:'binary' });
            } catch (error) {
                controllerConnectInProgress = false;
                scheduleControllerReconnect();
                return;
            }
            pendingControllerConnection = connection;
            attachDataConnectionLifecycle(connection, 'controller', false);
            connection._connectTimeout = setTimeout(() => {
                if (!connection.open && !connection._endHandled) {
                    controllerConnectInProgress = false;
                    try { connection.close(); } catch (error) {}
                    handleDataConnectionEnded(connection, 'controller', 'Connection timed out');
                }
            }, 18000);
        }

        async function createControllerPeer() {
            clearReconnectTimer();
            setRemoteConnectionStatus(controllerReconnectAttempts ? 'reconnecting' : 'preparing');
            try {
                const peer = await createConfiguredPeer();
                window.peer = peer;
                peer.on('open', () => {
                    if (window.remoteConnection?.open) return;
                    connectControllerToHost();
                });
                peer.on('disconnected', () => {
                    if (!window.remoteConnection?.open) {
                        setRemoteConnectionStatus('reconnecting', 'Signalling interrupted — reconnecting…');
                    }
                    setTimeout(() => {
                        if (peer.destroyed) return scheduleControllerReconnect();
                        try { peer.reconnect(); } catch (error) { scheduleControllerReconnect(); }
                    }, 1200);
                });
                peer.on('close', () => scheduleControllerReconnect());
                peer.on('error', error => {
                    console.warn('PeerJS controller error.', error);
                    if (window.remoteConnection?.open) return;
                    if (pendingControllerConnection) {
                        const connection = pendingControllerConnection;
                        handleDataConnectionEnded(connection, 'controller', 'Connection interrupted');
                        try { connection.close(); } catch (closeError) {}
                        return;
                    }
                    controllerConnectInProgress = false;
                    if (error?.type === 'peer-unavailable') {
                        setRemoteConnectionStatus('reconnecting', 'Smartboard not reachable yet — retrying…');
                    } else {
                        setRemoteConnectionStatus('reconnecting', 'Connection interrupted — retrying…');
                    }
                    scheduleControllerReconnect();
                });
            } catch (error) {
                console.error(error);
                setRemoteConnectionStatus('failed', error.message || 'Could not prepare remote connection');
                scheduleControllerReconnect();
            }
        }
        
        window.openWheelModal = function() {
            openWheelModal();
            if (window.syncStateToController) window.syncStateToController();
        };

        window.requestRemoteVisualMode = function(mode) {
            if (remoteConnectionState !== 'connected' || !VISUAL_MODES.includes(mode)) return;
            remoteCommands.enqueue('SET_VISUAL_MODE',null,{mode});
        };

        window.closeWheelModal = function() {
            requestWheelClose();
        };

        window.startHostMode = async function({resume=false}={}) {
            if(!LeagueAccess.granted)return;
            if(remoteRole==='host')return;
            prepareHostSession(resume);
            const startButton = document.getElementById('start-host-btn');
            startButton.disabled = true;
            setRemoteConnectionStatus('preparing', 'Preparing secure remote connection…');
            try {
                activeRoomCode = (resume&&recoveryCandidate?.roomCode)||Math.random().toString(36).substring(2, 6).toUpperCase();
                remoteRole = 'host';
                document.getElementById('startup-overlay').classList.add('hidden');
                document.body.classList.add('session-started');
                LeaguePerformance.start();checkpointNow();
                const peer = await createConfiguredPeer('class6d-' + activeRoomCode);
                window.peer = peer;

                document.getElementById('startup-overlay').classList.add('hidden');
                document.body.classList.add('session-started');
                setPerformanceMode(performanceMode, { persist:true, initializeScenery:performanceMode === 'ultra' });
                document.getElementById('display-room-code').innerText = activeRoomCode;
                document.getElementById('room-code-container').classList.remove('hidden');

                peer.on('open', () => {
                    setRemoteConnectionStatus('waiting', turnRelayConfigured
                        ? 'Room ready — TURN relay available'
                        : 'Room ready — direct connection only');
                });
                peer.on('connection', connection => {
                    pendingIncomingConnection = connection;
                    attachDataConnectionLifecycle(connection, 'host', true);
                    document.getElementById('approval-overlay').classList.remove('hidden');

                    document.getElementById('btn-approve').onclick = () => {
                        document.getElementById('approval-overlay').classList.add('hidden');
                        connection._approved = true;
                        if (connection.open) activateRemoteConnection(connection, 'host');
                        else setRemoteConnectionStatus('connecting', 'Approved — opening secure data channel…');
                    };

                    document.getElementById('btn-deny').onclick = () => {
                        document.getElementById('approval-overlay').classList.add('hidden');
                        if (pendingIncomingConnection === connection) pendingIncomingConnection = null;
                        try { connection.close(); } catch (error) {}
                        setRemoteConnectionStatus('waiting', 'Connection denied — waiting for phone');
                    };
                });
                peer.on('disconnected', () => {
                    if (remoteConnectionState !== 'connected') setRemoteConnectionStatus('reconnecting', 'Signalling interrupted — reconnecting…');
                    setTimeout(() => {
                        if (!peer.destroyed && peer.disconnected) {
                            try { peer.reconnect(); } catch (error) {}
                        }
                    }, 1200);
                });
                peer.on('close', () => setRemoteConnectionStatus('failed', 'Smartboard room closed — refresh to restart'));
                peer.on('error', error => {
                    console.warn('PeerJS host error.', error);
                    if (error?.type === 'unavailable-id') {
                        setRemoteConnectionStatus('failed', 'Room-code collision — refresh and try again');
                    } else if (remoteConnectionState !== 'connected') {
                        setRemoteConnectionStatus('failed', 'Could not open remote room');
                    }
                });
            } catch (error) {
                console.error(error);
                setRemoteConnectionStatus('failed', error.message || 'Could not start remote room');
                startButton.disabled = false;
            }
        };

        window.startControllerMode = async function() {
            if(!LeagueAccess.granted)return;
            const inputCode = document.getElementById('room-code-input').value.trim().toUpperCase();
            if (inputCode.length !== 4) {
                alert("Please enter a valid 4-digit code.");
                return;
            }

            document.getElementById('connect-phone-btn').disabled = true;
            // v10.1.0: the Teacher PIN typed here signs in to Google Sheets once the board allows this phone.
            const teacherPin=document.getElementById('teacher-pin-startup');globalThis.LeagueTeacher?.start(teacherPin?.value);if(teacherPin)teacherPin.value='';
            activeRoomCode = inputCode;
            remoteRole = 'controller';
            document.getElementById('startup-overlay').classList.add('hidden');
            document.querySelector('.app-shell').style.display = 'none';
            LeaguePerformance.stop();recoveryReady=false;
            document.getElementById('dynamic-background').style.display = 'none';
            document.getElementById('mobile-controller').classList.remove('hidden');
            const mobileRoomCode = document.getElementById('mobile-room-code');
            if (mobileRoomCode) mobileRoomCode.textContent = inputCode;
            updateMobileClassMissionUI();
            updateMobileRecordAvailability();
            await createControllerPeer();
        };

        window.setupConnectionData = function(connection = window.remoteConnection, role = remoteRole) {
            if (!connection || connection._dataHandlerAttached) return;
            connection._dataHandlerAttached = true;
            connection.on('data', (data) => {
                if(!data||typeof data!=='object'||(window.remoteConnection&&window.remoteConnection!==connection))return;
                lastRemoteActivityAt = Date.now();
                const isHost = role === 'host';

                if(data.type==='TEACHING_CHUNK'){
                    if(data.sessionId!==(isHost?sessionId:latestRemoteSessionId))return;
                    try{LeagueTeaching.receive(data);}catch(error){console.warn('Teaching sync failed.',error);}return;
                }
                if(data.type==='QUESTION_LOG'){
                    if(!globalThis.LeagueQuestionLog||!LeagueStudents.validClass(data.className)||!Array.isArray(data.rows))return;
                    if(isHost){
                        if(data.sessionId!==sessionId||data.className!==selectedClass)return;
                        LeagueQuestionLog.merge(data.className,data.rows);
                        if(data.request)safeRemoteSend({type:'QUESTION_LOG',sessionId,className:data.className,rows:LeagueQuestionLog.rows(data.className)},connection);
                        window.syncStateToController();
                    }else if(data.sessionId===latestRemoteSessionId)LeagueQuestionLog.merge(data.className,data.rows);
                    return;
                }
                if(data.type==='HALO_RESULT'&&isHost){
                    // v10.2.0: a class's last result loaded on the phone (Google Sheets) decides the Comeback Halo.
                    if(data.sessionId===sessionId&&data.className===selectedClass)globalThis.LeagueHalo?.accept(data.className,data.result);
                    return;
                }
                if(data.type==='LEAGUE_SEASON'&&isHost){
                    if(data.sessionId!==sessionId)return;
                    if(data.outdated===true){globalThis.LeagueSeason?.outdated();window.syncStateToController?.();}
                    else if(globalThis.LeagueSeason?.accept(data.season))window.syncStateToController?.();
                    return;
                }
                if(data.type==='SAGA_DATA'&&isHost){
                    if(data.sessionId!==sessionId||!LeagueSaga.validClass(data.className))return;
                    let changed=false;
                    if(data.row)changed=LeagueSaga.accept(data.className,data.row)||changed;
                    if(data.extras)LeagueSaga.acceptExtras(data.className,data.extras);
                    if(data.lines)LeagueSaga.acceptLines(data.lines.grade,data.lines.lines,data.lines.at);
                    if(changed){updateGameState(true);updateVixarRaidAccess();scheduleCheckpoint();}
                    window.syncStateToController?.();return;
                }
                if(data.type==='NAVIGATOR_SEALS'&&isHost){
                    if(data.sessionId===sessionId&&data.className===selectedClass&&Array.isArray(data.rows))globalThis.LeagueNavigatorSeals?.merge(selectedClass,data.rows);return;
                }
                if(data.type==='RUN_CONTROL'&&isHost){
                    if(!connection._stateReady||connection._versionMismatch||data.protocol!==7||data.sessionId!==sessionId)return;
                    LeagueIslandRun.control(data.control);return;
                }
                if(data.type==='ISLAND_PROGRESS'&&isHost){
                    if(data.sessionId===sessionId&&data.className===selectedClass){LeagueIslandProgress.merge(data.progress,selectedClass);window.syncStateToController();}return;
                }
                if(data.type==='ROSTER_CATALOG' && isHost){
                    try {if(LeagueRoster.accept(data.catalog)){
                        // v10.1.0: the Teacher sign-in's names also reach a lesson that has not awarded anyone yet.
                        const lessonOpen=data.signIn===true&&!LeagueStudents.hasCredits(studentContributions)&&!secretAgents.request&&!Object.keys(secretAgents.assignments).length;
                        if(!selectedClass||lessonOpen){LeagueStudents.useRoster(LeagueRoster.current().students);updateStudentSessionUI();scheduleCheckpoint();}
                        window.syncStateToController();
                    }} catch { safeRemoteSend({type:'ROSTER_ERROR',message:'Invalid roster. Load online again from Manage.'},connection); }
                    return;
                }
                if(data.type==='ROSTER_ERROR'&&!isHost){document.getElementById('mobile-command-status').textContent=data.message;return;}
                if (data?.type === 'PING') {
                    safeRemoteSend({ type:'PONG', sentAt:data.sentAt }, connection);
                    return;
                }
                if (data?.type === 'PONG') return;
                if(data.type==='ACTION_ACK'&&!isHost){remoteCommands.acknowledge(data);if(data.ok===false)pendingRemoteClassSelection=null;return;}
                if(data.type==='VERSION_MISMATCH'){
                    stopRemoteStateSync(connection);connection._stateReady=false;connection._versionMismatch=true;
                    setRemoteConnectionStatus('failed','Version mismatch — refresh both devices to v'+REMOTE_BUILD);return;
                }
                if(data.type==='STATE_SYNC_ACK'&&isHost){
                    if(data.build!==REMOTE_BUILD){rejectRemoteVersion(connection);return;}
                    if(data.sessionId!==sessionId||data.syncToken!==connection._syncToken||connection._versionMismatch)return;
                    const firstReady=!connection._stateReady;connection._stateReady=true;stopRemoteStateSync(connection);
                    if(firstReady&&selectedClass)LeagueTeaching.send(safeRemoteSend,sessionId,Number(selectedClass[0]));
                    setRemoteConnectionStatus('connected',turnRelayConfigured?'Connected — session synchronized · relay available':'Connected — session synchronized');return;
                }
                if (data?.type === 'CONTROLLER_READY' && isHost) {
                    if(data.build!==REMOTE_BUILD){rejectRemoteVersion(connection);return;}
                    safeRemoteSend({ type:'CONNECTION_APPROVED',build:REMOTE_BUILD }, connection);
                    window.syncStateToController();
                    return;
                }
                if (data?.type === 'CONNECTION_APPROVED' && !isHost) {
                    if(data.build!==REMOTE_BUILD){rejectRemoteVersion(connection);return;}
                    if(!connection._stateReady)setRemoteConnectionStatus('connecting', 'Loading current board state…');
                    safeRemoteSend({ type:'REQUEST_STATE',build:REMOTE_BUILD }, connection);
                    return;
                }
                if (data?.type === 'REQUEST_STATE' && isHost) {
                    if(data.build!==REMOTE_BUILD){rejectRemoteVersion(connection);return;}
                    window.syncStateToController();
                    if (lastMatchSummaryPayload) {
                        lastMatchSummaryAcknowledged = false;
                        summaryRetryAttempts = 0;
                        sendMatchSummaryWithRetry(true);
                    }
                    return;
                }
                if (data?.type === 'MATCH_SUMMARY_ACK' && isHost) {
                    if (lastMatchSummaryPayload?.summaryId === data.summaryId) {
                        lastMatchSummaryAcknowledged = true;
                        clearTimeout(summaryRetryTimer);
                        setSummaryDeliveryStatus('✓ Final results received by the phone.', 'delivered');
                    }
                    return;
                }
                
                // 1. PHONE RECEIVER: Store match snapshots in separate slots
                if (data.type === 'SYNC_MATCH_SUMMARY' && !isHost) {
                    if(!data.payload||data.payload.sessionId!==latestRemoteSessionId)return;
                    if (data.payload.type === 'LEADERBOARD_FINAL') {
                        cachedLeaderboardRecord = data.payload;
                    } else if (data.payload.type === 'BATTLE_OUTCOME') {
                        cachedBattleRecord = data.payload;
                    }
                    if(data.payload.islandProgress)LeagueIslandProgress.merge(data.payload.islandProgress,data.payload.className);
                    const recordBtn = document.getElementById('mobile-record-btn');
                    if (recordBtn) {
                        recordBtn.classList.add('ring-2', 'ring-emerald-400');
                    }
                    pendingRemoteFinish = false;
                    clearTimeout(remoteFinishTimeout);
                    remoteFinishTimeout = null;
                    updateMobileRecordAvailability();
                    persistMobileRecords();
                    safeRemoteSend({ type:'MATCH_SUMMARY_ACK', summaryId:data.payload.summaryId }, connection);
                    return;
                }

                // 2. SMARTBOARD RECEIVER: Handle incoming remote clicks from Phone
                if (data.type === 'ACTION' && isHost) {
                    if(!connection._stateReady||connection._versionMismatch){window.syncStateToController();return;}
                    const ack=LeagueRemote.receive(data,{sessionId,ledger:commandLedger,apply:applyRemoteCommand,commit:checkpointNow});
                    safeRemoteSend(ack,connection);window.syncStateToController();
                } else if (data.type === 'STATE_SYNC' && !isHost) {
                    if(data.build!==REMOTE_BUILD){rejectRemoteVersion(connection);return;}
                    if(connection._versionMismatch)return;
                    try {
                    if(data.protocol!==7||typeof data.sessionId!=='string'||typeof data.syncToken!=='string'||!data.syncToken||!['gryffindor','slytherin','hufflepuff','ravenclaw'].every(id=>Number.isFinite(data.scores?.[id])))throw Error('Incomplete board state');
                    if(latestRemoteSessionId!==data.sessionId){LeagueAgent.close();shownAgentRequest=null;LeagueStudentUI.close(true);closeParticipationSummary();pendingRemoteClassSelection=null;cachedLeaderboardRecord=null;cachedBattleRecord=null;pendingRemoteFinish=false;latestRemoteSessionId=data.sessionId;updateMobileRecordAvailability();}
                    updateRemoteSceneControls(data.scene,data.paused,data.islandRun);
                    if(data.islandProgress)LeagueIslandProgress.merge(data.islandProgress,data.selectedClass);
                    // v10.0.2: the phone loads islands while it is connected, so it passes the school season on whenever
                    // it holds a newer copy than the board (also when nothing changed on the phone), or reports an old script.
                    if(globalThis.LeagueSeason){
                        if(LeagueSeason.data&&LeagueSeason.loadedAt>(Number(data.seasonAt)||0))safeRemoteSend({type:'LEAGUE_SEASON',sessionId:data.sessionId,season:LeagueSeason.data});
                        else if(!LeagueSeason.data&&LeagueSeason.outdatedScript&&!data.seasonAt&&!data.seasonOutdated)safeRemoteSend({type:'LEAGUE_SEASON',sessionId:data.sessionId,outdated:true});
                    }
                    if(globalThis.LeagueHalo){
                        remoteHaloTeams=Array.isArray(data.haloTeams)?LeagueStudents.teams.filter(t=>data.haloTeams.includes(t)):[];renderMobileHalo();
                        // The phone may hold the class's last result from Google Sheets that the board does not have yet.
                        const last=LeagueStudents.validClass(data.selectedClass)?LeagueHalo.result(data.selectedClass):null,mark=last&&data.sessionId+'|'+data.selectedClass+'|'+last.sessionId+'|'+last.at;
                        if(last&&connection._haloSent!==mark){connection._haloSent=mark;safeRemoteSend({type:'HALO_RESULT',sessionId:data.sessionId,className:data.selectedClass,result:last});}
                    }
                    if(globalThis.LeagueNavigatorSeals&&Array.isArray(data.navigatorSeals)&&LeagueStudents.validClass(data.selectedClass)){
                        globalThis.LeagueNavigatorSeals?.merge(data.selectedClass,data.navigatorSeals);
                        // The phone may hold seals loaded from Google Sheets that the board has not seen yet.
                        if(globalThis.LeagueNavigatorSeals&&LeagueNavigatorSeals.rows(data.selectedClass).length>new Set(data.navigatorSeals.map(r=>r?.studentId+':'+r?.island)).size)
                            safeRemoteSend({type:'NAVIGATOR_SEALS',sessionId:data.sessionId,className:data.selectedClass,rows:LeagueNavigatorSeals.rows(data.selectedClass)});
                    }
                    // Answer logs are exchanged only when the two devices hold different rows for this class.
                    if(globalThis.LeagueQuestionLog&&LeagueStudents.validClass(data.selectedClass)&&typeof data.questionLogStamp==='string'){
                        const key=data.sessionId+'|'+data.selectedClass+'|'+data.questionLogStamp+'|'+LeagueQuestionLog.stamp(data.selectedClass);
                        if(data.questionLogStamp!==LeagueQuestionLog.stamp(data.selectedClass)&&remoteQuestionLogExchange!==key){
                            remoteQuestionLogExchange=key;safeRemoteSend({type:'QUESTION_LOG',sessionId:data.sessionId,className:data.selectedClass,rows:LeagueQuestionLog.rows(data.selectedClass),request:true});
                        }
                    }
                    if(syncStudentState(data)===false)throw Error('Roster sync failed');
                    if(LeagueIslandProgress.valid(data.selectedClass)){
                        const progress=LeagueIslandProgress.snapshot(data.selectedClass);
                        if(JSON.stringify(progress)!==JSON.stringify(LeagueIslandProgress.clean(data.islandProgress,data.selectedClass)))safeRemoteSend({type:'ISLAND_PROGRESS',sessionId:data.sessionId,className:data.selectedClass,progress});
                    }
                    syncRemoteAgents(data);
                    globalThis.LeagueSagaRemote?.sync(data.saga||null,{sessionId:data.sessionId,className:data.selectedClass,send:safeRemoteSend,command:(action,extra)=>remoteCommands.enqueue(action,null,extra)});
                    document.querySelectorAll('[data-remote-mode]').forEach(button => {
                        button.setAttribute('aria-pressed', button.dataset.remoteMode === data.visualMode ? 'true' : 'false');
                        button.setAttribute('aria-busy', button.dataset.remoteMode === data.pendingVisualMode ? 'true' : 'false');
                        button.title = visualModeNames[button.dataset.remoteMode] + (button.dataset.remoteMode === data.pendingVisualMode ? ' — queued until the current event ends' : '');
                    });
                    document.getElementById('mobile-score-gryffindor').innerText = data.scores.gryffindor.toLocaleString();
                    document.getElementById('mobile-score-slytherin').innerText = data.scores.slytherin.toLocaleString();
                    document.getElementById('mobile-score-hufflepuff').innerText = data.scores.hufflepuff.toLocaleString();
                    document.getElementById('mobile-score-ravenclaw').innerText = data.scores.ravenclaw.toLocaleString();

                    if (data.classMission) updateMobileClassMissionUI(data.classMission);
                    
                    if (data.chests) {
                        document.getElementById('mobile-chest-gryffindor').classList.toggle('hidden', !data.chests.gryffindor);
                        document.getElementById('mobile-chest-slytherin').classList.toggle('hidden', !data.chests.slytherin);
                        document.getElementById('mobile-chest-hufflepuff').classList.toggle('hidden', !data.chests.hufflepuff);
                        document.getElementById('mobile-chest-ravenclaw').classList.toggle('hidden', !data.chests.ravenclaw);
                    }

                    if (data.wheelVisible !== undefined) {
                        const overlay = document.getElementById('mobile-wheel-overlay');
                        const hasResult = Boolean(data.wheelResult);
                        overlay.classList.toggle('hidden', !data.wheelVisible);
                        document.getElementById('mobile-wheel-title').textContent = hasResult ? 'WHEEL RESULT' : data.wheelSpinning ? 'WHEEL IS SPINNING' : 'WHEEL IS OPEN';
                        document.getElementById('mobile-wheel-result').textContent = hasResult ? data.wheelResult : '';
                        document.getElementById('mobile-wheel-result').classList.toggle('hidden', !hasResult);
                        document.getElementById('mobile-wheel-message').textContent = hasResult
                            ? 'The selected subject will remain on the Smartboard until you continue.'
                            : 'The Wheel of Subjects is currently displayed on the Smartboard.';
                        document.getElementById('mobile-wheel-close-btn').textContent = hasResult ? 'Continue' : 'Close Wheel';
                        document.getElementById('mobile-wheel-icon').classList.toggle('is-spinning', Boolean(data.wheelSpinning));
                        // v10.4.0: the open Challenge Deck card, with the teacher's buttons.
                        const challenge = data.wheelVisible && data.challenge || null;
                        overlay.classList.toggle('has-challenge', Boolean(challenge));
                        if (challenge) document.getElementById('mobile-wheel-title').textContent = 'ENGLISH CHALLENGE';
                        globalThis.LeagueChallenge?.renderRemote(document.getElementById('mobile-challenge'), challenge, op => remoteCommands.enqueue('CHALLENGE', null, op));
                    }
                    connection._stateReady=true;stopRemoteStateSync(connection);
                    if(remoteConnectionState!=='connected')setRemoteConnectionStatus('connected');
                    // The receipt precedes commands, so the host is ready before a queued action arrives.
                    safeRemoteSend({type:'STATE_SYNC_ACK',build:REMOTE_BUILD,sessionId:data.sessionId,syncToken:data.syncToken},connection);
                    remoteCommands.sync(data.sessionId);
                    globalThis.LeagueTeacher?.connected();
                    if(data.selectedClass&&connection._teachingClass!==data.selectedClass){connection._teachingClass=data.selectedClass;LeagueTeaching.send(safeRemoteSend,data.sessionId,Number(data.selectedClass[0]));}
                    }catch(error){
                        console.warn('Remote state could not be applied.',error);connection._stateReady=false;
                        setRemoteConnectionStatus('connecting','Session data could not be applied — retrying. Refresh both devices if this continues.');
                        if(!connection._stateSyncTimer)connection._stateSyncTimer=setTimeout(()=>startRemoteStateSync(connection,'controller'),1800);
                    }
                }
            });
            
            if (role === 'host') {
                try { window.syncStateToController(); } catch(error) { console.warn('Initial board sync failed; activation will retry.',error); }
                
                if (!window.boardSyncPatched) {
                    const originalUpdate = updateGameState;
                    updateGameState = function(visualsChanged = false) {
                        originalUpdate(visualsChanged);
                        window.syncStateToController();
                    };
                    window.boardSyncPatched = true;
                }

                if (!window.wheelObserverPatched) {
                    const wheelModal = document.getElementById('wheel-modal');
                    if (wheelModal) {
                        const wheelObserver = new MutationObserver(() => {
                            if (window.syncStateToController) window.syncStateToController();
                        });
                        wheelObserver.observe(wheelModal, { attributes: true, attributeFilter: ['class'] });
                        window.wheelObserverPatched = true;
                    }
                }
            }
        };

        window.syncStateToController = function() {
            if(window.remoteConnection && window.remoteConnection.open) {
                const getTeam = id => teamsData.find(t => t.id === id);
                
                const currentScores = {
                    gryffindor: getTeam('gryffindor').points,
                    slytherin: getTeam('slytherin').points,
                    hufflepuff: getTeam('hufflepuff').points,
                    ravenclaw: getTeam('ravenclaw').points,
                };
                
                const cap = levelCap();
                const chestsReady = {
                    gryffindor: Boolean(getTeam('gryffindor').pendingEvolution) && getTeam('gryffindor').level < cap,
                    slytherin: Boolean(getTeam('slytherin').pendingEvolution) && getTeam('slytherin').level < cap,
                    hufflepuff: Boolean(getTeam('hufflepuff').pendingEvolution) && getTeam('hufflepuff').level < cap,
                    ravenclaw: Boolean(getTeam('ravenclaw').pendingEvolution) && getTeam('ravenclaw').level < cap
                };
                
                const isWheelVisible = document.getElementById('wheel-modal').classList.contains('visible');
                const wheelResultVisible = isWheelVisible && document.getElementById('wheel-result-card').classList.contains('revealed');
                const classMissionState = {
                    target:classMission.target,
                    progress:classMission.progress,
                    completed:Boolean(classMission.completed),
                    rewardGranted:Boolean(classMission.rewardGranted),
                    busy:Boolean(unityEventRunning || unityEventQueued)
                };

                safeRemoteSend({ 
                    type: 'STATE_SYNC', protocol:7, build:REMOTE_BUILD, syncToken:window.remoteConnection._syncToken, sessionId,
                    selectedClass, studentContributions, studentTrackingVersion:1, secretAgents,
                    islandProgress:LeagueIslandProgress.snapshot(selectedClass),
                    navigatorSeals:globalThis.LeagueNavigatorSeals?.rows(selectedClass)||[],
                    seasonAt:globalThis.LeagueSeason?.loadedAt||0,seasonOutdated:Boolean(globalThis.LeagueSeason?.outdatedScript),haloTeams,
                    questionLogStamp:globalThis.LeagueQuestionLog?.stamp(selectedClass)||'0',
                    rosterSnapshot:LeagueStudents.snapshot(),rosterCatalog:LeagueRoster.current(),
                    levels:Object.fromEntries(teamsData.map(t=>[t.id,t.level])),
                    pointValue:currentPointValue,scene:LeagueScenes.active,paused:LeagueScenes.paused,islandRun:LeagueIslandRun.state, 
                    scores: currentScores,
                    visualMode: performanceMode,
                    pendingVisualMode: deferredPerformanceMode, 
                    chests: chestsReady, 
                    classMission: classMissionState,
                    wheelVisible: isWheelVisible,
                    wheelResult: wheelResultVisible ? document.getElementById('wheel-result').textContent : null,
                    wheelSpinning: Boolean(activeWheelSpin && !activeWheelSpin.settled),
                    challenge: globalThis.LeagueChallenge?.remoteView() || null,
                    saga: sagaRemoteState()
                });
            }
        };

        window.sendRemoteAction = function(action, team) {
            if (action === 'ADD') return requestStudentAward(team,{remote:true});
            return remoteCommands.enqueue(action,team);
        };

        window.confirmRemoteTeamReset = function(teamId, teamName) {
            if (remoteConnectionState !== 'connected') return;
            pendingRemoteResetTeam = { teamId, teamName };
            const label = document.getElementById('mobile-reset-team-name');
            if (label) label.textContent = teamName;
            document.getElementById('mobile-reset-modal')?.classList.remove('hidden');
        };

        window.closeRemoteTeamResetModal = function() {
            document.getElementById('mobile-reset-modal')?.classList.add('hidden');
            pendingRemoteResetTeam = null;
        };

        window.executeRemoteTeamReset = function() {
            if (!pendingRemoteResetTeam || remoteConnectionState !== 'connected') {
                window.closeRemoteTeamResetModal();
                return;
            }
            const { teamId } = pendingRemoteResetTeam;
            window.closeRemoteTeamResetModal();
            window.sendRemoteAction('RESET_TEAM', teamId);
        };

        window.openRemoteFinishModal = function() {
            if (remoteConnectionState !== 'connected' || pendingRemoteFinish) return;
            if (cachedLeaderboardRecord || cachedBattleRecord) {
                window.openTeacherSaveModal();
                return;
            }
            document.getElementById('mobile-finish-modal')?.classList.remove('hidden');
        };

        window.closeRemoteFinishModal = function() {
            document.getElementById('mobile-finish-modal')?.classList.add('hidden');
        };

        window.executeRemoteFinish = function() {
            if (remoteConnectionState !== 'connected' || pendingRemoteFinish) {
                window.closeRemoteFinishModal();
                return;
            }

            window.closeRemoteFinishModal();
            pendingRemoteFinish = true;
            updateMobileRecordAvailability();

            if (!window.sendRemoteAction('FINISH_SESSION')) {
                pendingRemoteFinish = false;
                updateMobileRecordAvailability();
                return;
            }

            clearTimeout(remoteFinishTimeout);
            remoteFinishTimeout = setTimeout(() => {
                remoteFinishTimeout = null;
                if (cachedLeaderboardRecord || cachedBattleRecord) return;
                pendingRemoteFinish = false;
                updateMobileRecordAvailability();
                const status = document.getElementById('mobile-record-ready-status');
                if (status) status.textContent = 'No final result yet. Check the smartboard, then try Finish again.';
            }, 15000);
        };

        LeagueRoster.configure({getClass:()=>remoteRole==='controller'?remoteStudentClass:selectedClass,onSaved:(catalog,options)=>{
            if(remoteRole==='controller')safeRemoteSend({type:'ROSTER_CATALOG',catalog,signIn:options?.signIn===true});
            else {
                if(!selectedClass){LeagueStudents.useRoster(catalog.students);updateStudentSessionUI();scheduleCheckpoint();}
                window.syncStateToController?.();
            }
        }});
        globalThis.LeagueTeacher?.configure({remote:()=>remoteRole==='controller',ready:()=>remoteRole==='controller'&&Boolean(window.remoteConnection?.open&&window.remoteConnection._stateReady)});
        // --- GOOGLE SHEETS CLOUD LOGGER CONFIGURATION ---
        const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby1slB2qFrDkSp_4AsW7NGiADQju3TisakEWG-s1lGwAoho9gkAoz9enWZbAIEMT9eZww/exec";
        
        let cachedLeaderboardRecord = null;
        let cachedBattleRecord = null;

        function sendMatchSummaryWithRetry(sendImmediately = false) {
            clearTimeout(summaryRetryTimer);
            if (!lastMatchSummaryPayload || lastMatchSummaryAcknowledged) return;

            let sent=false;
            for(const payload of Object.values(boardSummaries))sent=safeRemoteSend({type:'SYNC_MATCH_SUMMARY',payload})||sent;

            if (sent) {
                summaryRetryAttempts += 1;
                setSummaryDeliveryStatus('Sending final results to the phone…', 'pending');
            } else {
                setSummaryDeliveryStatus('Final results saved on board — waiting for phone connection.', 'pending');
                return;
            }

            if (summaryRetryAttempts < 4) {
                summaryRetryTimer = setTimeout(() => sendMatchSummaryWithRetry(), sendImmediately ? 1200 : 2600);
            } else if (!lastMatchSummaryAcknowledged) {
                setSummaryDeliveryStatus('Final results pending — they will resend after reconnection.', 'pending');
            }
        }

        // 1. SMARTBOARD: Broadcasts a snapshot and waits for the phone to acknowledge receipt.
        window.broadcastMatchSummaryToController = function(recordType = "LEADERBOARD_FINAL", battleWinnerData = null) {
            try {
                const standings = (typeof teamsData !== 'undefined' && Array.isArray(teamsData))
                    ? [...teamsData].sort((a, b) => b.points - a.points)
                    : [];

                const payload = {
                    sessionId,
                    summaryId:(window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
                    createdAt:new Date().toISOString(),
                    type: recordType,
                    className:selectedClass,
                    islandProgress:LeagueIslandProgress.snapshot(selectedClass),
                    studentContributions:LeagueStudents.summary(selectedClass,studentContributions),
                    challengeLog:challengeLog.filter(row=>row.className===selectedClass).slice(-200),
                    standings: standings.map(t => ({
                        id: t.id,
                        name: t.name,
                        points: t.points,
                        level: t.level
                    })),
                    classMissionCompleted: Boolean(typeof classMission !== 'undefined' && classMission && classMission.completed),
                    winner: battleWinnerData ? battleWinnerData.winner : (standings[0] ? standings[0].name : "None"),
                    remainingHP: battleWinnerData ? battleWinnerData.remainingHP : "-",
                    damageDealt: battleWinnerData ? battleWinnerData.damageDealt : "-",
                    durationSeconds: 30
                };
                boardSummaries[recordType]=payload;
                lastMatchSummaryPayload = payload;
                scheduleCheckpoint();
                lastMatchSummaryAcknowledged = false;
                summaryRetryAttempts = 0;
                sendMatchSummaryWithRetry(true);
            } catch (e) {
                console.warn("Could not compile match summary:", e);
            }
        };

        // 2. MOBILE: Open / Close Modal Handlers
        window.openTeacherSaveModal = function() {
            if (!cachedLeaderboardRecord && !cachedBattleRecord) {
                alert('Final results have not arrived from the smartboard yet. Wait for the confirmation message first.');
                return;
            }
            document.getElementById('teacher-class-input').value = cachedLeaderboardRecord?.className || cachedBattleRecord?.className || remoteStudentClass || '';
            document.getElementById('mobile-save-modal').classList.remove('hidden');
            document.getElementById('teacher-pin-input').value = globalThis.LeagueTeacher?.pin||'';
            document.getElementById('mobile-save-status').textContent = '';
        };

        window.closeTeacherSaveModal = function() {
            document.getElementById('mobile-save-modal').classList.add('hidden');
        };

        // 3. MOBILE: Submit Single or Full Session to Google Apps Script
        window.submitOfficialRecordFromMobile = async function() {
            const classInput = document.getElementById('teacher-class-input').value.trim();
            const pin = document.getElementById('teacher-pin-input').value.trim();
            const recordType = document.getElementById('teacher-record-type').value;
            const statusEl = document.getElementById('mobile-save-status');
            const submitBtn = document.getElementById('btn-confirm-save');

            if (!classInput) {
                statusEl.textContent = "Please enter the class name (e.g. 5-A).";
                statusEl.style.color = "#f87171";
                return;
            }

            if (!pin) {
                statusEl.textContent = "Please enter your Teacher PIN.";
                statusEl.style.color = "#f87171";
                return;
            }

            if (['FULL_SESSION','BATTLE_OUTCOME'].includes(recordType) && !cachedBattleRecord) {
                statusEl.textContent = 'Wait for the Arena result, or select Leaderboard Standings Only.';
                statusEl.style.color = '#fcd34d';
                return;
            }
            if (!cachedLeaderboardRecord && !cachedBattleRecord) {
                statusEl.textContent = 'Finish the session and receive its results before saving.';
                statusEl.style.color = '#fcd34d';
                return;
            }

            // Fallback live standings if no snapshot exists yet
            const fallbackStandings = [
                { id: 'gryffindor', name: 'Gryffindor', points: parseInt(document.getElementById('mobile-score-gryffindor')?.innerText.replace(/,/g, '')) || 0, level: 0 },
                { id: 'slytherin', name: 'Slytherin', points: parseInt(document.getElementById('mobile-score-slytherin')?.innerText.replace(/,/g, '')) || 0, level: 0 },
                { id: 'hufflepuff', name: 'Hufflepuff', points: parseInt(document.getElementById('mobile-score-hufflepuff')?.innerText.replace(/,/g, '')) || 0, level: 0 },
                { id: 'ravenclaw', name: 'Ravenclaw', points: parseInt(document.getElementById('mobile-score-ravenclaw')?.innerText.replace(/,/g, '')) || 0, level: 0 }
            ].sort((a, b) => b.points - a.points);

            const lbRecord = cachedLeaderboardRecord || cachedBattleRecord || {
                standings: fallbackStandings,
                classMissionCompleted: false
            };

            const btRecord = cachedBattleRecord || {
                winner: fallbackStandings[0]?.name || "-",
                remainingHP: "-",
                damageDealt: "-",
                durationSeconds: 30
            };

            submitBtn.disabled = true;
            statusEl.textContent = "Uploading record to Google Sheet...";
            statusEl.style.color = "#38bdf8";

            try {
                const sessionClass=lbRecord.className||btRecord.className;
                if(sessionClass && classInput!==sessionClass)throw Error('Save this session as '+sessionClass+' so island progress stays with the correct class.');
                const payload = {
                    sessionId:latestRemoteSessionId||lbRecord.sessionId||btRecord.sessionId||lbRecord.summaryId,
                    islandProgress:LeagueIslandProgress.snapshot(classInput),
                    navigatorSeals:globalThis.LeagueNavigatorSeals?.rows(classInput)||[],
                    type: recordType,
                    className: classInput,
                    studentContributions:lbRecord.studentContributions || null,
                    pin: pin,
                    standings: lbRecord.standings || fallbackStandings,
                    classMissionCompleted: Boolean(lbRecord.classMissionCompleted),
                    winner: btRecord.winner || "-",
                    remainingHP: btRecord.remainingHP ?? "-",
                    damageDealt: btRecord.damageDealt ?? "-",
                    durationSeconds: btRecord.durationSeconds || 30
                };

                // v9.3.0: this session's Island Run answers travel with the session record (deduplicated by row ID).
                const answerRows=globalThis.LeagueQuestionLog?.rows(classInput,{sessionId:payload.sessionId||''}).slice(-200)||[];
                if(answerRows.length)payload.questionLog=answerRows;
                // v10.4.0: the Challenge Deck cards of this session (the later summary has every card).
                const cards=[lbRecord.challengeLog,btRecord.challengeLog].filter(Array.isArray).sort((a,b)=>b.length-a.length)[0]||[];
                if(cards.length)payload.challengeLog=cards.filter(row=>row?.className===classInput).slice(-200);
                const recordId=`${latestRemoteSessionId||lbRecord.sessionId||lbRecord.summaryId}:${recordType}:${classInput.toLowerCase()}`;
                let entry=LeagueOutbox.find(recordId);
                entry=LeagueOutbox.add(recordId,payload,{refresh:true});
                await LeagueOutbox.send(entry,pin,{retry:true});
                statusEl.textContent=(entry.error||LeagueOutbox.labels[entry.state])+(LeagueOutbox.storageOK?'':' · local storage unavailable');
                statusEl.style.color=entry.state==='sent'?'#7dd3fc':'#fcd34d';
                if(entry.state==='sent')globalThis.LeagueTeacher?.accepted(pin);
                document.getElementById('teacher-pin-input').value=globalThis.LeagueTeacher?.pin||'';
                submitBtn.disabled=false;

            } catch (err) {
                statusEl.textContent = err.message || "Could not prepare this record.";
                statusEl.style.color = "#f87171";
                submitBtn.disabled = false;
            }
        };
        // v7 classroom integration: this adapter alone sees private game state.
        let resumeUnityPlan=null,presentationHeld=false;
        const remoteCommands=LeagueRemote.controller({send:message=>safeRemoteSend(message),status:(message,state)=>{
            const el=document.getElementById('mobile-command-status');el.textContent=message;el.dataset.state=state;
        }});
        // v10.3.0: the recovery snapshot is written when the board is idle (at most 0.6 s after a change) instead of at
        // the end of every award, and at once when the page is closed or hidden, so nothing is lost on a reload.
        let checkpointHandle=0;
        function flushCheckpoint(){if(!checkpointQueued)return;checkpointQueued=false;if(window.cancelIdleCallback)cancelIdleCallback(checkpointHandle);else clearTimeout(checkpointHandle);checkpointNow();}
        function scheduleCheckpoint(){
            if(!recoveryReady||recoveryRestoring||checkpointQueued)return;
            checkpointQueued=true;
            checkpointHandle=window.requestIdleCallback?requestIdleCallback(flushCheckpoint,{timeout:600}):setTimeout(flushCheckpoint,250);
        }
        addEventListener('pagehide',flushCheckpoint);
        document.addEventListener('visibilitychange',()=>{if(document.hidden)flushCheckpoint();});
        function cleanTeam(team){return {id:team.id,points:team.points,level:team.level,evolutionProgress:team.evolutionProgress,
            milestonesReached:[...team.milestonesReached],wheelMilestonesReached:[...team.wheelMilestonesReached],powerups:{...team.powerups},traits:[...team.traits],hasRelic:team.hasRelic,pendingEvolution:team.pendingEvolution?{...team.pendingEvolution}:null};}
        function checkpointNow(){
            if(!recoveryReady||recoveryRestoring||remoteRole!=='host')return false;
            // A wheel whose card is still unanswered is saved as not yet spun: after a reload it spins again and deals a new card.
            const active=activeAnimatedWheel&&(!activeWheelSpin?.settled||LeagueChallenge.active&&!LeagueChallenge.answered)?{...activeAnimatedWheel,...(activeWheelSpin?{rotation:currentWheelRotation}: {})}:null;
            const snapshot={sessionId,roomCode:activeRoomCode,teams:teamsData.map(cleanTeam),pointSliderValues:[...pointSliderValues],selectedPointTierIndex,progressionMode,performanceMode,
                selectedClass,studentContributions,secretAgents,rosterSnapshot:LeagueStudents.snapshot(),
                classMission:{...classMission},lastTeamClicked,comboCount,historyLog:historyLog.slice(0,120),historyStack:historyStack.slice(-20),
                wheels:[...(active?[active]:[]),...pendingAnimatedWheels],wheelMode:activeWheelMode,pendingFinish:pendingAnimatedFinish,
                deferredEvolutions:[...deferredAnimatedEvolutions],commandLedger,boardSummaries,vixarDefeatedThisSession,lastVortexTime,sessionNavigator,haloTeams,haloLocked,
                levelStarts:[...levelStarts],lastAwardStudent:[...lastAwardStudent],challengeLog,riftOpen,sagaSessionWin,
                unity:unityAscensionState?{wave:unityAscensionState.wave,totalGranted:unityAscensionState.totalGranted,teamPlans:[...unityAscensionState.teamPlans]}:null,
                scene:LeagueScenes.active,arenaResult:battleState&&!battleState.running?battleState.fighters.map(f=>({id:f.id,hp:f.hp,maxHP:f.maxHP,alive:f.alive,damageDealt:f.damageDealt,points:f.points,traits:f.traits,level:f.level})):null};
            const saved=LeagueRecovery.save(snapshot);
            if(!saved){const el=document.getElementById('recovery-save-status');el.hidden=false;el.textContent='Session recovery unavailable';}
            return saved;
        }
        function prepareHostSession(resume){
            recoveryRestoring=true;
            if(resume&&recoveryCandidate){
                const s=recoveryCandidate;
                sessionId=s.sessionId;commandLedger=Object.assign(Object.create(null),s.commandLedger||{});
                LeagueStudents.useRoster(s.rosterSnapshot || LeagueStudents.defaults());
                selectedClass=LeagueStudents.validClass(s.selectedClass)?s.selectedClass:null;
                studentContributions=LeagueStudents.restore(selectedClass,s.studentContributions);updateStudentSessionUI();
                secretAgents=LeagueAgent.restore(selectedClass,s.secretAgents);
                teamsData=teamsData.map(base=>{
                    const saved=s.teams.find(t=>t.id===base.id);
                    const traits=saved.traits.filter(id=>teamTraits[base.id].some(t=>t.id===id));
                    const pending=saved.pendingEvolution;
                    return {...base,...saved,name:base.name,color:base.color,traits,cachedSVG:'',
                        milestonesReached:Array.isArray(saved.milestonesReached)?saved.milestonesReached:[],
                        wheelMilestonesReached:Array.isArray(saved.wheelMilestonesReached)?saved.wheelMilestonesReached:[],
                        pendingEvolution:pending&&teamTraits[base.id].some(t=>t.id===pending.selectedTraitId)?pending:null};
                });
                Object.assign(classMission,s.classMission);pointSliderValues=s.pointSliderValues;selectedPointTierIndex=s.selectedPointTierIndex||0;
                syncParticipationMission({allowCompletion:false});
                progressionMode=s.progressionMode==='hard'?'hard':'soft';lastTeamClicked=s.lastTeamClicked||null;comboCount=Number(s.comboCount)||0;
                historyLog=Array.isArray(s.historyLog)?s.historyLog.slice(0,120):[];historyStack=Array.isArray(s.historyStack)?s.historyStack.filter(x=>typeof x==='string').slice(-20):[];
                pendingAnimatedWheels=Array.isArray(s.wheels)?s.wheels.filter(w=>teamsData.some(t=>t.id===w.teamId)&&SUBJECT_WHEEL_LEVELS.includes(w.stage)):[];
                (s.deferredEvolutions||[]).filter(id=>teamsData.some(t=>t.id===id)).forEach(id=>deferredAnimatedEvolutions.add(id));
                boardSummaries=s.boardSummaries||{};lastMatchSummaryPayload=boardSummaries.BATTLE_OUTCOME||boardSummaries.LEADERBOARD_FINAL||null;
                vixarDefeatedThisSession=Boolean(s.vixarDefeatedThisSession);lastVortexTime=s.lastVortexTime||0;
                sessionNavigator=s.sessionNavigator&&s.sessionNavigator.sessionId===s.sessionId&&typeof s.sessionNavigator.id==='string'&&typeof s.sessionNavigator.name==='string'?{...s.sessionNavigator}:null;
                haloTeams=Array.isArray(s.haloTeams)?teamsData.map(t=>t.id).filter(id=>s.haloTeams.includes(id)):[];haloLocked=Boolean(s.haloLocked);
                levelStarts=new Map(Array.isArray(s.levelStarts)?s.levelStarts.filter(e=>Array.isArray(e)&&typeof e[0]==='string'&&e[1]&&typeof e[1]==='object'):[]);
                lastAwardStudent=new Map(Array.isArray(s.lastAwardStudent)?s.lastAwardStudent.filter(e=>Array.isArray(e)&&teamsData.some(t=>t.id===e[0])&&typeof e[1]?.name==='string'):[]);
                challengeLog=Array.isArray(s.challengeLog)?s.challengeLog.slice(-200):[];
                // v11.0.0: a reload keeps the Rift as it was; a reload during a fight returns here with the Rift still open.
                riftOpen=s.riftOpen===true;
                sagaSessionWin=s.sagaSessionWin&&s.sagaSessionWin.sessionId===s.sessionId&&LeagueSaga.STAGES.includes(s.sagaSessionWin.from)?{...s.sagaSessionWin}:null;
                pendingAnimatedFinish=Boolean(s.pendingFinish);const restoredVisualMode=normalizeVisualMode(s.performanceMode);setPerformanceMode(VISUAL_MODES.includes(restoredVisualMode)?restoredVisualMode:'light',{persist:true});
                if(s.unity&&Array.isArray(s.unity.teamPlans)&&!classMission.rewardGranted)resumeUnityPlan={...s.unity,teamPlans:new Map(s.unity.teamPlans)};
                setWheelMode(s.wheelMode==='english'?'english':'all');
                teamsData.forEach(normalizeTeamRuntimeState);handlePointChange();updateProgressionModeUI();updateClassMissionUI();updateGameState(true);
                document.getElementById('undo-btn').disabled=!historyStack.length;
                addHistoryLog('Session restored. Earned points and rewards are preserved.','#7dd3fc');
            }
            recoveryRestoring=false;recoveryReady=true;
            queueMicrotask(()=>{
                if(resume&&secretAgents.reveal){LeagueAgent.renderReveal(secretAgents,selectedClass,teamsData,t=>getAvatarSVG(t.id,t.traits));LeagueScenes.enter('agent','reveal');}
                if(resume&&!classMission.completed)syncParticipationMission();
                if(resume&&classMission.completed&&!classMission.rewardGranted)requestUnityEvent(false);
                pumpPresentation();
                if(resume&&recoveryCandidate?.arenaResult?.length===4){
                    const highest=Math.max(...teamsData.map(t=>t.points));
                    battleState={running:true,fighters:teamsData.map(t=>({...buildBattleFighter(t,highest),...recoveryCandidate.arenaResult.find(f=>f.id===t.id),name:t.name,color:t.color}))};
                    if(!LeagueScenes.active){LeagueScenes.enter('arena','results');finishFinalBattle();}
                }
            });
        }
        function stopSceneSound(){stopBattleMusic(0);for(const source of sceneAudioSources){try{source.stop();}catch{}try{source.disconnect();}catch{}}sceneAudioSources.clear();}
        function abandonScenes(){
            LeagueIslandRun.dispose();
            pendingAnimatedFinish=false;presentationHeld=false;
            stopSceneSound();clearBattleTasks();battleState=null;clearVixarRaidTasks();vixarRaidState=null;
            LeagueMergeSpell.unmount();LeagueSagaScenes.stopEscape();LeagueSagaScenes.finale.stop(false);
            cancelUnityEvent({preserveCompletion:true,immediate:true});clearTimeout(unityEventQueueTimer);unityEventQueueTimer=null;
            clearEvolutionChestTimers();AnimatedMode.cancelAll();eventClock.clear();clearInterval(timerInterval);
            wheelClock.clear();wheelVisualAnimation?.cancel();wheelVisualAnimation=null;LeagueChallenge.dismiss();
            clearAllAvatarReactions();cancelAllScoreAnimations({settle:true});stopParticles();
            for(const name of ['arena','raid','unity','wheel','chest','evolution','results','agent','finale'])LeagueScenes.leave(name);
            document.getElementById('vortex-overlay').style.display='none';document.getElementById('event-banner').classList.remove('visible');
        }
        function holdPresentation(){presentationHeld=true;pendingAnimatedFinish=false;clearTimeout(unityEventQueueTimer);unityEventQueueTimer=null;stopSceneSound();updateSceneControls();}
        function exitArena(){holdPresentation();clearBattleTasks();battleState=null;currentEvent=null;LeagueScenes.leave('arena');updateGameState(true);}
        function finishChest(){SceneRuntime.fastForward('chest',()=>!isEvolving,6500);clearEvolutionChestTimers();LeagueScenes.leave('chest');}
        function exitResults(){globalThis.CreaturePoses?.stopResults();if(LeagueIslandRun.isOpen){LeagueIslandRun.close();return;}LeagueIslandRun.dispose();holdPresentation();LeagueScenes.leave('results');document.getElementById('winner-svg-container').replaceChildren();document.getElementById('league-winner-avatars').replaceChildren();document.getElementById('all-team-recognition-grid').replaceChildren();}
        LeagueScenes.register('wheel',{skip:requestWheelClose,cancel:()=>{holdPresentation();requestWheelClose();}});
        LeagueScenes.register('chest',{skip:finishChest,cancel:()=>{holdPresentation();finishChest();}});
        LeagueScenes.register('evolution',{skip:()=>{AnimatedMode.cancelAll();pumpPresentation();},cancel:()=>{holdPresentation();AnimatedMode.cancelAll();}});
        LeagueScenes.register('unity',{skip:()=>finishUnityEvent({skipped:true,replay:classMission.rewardGranted}),cancel:()=>{holdPresentation();finishUnityEvent({skipped:true,replay:classMission.rewardGranted});clearUnityEventTimers();resetUnityEventVisuals();updateGameState(true);}});
        LeagueScenes.register('arena',{skip:()=>{ArenaMotion.stop();stopSceneSound();SceneRuntime.fastForward('arena',()=>!battleState?.running,35000);},cancel:exitArena});
        LeagueScenes.register('raid',{skip:()=>{if(vixarRaidState?.completed){LeagueSagaScenes.skipEscape();return;}RaidMotion.stop();stopSceneSound();SceneRuntime.fastForward('raid',()=>Boolean(vixarRaidState?.completed),240000);},cancel:()=>{holdPresentation();closeVixarRaid({silent:true});}});
        LeagueScenes.register('finale',{skip:()=>LeagueSagaScenes.finale.skip(),cancel:()=>LeagueSagaScenes.finale.stop(true)});
        LeagueScenes.register('results',{skip:exitResults,cancel:exitResults});
        LeagueScenes.register('agent',{skip:continueAgentReveal,cancel:continueAgentReveal});
        LeagueAgent.mount(continueAgentReveal,()=>remoteCommands.enqueue('AGENT_CONTINUE'));
        for(const team of teamsData){
            const b=document.createElement('button');b.type='button';b.id=`mobile-agent-${team.id}`;
            b.className='mobile-agent-button agent-icon mobile-remote-action';b.innerHTML=LeagueAgent.icon;
            b.setAttribute('aria-label',`${team.name} Secret Agent`);b.onclick=()=>window.openRemoteAgent(team.id);
            const card=document.getElementById(`mobile-score-${team.id}`).closest('.mobile-team-card');
            card.querySelector('.mobile-team-header').insertBefore(b,card.querySelector('.mobile-team-reset'));
        }
        function applyRemoteCommand(data){
            const scene=LeagueScenes.active;
            const saga=applySagaCommand(data);if(saga)return saga;
            if(data.action==='AGENT_CONTINUE')return continueAgentReveal();
            if(scene==='agent')return {ok:false,message:'Continue the Secret Agent reveal first.'};
            if(data.action==='AGENT_BEGIN')return beginAgent(data.team);
            if(data.action==='AGENT_CANCEL'){if(secretAgents.request?.id===data.requestId)secretAgents.request=null;teamsData.forEach(t=>updateTeamDOM(t));return;}
            if(data.action==='AGENT_ASSIGN'){
                if(scene||data.className!==selectedClass)return {ok:false,message:'Return to the current class scoreboard first.'};
                const previous=JSON.parse(JSON.stringify(secretAgents));
                const result=LeagueAgent.assign(secretAgents,selectedClass,data.team,data.studentId,data.requestId);
                if(result.ok){
                    const assigned=secretAgents;secretAgents=previous;saveState();secretAgents=assigned;
                    const assignment=secretAgents.assignments[data.team],source=teamsData.find(t=>t.id===assignment.sourceTeam);
                    assignment.blocked=LeagueRules.absorbNegative(source);
                    teamsData.forEach(t=>updateTeamDOM(t));
                    if(assignment.blocked){
                        playAvatarReaction(source.id,'shield',{label:'Shield used'});
                        addHistoryLog(`${source.name}: Shield stopped an incoming effect and was consumed.`,'#7dd3fc');
                        result.message='Shield blocked this agent. No points will transfer.';
                    }
                    addHistoryLog(`${teamsData.find(t=>t.id===data.team).name} activated Secret Agent. Identity sealed until reveal.`,'#fbbf24');
                }
                return result;
            }
            if(data.action==='AGENT_REVEAL')return revealAgents(data.team);
            if(data.action==='RUN_OPTIONS'){const o=data.options;if(!o||typeof o!=='object'||Array.isArray(o))return {ok:false,message:'Unknown Island Run option'};
                const value={};if(typeof o.listening==='boolean')value.listening=o.listening;if(typeof o.pictures==='boolean')value.pictures=o.pictures;return LeagueIslandRun.setOptions(value);}
            if(data.action==='RUN_REPEAT')return LeagueIslandRun.repeatAudio();
            if(data.action==='RUN_NAVIGATOR')return LeagueIslandRun.nextNavigator();
            if(LeagueIslandRun.isOpen&&data.action==='SCENE_PAUSE')return LeagueIslandRun.togglePause();
            if(LeagueIslandRun.isOpen&&data.action==='SCENE_EXIT')return LeagueIslandRun.close();
            if(LeagueIslandRun.isOpen&&data.action==='SCENE_SKIP')return {ok:false,message:'Play Island Run with the controls on the board.'};
            if(data.action==='SCENE_PAUSE'){scene&&(LeagueScenes.paused?LeagueScenes.resume():LeagueScenes.pause());return {ok:Boolean(scene)};}
            if(data.action==='SCENE_SKIP'){LeagueScenes.skip();return {ok:Boolean(scene)};}
            if(data.action==='SCENE_EXIT'){LeagueScenes.cancel();return {ok:Boolean(scene)};}
            if(data.action==='SET_VISUAL_MODE'){const mode=normalizeVisualMode(data.mode);if(!VISUAL_MODES.includes(mode))return {ok:false,message:'Unknown visual mode'};window.selectPerformanceMode(mode);return;}
            if(data.action==='CHALLENGE'){if(!LeagueChallenge.active)return {ok:false,message:'No challenge card is open'};return LeagueChallenge.command(data);}
            if(data.action==='CLOSE_WHEEL'){if(scene!=='wheel')return {ok:false,message:'No wheel is open'};requestWheelClose();return;}
            if(['arena','raid','results','agent','finale'].includes(scene))return {ok:false,message:'Return to the scoreboard to change points'};
            if(data.action==='SET_CLASS')return setSessionClass(data.className);
            if(data.action==='FINISH_SESSION'){
                if(secretAgents.request)return {ok:false,message:'Choose or cancel the pending Secret Agent first.'};
                
                presentationHeld=false;document.getElementById('finish-btn').click();return;
            }
            if(['MISSION_ADD_ONE','MISSION_ADD_FIVE','MISSION_COMPLETE'].includes(data.action)){
                return {ok:false,message:'Mission advances automatically for each new student contributor. Refresh the remote for v8.5.1.'};
            }
            const team=teamsData.find(t=>t.id===data.team);if(!team)return {ok:false,message:'Unknown team'};
            if(data.action==='ADD'){
                if(!selectedClass || data.className!==selectedClass)return {ok:false,message:'Choose the current session class first'};
                if(!LeagueStudents.student(selectedClass,team.id,data.studentId))return {ok:false,message:'Choose a student from this team'};
                applyTeamAward(team.id,{remote:true,studentId:data.studentId});return;
            }
            if(data.action==='SUBTRACT'){saveState();const previous=team.points;team.points-=currentPointValue;addHistoryLog(`-${currentPointValue.toLocaleString()} from ${team.name} (via Remote)`,team.color);animateTeamScore(team.id,{fromValue:previous,targetValue:team.points,delta:-currentPointValue,modifiers:[]});updateGameState({teamId:team.id});return;}
            if(data.action==='RESET_TEAM'){
                if(scene)return {ok:false,message:'Wait for the current event before resetting a team'};
                resetTeamAction(team.id,{remote:true});return;
            }
            if(data.action==='OPEN_CHEST'){
                if(!team.pendingEvolution||scene)return {ok:false,message:'No available chest right now'};
                openEvolutionChest(team.id);return;
            }
            return {ok:false,message:'Unknown command'};
        }
        // v11.0.0 Vixar Saga commands from the phone: the Rift, Set stage, the Merge Spell and the Finale.
        const SAGA_ACTIONS=new Set(['MERGE_CHOOSE','MERGE_STUDENT','FINALE_NEXT','FINALE_VOICE','FINALE_REPLAY','RIFT_OPEN','RIFT_CLOSE','SAGA_SET','SET_PROGRESSION']);
        function applySagaCommand(data){
            if(!SAGA_ACTIONS.has(data.action))return null;
            const scene=LeagueScenes.active,c=sagaClass();
            if(data.action==='MERGE_CHOOSE')return vixarRaidState?.merge?chooseMergeOption(data.card,Number(data.index)):{ok:false,message:'No Merge Spell is open'};
            if(data.action==='MERGE_STUDENT')return vixarRaidState?.merge?chooseMergeStudent(data.studentId,data.turn):{ok:false,message:'No Merge Spell is open'};
            if(data.action==='FINALE_NEXT')return LeagueSagaScenes.finale.next();
            if(data.action==='FINALE_VOICE'){finaleVoice=data.on===true;return LeagueSagaScenes.finale.active?LeagueSagaScenes.finale.setVoice(finaleVoice):{ok:true,message:finaleVoice?'Voice on':'Voice off'};}
            if(data.action==='FINALE_REPLAY')return requestFinaleReplay(true);
            if(data.action==='RIFT_OPEN'){
                if(!c)return {ok:false,message:'Choose the class first'};
                const stage=LeagueSaga.stageOf(c);
                if(stage==='Freed')return {ok:false,message:'The curse is broken: use Replay the Finale'};
                if(sagaFoughtToday(c))return {ok:false,message:`${c} has fought today · open the Rift in a later session`};
                if(scene==='raid')return {ok:false,message:'A fight is running'};
                // Nothing changes on the board when the Rift opens, so the surprise is kept.
                riftOpen=true;updateVixarRaidAccess();scheduleCheckpoint();
                return {ok:true,message:'The Rift is open for this session'};
            }
            if(data.action==='RIFT_CLOSE'){
                if(vixarRaidState&&!vixarRaidState.completed)return {ok:false,message:'The fight has started'};
                riftOpen=false;updateVixarRaidAccess();scheduleCheckpoint();return {ok:true,message:'The Rift is closed'};
            }
            if(data.action==='SAGA_SET'){
                // The phone has logged this correction in Google Sheets with the Teacher PIN.
                if(!LeagueSaga.validClass(data.className)||!LeagueSaga.STAGES.includes(data.stage))return {ok:false,message:'Unknown stage'};
                if(scene==='raid'||scene==='finale')return {ok:false,message:'Return to the scoreboard first'};
                const result=LeagueSaga.setStage(data.className,data.stage,{note:data.note,at:Number(data.at)||Date.now()});
                if(sagaSessionWin?.className===data.className)sagaSessionWin=null;
                addHistoryLog(`Vixar Saga: ${data.className} set to ${data.stage} (teacher correction).`,'#94a3b8');
                updateGameState(true);updateVixarRaidAccess();scheduleCheckpoint();
                return {ok:result.ok,message:result.ok?`${data.className} is at ${data.stage}`:'Could not set the stage'};
            }
            if(data.action==='SET_PROGRESSION'){
                if(!['soft','hard'].includes(data.mode))return {ok:false,message:'Unknown mode'};
                if(scene)return {ok:false,message:'Return to the scoreboard first'};
                saveState();setProgressionMode(data.mode,{announce:true,convertExisting:true});return {ok:true,message:data.mode==='soft'?'Soft mode':'Hard mode'};
            }
            return null;
        }
        const controls=document.createElement('div');controls.id='scene-controls';controls.hidden=true;
        controls.innerHTML='<span class="scene-label"></span><button type="button" data-scene-control="pause">Pause</button><button type="button" data-scene-control="skip">Skip</button><button type="button" data-scene-control="exit">Exit</button>';
        document.body.appendChild(controls);
        controls.addEventListener('click',event=>{const action=event.target.dataset.sceneControl;if(action==='pause')LeagueScenes.paused?LeagueScenes.resume():LeagueScenes.pause();if(action==='skip')LeagueScenes.skip();if(action==='exit')LeagueScenes.cancel();});
        const continueButton=document.createElement('button');continueButton.id='continue-scenes';continueButton.type='button';continueButton.hidden=true;continueButton.textContent='Continue rewards';document.body.appendChild(continueButton);
        continueButton.addEventListener('click',()=>{presentationHeld=false;continueButton.hidden=true;if(classMission.completed&&!classMission.rewardGranted)requestUnityEvent(false);pumpPresentation();});
        const recoveryStatus=document.createElement('span');recoveryStatus.id='recovery-save-status';recoveryStatus.hidden=true;document.body.appendChild(recoveryStatus);
        const sceneNames={arena:'Arena',raid:'VIXAR',unity:'Unity',wheel:'Subject Wheel',chest:'Evolution',evolution:'Evolution',results:'Champions',agent:'Secret Agent',finale:'Finale'};
        function updateSceneControls(){
            const scene=LeagueScenes.active;controls.hidden=!scene||scene==='agent'||remoteRole==='controller'||LeagueIslandRun.isOpen;
            controls.querySelector('.scene-label').textContent=sceneNames[scene]||'';
            controls.querySelector('[data-scene-control=pause]').textContent=LeagueScenes.paused?'Resume':'Pause';
            controls.querySelector('[data-scene-control=pause]').hidden=scene==='results';controls.querySelector('[data-scene-control=skip]').hidden=scene==='results';
            continueButton.hidden=!presentationHeld||!(pendingAnimatedWheels.length||pendingAnimatedFinish||deferredAnimatedEvolutions.size||classMission.completed&&!classMission.rewardGranted);
            if(remoteRole==='host')window.syncStateToController();scheduleCheckpoint();
        }
        function updateRemoteSceneControls(scene,paused,runner=remoteIslandRun){
            remoteIslandRun={open:runner?.open===true,ready:runner?.ready===true,canPause:runner?.canPause===true,paused:runner?.paused===true,
                options:{listening:runner?.options?.listening!==false,pictures:runner?.options?.pictures===true},navigator:typeof runner?.navigator==='string'?runner.navigator:'',audio:runner?.audio===true,voice:typeof runner?.voice==='string'?runner.voice:''};
            remoteScene=scene||null;remoteScenePaused=Boolean(paused);
            const el=document.getElementById('mobile-scene-controls');el.hidden=!scene||scene==='agent';
            document.getElementById('mobile-controller').classList.toggle('remote-in-scene',Boolean(scene));
            document.getElementById('mobile-scene-name').textContent=remoteIslandRun.open?'Island Run':sceneNames[scene]||'';
            document.getElementById('remote-pause-btn').textContent=(remoteIslandRun.open?remoteIslandRun.paused:paused)?'Resume':'Pause';
            document.getElementById('remote-pause-btn').hidden=scene==='results'&&!(remoteIslandRun.open&&remoteIslandRun.canPause);
            document.getElementById('remote-exit-btn').textContent=remoteIslandRun.open?'Back to Champions':'Exit';
            document.getElementById('remote-skip-btn').hidden=scene==='results';
            const connected=remoteConnectionState==='connected';
            const combat=['arena','raid','results','agent','finale'].includes(scene);
            document.getElementById('mobile-class-btn').disabled=!connected||combat;
            if(combat){LeagueAgent.close();LeagueStudentUI.close(true);pendingRemoteClassSelection=null;}
            document.querySelectorAll('.mobile-score-button').forEach(button=>{button.disabled=!connected||combat;});
            document.querySelectorAll('.mobile-team-reset,.mobile-team-chest').forEach(button=>{button.disabled=!connected||Boolean(scene);});
            updateMobileClassMissionUI();updateMobileRecordAvailability();
            globalThis.LeagueRunRemote?.render(remoteIslandRun,connected);
        }
        globalThis.LeagueRunRemote?.configure({send:(action,extra)=>remoteCommands.enqueue(action,null,extra),control:sendRunControl});
        LeagueStudio.configure({getClass:()=>remoteRole==='controller'?remoteStudentClass:selectedClass});
        window.LeaguePassportSeals?.configure({getClass:()=>remoteRole==='controller'?remoteStudentClass:selectedClass});
        const studioButton=document.createElement('button');studioButton.type='button';studioButton.className='island-cloud-button';studioButton.textContent='Manage';studioButton.onclick=()=>LeagueStudio.open();document.getElementById('board-selected-class')?.closest('button')?.after(studioButton);
        // v10.0: School League Season panel on the Champions screen (board only). This session's wins are the
        // League title holder(s) and the Arena champion; the phone passes on the season totals it gets from Sheets.
        globalThis.LeagueSeason?.configure({session:()=>{
            if(remoteRole==='controller'||LeagueScenes.active!=='results'||!battleState?.fighters?.length||battleState.running)return null;
            const top=Math.max(...battleState.fighters.map(f=>f.points));
            return {sessionId,league:battleState.fighters.filter(f=>f.points===top).map(f=>f.id),arena:determineArenaWinner().id};
        }});
        // v10.2.0: the phone shows "×2" on the Comeback Halo teams and passes on a last result loaded from Sheets.
        function renderMobileHalo(){
            for(const id of LeagueStudents.teams){
                const card=document.getElementById(`mobile-score-${id}`)?.closest('.mobile-team-card');if(!card)continue;
                const on=remoteHaloTeams.includes(id);card.classList.toggle('halo-active',on);
                let chip=card.querySelector('.mobile-halo-chip');
                if(on&&!chip){chip=document.createElement('span');chip.className='mobile-halo-chip';chip.textContent='×2';chip.title='Comeback Halo: double points this session';card.append(chip);}
                else if(!on)chip?.remove();
            }
        }
        // v11.0.0: a row loaded or saved on this board refreshes the raid sigil, the cap and the phone.
        document.addEventListener('league-saga-change',()=>{if(remoteRole!=='controller'&&recoveryReady){updateVixarRaidAccess();window.syncStateToController?.();}});
        document.addEventListener('league-saga-loaded',()=>{if(remoteRole!=='controller'&&recoveryReady)updateGameState(true);});
        document.addEventListener('league-halo-result',event=>{
            const c=event.detail?.className;
            if(remoteRole==='controller'&&c&&c===remoteStudentClass)safeRemoteSend({type:'HALO_RESULT',sessionId:latestRemoteSessionId,className:c,result:LeagueHalo.result(c)});
        });
        document.addEventListener('league-season-change',()=>{
            if(remoteRole==='controller'&&globalThis.LeagueSeason?.data)safeRemoteSend({type:'LEAGUE_SEASON',sessionId:latestRemoteSessionId,season:LeagueSeason.data});
        });
        document.addEventListener('league-season-outdated',()=>{
            if(remoteRole==='controller')safeRemoteSend({type:'LEAGUE_SEASON',sessionId:latestRemoteSessionId,outdated:true});
        });
        LeagueRecap.configure(()=>({sessionId,className:selectedClass,house:battleState?.fighters?.length?determineArenaWinner().id:null,progress:LeagueIslandProgress.snapshot(selectedClass)}));
        document.addEventListener('teaching-content-change',event=>{
            const grade=event.detail.grade;LeagueIslandRun.applyTeaching(LeagueTeaching.catalog(grade));
            if(remoteRole==='controller'&&remoteStudentClass&&Number(remoteStudentClass[0])===grade)LeagueTeaching.send(safeRemoteSend,latestRemoteSessionId,grade);
            else if(remoteRole==='host'&&selectedClass&&Number(selectedClass[0])===grade)LeagueTeaching.send(safeRemoteSend,sessionId,grade);
        });
        LeagueIslandProgress.configure({loaded:(className,progress)=>{
            if(remoteRole==='controller')safeRemoteSend({type:'ISLAND_PROGRESS',sessionId:latestRemoteSessionId,className,progress});
            else window.syncStateToController?.();
        }});
        document.addEventListener('island-progress-change',event=>{
            const c=event.detail.className,progress=LeagueIslandProgress.snapshot(c);LeagueRecap.render();
            if(remoteRole==='controller'){
                for(const record of [cachedLeaderboardRecord,cachedBattleRecord])if(record?.className===c)record.islandProgress=progress;
                if(typeof persistMobileRecords==='function')persistMobileRecords();
                if(c===remoteStudentClass)safeRemoteSend({type:'ISLAND_PROGRESS',sessionId:latestRemoteSessionId,className:c,progress});
                const status=document.getElementById('mobile-record-ready-status');if(status&&cachedBattleRecord)status.textContent='Island progress updated · Save session to Google Sheets.';
            }else{
                LeagueIslandRun.applyProgress(progress);
                for(const record of Object.values(boardSummaries))if(record.className===c)record.islandProgress=progress;
                window.syncStateToController?.();scheduleCheckpoint();
            }
        });
        // v9.7.0: navigator seals follow the same paths as island progress: board ⇄ phone, phone → Google Sheets.
        document.addEventListener('navigator-seals-change',event=>{
            const c=event.detail.className;
            if(remoteRole==='controller'){if(c===remoteStudentClass)safeRemoteSend({type:'NAVIGATOR_SEALS',sessionId:latestRemoteSessionId,className:c,rows:LeagueNavigatorSeals.rows(c)});}
            else{window.syncStateToController?.();scheduleCheckpoint();}
        });
        LeagueIslandRun.configure({
            eligible:()=>remoteRole!=='controller'&&LeagueScenes.active==='results'&&Boolean(battleState&&!battleState.running),
            context:()=>{
                if(!battleState?.fighters?.length||battleState.running)return null;
                const winner=determineArenaWinner();
                const chosen=chooseSessionNavigator(winner),navigator=chosen?{id:chosen.id,name:chosen.name,team:chosen.team}:null;
                return {sessionId,className:selectedClass,house:winner.id,name:winner.name,level:winner.level,avatarMarkup:getAvatarSVG(winner.id,winner.traits,winner.level),navigator};
            },
            changed:()=>{updateSceneControls();LeagueRecap.render();},
            questionsChanged:()=>{window.syncStateToController?.();scheduleCheckpoint();},
            sealsChanged:()=>{window.syncStateToController?.();scheduleCheckpoint();}
        });
        const pausedAnimations=new Set();
        document.addEventListener('league-scene-change',()=>{if(['arena','raid','results','agent','finale'].includes(LeagueScenes.active)){LeagueStudentUI.close(true);LeagueStudentUI.clearCelebrations();}updateSceneControls();pumpPresentation();});
        document.addEventListener('league-pause-change',event=>{
            if(event.detail.paused){
                document.getAnimations?.().forEach(animation=>{if(animation.playState==='running'){pausedAnimations.add(animation);animation.pause();}});
                audioContext?.suspend().catch(()=>{});
            }else{
                for(const animation of pausedAnimations)if(animation.playState==='paused')animation.play();pausedAnimations.clear();
                if(audioContext?.state==='suspended')audioContext.resume().catch(()=>{});
                AnimatedMode.pump();pumpPresentation();
            }updateSceneControls();
        });
        document.addEventListener('league-budget-change',()=>{if(LeaguePerformance.level>=1)stopParticles();if(LeaguePerformance.level===2)removeElementalScenery();else if(!LeagueScenes.active&&performanceMode==='ultra')initializeElementalScenery();});
        document.addEventListener('click',scheduleCheckpoint);
        addEventListener('pagehide',checkpointNow);
        document.addEventListener('visibilitychange',()=>{if(document.hidden)checkpointNow();});
        if(recoveryCandidate){document.getElementById('recovery-card').hidden=false;document.getElementById('recovery-label').textContent='Previous session · '+new Date(recoveryCandidate.savedAt).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});}
        document.getElementById('resume-session-btn').addEventListener('click',()=>window.startHostMode({resume:true}));

        updateStudentSessionUI();

        // Readiness is descriptive. A successful credential check is not a network connectivity guarantee.
        const checks={browser:typeof RTCPeerConnection==='function'&&typeof Peer==='function'?'Remote features available':'Board available · remote unsupported',storage:LeagueRecovery.available()?'Session recovery ready':'Session recovery unavailable',art:'Checking avatar artwork…',audio:AudioContextClass?'Sound starts after a tap':'Sound unavailable',relay:'Remote relay not checked'};
        function showReadiness(){
            const host=document.getElementById('readiness-items');host.replaceChildren();for(const text of Object.values(checks)){const row=document.createElement('div');row.textContent=text;host.appendChild(row);}
            document.getElementById('readiness-label').textContent=hardwarePrefersLight?'Ready · Light mode recommended':'Ready · details';
        }
        showReadiness();
        const probeImage=new Image();probeImage.onload=()=>{checks.art='Avatar artwork ready';showReadiness();};probeImage.onerror=()=>{checks.art='Avatar artwork unavailable · Light mode available';showReadiness();};probeImage.src='./assets/animated/ravenclaw-0.webp?v=6.7';
        document.getElementById('check-relay-btn').addEventListener('click',async event=>{event.target.disabled=true;checks.relay='Checking relay credentials…';showReadiness();const result=await fetchTurnConfiguration();checks.relay=result.turnAvailable?'Relay credentials ready · test by pairing your phone':'Relay credentials unavailable · direct connection only';showReadiness();event.target.disabled=false;});
        document.addEventListener('pointerdown',()=>{checks.audio=audioContext?.state==='running'?'Sound enabled':'Tap the sound control to enable audio';showReadiness();},{once:true});

        const RECORD_KEY='englishLeague.records.v7';let mobileRecords=[];
        try{const saved=JSON.parse(localStorage.getItem(RECORD_KEY)||'[]');if(Array.isArray(saved))mobileRecords=saved.slice(-8);}catch{}
        function persistMobileRecords(){
            const entry={sessionId:latestRemoteSessionId,leaderboard:cachedLeaderboardRecord,battle:cachedBattleRecord};
            mobileRecords=mobileRecords.filter(x=>x.sessionId!==entry.sessionId);mobileRecords.push(entry);mobileRecords=mobileRecords.slice(-8);
            try{localStorage.setItem(RECORD_KEY,JSON.stringify(mobileRecords));}catch{}
        }
        const outboxHost=document.createElement('div');outboxHost.id='sheets-outbox';document.getElementById('mobile-save-status').after(outboxHost);
        function renderOutbox(){
            outboxHost.replaceChildren();
            for(const entry of LeagueOutbox.list().slice().reverse()){
                const row=document.createElement('div');row.className='outbox-row';const label=document.createElement('span');label.textContent=`${entry.payload.className}${entry.payload.type==='SAGA_SAVE'?' · Vixar Saga':''} · ${LeagueOutbox.labels[entry.state]}`;row.appendChild(label);
                if(entry.state!=='sending'){
                    const button=document.createElement('button');button.type='button';button.textContent=entry.state==='waiting'?'Send':'Retry';
                    button.addEventListener('click',async()=>{
                        const pin=document.getElementById('teacher-pin-input').value.trim()||globalThis.LeagueTeacher?.pin||'';if(!pin){document.getElementById('mobile-save-status').textContent='Enter your Teacher PIN to send this saved result.';return;}
                        if(!entry.payload.sessionId&&entry.state!=='waiting'&&!window.confirm('Check the Google Sheet first. Retry only if this lesson row is missing. Continue?'))return;
                        await LeagueOutbox.send(LeagueOutbox.find(entry.id),pin,{retry:true});document.getElementById('teacher-pin-input').value=globalThis.LeagueTeacher?.pin||'';
                        document.getElementById('mobile-save-status').textContent=LeagueOutbox.labels[LeagueOutbox.find(entry.id).state];
                    });row.appendChild(button);
                }outboxHost.appendChild(row);
            }
        }
        LeagueOutbox.configure('/api/session',renderOutbox);
        const savedButton=document.getElementById('open-saved-results-btn');savedButton.hidden=!mobileRecords.length&&!LeagueOutbox.list().length;
        savedButton.addEventListener('click',()=>{
            remoteRole='controller';recoveryReady=false;document.getElementById('startup-overlay').classList.add('hidden');document.querySelector('.app-shell').style.display='none';document.getElementById('mobile-controller').classList.remove('hidden');
            const entry=mobileRecords[mobileRecords.length-1];latestRemoteSessionId=entry?.sessionId||null;cachedLeaderboardRecord=entry?.leaderboard||null;cachedBattleRecord=entry?.battle||null;
            setRemoteConnectionStatus('offline');document.getElementById('mobile-save-modal').classList.remove('hidden');renderOutbox();
        });
        recoveryReady=false;

    });
