/**
 * Battle Screen UI
 * The main battle screen controller. Renders and updates the battle UI,
 * connects player inputs to the BattleSystem, and handles all animations.
 */
'use strict';

const BattleScreenUI = (() => {
  // DOM refs cached at init
  let _dom = {};
  let _currentStep = null;
  let _executingPid = null;
  let _currentTime = 0;
  let _algorithm = 'FCFS';
  let _hintsRemaining = 0;
  let _processes = [];

  function init(levelData) {
    cacheDOM();
    const { levelConfig, bossData, processes } = levelData;

    _algorithm = levelConfig.algorithm;
    _processes = processes;
    _hintsRemaining = levelConfig.hintsAllowed;
    _currentTime = 0;
    _executingPid = null;

    // Setup HUD
    updateHUD(levelConfig, bossData);

    // Setup abilities
    renderAbilities();

    // Setup challenge area
    _dom.challengeFeedback.className = 'challenge-feedback';
    _dom.challengeFeedback.textContent = '';

    // Setup algo tag
    _dom.algoTag.textContent = _algorithm.replace('_', ' ');

    // Boss sprite
    renderBossSprite(bossData);

    // Update hint count
    document.getElementById('hint-count').textContent = _hintsRemaining;

    // Battle learn modal content
    setupLearnModal(bossData);

    // Bind controls
    bindControls();
  }

  function cacheDOM() {
    _dom = {
      playerHpFill:      document.getElementById('player-hp-fill'),
      playerHpText:      document.getElementById('hud-player-hp'),
      bossHpFill:        document.getElementById('boss-hp-fill'),
      bossHpText:        document.getElementById('hud-boss-hp'),
      hudLevelName:      document.getElementById('hud-level-name'),
      hudBossName:       document.getElementById('hud-boss-name'),
      hudTimer:          document.getElementById('hud-timer'),
      timerRing:         document.getElementById('timer-ring'),
      playerSprite:      document.getElementById('player-sprite'),
      bossSprite:        document.getElementById('boss-sprite'),
      bossCharLabel:     document.getElementById('boss-char-label'),
      cpuBox:            document.getElementById('cpu-box'),
      cpuExecuting:      document.getElementById('cpu-executing'),
      cpuProgressFill:   document.getElementById('cpu-progress-fill'),
      cpuRemaining:      document.getElementById('cpu-remaining'),
      ctxSwitchFlash:    document.getElementById('context-switch-flash'),
      preemptBadge:      document.getElementById('preempt-badge'),
      algoTag:           document.getElementById('algo-tag'),
      readyQueue:        document.getElementById('ready-queue'),
      currentTimeEl:     document.getElementById('current-time'),
      challengeText:     document.getElementById('challenge-text'),
      challengeHint:     document.getElementById('challenge-hint'),
      challengeOptions:  document.getElementById('challenge-options'),
      challengeFeedback: document.getElementById('challenge-feedback'),
      battleScore:       document.getElementById('battle-score'),
      battleCombo:       document.getElementById('battle-combo'),
      battleAccuracy:    document.getElementById('battle-accuracy'),
      battleSwitches:    document.getElementById('battle-switches'),
      abilitiesRow:      document.getElementById('abilities-row'),
      playerDamageNum:   document.getElementById('player-damage-num'),
      bossDamageNum:     document.getElementById('boss-damage-num'),
      battleScreen:      document.getElementById('screen-battle'),
      pcScreenContent:   document.querySelector('.pc-screen-content')
    };
  }

  function updateHUD(levelConfig, bossData) {
    const ps = PlayerSystem.getState();
    const playerHp = Math.min(ps.currentHp, ps.maxHp);
    const maxHp    = ps.maxHp;

    setHPBar(_dom.playerHpFill, _dom.playerHpText, playerHp, maxHp, 'player');
    setHPBar(_dom.bossHpFill, _dom.bossHpText, BossSystem.getHP(), BossSystem.getMaxHP(), 'boss');

    _dom.hudLevelName.textContent = levelConfig.levelName;
    _dom.hudBossName.textContent  = bossData.name;
  }

  function setHPBar(fill, textEl, current, max, type) {
    const pct = max > 0 ? Math.max(0, current / max * 100) : 0;
    fill.style.width = pct + '%';

    // Color transition
    if (pct <= 25) {
      fill.style.background = type === 'player'
        ? 'linear-gradient(90deg, #ff2d5a, #ff0000)'
        : 'linear-gradient(90deg, #ff2d5a, #ff0000)';
    } else if (pct <= 50) {
      fill.style.background = type === 'player'
        ? 'linear-gradient(90deg, #ffd700, #ff8c00)'
        : 'linear-gradient(90deg, #ff6b35, #ff2d5a)';
    }

    if (textEl) textEl.textContent = `${Math.max(0, current)} / ${max}`;
  }

  function renderBossSprite(bossData) {
    _dom.bossSprite.innerHTML = `
      <div class="boss-sprite-art" style="--boss-glow:${bossData.glow}">${bossData.emoji}</div>
    `;
    _dom.bossCharLabel.textContent = bossData.name;
    _dom.bossCharLabel.style.color = bossData.color;
  }

  // ── Step Rendering ───────────────────────────── 
  function renderStep(step) {
    _currentStep = step;
    _currentTime = step.time;
    _executingPid = null; // will be set after correct answer

    // Update current time display
    _dom.currentTimeEl.textContent = step.time;

    // Update ready queue
    ReadyQueueViz.renderQueue(
      _dom.readyQueue,
      step.allProcesses,
      step.time,
      _executingPid,
      _algorithm
    );

    // CPU box — show idle or last running
    updateCPUBox('IDLE', null, 0, 0);

    // Build challenge question
    renderChallenge(step);

    // Preempt badge
    if (step.wasPreempted) {
      showPreemptBadge();
      AudioSystem.playPreemption();
    }
  }

  function renderChallenge(step) {
    // Reset feedback
    _dom.challengeFeedback.className  = 'challenge-feedback';
    _dom.challengeFeedback.textContent = '';
    _dom.challengeHint.classList.remove('visible');
    _dom.challengeHint.textContent = '';

    // Question text
    let question = '';
    switch (step.algorithm) {
      case 'FCFS':
        question = 'Which process should the FCFS scheduler execute next?';
        break;
      case 'SJF':
        question = 'SJF: Which available process has the shortest burst time?';
        break;
      case 'PRIORITY':
        question = 'PRIORITY: Which process has the highest priority? (Lowest number!)';
        break;
      case 'ROUND_ROBIN':
        question = `Round Robin (Q=${GameEngine.getCurrentLevelConfig().timeQuantum}): Which process is at the FRONT of the queue?`;
        break;
      case 'SRTF':
        question = 'SRTF: Which process has the shortest REMAINING time?';
        break;
      default:
        question = 'Which process should run next?';
    }

    _dom.challengeText.textContent = question;
    _dom.challengeText.classList.add('anim-question');
    setTimeout(() => _dom.challengeText.classList.remove('anim-question'), 400);

    // Show hint if enabled
    const ps = PlayerSystem.getState();
    if (ps.hintsEnabled && _hintsRemaining > 0) {
      const bossData = GameEngine.getCurrentBossData();
      if (bossData.hint) {
        _dom.challengeHint.textContent = '💡 Hint: ' + bossData.hint;
        _dom.challengeHint.classList.add('visible');
      }
    }

    // Answer buttons
    renderAnswerButtons(step);
  }

  function renderAnswerButtons(step) {
    _dom.challengeOptions.innerHTML = '';

    // Collect unique candidates from ready queue
    const candidates = step.readyQueue
      .filter(p => p.status === 'READY' || p.status === 'RUNNING')
      .slice(0, 6); // Max 6 buttons

    if (candidates.length === 0) {
      _dom.challengeOptions.innerHTML =
        '<div style="color:var(--text-muted);font-family:var(--font-mono);font-size:0.75rem;">No processes ready.</div>';
      return;
    }

    candidates.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.setAttribute('data-pid', p.id);
      btn.setAttribute('aria-label', `Select process ${p.id}`);
      btn.innerHTML = `<span>${p.id}</span>`;

      // Show key detail
      let detail = '';
      if (step.algorithm === 'SJF')        detail = `<small>BT=${p.burstTime}</small>`;
      if (step.algorithm === 'PRIORITY')   detail = `<small>Pri=${p.priority}</small>`;
      if (step.algorithm === 'SRTF')       detail = `<small>Rem=${p.remainingTime}</small>`;
      if (step.algorithm === 'ROUND_ROBIN') detail = `<small>Rem=${p.remainingTime}</small>`;
      if (step.algorithm === 'FCFS')       detail = `<small>AT=${p.arrivalTime}</small>`;
      if (detail) btn.innerHTML += `<br/>${detail}`;

      btn.addEventListener('click', () => onAnswer(p.id));
      _dom.challengeOptions.appendChild(btn);
    });
  }

  // ── Answer Handling ──────────────────────────── 
  function onAnswer(pid) {
    const result = BattleSystem.processAnswer(pid);
    if (!result) return;

    handleAnswerResult(result, pid);
  }

  function handleAnswerResult(result, selectedPid) {
    const { correct, correctPid, explanation, scoreResult, bossDamage, playerDamage } = result;

    // Disable all answer buttons
    disableAnswerButtons();

    if (correct) {
      // Mark correct button
      markAnswerBtn(selectedPid, 'correct');

      // Combat: player attacks boss
      animatePlayerAttack();
      setTimeout(() => {
        animateBossHurt(bossDamage);
        BossSystem.takeDamage(bossDamage);
        updateBossHP();
        AudioSystem.playCorrect();
        AudioSystem.playPlayerAttack();
      }, 200);

      // CPU update — show selected process
      _executingPid = correctPid;
      updateCPUBox(correctPid, result.step.allProcesses, result.step.time);

      // Flash screen
      _dom.battleScreen.classList.add('flash-green');
      setTimeout(() => _dom.battleScreen.classList.remove('flash-green'), 500);

      // Feedback
      showFeedback(true, `✓ Correct! ${buildShortExplanation(result.step)}`);
      updateScoreHUD(scoreResult, true);

    } else {
      // Mark selected as wrong, show correct
      markAnswerBtn(selectedPid, 'wrong');
      setTimeout(() => markAnswerBtn(correctPid, 'correct'), 300);

      // Combat: boss attacks player
      animateBossAttack();
      setTimeout(() => {
        animatePlayerHurt(playerDamage);
        PlayerSystem.takeDamage(playerDamage);
        updatePlayerHP();
        AudioSystem.playWrong();
        AudioSystem.playBossAttack();
      }, 200);

      // Flash screen
      _dom.battleScreen.classList.add('flash-red');
      setTimeout(() => _dom.battleScreen.classList.remove('flash-red'), 500);

      // Feedback
      showFeedback(false, `✗ Wrong! Answer: ${correctPid}. ${buildShortExplanation(result.step)}`);
      updateScoreHUD(scoreResult, false);
    }

    // Context switch animation if applicable
    if (result.step.wasPreempted) {
      showContextSwitchFlash();
      AudioSystem.playContextSwitch();
    }

    // Update stats
    updateStatsHUD();

    // Check win/loss after short delay
    setTimeout(() => {
      if (BossSystem.isDefeated()) {
        onBossDefeated();
      } else if (PlayerSystem.isDead()) {
        onPlayerDead();
      } else {
        // Next step after feedback display
        setTimeout(() => BattleSystem.advanceStep(), 1200);
      }
    }, 1800);
  }

  function buildShortExplanation(step) {
    switch (step.algorithm) {
      case 'FCFS':        return `${step.correctAnswer} has the earliest arrival time.`;
      case 'SJF':         return `${step.correctAnswer} has the shortest burst time.`;
      case 'PRIORITY':    return `${step.correctAnswer} has the highest priority (lowest number).`;
      case 'ROUND_ROBIN': return `${step.correctAnswer} is at the front of the FIFO queue.`;
      case 'SRTF':        return `${step.correctAnswer} has the shortest remaining time.`;
      default:            return '';
    }
  }

  function onTimeout() {
    const result = BattleSystem.processTimeout();
    if (!result) return;
    handleAnswerResult(result, null);
  }

  // ── HP Updates ───────────────────────────────── 
  function updatePlayerHP() {
    const ps = PlayerSystem.getState();
    setHPBar(_dom.playerHpFill, _dom.playerHpText, ps.currentHp, ps.maxHp, 'player');
  }

  function updateBossHP() {
    setHPBar(_dom.bossHpFill, _dom.bossHpText, BossSystem.getHP(), BossSystem.getMaxHP(), 'boss');
  }

  // ── Score HUD ────────────────────────────────── 
  function updateScoreHUD(scoreResult, correct) {
    const state = ScoringSystem.getState();
    _dom.battleScore.textContent = state.score;

    const combo = scoreResult.newCombo;
    _dom.battleCombo.textContent = `x${Math.min(combo, 5) || 1}`;
    _dom.battleCombo.classList.remove('anim-combo-bounce');
    if (correct && combo > 1) {
      void _dom.battleCombo.offsetWidth; // force reflow
      _dom.battleCombo.classList.add('anim-combo-bounce');
    }
  }

  function updateStatsHUD() {
    const state = ScoringSystem.getState();
    _dom.battleAccuracy.textContent = state.accuracy + '%';
    _dom.battleSwitches.textContent = BattleSystem.getSimulationResult()?.contextSwitches || 0;
  }

  // ── CPU Box ──────────────────────────────────── 
  function updateCPUBox(pid, processes, time) {
    if (!pid || pid === 'IDLE') {
      _dom.cpuExecuting.textContent = 'IDLE';
      _dom.cpuProgressFill.style.width = '0%';
      _dom.cpuRemaining.textContent = '—';
      _dom.cpuBox.style.borderColor = 'var(--cpu-color)';
      return;
    }

    _dom.cpuExecuting.textContent = pid;

    if (processes) {
      const proc = processes.find(p => p.id === pid);
      if (proc) {
        const pct = proc.burstTime > 0 ? (1 - proc.remainingTime / proc.burstTime) * 100 : 100;
        _dom.cpuProgressFill.style.width = Math.min(100, Math.max(0, pct)) + '%';
        _dom.cpuRemaining.textContent = `Remaining: ${proc.remainingTime}`;
      }
    }

    _dom.cpuBox.classList.add('anim-cpu-pulse');
    setTimeout(() => _dom.cpuBox.classList.remove('anim-cpu-pulse'), 1500);
  }

  // ── Timer UI ─────────────────────────────────── 
  function updateTimer(remaining, total) {
    _dom.hudTimer.textContent = remaining;

    const pct = total > 0 ? (remaining / total * 100) : 100;
    _dom.timerRing.style.setProperty('--timer-pct', pct + '%');

    _dom.hudTimer.className = 'hud-timer';
    if (remaining <= 3)  { _dom.hudTimer.classList.add('danger'); AudioSystem.playTimerWarning(); }
    else if (remaining <= 6) { _dom.hudTimer.classList.add('warning'); }
  }

  // ── Ability Bar ──────────────────────────────── 
  function renderAbilities() {
    _dom.abilitiesRow.innerHTML = '';
    const abilities = PlayerSystem.getUnlockedAbilities();
    abilities.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'ability-btn ready';
      btn.setAttribute('data-ability', a.id);
      btn.setAttribute('aria-label', `Use ability ${a.name}`);
      btn.innerHTML = `
        <span class="ability-icon">${a.icon}</span>
        <span>${a.name}</span>
        <span class="ability-charges">${GameEngine.getAbilityCharges(a.id)} left</span>
      `;
      btn.addEventListener('click', () => onAbilityClick(a.id, btn));
      _dom.abilitiesRow.appendChild(btn);
    });
  }

  function onAbilityClick(abilityId, btn) {
    const success = GameEngine.useAbility(abilityId);
    if (!success) return;

    const charges = GameEngine.getAbilityCharges(abilityId);
    btn.querySelector('.ability-charges').textContent = charges + ' left';
    if (charges <= 0) {
      btn.classList.remove('ready');
      btn.classList.add('cooldown');
    }

    // Visual feedback
    btn.style.transform = 'scale(1.1)';
    setTimeout(() => { btn.style.transform = ''; }, 200);

    // Process scan: show extra info
    if (abilityId === 'process_scan' && _currentStep) {
      showProcessScan(_currentStep.allProcesses);
    }
  }

  function showProcessScan(processes) {
    const info = processes.map(p => `${p.id}: AT=${p.arrivalTime} BT=${p.burstTime} Pri=${p.priority} Rem=${p.remainingTime}`).join('\n');
    _dom.challengeHint.textContent = '🔍 PROCESS SCAN:\n' + info;
    _dom.challengeHint.classList.add('visible');
  }

  // ── Animations ───────────────────────────────── 
  function animatePlayerAttack() {
    _dom.playerSprite.classList.add('anim-player-attack');
    setTimeout(() => _dom.playerSprite.classList.remove('anim-player-attack'), 500);
  }

  function animateBossAttack() {
    _dom.bossSprite.classList.add('anim-boss-attack');
    setTimeout(() => _dom.bossSprite.classList.remove('anim-boss-attack'), 500);
  }

  function animateBossHurt(damage) {
    _dom.bossSprite.classList.add('anim-boss-hurt');
    setTimeout(() => _dom.bossSprite.classList.remove('anim-boss-hurt'), 500);
    showDamageNumber(_dom.bossDamageNum, damage, 'hit');
  }

  function animatePlayerHurt(damage) {
    _dom.playerSprite.classList.add('anim-player-hurt');
    setTimeout(() => _dom.playerSprite.classList.remove('anim-player-hurt'), 600);
    showDamageNumber(_dom.playerDamageNum, damage, 'hurt');

    // PC screen flicker
    if (_dom.pcScreenContent) {
      _dom.pcScreenContent.textContent = 'ERR';
      setTimeout(() => { _dom.pcScreenContent.textContent = 'OK'; }, 800);
    }
  }

  function showDamageNumber(el, amount, type) {
    el.textContent = (type === 'hit' ? '-' : '-') + amount;
    el.className = 'damage-number ' + type;
    void el.offsetWidth;
    el.classList.add('anim-damage-float');
    setTimeout(() => {
      el.className = 'damage-number';
      el.textContent = '';
    }, 1200);
  }

  function showContextSwitchFlash() {
    _dom.ctxSwitchFlash.classList.add('anim-ctx-flash');
    setTimeout(() => _dom.ctxSwitchFlash.classList.remove('anim-ctx-flash'), 900);
  }

  function showPreemptBadge() {
    _dom.preemptBadge.classList.add('show', 'anim-preempt');
    setTimeout(() => {
      _dom.preemptBadge.classList.remove('show', 'anim-preempt');
    }, 1500);
  }

  function showFeedback(correct, text) {
    _dom.challengeFeedback.textContent = text;
    _dom.challengeFeedback.className = 'challenge-feedback ' + (correct ? 'correct-fb' : 'wrong-fb');
  }

  // ── Button Helpers ───────────────────────────── 
  function markAnswerBtn(pid, type) {
    if (!pid) return;
    const btn = _dom.challengeOptions.querySelector(`[data-pid="${pid}"]`);
    if (btn) btn.classList.add(type);
  }

  function disableAnswerButtons() {
    _dom.challengeOptions.querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
    });
  }

  // ── Battle End ───────────────────────────────── 
  function onBossDefeated() {
    AudioSystem.playBossDefeated();
    _dom.bossSprite.innerHTML = `<div style="font-size:3rem;filter:grayscale(1);opacity:0.3">${GameEngine.getCurrentBossData().emoji}</div>`;

    const result = GameEngine.onBattleComplete(PlayerSystem.getState().currentHp);
    result.bossDefeated = true;
    result.playerHpRemaining = PlayerSystem.getState().currentHp;

    setTimeout(() => {
      ResultsUI.show(result);
    }, 1500);
  }

  function onPlayerDead() {
    AudioSystem.playWrong();
    document.getElementById('go-score').textContent = ScoringSystem.getState().score;
    ScreenManager.show('gameover');
  }

  // ── Controls ─────────────────────────────────── 
  function bindControls() {
    document.getElementById('btn-pause').onclick = () => {
      BattleSystem.pause();
      document.getElementById('modal-pause').style.display = 'flex';
    };

    document.getElementById('btn-resume').onclick = () => {
      BattleSystem.resume();
      document.getElementById('modal-pause').style.display = 'none';
    };

    document.getElementById('btn-pause-menu').onclick = () => {
      BattleSystem.pause();
      document.getElementById('modal-pause').style.display = 'none';
      ScreenManager.show('menu');
    };

    document.getElementById('btn-mute').onclick = (e) => {
      const muted = !AudioSystem.isMuted();
      AudioSystem.setMuted(muted);
      e.currentTarget.textContent = muted ? '🔇' : '🔊';
      PlayerSystem.setSoundEnabled(!muted);
    };

    document.getElementById('btn-learn-battle').onclick = () => {
      document.getElementById('modal-battle-learn').style.display = 'flex';
    };

    document.getElementById('btn-close-battle-learn').onclick = () => {
      document.getElementById('modal-battle-learn').style.display = 'none';
    };

    document.getElementById('btn-use-hint').onclick = () => {
      if (_hintsRemaining <= 0) return;
      _hintsRemaining--;
      ScoringSystem.useHint();
      document.getElementById('hint-count').textContent = _hintsRemaining;
      // Show explanation for current step
      if (_currentStep) {
        _dom.challengeHint.textContent = '💡 ' + _currentStep.explanation;
        _dom.challengeHint.classList.add('visible');
      }
      document.getElementById('modal-battle-learn').style.display = 'none';
      if (_hintsRemaining === 0) {
        document.getElementById('btn-use-hint').disabled = true;
      }
    };

    // Game Over buttons
    document.getElementById('btn-go-retry').onclick = () => {
      App.startLevel(GameEngine.getCurrentLevelNum());
    };
    document.getElementById('btn-go-menu').onclick = () => {
      ScreenManager.show('menu');
    };
  }

  function setupLearnModal(bossData) {
    document.getElementById('battle-learn-title').textContent = bossData.name + ' — Rules';
    document.getElementById('battle-learn-body').innerHTML = `
      <div style="font-family:var(--font-mono);font-size:0.75rem;line-height:1.8;white-space:pre-wrap;color:var(--neon-green)">
${bossData.learnRules}
      </div>
      <div style="margin-top:16px;padding:12px;background:rgba(0,245,255,0.05);border-radius:8px;border:1px solid var(--border-dim)">
        <div style="font-family:var(--font-display);font-size:0.65rem;letter-spacing:0.2em;color:var(--neon-cyan);margin-bottom:8px">WEAKNESS</div>
        <div style="font-family:var(--font-body);font-size:0.85rem;color:var(--text-secondary)">${bossData.weakness}</div>
      </div>
    `;
  }

  return { init, renderStep, updateTimer, onTimeout };
})();
