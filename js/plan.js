document.addEventListener('DOMContentLoaded', () => {
    async function initPlan() {
        document.getElementById('plan-loader').style.display = 'block';
        try {
            const planData = await API.getPlan();
            if (planData.error) {
                document.getElementById('plan-container').innerHTML = `<p style="color: var(--danger-color)">Error: ${planData.error}</p>`;
                return;
            }
            renderPlan(planData);
        } catch (e) {
            document.getElementById('plan-container').innerHTML = `<p style="color: var(--danger-color)">Failed to load plan.</p>`;
        } finally {
            document.getElementById('plan-loader').style.display = 'none';
        }
    }

    function renderPlan(phases) {
        const container = document.getElementById('plan-container');
        container.innerHTML = '';

        if (!phases || phases.length === 0) {
            container.innerHTML = '<p>No plan data available.</p>';
            return;
        }

        phases.forEach((phase, index) => {
            const el = document.createElement('div');
            el.className = 'phase-accordion';
            
            // Calculate completion
            const total = phase.topics.length;
            const completed = phase.topics.filter(t => t.status === 'done').length;
            const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
            
            let tableHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Week</th>
                            <th>Subject</th>
                            <th>Topic</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            phase.topics.forEach(t => {
                let badgeClass = 'badge-pending';
                if (t.status === 'done') badgeClass = 'badge-done';
                if (t.status === 'partial' || t.status === 'in-progress') badgeClass = 'badge-in-progress';
                
                tableHTML += `
                    <tr>
                        <td>${t.week}</td>
                        <td>${t.subject}</td>
                        <td>${t.topic}</td>
                        <td><span class="badge ${badgeClass}">${t.status}</span></td>
                    </tr>
                `;
            });
            
            tableHTML += `</tbody></table>`;

            el.innerHTML = `
                <div class="phase-header" onclick="this.nextElementSibling.classList.toggle('active')">
                    <div style="display: flex; flex-direction: column;">
                        <h3 style="margin:0;">${phase.name}</h3>
                        <small style="color: var(--text-secondary);">${phase.dateRange}</small>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span style="font-weight:600; color:var(--accent-color);">${pct}%</span>
                        <span style="color: var(--text-secondary);">▼</span>
                    </div>
                </div>
                <div class="phase-content ${index === 0 ? 'active' : ''}">
                    ${tableHTML}
                </div>
            `;
            
            container.appendChild(el);
        });
    }

    initPlan();
});
