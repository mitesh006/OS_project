/**
 * Scoring System
 * Computes score, combo, rank, and accuracy.
 */
'use strict';

const ScoringSystem = (() => {
  const SCORE = {
    CORRECT_BASE: 100,
    CORRECT_FAST_BONUS: 50,
    WRONG_PENALTY: -50,
    BOSS_DEFEATED: 500,
    PERFECT_ROUND: 250,
    COMBO_MULTIPLIER: [1, 1, 1.5, 2, 2.5, 3]  // index = combo count (capped at 5)
  };

  let _score = 0;
  let _combo = 0;
  let _totalAnswered = 0;
  let _correctAnswered = 0;
  let _hintsUsed = 0;
  let _speedBonusTotal = 0;

  function reset() {
    _score = 0;
    _combo = 0;
    _totalAnswered = 0;
    _correctAnswered = 0;
    _hintsUsed = 0;
    _speedBonusTotal = 0;
  }

  /**
   * Process a correct answer.
   * @param {number} timeRemaining - Seconds remaining on timer
   * @param {number} totalTime - Total timer duration
   * @returns {{ scoreGain, isCombo, newCombo, multiplier }}
   */
  function onCorrect(timeRemaining, totalTime) {
    _totalAnswered++;
    _correctAnswered++;
    _combo++;

    const mult = getMultiplier(_combo);
    let base = SCORE.CORRECT_BASE;

    // Speed bonus: > 60% time remaining
    let speedBonus = 0;
    if (timeRemaining > 0 && totalTime > 0) {
      const ratio = timeRemaining / totalTime;
      if (ratio > 0.7) { speedBonus = SCORE.CORRECT_FAST_BONUS; }
      else if (ratio > 0.5) { speedBonus = Math.floor(SCORE.CORRECT_FAST_BONUS * 0.5); }
    }

    const gain = Math.floor((base + speedBonus) * mult);
    _score += gain;
    _speedBonusTotal += speedBonus;

    return { scoreGain: gain, speedBonus, newCombo: _combo, multiplier: mult };
  }

  /**
   * Process a wrong answer.
   * @returns {{ scoreLoss }}
   */
  function onWrong() {
    _totalAnswered++;
    _combo = 0;
    const loss = Math.abs(SCORE.WRONG_PENALTY);
    _score = Math.max(0, _score - loss);
    return { scoreLoss: loss, newCombo: 0 };
  }

  /**
   * Timer expired — counts as wrong but with a different message.
   */
  function onTimeout() {
    return onWrong();
  }

  /**
   * Add boss defeat bonus.
   */
  function onBossDefeated(perfect = false) {
    const bonus = SCORE.BOSS_DEFEATED + (perfect ? SCORE.PERFECT_ROUND : 0);
    _score += bonus;
    return bonus;
  }

  function useHint() {
    _hintsUsed++;
  }

  function getMultiplier(combo) {
    const idx = Math.min(combo, SCORE.COMBO_MULTIPLIER.length - 1);
    return SCORE.COMBO_MULTIPLIER[idx];
  }

  /**
   * Calculate rank based on accuracy, damage taken (hp remaining ratio), hints used.
   */
  function calculateRank(accuracy, hpRemaining, maxHp, hintsUsed) {
    const hpRatio = hpRemaining / maxHp;
    let rankScore = accuracy * 60 + hpRatio * 30 + (hintsUsed === 0 ? 10 : hintsUsed === 1 ? 5 : 0);

    if (rankScore >= 90) return 'S';
    if (rankScore >= 75) return 'A';
    if (rankScore >= 60) return 'B';
    if (rankScore >= 45) return 'C';
    return 'D';
  }

  function getAccuracy() {
    if (_totalAnswered === 0) return 0;
    return +(_correctAnswered / _totalAnswered * 100).toFixed(1);
  }

  function getState() {
    return {
      score: _score,
      combo: _combo,
      totalAnswered: _totalAnswered,
      correctAnswered: _correctAnswered,
      hintsUsed: _hintsUsed,
      accuracy: getAccuracy(),
      speedBonusTotal: _speedBonusTotal
    };
  }

  return {
    reset,
    onCorrect,
    onWrong,
    onTimeout,
    onBossDefeated,
    useHint,
    calculateRank,
    getAccuracy,
    getState
  };
})();
