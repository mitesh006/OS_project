/**
 * Player System
 * Manages player HP, abilities, progression, and persistent state.
 */
'use strict';

const PlayerSystem = (() => {
  const STORAGE_KEY = 'os_boss_rush_save';
  const LEADERBOARD_KEY = 'os_boss_rush_leaderboard';

  // Ability definitions
  const ABILITY_DEFS = {
    cpu_boost: {
      id: 'cpu_boost',
      name: 'CPU BOOST',
      icon: '⚡',
      description: 'Doubles your decision time for 1 question.',
      charges: 2,
      cooldown: 0,
      unlockedAfter: 'fcfs'
    },
    process_scan: {
      id: 'process_scan',
      name: 'PROCESS SCAN',
      icon: '🔍',
      description: 'Reveals extra info about all ready processes.',
      charges: 2,
      cooldown: 0,
      unlockedAfter: 'sjf'
    },
    extra_time: {
      id: 'extra_time',
      name: 'EXTRA TIME',
      icon: '⏳',
      description: 'Adds 5 seconds to the current decision timer.',
      charges: 2,
      cooldown: 0,
      unlockedAfter: 'priority'
    },
    preempt_shield: {
      id: 'preempt_shield',
      name: 'PREEMPT SHIELD',
      icon: '🛡️',
      description: 'Negates the next wrong-answer damage once.',
      charges: 1,
      cooldown: 0,
      unlockedAfter: 'roundRobin'
    }
  };

  let _state = null;

  function _defaultState() {
    return {
      maxHp: 100,
      currentHp: 100,
      score: 0,
      highScore: 0,
      defeatedBosses: [],        // Array of boss IDs
      bestRanks: {},             // { bossId: rank }
      unlockedAbilities: [],     // Array of ability IDs
      schedulerMastery: {},      // { bossId: accuracy% }
      currentLevel: 1,
      soundEnabled: true,
      hintsEnabled: true
    };
  }

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        _state = { ..._defaultState(), ...JSON.parse(saved) };
      } else {
        _state = _defaultState();
      }
    } catch (e) {
      _state = _defaultState();
    }
    return _state;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
    } catch (e) {
      console.warn('Save failed:', e);
    }
  }

  function reset() {
    _state = _defaultState();
    try {
      localStorage.removeItem(LEADERBOARD_KEY);
    } catch (e) {
      console.warn('Leaderboard reset failed:', e);
    }
    save();
  }

  function getState() {
    if (!_state) load();
    return _state;
  }

  // ── HP Management ───────────────────────────────
  function setHPForBattle(levelConfig) {
    if (!_state) load();
    // Use level config HP as base, but apply upgrades
    _state.currentHp = Math.min(_state.maxHp, levelConfig.playerHP + _state.maxHp - 100);
    _state.maxHp = Math.max(_state.maxHp, levelConfig.playerHP);
  }

  function takeDamage(amount) {
    _state.currentHp = Math.max(0, _state.currentHp - amount);
    return _state.currentHp;
  }

  function heal(amount) {
    _state.currentHp = Math.min(_state.maxHp, _state.currentHp + amount);
  }

  function isDead() {
    return _state.currentHp <= 0;
  }

  // ── Boss Defeat ─────────────────────────────────
  function defeatBoss(bossId, rank, accuracy, totalScore) {
    if (!_state.defeatedBosses.includes(bossId)) {
      _state.defeatedBosses.push(bossId);
    }
    // Update best rank
    const rankOrder = ['D', 'C', 'B', 'A', 'S'];
    const current = _state.bestRanks[bossId];
    if (!current || rankOrder.indexOf(rank) > rankOrder.indexOf(current)) {
      _state.bestRanks[bossId] = rank;
    }
    // Scheduler mastery
    if (!_state.schedulerMastery[bossId] || accuracy > _state.schedulerMastery[bossId]) {
      _state.schedulerMastery[bossId] = accuracy;
    }
    // High score
    if (totalScore > _state.highScore) _state.highScore = totalScore;
    _state.score = totalScore;

    save();
  }

  function isBossDefeated(bossId) {
    return _state && _state.defeatedBosses.includes(bossId);
  }

  function isLevelUnlocked(levelNum) {
    if (levelNum === 1) return true;
    const prevBoss = BOSS_LIST[levelNum - 2];
    return prevBoss && isBossDefeated(prevBoss.id);
  }

  // ── Abilities ───────────────────────────────────
  function unlockAbility(abilityId) {
    if (!_state.unlockedAbilities.includes(abilityId)) {
      _state.unlockedAbilities.push(abilityId);
      save();
    }
  }

  function getUnlockedAbilities() {
    return _state.unlockedAbilities
      .map(id => ABILITY_DEFS[id])
      .filter(Boolean);
  }

  function applyBossReward(reward) {
    if (!reward) return;
    if (reward.type === 'hp') {
      _state.maxHp += reward.value;
      _state.currentHp = Math.min(_state.currentHp + reward.value, _state.maxHp);
    } else if (reward.type === 'ability') {
      unlockAbility(reward.abilityId);
    }
    save();
  }

  // ── Settings ─────────────────────────────────── 
  function setSoundEnabled(val) {
    _state.soundEnabled = val;
    save();
  }

  function setHintsEnabled(val) {
    _state.hintsEnabled = val;
    save();
  }

  function getLeaderboard() {
    try {
      const saved = localStorage.getItem(LEADERBOARD_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
    } catch (e) {
      return [];
    }
  }

  function recordLeaderboardScore(score, bossName, levelName, rank) {
    const entries = getLeaderboard();
    entries.push({
      score: Number(score) || 0,
      boss: bossName || 'Boss',
      level: levelName || 'Level',
      rank: rank || 'D',
      savedAt: new Date().toISOString()
    });
    entries.sort((a, b) => (b.score || 0) - (a.score || 0));
    const compact = entries.slice(0, 5).map((entry, index) => ({
      ...entry,
      rankDisplay: `${index + 1}. ${entry.rank}`
    }));
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(compact));
    } catch (e) {
      console.warn('Leaderboard save failed:', e);
    }
    return compact;
  }

  return {
    load, save, reset, getState, getLeaderboard, recordLeaderboardScore,
    setHPForBattle, takeDamage, heal, isDead,
    defeatBoss, isBossDefeated, isLevelUnlocked,
    unlockAbility, getUnlockedAbilities, applyBossReward,
    setSoundEnabled, setHintsEnabled,
    ABILITY_DEFS
  };
})();
