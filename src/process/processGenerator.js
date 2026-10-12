/**
 * Process Generator
 * Creates valid, non-trivial process scenarios for each scheduling algorithm.
 * Ensures no degenerate cases (negative bursts, duplicate PIDs, etc.)
 */
'use strict';

const ProcessGenerator = (() => {
  /**
   * Seeded pseudo-random number generator (LCG)
   * Allows reproducible test scenarios.
   */
  function makeRng(seed) {
    let s = seed >>> 0;
    return function() {
      s = (Math.imul(1664525, s) + 1013904223) >>> 0;
      return s / 0xFFFFFFFF;
    };
  }

  /**
   * Generate processes for a given level config.
   * @param {object} config - { count, algorithm, complexity, seed? }
   * @returns {Process[]}
   */
  function generate(config) {
    const {
      count = 4,
      algorithm = 'FCFS',
      complexity = 'low',
      seed = Date.now()
    } = config;

    const rng = makeRng(seed);

    // Burst time ranges by complexity
    const burstRange = {
      low:       [2, 8],
      medium:    [2, 10],
      high:      [1, 12],
      'very-high': [1, 15]
    };
    const [minB, maxB] = burstRange[complexity] || [2, 8];

    // Priority ranges
    const [minP, maxP] = [1, 6];

    const processes = [];

    // Generate arrival times: ensure they are spread out and interesting
    let arrivals = generateArrivals(count, complexity, rng);

    for (let i = 0; i < count; i++) {
      const pid = `P${i + 1}`;
      const arrivalTime = arrivals[i];
      const burstTime = Math.max(1, Math.floor(rng() * (maxB - minB + 1)) + minB);
      const priority = Math.floor(rng() * (maxP - minP + 1)) + minP;

      processes.push({
        id: pid,
        arrivalTime,
        burstTime,
        remainingTime: burstTime,
        priority,
        startTime: null,
        completionTime: null,
        waitingTime: null,
        turnaroundTime: null,
        responseTime: null,
        status: 'NOT_ARRIVED'
      });
    }

    // Validate and fix
    return validate(processes, algorithm);
  }

  /**
   * Generate spread arrival times. Ensures at least one process arrives at t=0.
   */
  function generateArrivals(count, complexity, rng) {
    const maxSpread = { low: 6, medium: 8, high: 10, 'very-high': 12 };
    const spread = maxSpread[complexity] || 6;

    const arrivals = [0]; // First process always at 0
    for (let i = 1; i < count; i++) {
      const prev = arrivals[i - 1];
      const gap = Math.floor(rng() * spread) + (complexity === 'low' ? 1 : 0);
      arrivals.push(prev + gap);
    }

    // Shuffle slightly but keep first at 0
    for (let i = arrivals.length - 1; i > 1; i--) {
      const j = Math.floor(rng() * (i - 1)) + 1;
      [arrivals[i], arrivals[j]] = [arrivals[j], arrivals[i]];
    }

    return arrivals.sort((a, b) => a - b);
  }

  /**
   * Validate processes — fix invalid data.
   */
  function validate(processes, algorithm) {
    const seen = new Set();
    return processes.map((p, i) => {
      // Unique PID
      if (seen.has(p.id)) p.id = `P${i + 10}`;
      seen.add(p.id);

      // Non-negative arrival
      if (p.arrivalTime < 0) p.arrivalTime = 0;

      // Burst >= 1
      if (p.burstTime < 1) p.burstTime = 1;

      // Priority in [1, 10]
      if (p.priority < 1) p.priority = 1;
      if (p.priority > 10) p.priority = 10;

      p.remainingTime = p.burstTime;
      return p;
    });
  }

  /**
   * Generate a guaranteed-interesting scenario for SJF.
   * Ensures there are processes with distinct burst times.
   */
  function generateForSJF(count, seed) {
    const procs = generate({ count, algorithm: 'SJF', complexity: 'medium', seed });
    // Make sure no two processes have exactly the same burst time (for clarity)
    const usedBursts = new Set();
    procs.forEach(p => {
      while (usedBursts.has(p.burstTime)) p.burstTime++;
      usedBursts.add(p.burstTime);
      p.remainingTime = p.burstTime;
    });
    return procs;
  }

  /**
   * Generate a scenario with interesting priority conflicts.
   */
  function generateForPriority(count, seed) {
    const procs = generate({ count, algorithm: 'PRIORITY', complexity: 'medium', seed });
    // Ensure at least 2 distinct priorities, possibly with ties
    const priorities = [1, 1, 2, 3, 4, 5];
    const rng = makeRng(seed + 1);
    procs.forEach((p, i) => {
      p.priority = priorities[Math.floor(rng() * priorities.length)];
    });
    return procs;
  }

  /**
   * Create hard-coded preset scenarios for teaching demos.
   */
  function preset(name) {
    const presets = {
      fcfs_basic: [
        { id: 'P1', arrivalTime: 0, burstTime: 7, priority: 2 },
        { id: 'P2', arrivalTime: 2, burstTime: 4, priority: 3 },
        { id: 'P3', arrivalTime: 4, burstTime: 1, priority: 1 }
      ],
      sjf_basic: [
        { id: 'P1', arrivalTime: 0, burstTime: 8, priority: 2 },
        { id: 'P2', arrivalTime: 1, burstTime: 4, priority: 3 },
        { id: 'P3', arrivalTime: 2, burstTime: 2, priority: 1 }
      ],
      rr_basic: [
        { id: 'P1', arrivalTime: 0, burstTime: 5, priority: 2 },
        { id: 'P2', arrivalTime: 1, burstTime: 3, priority: 3 },
        { id: 'P3', arrivalTime: 2, burstTime: 4, priority: 1 }
      ],
      srtf_basic: [
        { id: 'P1', arrivalTime: 0, burstTime: 8, priority: 2 },
        { id: 'P2', arrivalTime: 1, burstTime: 4, priority: 1 },
        { id: 'P3', arrivalTime: 2, burstTime: 2, priority: 3 }
      ]
    };

    const base = presets[name] || presets.fcfs_basic;
    return base.map(p => ({
      ...p,
      remainingTime: p.burstTime,
      startTime: null,
      completionTime: null,
      waitingTime: null,
      turnaroundTime: null,
      responseTime: null,
      status: 'NOT_ARRIVED'
    }));
  }

  return { generate, generateForSJF, generateForPriority, preset, makeRng };
})();
