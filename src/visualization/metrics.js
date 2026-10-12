/**
 * Metrics Visualization
 * Renders performance metrics after each battle.
 */
'use strict';

const MetricsViz = (() => {
  function render(container, simResult, processTableBody) {
    if (!container || !simResult) return;

    const metrics = [
      {
        label: 'Avg Waiting Time',
        value: simResult.avgWaitingTime,
        unit: 'units',
        tip: 'Average time a process spends waiting in the ready queue.\nWaiting Time = Turnaround Time − Burst Time'
      },
      {
        label: 'Avg Turnaround Time',
        value: simResult.avgTurnaroundTime,
        unit: 'units',
        tip: 'Average time from arrival to completion.\nTurnaround Time = Completion Time − Arrival Time'
      },
      {
        label: 'Avg Response Time',
        value: simResult.avgResponseTime,
        unit: 'units',
        tip: 'Average time from arrival to first CPU execution.\nResponse Time = Start Time − Arrival Time'
      },
      {
        label: 'CPU Utilization',
        value: simResult.cpuUtilization,
        unit: '%',
        tip: 'Percentage of time the CPU was actively executing processes.'
      },
      {
        label: 'Total Time',
        value: simResult.totalTime,
        unit: 'units',
        tip: 'Total time from start to last process completion.'
      },
      {
        label: 'Context Switches',
        value: simResult.contextSwitches,
        unit: '',
        tip: 'Number of times the CPU switched from one process to another.'
      }
    ];

    if (simResult.preemptions !== undefined) {
      metrics.push({
        label: 'Preemptions',
        value: simResult.preemptions,
        unit: '',
        tip: 'Number of times a running process was preempted by a higher-priority/shorter process.'
      });
    }

    container.innerHTML = '';
    metrics.forEach(m => {
      const card = document.createElement('div');
      card.className = 'metric-card';
      card.title = m.tip;
      card.innerHTML = `
        <div class="metric-label">${m.label}</div>
        <div class="metric-value">${m.value}<span class="metric-unit"> ${m.unit}</span></div>
      `;
      container.appendChild(card);
    });

    // Process table
    if (processTableBody && simResult.processes) {
      processTableBody.innerHTML = '';
      simResult.processes.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${p.id}</td>
          <td>${p.arrivalTime}</td>
          <td>${p.burstTime}</td>
          <td>${p.startTime ?? '—'}</td>
          <td>${p.completionTime ?? '—'}</td>
          <td>${p.waitingTime ?? '—'}</td>
          <td>${p.turnaroundTime ?? '—'}</td>
          <td>${p.responseTime ?? '—'}</td>
        `;
        processTableBody.appendChild(tr);
      });
    }
  }

  return { render };
})();
