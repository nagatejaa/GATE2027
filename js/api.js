class API {
    static async fetch(action, params = {}, method = 'GET', body = null) {
        if (!CONFIG.SCRIPT_URL || CONFIG.SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
            console.error("Please configure your Google Apps Script URL in js/config.js");
            return { error: "Configuration missing" };
        }

        let url = `${CONFIG.SCRIPT_URL}?action=${action}&token=${encodeURIComponent(CONFIG.TOKEN)}`;
        
        // Append GET params
        if (method === 'GET' && Object.keys(params).length > 0) {
            for (const [key, value] of Object.entries(params)) {
                url += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
            }
        }

        const options = {
            method: method,
            mode: 'cors', // Crucial for Apps Script
        };

        if (method === 'POST') {
            // Apps script requires Content-Type to be text/plain or x-www-form-urlencoded to avoid preflight issues easily
            options.headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
            };
            
            // Format body as form data
            const formBody = [];
            const data = { ...params, ...body };
            for (const property in data) {
                const encodedKey = encodeURIComponent(property);
                const encodedValue = encodeURIComponent(data[property]);
                formBody.push(encodedKey + "=" + encodedValue);
            }
            options.body = formBody.join("&");
        }

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }

    static async getDashboard() {
        return this.fetch('dashboard');
    }

    static async getPlan() {
        return this.fetch('plan');
    }

    static async getInsights() {
        return this.fetch('insights');
    }
    
    static async getQuizHistory() {
        return this.fetch('quiz-history');
    }

    static async updateTask(date, topic, status) {
        return this.fetch('update-task', {}, 'POST', { date, topic, status });
    }
}
