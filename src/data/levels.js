/**
 * Level Configuration Data
 * Defines difficulty parameters for each level independently.
 * Never hardcode difficulty values inline — always reference this.
 */
'use strict';

const LEVEL_CONFIGS = {
  1: {
    bossId: 'fcfs',
    levelName: 'LEVEL 1',
    processes: 3,
    decisionTime: 20,
    hintsAllowed: 3,
    hintEnabled: true,
    bossHP: 100,
    playerHP: 100,
    complexity: 'low',
    algorithm: 'FCFS',
    timeQuantum: null,
    damagePerCorrect: 12,     // Base boss damage per correct answer
    damagePerWrong: 10,       // Player damage per wrong answer
    bonusDamage: 6,           // Fast answer bonus damage
    comboDamage: [0, 0, 5, 10, 15], // Extra damage at combo 1,2,3,4,5+
    description: 'The first boss. Learn the basics of First Come First Serve scheduling.',
    unlockReward: { type: 'hp', value: 50, text: 'Maximum HP increased by +50!' }
  },

  2: {
    bossId: 'sjf',
    levelName: 'LEVEL 2',
    processes: 4,
    decisionTime: 15,
    hintsAllowed: 2,
    hintEnabled: true,
    bossHP: 150,
    playerHP: 150,
    complexity: 'medium',
    algorithm: 'SJF',
    timeQuantum: null,
    damagePerCorrect: 15,
    damagePerWrong: 12,
    bonusDamage: 8,
    comboDamage: [0, 0, 5, 12, 18],
    description: 'The Assassin strikes fastest. Master Shortest Job First.',
    unlockReward: { type: 'ability', abilityId: 'cpu_boost', text: 'Unlocked CPU BOOST ability!' }
  },

  3: {
    bossId: 'priority',
    levelName: 'LEVEL 3',
    processes: 5,
    decisionTime: 12,
    hintsAllowed: 1,
    hintEnabled: true,
    bossHP: 200,
    playerHP: 200,
    complexity: 'medium',
    algorithm: 'PRIORITY',
    timeQuantum: null,
    damagePerCorrect: 18,
    damagePerWrong: 15,
    bonusDamage: 10,
    comboDamage: [0, 0, 8, 15, 22],
    description: 'The Overlord commands by priority. Lower number = higher rank!',
    unlockReward: { type: 'ability', abilityId: 'process_scan', text: 'Unlocked PROCESS SCAN ability!' }
  },

  4: {
    bossId: 'roundRobin',
    levelName: 'LEVEL 4',
    processes: 6,
    decisionTime: 10,
    hintsAllowed: 1,
    hintEnabled: true,
    bossHP: 250,
    playerHP: 250,
    complexity: 'high',
    algorithm: 'ROUND_ROBIN',
    timeQuantum: 2,
    damagePerCorrect: 20,
    damagePerWrong: 18,
    bonusDamage: 12,
    comboDamage: [0, 0, 10, 18, 26],
    description: 'The Warrior rotates fairly. Track the queue order carefully!',
    unlockReward: { type: 'ability', abilityId: 'extra_time', text: 'Unlocked EXTRA TIME ability!' }
  },

  5: {
    bossId: 'srtf',
    levelName: 'LEVEL 5',
    processes: 7,
    decisionTime: 8,
    hintsAllowed: 0,
    hintEnabled: false,
    bossHP: 300,
    playerHP: 300,
    complexity: 'high',
    algorithm: 'SRTF',
    timeQuantum: null,
    damagePerCorrect: 25,
    damagePerWrong: 20,
    bonusDamage: 15,
    comboDamage: [0, 0, 12, 22, 32],
    description: 'The Reaper preempts without mercy. Track remaining times!',
    unlockReward: { type: 'ability', abilityId: 'preempt_shield', text: 'Unlocked PREEMPT SHIELD ability!' }
  },

  6: {
    bossId: 'kernel',
    levelName: 'FINAL BOSS',
    processes: 8,
    decisionTime: 8,
    hintsAllowed: 0,
    hintEnabled: false,
    bossHP: 500,
    playerHP: 300,
    complexity: 'very-high',
    algorithm: 'MIXED',
    timeQuantum: 2,
    damagePerCorrect: 22,
    damagePerWrong: 25,
    bonusDamage: 15,
    comboDamage: [0, 0, 12, 22, 32],
    description: 'The ultimate test. Every algorithm. No mercy.',
    unlockReward: { type: 'title', text: 'You have mastered CPU scheduling!' }
  }
};

/**
 * Get config for a given level number (1-indexed).
 */
function getLevelConfig(levelNum) {
  return LEVEL_CONFIGS[levelNum] || null;
}

/**
 * Get total number of levels.
 */
function getTotalLevels() {
  return Object.keys(LEVEL_CONFIGS).length;
}
