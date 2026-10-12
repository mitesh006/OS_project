/**
 * Progression System
 * Handles level unlocks, boss rewards, and mastery tracking.
 */
'use strict';

const Progression = (() => {
  /**
   * Called when a boss is defeated.
   * Applies rewards and unlocks next level.
   * @param {string} bossId
   * @param {number} levelNum
   * @param {string} rank
   * @param {number} accuracy
   * @param {number} totalScore
   * @param {number} playerHpRemaining
   */
  function onBossDefeated(bossId, levelNum, rank, accuracy, totalScore, playerHpRemaining) {
    const config = getLevelConfig(levelNum);
    if (!config) return;

    // Score bonus
    const bonus = ScoringSystem.onBossDefeated(rank === 'S');

    // Save in player system
    PlayerSystem.defeatBoss(bossId, rank, accuracy, totalScore + bonus);

    // Apply reward
    if (config.unlockReward) {
      PlayerSystem.applyBossReward(config.unlockReward);
    }

    return {
      reward: config.unlockReward,
      bonus,
      nextLevel: levelNum < getTotalLevels() ? levelNum + 1 : null
    };
  }

  /**
   * Get the list of unlocked levels for level select screen.
   */
  function getUnlockedLevels() {
    const total = getTotalLevels();
    const result = [];
    for (let i = 1; i <= total; i++) {
      result.push({
        levelNum: i,
        unlocked: PlayerSystem.isLevelUnlocked(i),
        completed: PlayerSystem.isBossDefeated(BOSS_LIST[i - 1].id),
        bestRank: PlayerSystem.getState().bestRanks[BOSS_LIST[i - 1].id] || null,
        config: getLevelConfig(i),
        bossData: BOSS_LIST[i - 1]
      });
    }
    return result;
  }

  return { onBossDefeated, getUnlockedLevels };
})();
