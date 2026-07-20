document.addEventListener('DOMContentLoaded', () => {
    let scoresChartInstance = null;

    async function initQuiz() {
        document.getElementById('quiz-loader').style.display = 'block';
        try {
            const data = await API.getQuizHistory();
            if (data.error) {
                document.getElementById('mistakes-body').innerHTML = `<tr><td colspan="5" style="color: var(--danger-color); text-align:center;">Error: ${data.error}</td></tr>`;
                return;
            }
            renderChart(data.scores);
            renderMistakes(data.mistakes);
        } catch (e) {
            document.getElementById('mistakes-body').innerHTML = `<tr><td colspan="5" style="color: var(--danger-color); text-align:center;">Failed to load quiz data.</td></tr>`;
        } finally {
            document.getElementById('quiz-loader').style.display = 'none';
        }
    }

    function renderChart(scores) {
        if (!scores || scores.length === 0) return;
        
        const labels = scores.map(s => s.date);
        const data = scores.map(s => s.percentage);

        const ctx = document.getElementById('scoresChart').getContext('2d');
        if (scoresChartInstance) scoresChartInstance.destroy();

        scoresChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Quiz Score %',
                    data: data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    function renderMistakes(mistakes) {
        const tbody = document.getElementById('mistakes-body');
        tbody.innerHTML = '';

        if (!mistakes || mistakes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No mistakes logged yet! Keep it up.</td></tr>';
            return;
        }

        mistakes.forEach(m => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="white-space: nowrap;">${m.date}</td>
                <td><span class="badge badge-pending">${m.subject}</span></td>
                <td>${m.question}</td>
                <td style="color: var(--danger-color);">${m.myAnswer}</td>
                <td style="color: var(--success-color);">${m.correctAnswer}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    initQuiz();
});
