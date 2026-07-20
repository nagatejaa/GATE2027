document.addEventListener('DOMContentLoaded', () => {
    // Set date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('date-display').textContent = new Date().toLocaleDateString('en-US', options);

    let progressChartInstance = null;

    async function initDashboard() {
        document.getElementById('tasks-loader').style.display = 'block';
        try {
            const data = await API.getDashboard();
            if (data.error) {
                document.getElementById('tasks-list').innerHTML = `<p style="color: var(--danger-color)">Error: ${data.error}</p>`;
                return;
            }
            
            // Update header
            document.getElementById('streak-count').textContent = data.streak || 0;
            document.getElementById('current-phase-name').textContent = data.currentPhaseName || 'Unknown Phase';
            
            const progressPct = data.phaseProgress || 0;
            document.getElementById('phase-progress-text').textContent = `${progressPct}%`;
            // Add a small delay for the animation
            setTimeout(() => {
                document.getElementById('phase-progress-bar').style.width = `${progressPct}%`;
            }, 100);

            // Render Insights
            if (data.insights && data.insights.length > 0) {
                const insightsPanel = document.getElementById('insights-panel');
                const insightsText = document.getElementById('insights-text');
                insightsText.innerHTML = data.insights.map(i => `• ${i}`).join('<br>');
                insightsPanel.style.display = 'block';
            }

            // Render Tasks
            renderTasks(data.todayTasks || []);
            
            // Render Chart
            renderChart(data.chartData);

        } catch (e) {
            document.getElementById('tasks-list').innerHTML = `<p style="color: var(--danger-color)">Failed to connect to backend.</p>`;
        } finally {
            document.getElementById('tasks-loader').style.display = 'none';
        }
    }

    function renderTasks(tasks) {
        const container = document.getElementById('tasks-list');
        container.innerHTML = '';

        if (tasks.length === 0) {
            container.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 2rem 0;">No tasks allocated for today. Take a break or do some light revision!</p>`;
            return;
        }

        tasks.forEach(task => {
            const el = document.createElement('div');
            el.className = 'task-item';
            
            let badgeClass = 'badge-pending';
            if (task.status === 'done') badgeClass = 'badge-done';
            if (task.status === 'partial') badgeClass = 'badge-in-progress';

            el.innerHTML = `
                <div class="task-info">
                    <h4>${task.topic} <span class="badge ${badgeClass}" style="margin-left: 0.5rem;">${task.status}</span></h4>
                    <p>${task.subject} | ~${task.estimatedMins} mins</p>
                </div>
                <div class="task-actions">
                    <button class="btn btn-outline" onclick="updateTaskStatus('${task.date}', '${task.topic}', 'partial')">Partial</button>
                    <button class="btn" onclick="updateTaskStatus('${task.date}', '${task.topic}', 'done')">Done</button>
                </div>
            `;
            container.appendChild(el);
        });
    }

    function renderChart(chartData) {
        if (!chartData) return;
        
        const ctx = document.getElementById('progressChart').getContext('2d');
        
        if (progressChartInstance) {
            progressChartInstance.destroy();
        }

        progressChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Pending'],
                datasets: [{
                    data: [chartData.completed, chartData.pending],
                    backgroundColor: [
                        '#10b981', // Success green
                        'rgba(255, 255, 255, 0.1)'
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }

    // Expose to window for inline onclick handlers
    window.updateTaskStatus = async (date, topic, status) => {
        document.getElementById('tasks-loader').style.display = 'block';
        try {
            await API.updateTask(date, topic, status);
            // Refresh dashboard
            await initDashboard();
        } catch (e) {
            alert('Failed to update task.');
            document.getElementById('tasks-loader').style.display = 'none';
        }
    };

    // Boot
    initDashboard();
});
