/**
 * Process Manager
 * Wraps the generated processes and provides runtime query/mutation API.
 * This is the single source of truth for process state during a battle.
 */
'use strict';

const ProcessManager = (() => {
  let _processes = [];
  let _onChangeCallback = null;

  function init(processes) {
    _processes = processes.map(p => ({
      id: p.id,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      remainingTime: p.burstTime,
      priority: p.priority,
      startTime: null,
      completionTime: null,
      waitingTime: null,
      turnaroundTime: null,
      responseTime: null,
      status: 'NOT_ARRIVED'
    }));
  }

  function getAll() {
    return [..._processes];
  }

  function getById(id) {
    return _processes.find(p => p.id === id) || null;
  }

  function getReady(currentTime) {
    return _processes.filter(
      p => p.arrivalTime <= currentTime && p.status === 'READY'
    );
  }

  function getRunning() {
    return _processes.find(p => p.status === 'RUNNING') || null;
  }

  function getCompleted() {
    return _processes.filter(p => p.status === 'COMPLETED');
  }

  function isAllDone() {
    return _processes.every(p => p.status === 'COMPLETED');
  }

  function updateArrivals(currentTime) {
    _processes.forEach(p => {
      if (p.status === 'NOT_ARRIVED' && p.arrivalTime <= currentTime) {
        p.status = 'READY';
      }
    });
  }

  function setRunning(id, currentTime) {
    const p = getById(id);
    if (!p) return;
    p.status = 'RUNNING';
    if (p.startTime === null) {
      p.startTime = currentTime;
      p.responseTime = currentTime - p.arrivalTime;
    }
  }

  function setReady(id) {
    const p = getById(id);
    if (p && p.status !== 'COMPLETED') p.status = 'READY';
  }

  function tick(id, currentTime) {
    const p = getById(id);
    if (!p || p.status !== 'RUNNING') return false;
    p.remainingTime--;
    if (p.remainingTime <= 0) {
      p.status = 'COMPLETED';
      p.completionTime = currentTime + 1;
      p.turnaroundTime = p.completionTime - p.arrivalTime;
      p.waitingTime = p.turnaroundTime - p.burstTime;
      return true; // completed
    }
    return false;
  }

  function setOnChange(cb) {
    _onChangeCallback = cb;
  }

  function snapshot() {
    return _processes.map(p => ({ ...p }));
  }

  return {
    init, getAll, getById, getReady, getRunning, getCompleted,
    isAllDone, updateArrivals, setRunning, setReady, tick, snapshot,
    setOnChange
  };
})();
