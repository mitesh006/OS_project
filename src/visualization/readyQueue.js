/**
 * Ready Queue Visualization
 * Renders process cards in the ready queue area.
 */
'use strict';

const ReadyQueueViz = (() => {
  function renderQueue(container, processes, currentTime, executingPid, algorithm) {
    if (!container) return;
    container.innerHTML = '';

    if (!processes || processes.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'font-family:var(--font-mono);font-size:0.7rem;color:var(--text-muted);padding:8px;';
      empty.textContent = 'Queue empty';
      container.appendChild(empty);
      return;
    }

    // Sort for display based on algorithm
    let displayProcs = [...processes].filter(
      p => p.status === 'READY' || p.status === 'RUNNING'
    );

    // Show completed ones too (faded)
    const completed = processes.filter(p => p.status === 'COMPLETED');

    displayProcs.forEach(p => {
      const card = createProcessCard(p, executingPid, algorithm, currentTime);
      container.appendChild(card);
    });

    completed.forEach(p => {
      const card = createProcessCard(p, executingPid, algorithm, currentTime);
      container.appendChild(card);
    });
  }

  function createProcessCard(process, executingPid, algorithm, currentTime) {
    const card = document.createElement('div');
    card.className = 'process-card';
    card.setAttribute('data-pid', process.id);

    if (process.id === executingPid && process.status !== 'COMPLETED') {
      card.classList.add('executing');
    } else if (process.status === 'COMPLETED') {
      card.classList.add('completed');
    } else if (process.status === 'READY') {
      card.classList.add('waiting');
    }

    // PID row with status dot
    const pidRow = document.createElement('div');
    pidRow.className = 'process-card-pid';
    pidRow.innerHTML = `<span>${process.id}</span><div class="status-dot"></div>`;
    card.appendChild(pidRow);

    // Details
    const details = buildDetails(process, algorithm);
    details.forEach(d => {
      const el = document.createElement('div');
      el.className = 'process-card-detail';
      el.innerHTML = `${d.label}:<span>${d.value}</span>`;
      card.appendChild(el);
    });

    return card;
  }

  function buildDetails(process, algorithm) {
    const details = [
      { label: 'AT', value: process.arrivalTime }
    ];

    if (algorithm === 'SRTF' || algorithm === 'ROUND_ROBIN') {
      details.push({ label: 'Rem', value: process.remainingTime });
      details.push({ label: 'BT', value: process.burstTime });
    } else if (algorithm === 'PRIORITY') {
      details.push({ label: 'BT', value: process.burstTime });
      details.push({ label: 'Pri', value: process.priority });
    } else if (algorithm === 'SJF') {
      details.push({ label: 'BT', value: process.burstTime });
    } else {
      details.push({ label: 'BT', value: process.burstTime });
    }

    return details;
  }

  /**
   * Flash a process card (e.g., when it arrives or gets selected).
   */
  function flashCard(container, pid, type = 'arriving') {
    const card = container.querySelector(`[data-pid="${pid}"]`);
    if (!card) return;
    card.classList.add(type);
    setTimeout(() => card.classList.remove(type), 600);
  }

  return { renderQueue, flashCard };
})();
