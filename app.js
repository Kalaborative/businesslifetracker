// Firework particle animation (mo.js) — edge bursts
const BURST_PALETTE = ['#e91e63', '#7c4dff', '#ff9800', '#4caf50', '#00bcd4', '#ffeb3b', '#ff5722'];
const EDGE_BURST_COUNT = 6;

// Pre-create reusable burst pools
const edgeBursts = [];
for (let i = 0; i < EDGE_BURST_COUNT; i++) {
  edgeBursts.push({
    outer: new mojs.Burst({
      left: 0, top: 0,
      radius:   { 0: 160 },
      count:    8,
      children: {
        shape:    'circle',
        fill:     BURST_PALETTE,
        radius:   { 12: 0 },
        scale:    { 1: 0 },
        duration: 1500,
        easing:   'expo.out',
        opacity:  { 1: 0 },
      }
    }),
    inner: new mojs.Burst({
      left: 0, top: 0,
      radius:   { 0: 90 },
      count:    5,
      children: {
        shape:    'circle',
        fill:     BURST_PALETTE,
        radius:   { 10: 0 },
        scale:    { 1: 0 },
        duration: 1300,
        easing:   'quad.out',
      }
    }),
  });
}

function getEdgePoint(rect) {
  // Pick a random point along the perimeter of the button
  const perim = 2 * (rect.width + rect.height);
  let d = Math.random() * perim;
  if (d < rect.width) {
    return { x: rect.left + d, y: rect.top };                    // top edge
  }
  d -= rect.width;
  if (d < rect.height) {
    return { x: rect.right, y: rect.top + d };                   // right edge
  }
  d -= rect.height;
  if (d < rect.width) {
    return { x: rect.right - d, y: rect.bottom };                // bottom edge
  }
  d -= rect.width;
  return { x: rect.left, y: rect.top + (rect.height - d) };     // left edge
}

function spawnFirework(button) {
  const rect = button.getBoundingClientRect();
  document.body.style.overflow = 'hidden';
  const totalDuration = (EDGE_BURST_COUNT - 1) * 100 + 1500;
  for (let i = 0; i < EDGE_BURST_COUNT; i++) {
    const pt = getEdgePoint(rect);
    const b = edgeBursts[i];
    setTimeout(() => {
      b.outer.tune({ x: pt.x, y: pt.y }).generate().replay();
      b.inner.tune({ x: pt.x, y: pt.y }).generate().replay();
    }, i * 100);
  }
  setTimeout(() => { document.body.style.overflow = ''; }, totalDuration);
}

// Asset data
const tiers = [
  { levels: "1~3",   guarantee: 5,    probability: 50.00,  catItem: "Skateboard",         wolfItem: "Ticket Stubs",        netWorthPercent: 1 },
  { levels: "4~6",   guarantee: 10,   probability: 50.00,  catItem: "Bike",               wolfItem: "Lighter",             netWorthPercent: 2 },
  { levels: "7~9",   guarantee: 20,   probability: 10.00,  catItem: "Road Bike",          wolfItem: "Cups",                netWorthPercent: 3 },
  { levels: "10~12", guarantee: 25,   probability: 9.00,   catItem: "E-Bike",             wolfItem: "Jade Pot",            netWorthPercent: 4 },
  { levels: "13~15", guarantee: 40,   probability: 5.00,   catItem: "E-Motorcycle",       wolfItem: "Cellared Red Wine",   netWorthPercent: 5 },
  { levels: "16~18", guarantee: 80,   probability: 3.50,  catItem: "Motorcycle",         wolfItem: "Vintage Camera",      netWorthPercent: 5 },
  { levels: "19~21", guarantee: 120,  probability: 2.30,  catItem: "Racing-Motorcycle",  wolfItem: "Vintage Typewriter",  netWorthPercent: 5 },
  { levels: "22~24", guarantee: 150,  probability: 1.80,  catItem: "Sedan",              wolfItem: "Phonograph",          netWorthPercent: 5 },
  { levels: "25~27", guarantee: 180,  probability: 1.50,  catItem: "Convertible",        wolfItem: "Royal Badge (Silver)",netWorthPercent: 6 },
  { levels: "28~30", guarantee: 210,  probability: 1.20,  catItem: "Racing Car",         wolfItem: "Royal Badge (Gold)",   netWorthPercent: 6 },
  { levels: "31~33", guarantee: 250,  probability: 0.70,  catItem: "Balloon Yacht",      wolfItem: "Silver Scale",        netWorthPercent: 6 },
  { levels: "34~36", guarantee: 290,  probability: 0.60,  catItem: "Ship",               wolfItem: "Gilded Clock",        netWorthPercent: 6 },
  { levels: "37~39", guarantee: 330,  probability: 0.40,  catItem: "Sea Train",          wolfItem: "Beethoven Manuscript",netWorthPercent: 7 },
  { levels: "40~42", guarantee: 370,  probability: 0.35,  catItem: "Private Jet",        wolfItem: "Famous Painting",     netWorthPercent: 7 },
  { levels: "43~45", guarantee: 420,  probability: 0.30,  catItem: "Fight Aircraft",     wolfItem: "Royal Harp",           netWorthPercent: 8 },
  { levels: "46~48", guarantee: 470,  probability: 0.27,  catItem: "Fantasy Airship",    wolfItem: "Royal Piano",         netWorthPercent: 8 },
  { levels: "49~51", guarantee: 800,  probability: 0.20,  catItem: "Rocket",             wolfItem: "Crown",               netWorthPercent: 9 },
  { levels: "52~54", guarantee: 1200, probability: 0.15,  catItem: "UFO",                wolfItem: "Alien Civilization Relic",netWorthPercent: 10 },
];

