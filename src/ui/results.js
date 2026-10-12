/**
 * Results UI
 * Renders the post-battle results screen with Gantt chart and metrics.
 */
'use strict';

const ResultsUI = (() => {
  function show(result) {
    const {
      rank, scoreState, progression, simResult,
      processes, bossData, levelConfig, playerHpRemaining
    } = result;

    // Rank display
    const rankEl = document.getElementById('results-rank');
    rankEl.textContent = rank;
    rankEl.style.color = rankColor(rank);
    rankEl.style.textShadow = `0 0 30px ${rankColor(rank)}, 0 0 60px ${rankColor(rank)}50`;

    document.getElementById('results-title').textContent =
      result.bossDefeated ? '🎉 BOSS DEFEATED!' : '💔 GAME OVER (Time Up)';

    document.getElementById('results-boss-name').textContent =
      `vs. ${bossData.name}`;

    // Metrics
    MetricsViz.render(
      document.getElementById('metrics-grid'),
      simResult,
      document.getElementById('process-table-body')
    );

    // Gantt chart
    GanttChart.render(
      document.getElementById('gantt-chart'),
      simResult.gantt,
      simResult.totalTime
    );

    // Score summary
    document.getElementById('res-base-score').textContent  = scoreState.correctAnswered * 100;
    document.getElementById('res-speed-bonus').textContent = '+' + scoreState.speedBonusTotal;
    document.getElementById('res-accuracy-bonus').textContent =
      scoreState.accuracy >= 95 ? '+250 (Perfect!)' :
      scoreState.accuracy >= 80 ? '+100 (Great!)'   : '+0';
    document.getElementById('res-total-score').textContent = scoreState.score;

    // Reward section
    const rewardSec = document.getElementById('reward-section');
    if (progression && progression.reward && result.bossDefeated) {
      rewardSec.style.display = 'block';
      document.getElementById('reward-text').textContent = progression.reward.text;
    } else {
      rewardSec.style.display = 'none';
    }

    // Buttons
    const nextBtn = document.getElementById('btn-next-level');
    if (progression && progression.nextLevel && result.bossDefeated) {
      nextBtn.style.display = 'flex';
      nextBtn.onclick = () => {
        BossIntroUI.show(progression.nextLevel);
      };
    } else {
      nextBtn.style.display = 'none';
    }

    document.getElementById('btn-retry').onclick = () => {
      App.startLevel(GameEngine.getCurrentLevelNum());
    };

    document.getElementById('btn-to-menu-results').onclick = () => {
      ScreenManager.show('menu');
    };

    ScreenManager.show('results');
    AudioSystem.playLevelComplete();
  }

  function rankColor(rank) {
    const colors = { S: '#00f5ff', A: '#00ff88', B: '#ffd700', C: '#ff8c00', D: '#ff2d5a' };
    return colors[rank] || '#ffffff';
  }

  return { show };
})();
