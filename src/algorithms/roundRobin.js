/**
 * Round Robin Scheduler
 * Each process gets at most timeQuantum time units before being preempted.
 * Maintains a strict FIFO ready queue.
 */
'use strict';

const RoundRobin = (() => {
  /**
   * Simulate Round Robin scheduling.
   * @param {Process[]} processes
   * @param {number} timeQuantum
   * @returns {SimulationResult}
   */
  function simulate(processes, timeQuantum = 2) {
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
    const readyQueue = [];   // FIFO queue of process refs
    const ganttEntries = [];
    let contextSwitches = 0;
    const arrived = new Set();

    // Enqueue arrivals at t=0
    procs.forEach(p => {
      if (p.arrivalTime <= 0) { p.status = 'READY'; readyQueue.push(p); arrived.add(p.id); }
    });

    const allDone = () => procs.every(p => p.status === 'COMPLETED');
    const maxTime = procs.reduce((s, p) => s + p.burstTime, 0) * 3 + 100;
    let safety = 0;

    while (!allDone() && safety++ < maxTime) {
      if (readyQueue.length === 0) {
        // Fast-forward to next arrival
        const notArrived = procs.filter(p => p.status === 'NOT_ARRIVED');
        if (notArrived.length === 0) break;
        const nextT = Math.min(...notArrived.map(p => p.arrivalTime));
        // Record idle
        if (ganttEntries.length > 0 && ganttEntries[ganttEntries.length - 1].pid === 'IDLE') {
          ganttEntries[ganttEntries.length - 1].end = nextT;
        } else {
          ganttEntries.push({ pid: 'IDLE', start: currentTime, end: nextT });
        }
        currentTime = nextT;
        procs.forEach(p => {
          if (p.status === 'NOT_ARRIVED' && p.arrivalTime <= currentTime) {
            p.status = 'READY'; readyQueue.push(p); arrived.add(p.id);
          }
        });
        continue;
      }

      const current = readyQueue.shift();
      if (current.status === 'COMPLETED') continue; // Skip if somehow completed

      if (ganttEntries.length > 0) contextSwitches++;

      if (current.startTime === null) {
        current.startTime = currentTime;
        current.responseTime = currentTime - current.arrivalTime;
      }

      const execTime = Math.min(timeQuantum, current.remainingTime);
      ganttEntries.push({ pid: current.id, start: currentTime, end: currentTime + execTime });

      // Advance time step by step, enqueuing new arrivals mid-quantum
      for (let t = 0; t < execTime; t++) {
        current.remainingTime--;
        currentTime++;
        procs.forEach(p => {
          if (!arrived.has(p.id) && p.arrivalTime <= currentTime) {
            p.status = 'READY'; readyQueue.push(p); arrived.add(p.id);
          }
        });
      }

      if (current.remainingTime <= 0) {
        current.status = 'COMPLETED';
        current.completionTime = currentTime;
        current.turnaroundTime = currentTime - current.arrivalTime;
        current.waitingTime = current.turnaroundTime - current.burstTime;
      } else {
        current.status = 'READY';
        readyQueue.push(current);
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
      cpuUtilization: +cpuUtil,
      timeQuantum
    };
  }

  /**
   * Build challenge steps for Round Robin.
   * A "decision moment" = choosing which process gets next quantum.
   */
  function buildChallengeSteps(processes, timeQuantum = 2) {
    const procs = processes.map(p => ({
      ...p,
      remainingTime: p.burstTime,
      startTime: null,
      completionTime: null,
      status: 'NOT_ARRIVED'
    }));

    const steps = [];
    let currentTime = 0;
    const readyQueue = [];
    const arrived = new Set();

    procs.forEach(p => {
      if (p.arrivalTime <= 0) { p.status = 'READY'; readyQueue.push(p); arrived.add(p.id); }
    });

    const allDone = () => procs.every(p => p.status === 'COMPLETED');
    const maxTime = procs.reduce((s, p) => s + p.burstTime, 0) * 3 + 100;
    let safety = 0;
    let isFirstDispatch = true;

    while (!allDone() && safety++ < maxTime) {
      if (readyQueue.length === 0) {
        const notArrived = procs.filter(p => p.status === 'NOT_ARRIVED');
        if (!notArrived.length) break;
        const nextT = Math.min(...notArrived.map(p => p.arrivalTime));
        currentTime = nextT;
        procs.forEach(p => {
          if (p.status === 'NOT_ARRIVED' && p.arrivalTime <= currentTime) {
            p.status = 'READY'; readyQueue.push(p); arrived.add(p.id);
          }
        });
        continue;
      }

      const next = readyQueue[0]; // peek
      // Generate a challenge step (first in queue = correct)
      steps.push({
        time: currentTime,
        algorithm: 'ROUND_ROBIN',
        readyQueue: readyQueue.map(p => ({ ...p })),
        correctAnswer: next.id,
        allProcesses: procs.map(p => ({ ...p })),
        explanation: buildRRExplanation(readyQueue, next, currentTime, timeQuantum),
        timeQuantum,
        isPreemptive: true
      });

      // Execute
      readyQueue.shift();
      if (next.startTime === null) {
        next.startTime = currentTime;
        next.responseTime = currentTime - next.arrivalTime;
      }
      const execTime = Math.min(timeQuantum, next.remainingTime);

      for (let t = 0; t < execTime; t++) {
        next.remainingTime--;
        currentTime++;
        procs.forEach(p => {
          if (!arrived.has(p.id) && p.arrivalTime <= currentTime) {
            p.status = 'READY'; readyQueue.push(p); arrived.add(p.id);
          }
        });
      }

      if (next.remainingTime <= 0) {
        next.status = 'COMPLETED';
        next.completionTime = currentTime;
        next.turnaroundTime = currentTime - next.arrivalTime;
        next.waitingTime = next.turnaroundTime - next.burstTime;
      } else {
        next.status = 'READY';
        readyQueue.push(next);
      }
      isFirstDispatch = false;
    }

    return steps;
  }

  function buildRRExplanation(queue, correct, time, quantum) {
    return `ROUND ROBIN (Time Quantum = ${quantum}).\n` +
      `The ready queue is a FIFO. The next process to execute is the one at the FRONT of the queue.\n` +
      `At time ${time}, ready queue (front → back):\n` +
      queue.map((p, i) => `  ${i === 0 ? '→' : ' '} ${p.id}: remaining=${p.remainingTime}${p === correct ? ' ← FRONT (SELECTED)' : ''}`).join('\n');
  }

  function mergeGantt(entries) {
    // RR entries should NOT be merged (different time slices shown separately)
    return entries;
  }

  function avg(procs, field) {
    const vals = procs.map(p => p[field]).filter(v => v !== null && !isNaN(v));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }

  return { simulate, buildChallengeSteps };
})();
