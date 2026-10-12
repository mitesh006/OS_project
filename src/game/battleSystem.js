/**
 * Battle System
 * Orchestrates the challenge loop: steps, timer, answer processing.
 * Connects the scheduler engine to the game UI callbacks.
 */
'use strict';

const BattleSystem = (() => {
  let _config = null;
  let _steps = [];
  let _currentStepIndex = 0;
  let _timer = null;
  let _timerRemaining = 0;
  let _timerTotal = 0;
  let _isPaused = false;
  let _isAnswered = false;
  let _onStepReady = null;   // cb(step)
  let _onTimerTick = null;   // cb(remaining, total)
  let _onTimeout = null;     // cb()
  let _onComplete = null;    // cb()
  let _contextSwitches = 0;
  let _simulationResult = null;

  // Active ability state
  let _cpuBoostActive = false;
  let _preemptShieldActive = false;

  function init(config, steps, simulationResult) {
    _config = config;
    _steps = steps;
    _currentStepIndex = 0;
    _contextSwitches = 0;
    _simulationResult = simulationResult;
    _isPaused = false;
    _isAnswered = false;
    _cpuBoostActive = false;
    _preemptShieldActive = false;
    clearTimer();
  }

  function setCallbacks({ onStepReady, onTimerTick, onTimeout, onComplete }) {
    _onStepReady = onStepReady;
    _onTimerTick = onTimerTick;
    _onTimeout = onTimeout;
    _onComplete = onComplete;
  }

  function hasMoreSteps() {
    return _currentStepIndex < _steps.length;
  }

  function getCurrentStep() {
    return _steps[_currentStepIndex] || null;
  }

  function advanceStep() {
    if (!hasMoreSteps()) {
      if (_onComplete) _onComplete();
      return;
    }
    _isAnswered = false;
    _currentStepIndex++;
    if (!hasMoreSteps()) {
      if (_onComplete) _onComplete();
      return;
    }
    startStep();
  }

  function startStep() {
    if (!hasMoreSteps()) { if (_onComplete) _onComplete(); return; }
    _isAnswered = false;
    const step = getCurrentStep();
    const time = _cpuBoostActive ? _config.decisionTime * 2 : _config.decisionTime;
    _cpuBoostActive = false;
    if (_onStepReady) _onStepReady(step);
    startTimer(time);
  }

  function startBattle() {
    _currentStepIndex = 0;
    startStep();
  }

  // ── Timer ────────────────────────────────────── 
  function startTimer(seconds) {
    clearTimer();
    _timerRemaining = seconds;
    _timerTotal = seconds;
    if (_onTimerTick) _onTimerTick(_timerRemaining, _timerTotal);

    _timer = setInterval(() => {
      if (_isPaused || _isAnswered) return;
      _timerRemaining--;
      if (_onTimerTick) _onTimerTick(_timerRemaining, _timerTotal);
      if (_timerRemaining <= 0) {
        clearTimer();
        if (_onTimeout) _onTimeout();
      }
    }, 1000);
  }

  function clearTimer() {
    if (_timer) { clearInterval(_timer); _timer = null; }
  }

  function addTime(seconds) {
    _timerRemaining = Math.min(_timerRemaining + seconds, _timerTotal * 2);
    if (_onTimerTick) _onTimerTick(_timerRemaining, _timerTotal);
  }

  function pause() {
    _isPaused = true;
  }

  function resume() {
    _isPaused = false;
  }

  /**
   * Process a player's answer.
   * @param {string} pid - The PID the player chose
   * @returns {{ correct, correctPid, explanation, damage, playerDamage, speedBonus, timeRemaining }}
   */
  function processAnswer(pid) {
    if (_isAnswered) return null;
    _isAnswered = true;
    clearTimer();

    const step = getCurrentStep();
    if (!step) return null;

    const correct = pid === step.correctAnswer;
    const timeRemaining = _timerRemaining;

    // Scoring
    let scoreResult;
    if (correct) {
      scoreResult = ScoringSystem.onCorrect(timeRemaining, _timerTotal);
    } else {
      // Check preempt shield
      if (_preemptShieldActive) {
        _preemptShieldActive = false;
        scoreResult = ScoringSystem.onWrong();
        scoreResult._shieldBlocked = true;
      } else {
        scoreResult = ScoringSystem.onWrong();
      }
    }

    // Combat damage
    let bossDamage = 0;
    let playerDamage = 0;

    if (correct) {
      bossDamage = BossSystem.calcDamage(_config, scoreResult.speedBonus || 0, scoreResult.newCombo);
    } else {
      if (!scoreResult._shieldBlocked) {
        playerDamage = BossSystem.calcPlayerDamage(_config);
      }
    }

    return {
      correct,
      correctPid: step.correctAnswer,
      explanation: step.explanation,
      scoreResult,
      bossDamage,
      playerDamage,
      timeRemaining,
      wasPreempted: step.wasPreempted || false,
      isPreemptive: step.isPreemptive || false,
      step
    };
  }

  function processTimeout() {
    if (_isAnswered) return null;
    _isAnswered = true;
    const step = getCurrentStep();
    const scoreResult = ScoringSystem.onTimeout();
    const playerDamage = BossSystem.calcPlayerDamage(_config);
    return {
      correct: false,
      correctPid: step ? step.correctAnswer : null,
      explanation: step ? step.explanation : '',
      scoreResult,
      bossDamage: 0,
      playerDamage,
      timeRemaining: 0,
      timedOut: true,
      step
    };
  }

  // ── Abilities ────────────────────────────────── 
  function activateCPUBoost() {
    _cpuBoostActive = true;
    // If timer is already running, extend it
    addTime(_config.decisionTime);
  }

  function activatePreemptShield() {
    _preemptShieldActive = true;
  }

  function activateExtraTime() {
    addTime(5);
  }

  function getSimulationResult() { return _simulationResult; }
  function getStepCount() { return _steps.length; }
  function getCurrentStepIndex() { return _currentStepIndex; }
  function getTimerRemaining() { return _timerRemaining; }
  function getTimerTotal() { return _timerTotal; }

  return {
    init, setCallbacks, startBattle, startStep, advanceStep,
    hasMoreSteps, getCurrentStep, processAnswer, processTimeout,
    pause, resume, addTime,
    activateCPUBoost, activatePreemptShield, activateExtraTime,
    getSimulationResult, getStepCount, getCurrentStepIndex,
    getTimerRemaining, getTimerTotal
  };
})();