const GOLD_PER_GIFT = 300;

// State
let startTierIndex = -1;
let goalTierIndex = -1;
let catCounts = [];
let wolfCounts = [];
let totalGoldMax = 0;
let currentGoldSpent = 0; // total gifts sent * 300
let showAllAssets = false;
let inputCurrentLevel = 0;
let inputGoalLevel = 0;
let catGot = [];     // boolean per tier — true if asset obtained
let wolfGot = [];    // boolean per tier — true if asset obtained
let catSkipped = []; // boolean per tier — true if asset skipped
let wolfSkipped = [];
let goldRushActive = false;

// Elements
const currentLevelInput = document.getElementById('currentLevel');
const goalSelect = document.getElementById('goalLevel');
const goldPreview = document.getElementById('goldPreview');
const startBtn = document.getElementById('startBtn');
const backBtn = document.getElementById('backBtn');
const onboarding = document.getElementById('onboarding');
const tracker = document.getElementById('tracker');
const trackerTitle = document.getElementById('trackerTitle');
const goldRemainingEl = document.getElementById('goldRemaining');
const catAssetsEl = document.getElementById('catAssets');
const wolfAssetsEl = document.getElementById('wolfAssets');

const toggleViewBtn = document.getElementById('toggleViewBtn');
const goldRushBtn = document.getElementById('goldRushBtn');
const currentLevelHint = document.getElementById('currentLevelHint');
const levelHint = document.getElementById('levelHint');
const netWorthIncreaseEl = document.getElementById('netWorthIncrease');

// Find which tier index a given level falls into
function getTierIndex(level) {
  for (let i = 0; i < tiers.length; i++) {
    const parts = tiers[i].levels.split('~');
    const lo = parseInt(parts[0]);
    const hi = parseInt(parts[1]);
    if (level >= lo && level <= hi) return i;
  }
  return -1;
}

function init() {
  currentLevelInput.addEventListener('input', onLevelChange);
  goalSelect.addEventListener('input', onLevelChange);
  startBtn.addEventListener('click', onStart);
  backBtn.addEventListener('click', onBack);
  toggleViewBtn.addEventListener('click', onToggleView);
  goldRushBtn.addEventListener('click', onGoldRushToggle);

  // Try to load saved state
  loadState();
}

function onGoldRushToggle() {
  goldRushActive = !goldRushActive;
  goldRushBtn.classList.toggle('active', goldRushActive);
  goldRushBtn.textContent = goldRushActive ? 'Gold Rush ON' : 'Gold Rush';
  // Re-render assets to show updated probabilities
  if (startTierIndex !== -1 && goalTierIndex !== -1) {
    renderAssets();
  }
}

