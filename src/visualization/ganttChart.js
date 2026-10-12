/**
 * Gantt Chart Visualization
 * Renders a dynamic Gantt chart from simulation results.
 * Source of truth: simulationResult.gantt
 */
'use strict';

const GanttChart = (() => {
  // Colors per process PID
  const PROCESS_COLORS = [
    { bg: 'rgba(0,245,255,0.35)',  text: '#00f5ff',  border: '#00f5ff' },
    { bg: 'rgba(255,140,0,0.35)',  text: '#ff8c00',  border: '#ff8c00' },
    { bg: 'rgba(168,85,247,0.35)', text: '#a855f7',  border: '#a855f7' },
    { bg: 'rgba(0,255,136,0.35)',  text: '#00ff88',  border: '#00ff88' },
    { bg: 'rgba(255,45,90,0.35)',  text: '#ff2d5a',  border: '#ff2d5a' },
    { bg: 'rgba(255,215,0,0.35)',  text: '#ffd700',  border: '#ffd700' },
    { bg: 'rgba(100,200,255,0.35)',text: '#64c8ff',  border: '#64c8ff' },
    { bg: 'rgba(255,100,200,0.35)',text: '#ff64c8',  border: '#ff64c8' },
  ];

  const _pidColorMap = {};
  let _colorIndex = 0;

  function getColor(pid) {
    if (pid === 'IDLE') return { bg: 'rgba(50,50,80,0.4)', text: '#555588', border: '#333366' };
    if (!_pidColorMap[pid]) {
      _pidColorMap[pid] = PROCESS_COLORS[_colorIndex % PROCESS_COLORS.length];
      _colorIndex++;
    }
    return _pidColorMap[pid];
  }

  function reset() {
    Object.keys(_pidColorMap).forEach(k => delete _pidColorMap[k]);
    _colorIndex = 0;
  }

  /**
   * Render the Gantt chart into a container element.
   * @param {HTMLElement} container - The .gantt-chart div
   * @param {GanttEntry[]} ganttData - Array of { pid, start, end }
   * @param {number} totalTime - Total simulation time for scaling
   */
  function render(container, ganttData, totalTime) {
    if (!container || !ganttData || ganttData.length === 0) {
      container.innerHTML = '<div style="color:var(--text-muted);font-family:var(--font-mono);font-size:0.75rem;">No scheduling data available.</div>';
      return;
    }

    reset();
    container.innerHTML = '';

    // Collect unique PIDs (excluding IDLE)
    const pids = [...new Set(ganttData.map(e => e.pid).filter(p => p !== 'IDLE'))];

    const maxTime = totalTime || Math.max(...ganttData.map(e => e.end));
    const scale = 100 / maxTime; // percent per unit time

    // One row per PID
    pids.forEach(pid => {
      const row = document.createElement('div');
      row.className = 'gantt-row';

      const label = document.createElement('div');
      label.className = 'gantt-pid-label';
      label.textContent = pid;
      row.appendChild(label);

      const bars = document.createElement('div');
      bars.className = 'gantt-bars';
      bars.style.position = 'relative';
      bars.style.flex = '1';
      bars.style.height = '34px';

      ganttData.forEach(entry => {
        const duration = entry.end - entry.start;
        if (duration <= 0) return;

        const block = document.createElement('div');
        block.className = 'gantt-block';
        if (entry.pid === 'IDLE') block.classList.add('gantt-idle');

        const leftPct = entry.start * scale;
        const widthPct = duration * scale;
        block.style.cssText = `
          position: absolute;
          left: ${leftPct}%;
          width: ${widthPct}%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-family: var(--font-mono);
          border-radius: 3px;
          overflow: hidden;
          box-sizing: border-box;
        `;

        if (entry.pid === pid) {
          const color = getColor(pid);
          block.style.background = color.bg;
          block.style.border = `1px solid ${color.border}`;
          block.style.color = color.text;
          block.textContent = widthPct > 5 ? pid : '';
          block.setAttribute('data-time', entry.end);
          block.title = `${pid}: t=${entry.start} → t=${entry.end} (${duration} units)`;
        } else {
          // Placeholder for alignment
          block.style.background = 'transparent';
          block.style.border = 'none';
        }

        bars.appendChild(block);
      });

      row.appendChild(bars);
      container.appendChild(row);
    });

    // Timeline row
    const timeline = document.createElement('div');
    timeline.className = 'gantt-timeline';

    // Get unique time points
    const times = [...new Set(ganttData.flatMap(e => [e.start, e.end]))].sort((a, b) => a - b);
    let lastLeft = 0;

    times.forEach(t => {
      const tick = document.createElement('div');
      tick.className = 'gantt-tick';
      const leftPct = t * scale;
      tick.style.cssText = `
        position: absolute;
        left: calc(36px + ${leftPct}%);
        font-family: var(--font-mono);
        font-size: 0.55rem;
        color: var(--text-muted);
        transform: translateX(-50%);
      `;
      tick.textContent = t;
      timeline.appendChild(tick);
    });

    // Wrap timeline in relative container
    const timelineWrap = document.createElement('div');
    timelineWrap.style.cssText = 'position:relative;height:20px;margin-top:4px;';
    timelineWrap.appendChild(timeline);
    container.appendChild(timelineWrap);
  }

  /**
   * Highlight a specific PID in the gantt chart.
   */
  function highlightPid(container, pid) {
    const blocks = container.querySelectorAll('.gantt-block');
    blocks.forEach(b => {
      b.style.opacity = b.textContent.trim() === pid ? '1' : '0.3';
    });
  }

  function clearHighlight(container) {
    const blocks = container.querySelectorAll('.gantt-block');
    blocks.forEach(b => { b.style.opacity = '1'; });
  }

  return { render, reset, highlightPid, clearHighlight };
})();
