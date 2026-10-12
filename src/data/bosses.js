/**
 * Boss Data Definitions
 * Each boss represents a CPU scheduling algorithm.
 * Includes personality, mechanics, and visual identity.
 */
'use strict';

const BOSS_DATA = {
  fcfs: {
    id: 'fcfs',
    name: 'FCFS KING',
    title: 'First Come First Serve',
    algorithm: 'FCFS',
    level: 1,
    hp: 100,
    emoji: '👑',
    color: '#00f5ff',
    gradient: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(0,100,200,0.05))',
    glow: 'rgba(0,245,255,0.4)',
    difficulty: 1,
    personality: 'A slow, powerful king who believes order must never be broken.',
    quote: '"First come. First served. That is the only law I know."',
    specialMove: 'QUEUE LOCK',
    specialDesc: 'Once a process begins, it runs until completion. No exceptions.',
    weakness: 'Convoy Effect — slow processes can block faster ones.',
    rules: [
      'The process that arrives FIRST gets the CPU first.',
      'Once a process starts, it runs until COMPLETION (non-preemptive).',
      'Sort the ready queue by ARRIVAL TIME.',
      'Tie-break: earlier arrival wins. Same arrival → smaller PID wins.'
    ],
    type: 'Non-Preemptive',
    tags: ['Non-Preemptive', 'FIFO', 'Easy'],
    hint: 'Look at the Arrival Time — the smallest value wins.',
    learnRules: `FCFS — First Come First Serve\n\nType: Non-Preemptive\n\nRule:\n  Choose the process with the SMALLEST arrival time.\n  Once selected, it runs to completion.\n\nTie-breaking:\n  Same arrival → pick the one with smaller PID (P1 < P2 < P3...).\n\nCommon mistake:\n  Choosing the shortest burst time instead of earliest arrival.\n  That's SJF, not FCFS!\n\nExample:\n  P1: arrives=0, burst=5\n  P2: arrives=2, burst=2\n  P3: arrives=4, burst=3\n  Order: P1 → P2 → P3`
  },

  sjf: {
    id: 'sjf',
    name: 'SJF ASSASSIN',
    title: 'Shortest Job First',
    algorithm: 'SJF',
    level: 2,
    hp: 150,
    emoji: '🗡️',
    color: '#ff8c00',
    gradient: 'linear-gradient(135deg, rgba(255,140,0,0.1), rgba(200,60,0,0.05))',
    glow: 'rgba(255,140,0,0.4)',
    difficulty: 2,
    personality: 'A fast, calculating assassin who always targets the weakest prey first.',
    quote: '"I waste no time. Short jobs die first. Efficiency is my art."',
    specialMove: 'QUICK STRIKE',
    specialDesc: 'The process with the smallest burst time is targeted first.',
    weakness: 'Starvation — long processes may never get the CPU.',
    rules: [
      'Look at all CURRENTLY AVAILABLE (arrived) processes.',
      'Choose the process with the SHORTEST BURST TIME.',
      'Non-preemptive — once started, runs until done.',
      'Tie-break: shortest burst → earliest arrival → smaller PID.'
    ],
    type: 'Non-Preemptive',
    tags: ['Non-Preemptive', 'Burst-Based', 'Medium'],
    hint: 'Burst Time is the key — smallest burst time wins among ready processes.',
    learnRules: `SJF — Shortest Job First\n\nType: Non-Preemptive\n\nRule:\n  Among all processes that have ARRIVED, choose the one with\n  the SMALLEST burst time.\n\nTie-breaking:\n  Same burst → earliest arrival → smaller PID.\n\nCommon mistake:\n  Including processes that haven't arrived yet!\n  Only consider processes where arrivalTime ≤ currentTime.\n\nExample:\n  At time 3:\n  P1: arrived=0, burst=8 (available)\n  P2: arrived=2, burst=3 (available)\n  P3: arrived=5, burst=2 (NOT yet arrived!)\n  → Select P2 (burst=3, shortest available)`
  },

  priority: {
    id: 'priority',
    name: 'PRIORITY OVERLORD',
    title: 'Priority Scheduling',
    algorithm: 'PRIORITY',
    level: 3,
    hp: 200,
    emoji: '⚡',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(100,30,200,0.05))',
    glow: 'rgba(168,85,247,0.4)',
    difficulty: 3,
    personality: 'An obsessive ruler of hierarchy who demands processes respect the chain of command.',
    quote: '"Priority is not a suggestion. It is LAW. Number 1 rules all."',
    specialMove: 'PRIORITY OVERRIDE',
    specialDesc: 'The lowest priority number always takes control. Rank matters above all.',
    weakness: 'Starvation of low-priority processes (indefinite blocking).',
    rules: [
      '⚠️ LOWER NUMBER = HIGHER PRIORITY (Priority 1 > Priority 2 > Priority 3...)',
      'Choose the ready process with the LOWEST priority number.',
      'Non-preemptive — once started, runs to completion.',
      'Tie-break: same priority → earliest arrival → smaller PID.'
    ],
    type: 'Non-Preemptive',
    tags: ['Non-Preemptive', 'Priority-Based', 'Medium/Hard'],
    hint: 'LOWER priority NUMBER = HIGHER importance. Pick the smallest priority value.',
    learnRules: `PRIORITY — Priority Scheduling\n\nType: Non-Preemptive\n\n⚠️ KEY RULE: Lower number = Higher priority!\n  Priority 1 is the MOST important.\n  Priority 5 is the LEAST important.\n\nRule:\n  Among all arrived processes, choose the one with\n  the SMALLEST priority number.\n\nTie-breaking:\n  Same priority → earliest arrival → smaller PID.\n\nCommon mistake:\n  Choosing the LARGEST priority number thinking it's higher priority.\n  In this game: Priority 1 BEATS Priority 5!\n\nExample:\n  P1: priority=3\n  P2: priority=1  ← SELECTED (lowest number = highest priority)\n  P3: priority=5`
  },

  roundRobin: {
    id: 'roundRobin',
    name: 'ROUND ROBIN WARRIOR',
    title: 'Round Robin',
    algorithm: 'ROUND_ROBIN',
    level: 4,
    hp: 250,
    emoji: '🔄',
    color: '#00ff88',
    gradient: 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,200,80,0.05))',
    glow: 'rgba(0,255,136,0.4)',
    difficulty: 4,
    personality: 'A relentless warrior who gives everyone an equal chance — for exactly one time quantum.',
    quote: '"Fair rotation is my weapon. No process holds the CPU forever!"',
    specialMove: 'TIME SLICE',
    specialDesc: 'Each process gets exactly the time quantum. Then it goes to the back of the queue.',
    weakness: 'High context switch overhead when quantum is too small.',
    timeQuantum: 2,
    rules: [
      'Maintain a FIFO ready queue.',
      'Each process runs for at most TIME QUANTUM units.',
      'If not finished, the process goes to the BACK of the queue.',
      'New arrivals during execution join the back of the queue.',
      'The process at the FRONT of the queue runs next.'
    ],
    type: 'Preemptive',
    tags: ['Preemptive', 'FIFO Queue', 'Time Quantum', 'Hard'],
    hint: 'The FRONT of the ready queue always runs next. Remember the FIFO order!',
    learnRules: `ROUND ROBIN — Time-Sharing Scheduler\n\nType: Preemptive (time quantum based)\n\nTime Quantum: 2 (configurable per level)\n\nRule:\n  1. Maintain a FIFO queue.\n  2. Run the front process for min(quantum, remaining) time.\n  3. If not done, push it to the BACK of the queue.\n  4. Repeat until all processes complete.\n\nKey: The question asks which process is at the FRONT of the queue next.\n\nCommon mistake:\n  Forgetting which processes have been queued and in what order.\n  Track the FIFO order carefully!\n\nExample (quantum=2):\n  Queue: [P1(5), P2(3), P3(4)]\n  Run P1 for 2 → Queue: [P2(3), P3(4), P1(3)]\n  Run P2 for 2 → Queue: [P3(4), P1(3), P2(1)]\n  Run P3 for 2 → Queue: [P1(3), P2(1), P3(2)]`
  },

  srtf: {
    id: 'srtf',
    name: 'SRTF REAPER',
    title: 'Shortest Remaining Time First',
    algorithm: 'SRTF',
    level: 5,
    hp: 300,
    emoji: '💀',
    color: '#ff2d5a',
    gradient: 'linear-gradient(135deg, rgba(255,45,90,0.1), rgba(180,0,40,0.05))',
    glow: 'rgba(255,45,90,0.5)',
    difficulty: 5,
    personality: 'A dangerous reaper who can interrupt anyone. Speed is the only mercy.',
    quote: '"I cut through anything that takes too long. Your remaining time is my weapon."',
    specialMove: 'PREEMPT',
    specialDesc: 'When a new process with shorter remaining time arrives, the current process is cut!',
    weakness: 'Context switch overhead. Can starve long processes.',
    rules: [
      'PREEMPTIVE — a running process CAN be interrupted!',
      'At every moment, run the process with SHORTEST REMAINING TIME.',
      'When a new process arrives, compare its burst with current remaining time.',
      'If new process is shorter → PREEMPT current → switch to new one.',
      'Tie-break: same remaining → earliest arrival → smaller PID.'
    ],
    type: 'Preemptive',
    tags: ['Preemptive', 'Remaining-Time', 'Very Hard', 'No Hints'],
    hint: null, // No hints for SRTF boss
    learnRules: `SRTF — Shortest Remaining Time First\n\nType: PREEMPTIVE SJF\n\nRule:\n  Always run the process with the SHORTEST REMAINING time.\n  If a new process arrives with a shorter burst, PREEMPT the current!\n\nTie-breaking:\n  Same remaining → earliest arrival → smaller PID.\n\nCommon mistake:\n  Using original burst time instead of REMAINING time!\n  As processes run, their remaining time decreases.\n\nExample:\n  t=0: P1(burst=8) starts → P1 remaining=8\n  t=1: P2(burst=4) arrives → P2 remaining=4 < P1 remaining=7\n  → PREEMPT! Switch to P2\n  t=5: P2 finishes → P1 remaining=7, P1 continues`
  },

  kernel: {
    id: 'kernel',
    name: 'THE KERNEL',
    title: 'Multi-Algorithm Final Boss',
    algorithm: 'MIXED',
    level: 6,
    hp: 500,
    emoji: '🔮',
    color: '#ffd700',
    gradient: 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(180,100,0,0.05))',
    glow: 'rgba(255,215,0,0.5)',
    difficulty: 6,
    personality: 'The ultimate master of the CPU. It knows every scheduling algorithm and uses them all.',
    quote: '"I AM the kernel. I control every process, every quantum, every priority. You cannot master what you do not understand."',
    specialMove: 'ALGORITHM SHIFT',
    specialDesc: 'The boss switches between ALL scheduling algorithms across multiple rounds.',
    weakness: 'A player who has truly mastered all five scheduling algorithms.',
    rules: [
      'Round 1: FCFS Challenge',
      'Round 2: SJF Challenge',
      'Round 3: Priority Challenge',
      'Round 4: Round Robin Challenge',
      'Round 5: SRTF Challenge',
      'Round 6: Identify the algorithm from process behavior!'
    ],
    type: 'Mixed',
    tags: ['All Algorithms', 'Final Boss', 'Identification', 'Extreme'],
    hint: null,
    learnRules: 'THE KERNEL uses all scheduling algorithms. Review each one carefully before battle.'
  }
};

// Array in order
const BOSS_LIST = [
  BOSS_DATA.fcfs,
  BOSS_DATA.sjf,
  BOSS_DATA.priority,
  BOSS_DATA.roundRobin,
  BOSS_DATA.srtf,
  BOSS_DATA.kernel
];