function calcMaxGold(fromTier, toTier) {
  let sum = 0;
  for (let i = fromTier; i <= toTier; i++) {
    sum += tiers[i].guarantee;
  }
  return sum * GOLD_PER_GIFT * 2; // x2 for cat and wolf
}

function onLevelChange() {
  const curLevel = parseInt(currentLevelInput.value);
  const goalLevel = parseInt(goalSelect.value);

  // Update current level hint
  if (!isNaN(curLevel) && curLevel >= 1 && curLevel <= 54) {
    const curIdx = getTierIndex(curLevel);
    if (curIdx !== -1) {
      currentLevelHint.textContent = `Falls in range ${tiers[curIdx].levels}`;
    }
  } else {
    currentLevelHint.textContent = '';
  }

  // Update goal level hint
  if (!isNaN(goalLevel) && goalLevel >= 1 && goalLevel <= 54) {
    const goalIdx = getTierIndex(goalLevel);
    if (goalIdx !== -1) {
      levelHint.textContent = `Falls in range ${tiers[goalIdx].levels}`;
    }
  } else {
    levelHint.textContent = '';
  }

  // Update gold preview only when both are valid
  if (isNaN(curLevel) || curLevel < 1 || curLevel > 54 ||
      isNaN(goalLevel) || goalLevel < 1 || goalLevel > 54) {
    goldPreview.innerHTML = '<span>Select levels to see the gold needed</span>';
    return;
  }

  if (curLevel > goalLevel) {
    goldPreview.innerHTML = '<span>Current level must be less than or equal to target level</span>';
    return;
  }

  const fromIdx = getTierIndex(curLevel);
  const toIdx = getTierIndex(goalLevel);
  if (fromIdx === -1 || toIdx === -1) return;

  const tierCount = toIdx - fromIdx + 1;
  const gold = calcMaxGold(fromIdx, toIdx);
  const fromLvl = tiers[fromIdx].levels.split('~')[0];
  const toLvl = tiers[toIdx].levels.split('~')[1];
  goldPreview.innerHTML = `
    <span>Max gold for Lv.${fromLvl}\u2013${toLvl} (${tierCount} tier${tierCount > 1 ? 's' : ''}):</span>
    <span class="gold-amount">${gold.toLocaleString()} Gold</span>
  `;
}

function onStart() {
  const curLevel = parseInt(currentLevelInput.value);
  const goalLevel = parseInt(goalSelect.value);
  if (isNaN(curLevel) || curLevel < 1 || curLevel > 54) {
    alert('Please enter a valid current level between 1 and 54!');
    return;
  }
  if (isNaN(goalLevel) || goalLevel < 1 || goalLevel > 54) {
    alert('Please enter a valid target level between 1 and 54!');
    return;
  }
  if (curLevel > goalLevel) {
    alert('Current level must be less than or equal to target level!');
    return;
  }
  const fromIdx = getTierIndex(curLevel);
  const toIdx = getTierIndex(goalLevel);
  if (fromIdx === -1 || toIdx === -1) return;

  startTierIndex = fromIdx;
  goalTierIndex = toIdx;
  inputCurrentLevel = curLevel;
  inputGoalLevel = goalLevel;
  totalGoldMax = calcMaxGold(startTierIndex, goalTierIndex);
  catCounts = new Array(tiers.length).fill(0);
  wolfCounts = new Array(tiers.length).fill(0);
  catGot = new Array(tiers.length).fill(false);
  wolfGot = new Array(tiers.length).fill(false);
  catSkipped = new Array(tiers.length).fill(false);
  wolfSkipped = new Array(tiers.length).fill(false);
  currentGoldSpent = 0;
  showAllAssets = false;
  toggleViewBtn.textContent = 'Show All';
  toggleViewBtn.classList.remove('active');

  showTracker();
  saveState();
}

function onBack() {
  // Clear saved state
  localStorage.removeItem('bl_tracker_state');
  tracker.style.display = 'none';
  onboarding.style.display = 'flex';
}

