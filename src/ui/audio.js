/**
 * Audio System
 * Web Audio API sound effects. Optional — can be muted.
 */
'use strict';

const AudioSystem = (() => {
  let _ctx = null;
  let _muted = false;
  let _initialized = false;

  function init(muted = false) {
    _muted = muted;
  }

  function _getCtx() {
    if (!_ctx) {
      try {
        _ctx = new (window.AudioContext || window.webkitAudioContext)();
        _initialized = true;
      } catch (e) { return null; }
    }
    // Resume if suspended (browser autoplay policy)
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  }

  function _playTone(frequency, duration, type = 'sine', volume = 0.3, delay = 0) {
    if (_muted) return;
    const ctx = _getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  }

  function playCorrect() {
    _playTone(523, 0.1, 'sine', 0.25);
    _playTone(659, 0.15, 'sine', 0.25, 0.1);
    _playTone(784, 0.2, 'sine', 0.3, 0.22);
  }

  function playWrong() {
    _playTone(200, 0.08, 'sawtooth', 0.2);
    _playTone(150, 0.15, 'sawtooth', 0.2, 0.1);
  }

  function playBossAttack() {
    _playTone(80, 0.2, 'square', 0.15);
    _playTone(100, 0.3, 'sawtooth', 0.15, 0.1);
  }

  function playPlayerAttack() {
    _playTone(440, 0.07, 'square', 0.2);
    _playTone(660, 0.12, 'square', 0.2, 0.07);
  }

  function playLevelComplete() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => _playTone(n, 0.2, 'sine', 0.25, i * 0.15));
  }

  function playBossDefeated() {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((n, i) => _playTone(n, 0.3, 'sine', 0.3, i * 0.1));
  }

  function playContextSwitch() {
    _playTone(800, 0.05, 'square', 0.1);
    _playTone(400, 0.05, 'square', 0.1, 0.06);
  }

  function playPreemption() {
    _playTone(1000, 0.04, 'sawtooth', 0.15);
    _playTone(700, 0.08, 'sawtooth', 0.15, 0.05);
  }

  function playTimerWarning() {
    _playTone(880, 0.05, 'sine', 0.1);
  }

  function setMuted(val) {
    _muted = val;
  }

  function isMuted() { return _muted; }

  return {
    init, setMuted, isMuted,
    playCorrect, playWrong,
    playBossAttack, playPlayerAttack,
    playLevelComplete, playBossDefeated,
    playContextSwitch, playPreemption, playTimerWarning
  };
})();
