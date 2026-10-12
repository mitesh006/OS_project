/**
 * Main Application Entry Point
 * Initializes all systems, manages screen transitions.
 */
'use strict';

// ── Screen Manager ───────────────────────────────
const ScreenManager = (() => {
  const screens = [
    'menu', 'level-select', 'boss-intro', 'battle', 'results', 'gameover'
  ];

  function show(name) {
    screens.forEach(id => {
      const el = document.getElementById(`screen-${id}`);
      if (el) el.classList.toggle('active', id === name);
    });
  }

  return { show };
})();

// ── App ──────────────────────────────────────────
const App = (() => {
  function init() {
    // Initialize all systems
    GameEngine.init();
    AudioSystem.init(!PlayerSystem.getState().soundEnabled);
    ParticleSystem.init();
    MenuUI.init();

    // Show main menu
    ScreenManager.show('menu');
  }

  /**
   * Start a battle level. Called from BossIntroUI and Menu.
   * @param {number} levelNum
   * @param {boolean} demoMode
   */
  function startLevel(levelNum, demoMode = false) {
    // Setup game systems
    const levelData = GameEngine.startLevel(levelNum, demoMode);
    if (!levelData) { console.error('Failed to start level', levelNum); return; }

    // Wire BattleSystem callbacks → BattleScreenUI
    BattleSystem.setCallbacks({
      onStepReady: (step) => {
        BattleScreenUI.renderStep(step);
      },
      onTimerTick: (remaining, total) => {
        BattleScreenUI.updateTimer(remaining, total);
      },
      onTimeout: () => {
        BattleScreenUI.onTimeout();
      },
      onComplete: () => {
        // All steps exhausted — if boss still alive, it's a draw/score
        const ps = PlayerSystem.getState();
        const result = GameEngine.onBattleComplete(ps.currentHp);
        result.bossDefeated = BossSystem.isDefeated();
        result.playerHpRemaining = ps.currentHp;
        setTimeout(() => ResultsUI.show(result), 800);
      }
    });

    // Init battle UI
    BattleScreenUI.init(levelData);

    // Show battle screen
    ScreenManager.show('battle');

    // Start combat
    if (demoMode) {
      runDemoMode(levelData);
    } else {
      BattleSystem.startBattle();
    }
  }

  /**
   * Demo mode: auto-runs through steps with delays.
   */
  function runDemoMode(levelData) {
    // Show each step automatically
    const steps = levelData.steps;
    let idx = 0;

    function nextDemo() {
      if (idx >= steps.length || BossSystem.isDefeated() || PlayerSystem.isDead()) {
        // End demo
        setTimeout(() => {
          const ps = PlayerSystem.getState();
          const result = GameEngine.onBattleComplete(ps.currentHp);
          result.bossDefeated = true;
          result.playerHpRemaining = ps.currentHp;
          ResultsUI.show(result);
        }, 1000);
        return;
      }

      BattleScreenUI.renderStep(steps[idx]);

      // Auto-answer correctly after 2 seconds
      setTimeout(() => {
        const correct = steps[idx].correctAnswer;
        const result = BattleSystem.processAnswer(correct);

        // Visual feedback without real game consequences in demo
        if (result) {
          BossSystem.takeDamage(result.bossDamage);
          // Update boss HP display manually
          const bossHpFill = document.getElementById('boss-hp-fill');
          const bossHpText = document.getElementById('hud-boss-hp');
          const pct = BossSystem.getHPPercent() * 100;
          bossHpFill.style.width = pct + '%';
          bossHpText.textContent = `${BossSystem.getHP()} / ${BossSystem.getMaxHP()}`;
        }

        idx++;
        setTimeout(nextDemo, 1500);
      }, 2000);
    }

    nextDemo();
  }

  return { init, startLevel };
})();

// ── Bootstrap ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