function showTracker() {
  onboarding.style.display = 'none';
  tracker.style.display = 'block';

  trackerTitle.textContent = `Tracking Level ${inputCurrentLevel} to ${inputGoalLevel}`;

  renderAssets();
  updateGold();
  updateNetWorth();
}

function getCurrentTier() {
  // Find the first tier where either cat or wolf is neither obtained nor skipped
  for (let i = startTierIndex; i <= goalTierIndex; i++) {
    const catDone = catGot[i] || catSkipped[i];
    const wolfDone = wolfGot[i] || wolfSkipped[i];
    if (!catDone || !wolfDone) return i;
  }
  // All resolved — show the last tier
  return goalTierIndex;
}

function onToggleView() {
  showAllAssets = !showAllAssets;
  toggleViewBtn.textContent = showAllAssets ? 'Show Current' : 'Show All';
  toggleViewBtn.classList.toggle('active', showAllAssets);
  applyVisibility();
}

let previousActiveTier = -1;

function applyVisibility() {
  const activeTier = getCurrentTier();
  
  // Detect tier transition
  const tierChanged = previousActiveTier !== -1 && previousActiveTier !== activeTier;
  
  for (let i = startTierIndex; i <= goalTierIndex; i++) {
    const catRow = document.getElementById(`row-cat-${i}`);
    const wolfRow = document.getElementById(`row-wolf-${i}`);
    const visible = showAllAssets || i === activeTier;
    
    if (catRow && wolfRow) {
      const wasVisible = !catRow.classList.contains('hidden-row');
      
      if (visible) {
        catRow.classList.remove('hidden-row', 'exiting');
        wolfRow.classList.remove('hidden-row', 'exiting');
        
        // Add entering animation when transitioning to a new tier
        if (tierChanged && i === activeTier) {
          catRow.classList.add('entering');
          wolfRow.classList.add('entering');
          
          // Add pulse highlight after entering animation completes
          setTimeout(() => {
            catRow.classList.remove('entering');
            wolfRow.classList.remove('entering');
            catRow.classList.add('current-tier');
            wolfRow.classList.add('current-tier');
            
            // Remove pulse class after animation
            setTimeout(() => {
              catRow.classList.remove('current-tier');
              wolfRow.classList.remove('current-tier');
            }, 600);
          }, 500);
        }
      } else if (wasVisible && tierChanged) {
        // Add exiting animation when hiding previous tier
        catRow.classList.add('exiting');
        wolfRow.classList.add('exiting');
        
        // Hide after animation completes
        setTimeout(() => {
          catRow.classList.add('hidden-row');
          catRow.classList.remove('exiting');
          wolfRow.classList.add('hidden-row');
          wolfRow.classList.remove('exiting');
        }, 400);
      } else if (!visible) {
        catRow.classList.add('hidden-row');
        wolfRow.classList.add('hidden-row');
      }
    }
  }
  
  previousActiveTier = activeTier;
}

function renderAssets() {
  catAssetsEl.innerHTML = '';
  wolfAssetsEl.innerHTML = '';

  for (let i = startTierIndex; i <= goalTierIndex; i++) {
    catAssetsEl.appendChild(createAssetRow('cat', i));
    wolfAssetsEl.appendChild(createAssetRow('wolf', i));
  }
  applyVisibility();
}

function isTierLocked(tierIdx) {
  const catDone = catGot[tierIdx] || catSkipped[tierIdx];
  const wolfDone = wolfGot[tierIdx] || wolfSkipped[tierIdx];
  return catDone && wolfDone;
}

