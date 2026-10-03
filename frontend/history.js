async function loadHistory() {
    const container = document.getElementById('history-container');
    if (!window.Clerk || !window.Clerk.session) {
        container.innerHTML = '<p>Please sign in to view your interview history.</p>';
        return;
    }

    try {
        const response = await fetchWithAuth('http://127.0.0.1:8000/history/');
        if (!response.ok) throw new Error('Failed to fetch history');
        
        const historyData = await response.json();
        
        if (historyData.length === 0) {
            container.innerHTML = '<p>No interview history found.</p>';
            return;
        }

        container.innerHTML = '';
        
        historyData.forEach(item => {
            const createdAt = item.created_at;
            const utcTimestamp = /(?:Z|[+-]\d{2}:\d{2})$/i.test(createdAt)
                ? createdAt
                : `${createdAt}Z`;
            const date = new Date(utcTimestamp).toLocaleString();
            
            const div = document.createElement('div');
            div.className = 'history-item';
            
            let messagesHtml = '<div class="history-qa"><h3>Q&A Transcript</h3>';
            item.messages.forEach(msg => {
                const roleClass = msg.role === 'ai' || msg.role === 'bot' || msg.role === 'interviewer' || msg.role === 'assistant' ? 'role-bot' : 'role-user';
                const roleName = msg.role === 'ai' || msg.role === 'bot' || msg.role === 'interviewer' || msg.role === 'assistant' ? 'Interviewer' : 'You';
                messagesHtml += `<div><span class="${roleClass}">${roleName}:</span> <p>${msg.content || msg.text || msg.answer || msg.question}</p></div>`;
            });
            messagesHtml += '</div>';

            let evalHtml = '';
            if (item.evaluation) {
                const evaluationText = JSON.stringify(item.evaluation, (key, value) => {
                    if (typeof value === 'number' && Number.isFinite(value)) {
                        return `__HISTORY_NUMBER_${value.toFixed(2)}__`;
                    }
                    return value;
                }, 2).replace(/"__HISTORY_NUMBER_(-?\d+\.\d{2})__"/g, '$1');

                evalHtml = `<div class="history-eval">
                    <h3>Final Report</h3>
                    <pre style="white-space: pre-wrap; font-family: inherit; background: var(--bg-body); padding: 1rem; border-radius: 8px;">${evaluationText}</pre>
                </div>`;
            }

            div.innerHTML = `
                <h2>Interview on ${date}</h2>
                <div class="history-details">
                    ${messagesHtml}
                    ${evalHtml}
                </div>
            `;
            
            div.addEventListener('click', () => {
                const details = div.querySelector('.history-details');
                details.classList.toggle('active');
            });
            
            container.appendChild(div);
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = '<p>Error loading history.</p>';
    }
}

window.clerkReady
    .then(loadHistory)
    .catch(error => {
        console.error(error);
        document.getElementById('history-container').innerHTML = '<p>Error loading history.</p>';
    });
