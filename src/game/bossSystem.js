/**
 * Boss System
 * Manages boss HP, special moves, and battle state.
 */
'use strict';

const BossSystem = (() => {
  let _boss = null;
  let _currentHp = 0;
  let _maxHp = 0;

  function init(bossData, levelConfig) {
    _boss = bossData;
    _maxHp = levelConfig.bossHP;
    _currentHp = _maxHp;
  }

  function takeDamage(amount) {
    _currentHp = Math.max(0, _currentHp - amount);
    return _currentHp;
  }

  function isDefeated() {
    return _currentHp <= 0;
  }

  function getHP() { return _currentHp; }
  function getMaxHP() { return _maxHp; }
  function getHPPercent() { return _maxHp > 0 ? _currentHp / _maxHp : 0; }
  function getBoss() { return _boss; }

  /**
   * Calculate how much damage a correct answer deals to the boss.
   * Factors in: base damage, speed, combo.
   */
  function calcDamage(config, speedBonus, combo) {
    const base = config.damagePerCorrect;
    const comboBonus = config.comboDamage[Math.min(combo, config.comboDamage.length - 1)] || 0;
    const fast = speedBonus > 0 ? config.bonusDamage : 0;
    return base + comboBonus + fast;
  }

  /**
   * Calculate how much damage a wrong answer does to the player.
   */
  function calcPlayerDamage(config) {
    return config.damagePerWrong;
  }

  return {
    init,
    takeDamage,
    isDefeated,
    getHP, getMaxHP, getHPPercent,
    getBoss,
    calcDamage,
    calcPlayerDamage
  };
})();