function createAssetRow(type, tierIdx) {
  const tier = tiers[tierIdx];
  const counts = type === 'cat' ? catCounts : wolfCounts;
  const gotArr = type === 'cat' ? catGot : wolfGot;
  const skipArr = type === 'cat' ? catSkipped : wolfSkipped;
  const count = counts[tierIdx];
  const guarantee = tier.guarantee;
  const itemName = type === 'cat' ? tier.catItem : tier.wolfItem;
  const obtained = gotArr[tierIdx];
  const skipped = skipArr[tierIdx];
  const resolved = obtained || skipped;
  const locked = isTierLocked(tierIdx);

  const experimentalProb = ((count / guarantee) * 100).toFixed(2);
  
  // Calculate theoretical probability with Gold Rush bonus (20% increase)
  const goldRushMultiplier = goldRushActive ? 1.2 : 1;
  const displayProbability = (tier.probability * goldRushMultiplier).toFixed(2);

  const row = document.createElement('div');
  row.className = 'asset-row' + (obtained ? ' completed' : '') + (skipped ? ' skipped' : '') + (goldRushActive ? ' gold-rush' : '');
  row.id = `row-${type}-${tierIdx}`;

  row.innerHTML = `
    <div class="asset-info">
      <div class="asset-name">${itemName}</div>
      <div class="asset-level">Lv. ${tier.levels}</div>
      <div class="asset-prob">
        Theoretical: ${displayProbability}% ${goldRushActive ? '<span class="gold-rush-badge">+20%</span>' : ''} &nbsp;|&nbsp;
        Experimental: <span class="exp-prob">${experimentalProb}%</span>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" style="width: ${Math.min(100, (count / guarantee) * 100)}%"></div>
      </div>
    </div>
    <div class="asset-counter">
      <button class="counter-btn minus minus-10" data-type="${type}" data-tier="${tierIdx}" data-amount="10" ${count < 10 || resolved ? 'disabled' : ''}>-10</button>
      <button class="counter-btn minus minus-3" data-type="${type}" data-tier="${tierIdx}" data-amount="3" ${count < 3 || resolved ? 'disabled' : ''}>-3</button>
      <button class="counter-btn minus minus-1" data-type="${type}" data-tier="${tierIdx}" data-amount="1" ${count <= 0 || resolved ? 'disabled' : ''}>-</button>
      <div class="count-display">
        ${count}<br><span class="of-total">/ ${guarantee}</span>
      </div>
      <button class="counter-btn plus plus-1" data-type="${type}" data-tier="${tierIdx}" data-amount="1" ${resolved || count + 1 > guarantee ? 'disabled' : ''}>+</button>
      <button class="counter-btn plus plus-3" data-type="${type}" data-tier="${tierIdx}" data-amount="3" ${resolved || count + 3 > guarantee ? 'disabled' : ''}>+3</button>
      <button class="counter-btn plus plus-10" data-type="${type}" data-tier="${tierIdx}" data-amount="10" ${resolved || count + 10 > guarantee ? 'disabled' : ''}>+10</button>
    </div>
    <button class="got-btn ${obtained ? 'obtained' : ''} ${obtained && locked ? 'locked' : ''}" ${skipped ? 'style="display:none"' : ''}>
      <span class="got-icon">&#10003;</span>
      ${obtained ? 'Obtained' : 'Got It!'}
    </button>
    <button class="skip-btn ${skipped ? 'skipped' : ''} ${skipped && locked ? 'locked' : ''}" ${obtained ? 'style="display:none"' : ''}>
      <span class="skip-icon">&#10140;</span>
      ${skipped ? 'Skipped' : 'Skip'}
    </button>
  `;

  // Bind events
  const gotBtn = row.querySelector('.got-btn');
  const skipBtn = row.querySelector('.skip-btn');

  row.querySelectorAll('.counter-btn.minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseInt(btn.dataset.amount);
      if (counts[tierIdx] > 0 && !gotArr[tierIdx] && !skipArr[tierIdx]) {
        const actual = Math.min(amount, counts[tierIdx]);
        counts[tierIdx] -= actual;
        currentGoldSpent -= GOLD_PER_GIFT * actual;
        refreshRow(type, tierIdx);
        updateGold();
        updateNetWorth();
        saveState();
      }
    });
  });

  row.querySelectorAll('.counter-btn.plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseInt(btn.dataset.amount);
      if (!gotArr[tierIdx] && !skipArr[tierIdx]) {
        counts[tierIdx] += amount;
        currentGoldSpent += GOLD_PER_GIFT * amount;
        if (counts[tierIdx] >= guarantee) {
          gotArr[tierIdx] = true;
          spawnFirework(row.querySelector('.got-btn'));
          refreshRow(type === 'cat' ? 'wolf' : 'cat', tierIdx);
        }
        refreshRow(type, tierIdx);
        updateGold();
        updateNetWorth();
        saveState();
      }
    });
  });

  gotBtn.addEventListener('click', () => {
    if (skipArr[tierIdx]) return;
    if (obtained && !isTierLocked(tierIdx)) {
      // Undo — only if the tier hasn't been fully resolved
      gotArr[tierIdx] = false;
      refreshRow(type, tierIdx);
      updateNetWorth();
      saveState();
    } else if (!obtained) {
      gotArr[tierIdx] = true;
      spawnFirework(gotBtn);
      refreshRow(type, tierIdx);
      // Also refresh the other side so it picks up locked state
      refreshRow(type === 'cat' ? 'wolf' : 'cat', tierIdx);
      updateNetWorth();
      saveState();
    }
  });

  skipBtn.addEventListener('click', () => {
    if (gotArr[tierIdx]) return;
    if (skipped && !isTierLocked(tierIdx)) {
      // Undo
      skipArr[tierIdx] = false;
      refreshRow(type, tierIdx);
      updateNetWorth();
      saveState();
    } else if (!skipped) {
      skipArr[tierIdx] = true;
      refreshRow(type, tierIdx);
      // Also refresh the other side so it picks up locked state
      refreshRow(type === 'cat' ? 'wolf' : 'cat', tierIdx);
      updateNetWorth();
      saveState();
    }
  });

  return row;
}

