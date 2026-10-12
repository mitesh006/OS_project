/**
 * FCFS — First Come First Serve Scheduler
 * Non-preemptive. Selects the process with the earliest arrival time.
 * Tie-breaking: arrival time → PID (alphanumeric).
 */
'use strict';

const FCFS = (() => {
  /**
   * Given the current set of processes and the current time,
   * return which process should run next according to FCFS.
   * @param {Process[]} processes - All processes (may include completed ones)
   * @param {number} currentTime
   * @returns {Process|null}
   */
  function selectNext(processes, currentTime) {
    const ready = processes.filter(
      p => p.arrivalTime <= currentTime && p.status === 'READY'
    );
    if (ready.length === 0) return null;

    // Sort: earliest arrival → smallest PID
    ready.sort((a, b) => {
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });
    return ready[0];
  }

  /**
   * Run a full simulation. Returns complete scheduling history.
   * @param {Process[]} processes - Array of process definitions
   * @returns {SimulationResult}
   */
  function simulate(processes) {
    // Deep clone to avoid mutation
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
    const ganttEntries = [];   // { pid, start, end }
    let contextSwitches = 0;

    const allDone = () => procs.every(p => p.status === 'COMPLETED');
    const maxTime = procs.reduce((s, p) => s + p.burstTime, 0) +
                    Math.max(...procs.map(p => p.arrivalTime)) + 100;
    let safety = 0;

    while (!allDone() && safety++ < maxTime) {
      // Update statuses
      procs.forEach(p => {
        if (p.status === 'NOT_ARRIVED' && p.arrivalTime <= currentTime) {
          p.status = 'READY';
        }
      });

      if (!currentProcess || currentProcess.status === 'COMPLETED') {
        const next = selectNext(procs, currentTime);
        if (!next) {
          // CPU idle
          currentTime++;
          if (ganttEntries.length > 0 && ganttEntries[ganttEntries.length - 1].pid === 'IDLE') {
            ganttEntries[ganttEntries.length - 1].end = currentTime;
          } else {
            ganttEntries.push({ pid: 'IDLE', start: currentTime - 1, end: currentTime });
          }
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

      // Extend last gantt entry
      ganttEntries[ganttEntries.length - 1].end = currentTime + 1;
      currentProcess.remainingTime--;
      currentTime++;

      if (currentProcess.remainingTime <= 0) {
        currentProcess.status = 'COMPLETED';
        currentProcess.completionTime = currentTime;
        currentProcess.turnaroundTime = currentProcess.completionTime - currentProcess.arrivalTime;
        currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
        currentProcess = null;
      }
    }

    // Merge consecutive same-pid gantt entries
    const mergedGantt = mergeGantt(ganttEntries);

    const avgWaiting     = avg(procs, 'waitingTime');
    const avgTurnaround  = avg(procs, 'turnaroundTime');
    const avgResponse    = avg(procs, 'responseTime');
    const totalTime      = currentTime;
    const cpuBusy        = procs.reduce((s, p) => s + p.burstTime, 0);
    const cpuUtil        = totalTime > 0 ? ((cpuBusy / totalTime) * 100).toFixed(1) : '0.0';

    return {
      processes: procs,
      gantt: mergedGantt,
      contextSwitches,
      avgWaitingTime:    +avgWaiting.toFixed(2),
      avgTurnaroundTime: +avgTurnaround.toFixed(2),
      avgResponseTime:   +avgResponse.toFixed(2),
      totalTime,
      cpuUtilization:    +cpuUtil
    };
  }

  /**
   * Build a step-by-step walkthrough for the game challenge system.
   * Returns an ordered list of "decision moments" with correct answer.
   * @param {Process[]} processes
   * @returns {DecisionStep[]}
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
                    Math.max(...procs.map(p => p.arrivalTime)) + 20;
    let safety = 0;

    while (procs.some(p => p.status !== 'COMPLETED') && safety++ < maxTime) {
      procs.forEach(p => {
        if (p.status === 'NOT_ARRIVED' && p.arrivalTime <= currentTime) {
          p.status = 'READY';
        }
      });

      if (!currentProcess || currentProcess.status === 'COMPLETED') {
        const ready = procs.filter(p => p.status === 'READY');
        if (ready.length === 0) { currentTime++; continue; }

        const candidates = [...ready];
        const correct = selectNext(procs, currentTime);

        // Build a snapshot for the challenge
        steps.push({
          time: currentTime,
          algorithm: 'FCFS',
          readyQueue: candidates.map(p => ({ ...p })),
          correctAnswer: correct.id,
          allProcesses: procs.map(p => ({ ...p })),
          explanation: buildFCFSExplanation(candidates, correct, currentTime)
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
        currentProcess.turnaroundTime = currentProcess.completionTime - currentProcess.arrivalTime;
        currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
        currentProcess = null;
      }
    }

    return steps;
  }

  function buildFCFSExplanation(candidates, correct, time) {
    const sorted = [...candidates].sort((a, b) =>
      a.arrivalTime !== b.arrivalTime
        ? a.arrivalTime - b.arrivalTime
        : a.id.localeCompare(b.id, undefined, { numeric: true })
    );
    return `FCFS selects the process that arrived earliest.\n` +
      `At time ${time}, available processes (sorted by arrival):\n` +
      sorted.map(p => `  ${p.id}: arrived=${p.arrivalTime}${p === correct ? ' ← SELECTED' : ''}`).join('\n');
  }

  function mergeGantt(entries) {
    if (entries.length === 0) return [];
    const merged = [{ ...entries[0] }];
    for (let i = 1; i < entries.length; i++) {
      const last = merged[merged.length - 1];
      if (last.pid === entries[i].pid && last.end === entries[i].start) {
        last.end = entries[i].end;
      } else {
        merged.push({ ...entries[i] });
      }
    }
    return merged;
  }

  function avg(procs, field) {
    const vals = procs.map(p => p[field]).filter(v => v !== null && !isNaN(v));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }

  return { selectNext, simulate, buildChallengeSteps };
})();
