/**
 * Game Engine
 * Central coordinator. Owns the state machine (screens, current level).
 * Wires all systems together. Single entry point for game actions.
 */
'use strict';

const GameEngine = (() => {
  let _currentLevelNum = null;
  let _currentLevelConfig = null;
  let _currentBossData = null;
  let _processes = [];
  let _abilityCharges = {};
  let _isDemoMode = false;

  // ── Initialization ─────────────────────────────
  function init() {
    PlayerSystem.load();
    ScoringSystem.reset();
  }

  // ── Level Setup ─────────────────────────────── 
  function startLevel(levelNum, demoMode = false) {
    _isDemoMode = demoMode;
    _currentLevelNum = levelNum;
    _currentLevelConfig = getLevelConfig(levelNum);
    if (!_currentLevelConfig) { console.error('Invalid level', levelNum); return; }

    _currentBossData = BOSS_DATA[_currentLevelConfig.bossId];

    // Reset scoring
    ScoringSystem.reset();

    // Generate processes
    _processes = ProcessGenerator.generate({
      count: _currentLevelConfig.processes,
      algorithm: _currentLevelConfig.algorithm,
      complexity: _currentLevelConfig.complexity,
      seed: Date.now()
    });

    // Set player HP
    PlayerSystem.setHPForBattle(_currentLevelConfig);

    // Init boss
    BossSystem.init(_currentBossData, _currentLevelConfig);

    // Build scheduling challenge steps
    const steps = buildSteps(_processes, _currentLevelConfig);

    // Run full simulation for Gantt/metrics
    const simResult = runSimulation(_processes, _currentLevelConfig);

    // Init battle system
    BattleSystem.init(_currentLevelConfig, steps, simResult);

    // Init ability charges for this battle
    _initAbilityCharges();

    return {
      levelConfig: _currentLevelConfig,
      bossData: _currentBossData,
      processes: _processes,
      steps,
      simResult
    };
  }

  function buildSteps(processes, config) {
    const algo = config.algorithm;
    switch (algo) {
      case 'FCFS':
        return FCFS.buildChallengeSteps(processes);
      case 'SJF':
        return SJF.buildChallengeSteps(processes);
      case 'PRIORITY':
        return PriorityScheduler.buildChallengeSteps(processes);
      case 'ROUND_ROBIN':
        return RoundRobin.buildChallengeSteps(processes, config.timeQuantum || 2);
      case 'SRTF':
        return SRTF.buildChallengeSteps(processes);
      case 'MIXED':
        return buildMixedSteps(processes, config);
      default:
        return FCFS.buildChallengeSteps(processes);
    }
  }

  function runSimulation(processes, config) {
    switch (config.algorithm) {
      case 'FCFS':        return FCFS.simulate(processes);
      case 'SJF':         return SJF.simulate(processes);
      case 'PRIORITY':    return PriorityScheduler.simulate(processes);
      case 'ROUND_ROBIN': return RoundRobin.simulate(processes, config.timeQuantum || 2);
      case 'SRTF':        return SRTF.simulate(processes);
      case 'MIXED':       return simulateMixedRounds(processes, config);
      default:            return FCFS.simulate(processes);
    }
  }

  function simulateMixedRounds(processes, config) {
    const rounds = ['FCFS', 'SJF', 'PRIORITY', 'ROUND_ROBIN', 'SRTF'];
    const roundSimulations = rounds.map((algo, index) => {
      const subCount = Math.min(4 + index, 6);
      const subProcesses = ProcessGenerator.generate({
        count: subCount,
        algorithm: algo,
        complexity: index < 2 ? 'medium' : 'high',
        seed: Date.now() + index * 131 + Math.floor(Math.random() * 2000)
      });

      const sim = (() => {
        switch (algo) {
          case 'FCFS': return FCFS.simulate(subProcesses);
          case 'SJF': return SJF.simulate(subProcesses);
          case 'PRIORITY': return PriorityScheduler.simulate(subProcesses);
          case 'ROUND_ROBIN': return RoundRobin.simulate(subProcesses, config.timeQuantum || 2);
          case 'SRTF': return SRTF.simulate(subProcesses);
          default: return FCFS.simulate(subProcesses);
        }
      })();

      return { algorithm: algo, sim, processes: subProcesses };
    });

    const totalTime = roundSimulations.reduce((sum, entry) => sum + (entry.sim.totalTime || 0), 0);
    const contextSwitches = roundSimulations.reduce((sum, entry) => sum + (entry.sim.contextSwitches || 0), 0);
    const avgWaitingTime = roundSimulations.reduce((sum, entry) => sum + (entry.sim.avgWaitingTime || 0), 0) / Math.max(roundSimulations.length, 1);
    const avgTurnaroundTime = roundSimulations.reduce((sum, entry) => sum + (entry.sim.avgTurnaroundTime || 0), 0) / Math.max(roundSimulations.length, 1);
    const avgResponseTime = roundSimulations.reduce((sum, entry) => sum + (entry.sim.avgResponseTime || 0), 0) / Math.max(roundSimulations.length, 1);
    const cpuUtilization = roundSimulations.reduce((sum, entry) => sum + (entry.sim.cpuUtilization || 0), 0) / Math.max(roundSimulations.length, 1);

    return {
      processes,
      gantt: roundSimulations.flatMap((entry, index) =>
        entry.sim.gantt.map(slot => ({ ...slot, round: index + 1, algorithm: entry.algorithm }))
      ),
      contextSwitches,
      avgWaitingTime: +avgWaitingTime.toFixed(2),
      avgTurnaroundTime: +avgTurnaroundTime.toFixed(2),
      avgResponseTime: +avgResponseTime.toFixed(2),
      totalTime,
      cpuUtilization: +cpuUtilization.toFixed(2),
      mixedRounds: roundSimulations
    };
  }

  function buildMixedSteps(processes, config) {
    const algos = ['FCFS', 'SJF', 'PRIORITY', 'ROUND_ROBIN', 'SRTF'];
    const steps = [];

    algos.forEach((algo, index) => {
      const subCount = Math.min(4 + index, 6);
      const subConfig = { ...config, algorithm: algo, processes: subCount, complexity: index < 2 ? 'medium' : 'high' };
      const subProcs = ProcessGenerator.generate({
        count: subCount,
        algorithm: algo,
        complexity: subConfig.complexity,
        seed: Date.now() + index * 997 + Math.floor(Math.random() * 1000)
      });

      const subSteps = buildSteps(subProcs, subConfig);
      const chosenSteps = subSteps.slice(0, 2);
      chosenSteps.forEach(step => {
        steps.push({
          ...step,
          algorithm: algo,
          round: algo,
          mixedRound: index + 1,
          explanation: `${step.explanation}\n\n[Kernel Round ${index + 1}] Algorithm: ${algo}`
        });
      });
    });

    return steps;
  }

  // ── Ability Management ───────────────────────── 
  function _initAbilityCharges() {
    _abilityCharges = {};
    const abilities = PlayerSystem.getUnlockedAbilities();
    abilities.forEach(a => {
      _abilityCharges[a.id] = a.charges;
    });
  }

  function useAbility(abilityId) {
    if (!_abilityCharges[abilityId] || _abilityCharges[abilityId] <= 0) return false;
    _abilityCharges[abilityId]--;

    switch (abilityId) {
      case 'cpu_boost':      BattleSystem.activateCPUBoost(); break;
      case 'extra_time':     BattleSystem.activateExtraTime(); break;
      case 'preempt_shield': BattleSystem.activatePreemptShield(); break;
      case 'process_scan':   break; // Handled in UI
    }
    return true;
  }

  function getAbilityCharges(abilityId) {
    return _abilityCharges[abilityId] || 0;
  }

  // ── End of Battle ────────────────────────────── 
  function onBattleComplete(playerHpRemaining) {
    const baseScoreState = ScoringSystem.getState();
    const accuracy   = baseScoreState.accuracy / 100; // 0–1
    const rank       = ScoringSystem.calculateRank(
      accuracy * 100,
      playerHpRemaining,
      PlayerSystem.getState().maxHp,
      baseScoreState.hintsUsed
    );

    const progression = Progression.onBossDefeated(
      _currentBossData.id,
      _currentLevelNum,
      rank,
      accuracy * 100,
      baseScoreState.score,
      playerHpRemaining
    );

    const scoreState = ScoringSystem.getState();
    PlayerSystem.recordLeaderboardScore(
      scoreState.score,
      _currentBossData ? _currentBossData.name : 'Boss',
      _currentLevelConfig ? _currentLevelConfig.levelName : 'LEVEL',
      rank
    );

    return {
      rank,
      scoreState,
      progression,
      simResult: BattleSystem.getSimulationResult(),
      processes: _processes,
      bossData: _currentBossData,
      levelConfig: _currentLevelConfig
    };
  }

  // ── Getters ──────────────────────────────────── 
  function getCurrentLevelNum()    { return _currentLevelNum; }
  function getCurrentLevelConfig() { return _currentLevelConfig; }
  function getCurrentBossData()    { return _currentBossData; }
  function getProcesses()          { return _processes; }
  function isDemoMode()            { return _isDemoMode; }

  return {
    init, startLevel, useAbility, getAbilityCharges,
    onBattleComplete,
    getCurrentLevelNum, getCurrentLevelConfig, getCurrentBossData,
    getProcesses, isDemoMode
  };
})();
