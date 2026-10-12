/**
 * SJF — Shortest Job First (Non-Preemptive)
 * Selects the ready process with the smallest burst time.
 * Tie-breaking: burst time → arrival time → PID
 */
'use strict';

const SJF = (() => {
  function selectNext(processes, currentTime) {
    const ready = processes.filter(
      p => p.arrivalTime <= currentTime && p.status === 'READY'
    );
    if (ready.length === 0) return null;

    ready.sort((a, b) => {
      if (a.burstTime !== b.burstTime) return a.burstTime - b.burstTime;
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

    const allDone = () => procs.every(p => p.status === 'COMPLETED');
    const maxTime = procs.reduce((s, p) => s + p.burstTime, 0) +
                    Math.max(...procs.map(p => p.arrivalTime)) + 100;
    let safety = 0;

    while (!allDone() && safety++ < maxTime) {
      procs.forEach(p => {
        if (p.status === 'NOT_ARRIVED' && p.arrivalTime <= currentTime) p.status = 'READY';
      });

      if (!currentProcess || currentProcess.status === 'COMPLETED') {
        const next = selectNext(procs, currentTime);
        if (!next) {
          currentTime++;
          const last = ganttEntries[ganttEntries.length - 1];
          if (last && last.pid === 'IDLE') { last.end = currentTime; }
          else ganttEntries.push({ pid: 'IDLE', start: currentTime - 1, end: currentTime });
          continue;
        }
        if (currentProcess && currentProcess !== next) contextSwitches++;
        currentProcess = next;
        currentProcess.status = 'RUNNING';
        if (currentProcess.startTime === null) {
          currentProcess.startTime = currentTime;
          currentProcess.responseTime = currentTime - currentProcess.arrivalTime;
        }
        ganttEntries.push({ pid: currentProcess.id, start: currentTime, end: currentTime });
      }

      ganttEntries[ganttEntries.length - 1].end = currentTime + 1;
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
      avgWaitingTime:    +avg(procs, 'waitingTime').toFixed(2),
      avgTurnaroundTime: +avg(procs, 'turnaroundTime').toFixed(2),
      avgResponseTime:   +avg(procs, 'responseTime').toFixed(2),
      totalTime: currentTime,
      cpuUtilization: +cpuUtil
    };
  }

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
                    Math.max(...procs.map(p => p.arrivalTime)) + 20;
    let safety = 0;

    while (procs.some(p => p.status !== 'COMPLETED') && safety++ < maxTime) {
      procs.forEach(p => {
        if (p.status === 'NOT_ARRIVED' && p.arrivalTime <= currentTime) p.status = 'READY';
      });

      if (!currentProcess || currentProcess.status === 'COMPLETED') {
        const ready = procs.filter(p => p.status === 'READY');
        if (ready.length === 0) { currentTime++; continue; }

        const correct = selectNext(procs, currentTime);
        steps.push({
          time: currentTime,
          algorithm: 'SJF',
          readyQueue: ready.map(p => ({ ...p })),
          correctAnswer: correct.id,
          allProcesses: procs.map(p => ({ ...p })),
          explanation: buildSJFExplanation(ready, correct, currentTime)
        });

        currentProcess = correct;
        currentProcess.status = 'RUNNING';
        if (currentProcess.startTime === null) currentProcess.startTime = currentTime;
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

  function buildSJFExplanation(candidates, correct, time) {
    const sorted = [...candidates].sort((a, b) =>
      a.burstTime !== b.burstTime ? a.burstTime - b.burstTime : a.arrivalTime - b.arrivalTime
    );
    return `SJF selects the process with the SHORTEST burst time.\n` +
      `At time ${time}, available processes (sorted by burst):\n` +
      sorted.map(p => `  ${p.id}: burst=${p.burstTime}${p === correct ? ' ← SELECTED (shortest)' : ''}`).join('\n');
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