function refreshRow(type, tierIdx) {
  const container = type === 'cat' ? catAssetsEl : wolfAssetsEl;
  const oldRow = document.getElementById(`row-${type}-${tierIdx}`);
  const newRow = createAssetRow(type, tierIdx);
  container.replaceChild(newRow, oldRow);
  applyVisibility();
}

function updateGold() {
  const remaining = totalGoldMax - currentGoldSpent;
  goldRemainingEl.innerHTML = '<span class="coin">&#x1FA99;</span> ' + remaining.toLocaleString() + ' Gold';
}

function updateNetWorth() {
  let totalNetWorth = 0;
  
  // Calculate net worth for each tier where assets are obtained
  for (let i = startTierIndex; i <= goalTierIndex; i++) {
    const catObtained = catGot[i];
    const wolfObtained = wolfGot[i];
    const netWorthPercent = tiers[i].netWorthPercent;
    
    // Add percentage for each obtained asset (cat and wolf)
    if (catObtained) {
      totalNetWorth += netWorthPercent;
    }
    if (wolfObtained) {
      totalNetWorth += netWorthPercent;
    }
  }
  
  netWorthIncreaseEl.textContent = '+' + totalNetWorth + '%';
}

// Persistence
function saveState() {
  const state = {
    startTierIndex,
    goalTierIndex,
    inputCurrentLevel,
    inputGoalLevel,
    catCounts,
    wolfCounts,
    catGot,
    wolfGot,
    catSkipped,
    wolfSkipped,
    totalGoldMax,
    currentGoldSpent
  };
  localStorage.setItem('bl_tracker_state', JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem('bl_tracker_state');
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    startTierIndex = state.startTierIndex ?? 0;
    goalTierIndex = state.goalTierIndex;
    inputCurrentLevel = state.inputCurrentLevel ?? parseInt(tiers[startTierIndex].levels.split('~')[0]);
    inputGoalLevel = state.inputGoalLevel ?? parseInt(tiers[goalTierIndex].levels.split('~')[1]);
    catCounts = state.catCounts;
    wolfCounts = state.wolfCounts;
    catGot = state.catGot ?? new Array(tiers.length).fill(false);
    wolfGot = state.wolfGot ?? new Array(tiers.length).fill(false);
    catSkipped = state.catSkipped ?? new Array(tiers.length).fill(false);
    wolfSkipped = state.wolfSkipped ?? new Array(tiers.length).fill(false);
    totalGoldMax = state.totalGoldMax;
    currentGoldSpent = state.currentGoldSpent;
    currentLevelInput.value = inputCurrentLevel;
    goalSelect.value = inputGoalLevel;
    onLevelChange();
    showTracker();
  } catch (e) {
    // ignore corrupt state
  }
}

init();
