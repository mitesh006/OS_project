# OS Scheduler Boss Rush — "Battle of the CPU"

## Project Overview
"OS Scheduler Boss Rush" is a complete, polished, playable educational browser game that gamifies Operating System CPU scheduling algorithms. Built for college OS courses and demonstrations, it takes abstract scheduling concepts and turns them into a fast-paced, interactive boss-battle experience.

## Game Concept
Different CPU scheduling algorithms are represented as unique boss characters. The player controls a computer/PC character and battles each scheduler boss by correctly understanding and predicting their CPU scheduling decisions.

## Features
- **Progressive Boss Rush**: Fight through 5 distinct bosses and a final kernel challenge.
- **Dynamic Scenarios**: Seed-based procedural process generation ensures every battle is slightly different while remaining solvable.
- **Real-Time OS Visualization**: View the Ready Queue, CPU state, and context switches in real-time.
- **Interactive Combat**: Predict the scheduler's next move. Correct answers deal damage and build combos; wrong answers cause player damage.
- **Upgrades & Progression**: Unlock max HP, new abilities, and game modes.
- **Post-Battle Metrics**: View an auto-generated Gantt Chart, average waiting times, turnaround times, and CPU utilization.
- **Demo Mode**: Specifically designed for college project presentations to auto-run a simulation visually.

## Scheduler Algorithms
1. **FCFS KING (First Come First Serve)**: Non-preemptive scheduling based purely on arrival time.
2. **SJF ASSASSIN (Shortest Job First)**: Non-preemptive scheduling based on shortest burst time.
3. **PRIORITY OVERLORD (Priority Scheduling)**: Non-preemptive scheduling based on explicit priority numbers (lower number = higher priority).
4. **ROUND ROBIN WARRIOR (Round Robin)**: Preemptive time-sliced FIFO scheduling.
5. **SRTF REAPER (Shortest Remaining Time First)**: Preemptive scheduling where shorter new jobs can interrupt currently running jobs.
6. **THE KERNEL**: The ultimate challenge mixing all algorithms unpredictably.

## Game Mechanics
- **HP & Damage**: The player and boss both have health pools. Fast and correct answers deal bonus damage.
- **Combos**: Consecutive correct answers multiply your score and damage.
- **Timer**: Every decision must be made within a specific time limit.
- **Abilities**: Earn tools like `CPU BOOST` (double decision time), `PROCESS SCAN` (reveal queue stats), or `PREEMPT SHIELD` (block damage).

## How Game Mechanics Map to OS Concepts
- **FCFS Queue Lock** → Non-preemptive scheduling (once it starts, it can't be stopped).
- **Round Robin Time Slice** → OS Time Quantum (the max time a process can run before a context switch).
- **SRTF Preempt** → Real-time preemption (CPU is forcibly taken away).
- **Ready Queue** → OS Ready Queue data structure.
- **CPU Arena** → CPU execution unit.
- **Gantt Chart** → Scheduling timeline and execution history.
- **Context Switch Animation** → The overhead and transition of swapping process states.

## Technology Stack
- **Core**: HTML5, Vanilla JavaScript (ES6+), Vanilla CSS3.
- **Graphics**: DOM manipulation, CSS Keyframes, HTML Canvas (for background particles).
- **Audio**: Web Audio API (procedural synthesis, no external assets).
- **Storage**: LocalStorage (for player progression and unlocks).

## Installation & How to Run
This project uses pure Vanilla JS and requires no complex build step.

1. Clone or download the repository.
2. Open `index.html` in any modern web browser.
   - Note: If testing locally from a file system (`file://`), everything works perfectly. If you want to run it on a local server, you can use any simple HTTP server (e.g., `npx serve .` or Python's `python -m http.server`).
3. Click "Start Game" on the main menu.

## Team Roles
- **Lead Developer**: Core game loop, scheduler logic, and battle system wiring
- **Game Designer**: Boss progression, difficulty tuning, and gameplay balancing
- **OS Concept Validator**: Scheduling algorithm correctness and educational explanations
- **UI/UX Designer**: Menu flow, battle HUD, feedback, and polished visual presentation

## Architecture
The codebase is heavily modularized to separate the academic scheduling algorithms from the game UI:
- `/src/algorithms/`: Pure JS implementations of OS schedulers. No DOM logic.
- `/src/process/`: Process generation, simulation, and state tracking.
- `/src/game/`: Game logic (HP, scoring, progression, abilities).
- `/src/visualization/`: Auto-rendering of Gantt charts, metrics, and queues.
- `/src/ui/`: DOM manipulation, menus, battle screen, and audio.

## Screenshots
- Main menu screen showing the boss-rush selection flow
- In-battle CPU arena with ready queue, timer, and boss/player HP bars
- Results screen with Gantt chart, metrics, and rank summary

## Future Improvements
- Add Multi-Level Queue (MLQ) scheduling boss.
- Add multi-core CPU scheduling (Player controls multiple CPUs).
- Implement an online leaderboard.
- Add import/export for custom process scenarios to test edge cases.
