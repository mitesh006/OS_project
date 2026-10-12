/**
 * Menu UI
 * Manages main menu, level select, settings, and learn modals.
 */
'use strict';

const MenuUI = (() => {
  function init() {
    bindMainMenu();
    bindModals();
    buildLearnContent();
  }

  function bindMainMenu() {
    document.getElementById('btn-start-game').addEventListener('click', () => {
      ScreenManager.show('level-select');
      buildLevelGrid();
    });

    document.getElementById('btn-how-to-play').addEventListener('click', () => {
      document.getElementById('modal-how-to-play').style.display = 'flex';
    });

    document.getElementById('btn-learn').addEventListener('click', () => {
      document.getElementById('modal-learn').style.display = 'flex';
    });

    document.getElementById('btn-leaderboard').addEventListener('click', () => {
      renderLeaderboard();
      document.getElementById('modal-leaderboard').style.display = 'flex';
    });

    document.getElementById('btn-demo').addEventListener('click', () => {
      startDemo();
    });

    document.getElementById('btn-settings').addEventListener('click', () => {
      openSettings();
      document.getElementById('modal-settings').style.display = 'flex';
    });

    document.getElementById('btn-back-menu').addEventListener('click', () => {
      ScreenManager.show('menu');
    });
  }

  function bindModals() {
    // How To Play
    document.getElementById('btn-close-htp').addEventListener('click', () => {
      document.getElementById('modal-how-to-play').style.display = 'none';
    });

    // Learn
    document.getElementById('btn-close-learn').addEventListener('click', () => {
      document.getElementById('modal-learn').style.display = 'none';
    });

    // Settings
    document.getElementById('btn-close-settings').addEventListener('click', () => {
      document.getElementById('modal-settings').style.display = 'none';
    });

    document.getElementById('btn-close-leaderboard').addEventListener('click', () => {
      document.getElementById('modal-leaderboard').style.display = 'none';
    });

    document.getElementById('btn-reset-progress').addEventListener('click', () => {
      if (confirm('Reset ALL progress? This cannot be undone.')) {
        PlayerSystem.reset();
        document.getElementById('modal-settings').style.display = 'none';
        ScreenManager.show('menu');
      }
    });

    document.getElementById('toggle-sound').addEventListener('click', (e) => {
      const state = PlayerSystem.getState();
      const newVal = !state.soundEnabled;
      PlayerSystem.setSoundEnabled(newVal);
      AudioSystem.setMuted(!newVal);
      e.target.textContent = newVal ? 'ON' : 'OFF';
      e.target.classList.toggle('off', !newVal);
    });

    document.getElementById('toggle-hints').addEventListener('click', (e) => {
      const state = PlayerSystem.getState();
      const newVal = !state.hintsEnabled;
      PlayerSystem.setHintsEnabled(newVal);
      e.target.textContent = newVal ? 'ON' : 'OFF';
      e.target.classList.toggle('off', !newVal);
    });

    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.style.display = 'none';
      });
    });
  }

  function openSettings() {
    const state = PlayerSystem.getState();
    const soundBtn = document.getElementById('toggle-sound');
    const hintsBtn = document.getElementById('toggle-hints');
    soundBtn.textContent = state.soundEnabled ? 'ON' : 'OFF';
    soundBtn.classList.toggle('off', !state.soundEnabled);
    hintsBtn.textContent = state.hintsEnabled ? 'ON' : 'OFF';
    hintsBtn.classList.toggle('off', !state.hintsEnabled);
  }

  function renderLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    const highScore = document.getElementById('leaderboard-high-score');
    if (!list || !highScore) return;

    const entries = PlayerSystem.getLeaderboard();
    const state = PlayerSystem.getState();
    const high = state.highScore || 0;
    highScore.textContent = high.toString();

    if (!entries.length) {
      list.innerHTML = '<li>No runs recorded yet. Defeat a boss to set the leaderboard.</li>';
      return;
    }

    list.innerHTML = entries.map((entry, index) => `
      <li>
        <span>#${index + 1} — ${entry.boss} (${entry.level})</span>
        <strong>${entry.score}</strong>
        <span style="color:var(--text-muted);">Rank ${entry.rank}</span>
      </li>
    `).join('');
  }

  // ── Level Grid ───────────────────────────────── 
  function buildLevelGrid() {
    const grid = document.getElementById('level-grid');
    grid.innerHTML = '';

    const playerState = PlayerSystem.getState();
    document.getElementById('ls-player-hp').textContent = `HP: ${playerState.maxHp}`;
    document.getElementById('ls-player-score').textContent = `SCORE: ${playerState.score || 0}`;

    const levels = Progression.getUnlockedLevels();
    levels.forEach(lv => {
      const card = buildBossCard(lv);
      grid.appendChild(card);
    });
  }

  function buildBossCard(levelInfo) {
    const { levelNum, unlocked, completed, bestRank, config, bossData } = levelInfo;

    const card = document.createElement('div');
    card.className = 'boss-card';
    if (!unlocked) card.classList.add('locked');
    if (completed) card.classList.add('completed');

    card.style.setProperty('--boss-card-color', bossData.color);
    card.style.setProperty('--boss-card-gradient', bossData.gradient);

    // Difficulty pips
    const pips = Array.from({ length: 5 }, (_, i) => {
      const pip = document.createElement('div');
      pip.className = 'diff-pip' + (i < bossData.difficulty ? ' active' : '');
      return pip;
    });

    card.innerHTML = `
      <div class="boss-card-header">
        <div class="boss-card-icon" style="background:${bossData.gradient};border-color:${bossData.color}20;">
          <span style="filter:drop-shadow(0 0 8px ${bossData.color})">${bossData.emoji}</span>
        </div>
        <div class="boss-card-info">
          <div class="boss-card-level">${config.levelName} ${unlocked ? '' : '🔒'}</div>
          <div class="boss-card-name" style="color:${bossData.color}">${bossData.name}</div>
          <div class="boss-card-algo">${bossData.title}</div>
        </div>
      </div>
      <div class="boss-card-desc">${bossData.personality}</div>
      <div class="boss-card-stats">
        <div class="boss-stat">HP: <span>${config.bossHP}</span></div>
        <div class="boss-stat">Timer: <span>${config.decisionTime}s</span></div>
        <div class="boss-stat">Procs: <span>${config.processes}</span></div>
        <div class="boss-stat">Hints: <span>${config.hintsAllowed}</span></div>
      </div>
      <div class="boss-card-difficulty">
        ${pips.map(p => p.outerHTML).join('')}
      </div>
    `;

    // Best rank badge
    if (bestRank) {
      const rankEl = document.createElement('div');
      rankEl.className = `boss-card-rank rank-${bestRank}`;
      rankEl.textContent = bestRank;
      card.appendChild(rankEl);
    }

    // Lock overlay
    if (!unlocked) {
      const lockOverlay = document.createElement('div');
      lockOverlay.className = 'boss-card-lock-overlay';
      lockOverlay.innerHTML = `<div>🔒</div><div class="boss-card-lock-text">DEFEAT PREVIOUS BOSS</div>`;
      card.appendChild(lockOverlay);
    }

    if (unlocked) {
      card.addEventListener('click', () => {
        startLevelFromMenu(levelNum);
      });
    }

    return card;
  }

  function startLevelFromMenu(levelNum) {
    BossIntroUI.show(levelNum);
  }

  // ── Learn Modal ──────────────────────────────── 
  function buildLearnContent() {
    const body = document.getElementById('learn-modal-body');
    if (!body) return;

    const algos = [
      { id: 'fcfs', name: 'FCFS', data: BOSS_DATA.fcfs },
      { id: 'sjf', name: 'SJF', data: BOSS_DATA.sjf },
      { id: 'priority', name: 'PRIORITY', data: BOSS_DATA.priority },
      { id: 'rr', name: 'ROUND ROBIN', data: BOSS_DATA.roundRobin },
      { id: 'srtf', name: 'SRTF', data: BOSS_DATA.srtf }
    ];

    const tabButtons = document.createElement('div');
    tabButtons.className = 'learn-tab-buttons';

    const tabContents = [];

    algos.forEach((algo, i) => {
      const btn = document.createElement('button');
      btn.className = 'learn-tab-btn' + (i === 0 ? ' active' : '');
      btn.textContent = algo.name;
      btn.setAttribute('data-tab', algo.id);
      btn.addEventListener('click', () => {
        document.querySelectorAll('.learn-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.learn-tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`learn-tab-${algo.id}`).classList.add('active');
      });
      tabButtons.appendChild(btn);

      const content = document.createElement('div');
      content.className = 'learn-tab-content' + (i === 0 ? ' active' : '');
      content.id = `learn-tab-${algo.id}`;
      content.innerHTML = `
        <div class="learn-algo-card">
          <div class="learn-algo-name">${algo.data.emoji} ${algo.data.name} — ${algo.data.title}</div>
          <div>
            <span class="learn-algo-tag" style="border-color:${algo.data.color};color:${algo.data.color}">${algo.data.type}</span>
            ${algo.data.tags.map(t => `<span class="learn-algo-tag" style="border-color:var(--border-dim);color:var(--text-muted)">${t}</span>`).join('')}
          </div>
          <div class="learn-algo-detail">${algo.data.personality}</div>
          <div class="learn-algo-detail"><strong style="color:var(--neon-cyan)">Special:</strong> ${algo.data.specialMove} — ${algo.data.specialDesc}</div>
          <div class="learn-algo-detail"><strong style="color:var(--neon-red)">Weakness:</strong> ${algo.data.weakness}</div>
          <pre class="learn-algo-example">${algo.data.learnRules}</pre>
        </div>
      `;
      tabContents.push(content);
    });

    body.innerHTML = '';
    body.appendChild(tabButtons);
    tabContents.forEach(c => body.appendChild(c));
  }

  // ── Demo Mode ────────────────────────────────── 
  function startDemo() {
    // Start Level 1 in demo mode
    App.startLevel(1, true);
  }

  return { init, buildLevelGrid, startLevelFromMenu };
})();
