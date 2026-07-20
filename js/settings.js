document.addEventListener('DOMContentLoaded', () => {
    async function initSettings() {
        document.getElementById('settings-loader').style.display = 'block';
        try {
            const data = await API.fetch('settings');
            if (data.error) throw new Error(data.error);

            // Populate form
            document.getElementById('checkin-time').value = `${String(data.CHECKIN_HOUR || 20).padStart(2, '0')}:${String(data.CHECKIN_MINUTE || 0).padStart(2, '0')}`;
            document.getElementById('reminder-intervals').value = data.REMINDER_INTERVALS_HRS || '2,6,12';
            document.getElementById('telegram-id').value = data.TELEGRAM_CHAT_ID || '';

        } catch (e) {
            console.error(e);
        } finally {
            document.getElementById('settings-loader').style.display = 'none';
        }
    }

    document.getElementById('settings-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusEl = document.getElementById('save-status');
        statusEl.textContent = 'Saving...';
        statusEl.style.color = 'var(--text-secondary)';
        document.getElementById('settings-loader').style.display = 'block';

        const timeParts = document.getElementById('checkin-time').value.split(':');
        
        const payload = {
            CHECKIN_HOUR: parseInt(timeParts[0], 10),
            CHECKIN_MINUTE: parseInt(timeParts[1], 10),
            REMINDER_INTERVALS_HRS: document.getElementById('reminder-intervals').value
        };

        try {
            const res = await API.fetch('save-settings', {}, 'POST', payload);
            if (res.success) {
                statusEl.textContent = 'Settings saved successfully!';
                statusEl.style.color = 'var(--success-color)';
            } else {
                throw new Error(res.error || 'Unknown error');
            }
        } catch (error) {
            statusEl.textContent = `Error: ${error.message}`;
            statusEl.style.color = 'var(--danger-color)';
        } finally {
            document.getElementById('settings-loader').style.display = 'none';
        }
    });

    initSettings();
});
