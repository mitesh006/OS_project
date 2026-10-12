/**
 * Boss Intro UI
 * Shows the dramatic boss introduction screen before battle starts.
 */
'use strict';

const BossIntroUI = (() => {
  function show(levelNum) {
    const config = getLevelConfig(levelNum);
    const bossData = BOSS_DATA[config.bossId];

    const content = document.getElementById('boss-intro-content');
    content.innerHTML = '';
    content.classList.add('anim-boss-intro');

    content.innerHTML = `
      <div class="boss-intro-level">${config.levelName}</div>
      <div class="boss-intro-sprite" style="filter:drop-shadow(0 0 30px ${bossData.color})">${bossData.emoji}</div>
      <div class="boss-intro-name" style="color:${bossData.color};text-shadow:0 0 30px ${bossData.color}">${bossData.name}</div>
      <div class="boss-intro-algorithm">${bossData.algorithm} — ${bossData.title}</div>
      <blockquote class="boss-intro-quote">${bossData.quote}</blockquote>

      <div class="boss-intro-rules">
        <h3>⚔️ COMBAT RULES</h3>
        <ul>
          ${bossData.rules.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>

      <div class="boss-intro-tags">
        <span class="intro-tag highlight">${bossData.type}</span>
        <span class="intro-tag highlight">🗡 ${bossData.specialMove}</span>
        ${config.timeQuantum ? `<span class="intro-tag highlight">⏱ Quantum = ${config.timeQuantum}</span>` : ''}
        ${config.hintEnabled ? `<span class="intro-tag">💡 ${config.hintsAllowed} Hints</span>` : '<span class="intro-tag">No Hints</span>'}
        <span class="intro-tag">🔴 Boss HP: ${config.bossHP}</span>
        <span class="intro-tag">⏰ ${config.decisionTime}s timer</span>
      </div>

      <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;width:100%;">
        <button class="menu-btn primary" id="btn-start-battle" style="width:auto;min-width:200px;" aria-label="Start Battle">
          ⚔️ START BATTLE
        </button>
        <button class="menu-btn secondary" id="btn-intro-back" style="width:auto;" aria-label="Back">
          ← BACK
        </button>
      </div>
    `;

    ScreenManager.show('boss-intro');

    setTimeout(() => {
      content.classList.remove('anim-boss-intro');
    }, 600);

    document.getElementById('btn-start-battle').addEventListener('click', () => {
      App.startLevel(levelNum);
    });

    document.getElementById('btn-intro-back').addEventListener('click', () => {
      ScreenManager.show('level-select');
    });
  }

  return { show };
})();
