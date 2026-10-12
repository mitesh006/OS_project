/**
 * SRTF — Shortest Remaining Time First (Preemptive SJF)
 * At every new process arrival, check if current process should be preempted.
 * Tie-breaking: remaining time → arrival time → PID
 */
'use strict';

const SRTF = (() => {
  function selectNext(processes, currentTime) {
    const ready = processes.filter(
      p => p.arrivalTime <= currentTime && (p.status === 'READY' || p.status === 'RUNNING')
    );
    if (ready.length === 0) return null;

    ready.sort((a, b) => {
      if (a.remainingTime !== b.remainingTime) return a.remainingTime - b.remainingTime;
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });
    return ready[0];
  }

  function simulate(processes) {
    const procs = processes.map(p => ({
      ...p,
      remainingTime: p.burstTime,
      startTime: null,
      completionTime: null,
      waitingTime: null,
      turnaroundTime: null,
      responseTime: null,
      status: 'NOT_ARRIVED'
    }));

    let currentTime = 0;
    let currentProcess = null;
    const ganttEntries = [];
    let contextSwitches = 0;
    let preemptions = 0;

    const allDone = () => procs.every(p => p.status === 'COMPLETED');
    const maxTime = procs.reduce((s, p) => s + p.burstTime, 0) +
                    Math.max(...procs.map(p => p.arrivalTime)) + 100;
    let safety = 0;

    while (!allDone() && safety++ < maxTime) {
      // Update arrivals
      procs.forEach(p => {
        if (p.status === 'NOT_ARRIVED' && p.arrivalTime <= currentTime) {
          p.status = 'READY';
        }
      });

      const best = selectNext(procs, currentTime);

      if (!best) {
        currentTime++;
        const last = ganttEntries[ganttEntries.length - 1];
        if (last && last.pid === 'IDLE') last.end = currentTime;
        else ganttEntries.push({ pid: 'IDLE', start: currentTime - 1, end: currentTime });
        continue;
      }

      // Preemption check
      if (currentProcess && currentProcess !== best && currentProcess.status !== 'COMPLETED') {
        currentProcess.status = 'READY';
        preemptions++;
        contextSwitches++;
      }

      if (currentProcess !== best) {
        if (currentProcess && currentProcess.status !== 'COMPLETED') contextSwitches++;
        currentProcess = best;
      }

      if (currentProcess.status !== 'RUNNING') {
        currentProcess.status = 'RUNNING';
        if (currentProcess.startTime === null) {
          currentProcess.startTime = currentTime;
          currentProcess.responseTime = currentTime - currentProcess.arrivalTime;
        }
      }

      // Push gantt
      const last = ganttEntries[ganttEntries.length - 1];
      if (last && last.pid === currentProcess.id && last.end === currentTime) {
        last.end = currentTime + 1;
      } else {
        ganttEntries.push({ pid: currentProcess.id, start: currentTime, end: currentTime + 1 });
      }

      currentProcess.remainingTime--;
      currentTime++;

      if (currentProcess.remainingTime <= 0) {
        currentProcess.status = 'COMPLETED';
        currentProcess.completionTime = currentTime;
        currentProcess.turnaroundTime = currentTime - currentProcess.arrivalTime;
        currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
        currentProcess = null;
      }
    }

    const mergedGantt = mergeGantt(ganttEntries);
    const cpuBusy = procs.reduce((s, p) => s + p.burstTime, 0);
    const cpuUtil = currentTime > 0 ? ((cpuBusy / currentTime) * 100).toFixed(1) : '0.0';

    return {
      processes: procs,
      gantt: mergedGantt,
      contextSwitches,
      preemptions,
      avgWaitingTime:    +avg(procs, 'waitingTime').toFixed(2),
      avgTurnaroundTime: +avg(procs, 'turnaroundTime').toFixed(2),
      avgResponseTime:   +avg(procs, 'responseTime').toFixed(2),
      totalTime: currentTime,
      cpuUtilization: +cpuUtil
    };
  }

  /**
   * Build challenge steps. For SRTF, a challenge step is generated at every
   * decision point: when CPU is free OR when a new process arrives.
   */
  function buildChallengeSteps(processes) {
    const procs = processes.map(p => ({
      ...p,
      remainingTime: p.burstTime,
      startTime: null,
      completionTime: null,
      status: 'NOT_ARRIVED'
    }));

    const steps = [];
    let currentTime = 0;
    let currentProcess = null;
    const maxTime = procs.reduce((s, p) => s + p.burstTime, 0) +
                    Math.max(...procs.map(p => p.arrivalTime)) + 30;
    let safety = 0;

    // Collect all "interesting" times: arrivals + completions
    const keyTimes = new Set(procs.map(p => p.arrivalTime));
    keyTimes.add(0);

    while (procs.some(p => p.status !== 'COMPLETED') && safety++ < maxTime) {
      procs.forEach(p => {
        if (p.status === 'NOT_ARRIVED' && p.arrivalTime <= currentTime) p.status = 'READY';
      });

      const best = selectNext(procs, currentTime);
      if (!best) { currentTime++; continue; }

      // If we need to make a decision (start or preempt)
      const needsDecision = !currentProcess ||
        currentProcess.status === 'COMPLETED' ||
        (best !== currentProcess);

      if (needsDecision) {
        const ready = procs.filter(
          p => p.arrivalTime <= currentTime && (p.status === 'READY' || p.status === 'RUNNING')
        );
        const wasPreempted = currentProcess && currentProcess !== best && currentProcess.status !== 'COMPLETED';

        steps.push({
          time: currentTime,
          algorithm: 'SRTF',
          readyQueue: ready.map(p => ({ ...p })),
          correctAnswer: best.id,
          allProcesses: procs.map(p => ({ ...p })),
          explanation: buildSRTFExplanation(ready, best, currentTime, wasPreempted ? currentProcess : null),
          isPreemptive: true,
          wasPreempted
        });

        if (currentProcess && currentProcess !== best && currentProcess.status !== 'COMPLETED') {
          currentProcess.status = 'READY';
        }
        currentProcess = best;
        if (currentProcess.startTime === null) {
          currentProcess.startTime = currentTime;
          currentProcess.responseTime = currentTime - currentProcess.arrivalTime;
        }
        currentProcess.status = 'RUNNING';
      }

      currentProcess.remainingTime--;
      currentTime++;

      if (currentProcess.remainingTime <= 0) {
        currentProcess.status = 'COMPLETED';
        currentProcess.completionTime = currentTime;
        currentProcess.turnaroundTime = currentTime - currentProcess.arrivalTime;
        currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
        currentProcess = null;
      }
    }

    return steps;
  }

  function buildSRTFExplanation(candidates, correct, time, preempted) {
    const sorted = [...candidates].sort((a, b) =>
      a.remainingTime !== b.remainingTime ? a.remainingTime - b.remainingTime : a.arrivalTime - b.arrivalTime
    );
    let text = `SRTF: Selects process with SHORTEST REMAINING TIME.\n`;
    if (preempted) {
      text += `PREEMPTION! ${preempted.id} (remaining=${preempted.remainingTime + 1}) ` +
              `preempted by ${correct.id} (remaining=${correct.remainingTime}).\n`;
    }
    text += `At time ${time}, candidates (sorted by remaining time):\n` +
      sorted.map(p => `  ${p.id}: remaining=${p.remainingTime}${p === correct ? ' ← SELECTED' : ''}`).join('\n');
    return text;
  }

  function mergeGantt(entries) {
    if (!entries.length) return [];
    const m = [{ ...entries[0] }];
    for (let i = 1; i < entries.length; i++) {
      const last = m[m.length - 1];
      if (last.pid === entries[i].pid && last.end === entries[i].start) last.end = entries[i].end;
      else m.push({ ...entries[i] });
    }
    return m;
  }

  function avg(procs, field) {
    const vals = procs.map(p => p[field]).filter(v => v !== null && !isNaN(v));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }

  return { selectNext, simulate, buildChallengeSteps };
})();
