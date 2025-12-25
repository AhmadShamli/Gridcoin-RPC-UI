/**
 * Polls page JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('refreshPolls')?.addEventListener('click', refreshData);
    refreshData();
});

async function refreshData() {
    try {
        const response = await apiRequest('/api/polls');
        updatePolls(response);
        updateConnectionStatus(true, 'Connected');
    } catch (error) {
        console.error('Polls refresh failed:', error);
        updateConnectionStatus(false, 'Connection Error');
    }
}

function updatePolls(data) {
    const container = document.getElementById('pollsContainer');

    if (!data.success) {
        container.innerHTML = `<div class="text-center py-5 text-danger">${data.error}</div>`;
        return;
    }

    const polls = data.data || [];

    if (polls.length === 0) {
        container.innerHTML = `<div class="text-center py-5 text-muted">No active polls</div>`;
        return;
    }

    container.innerHTML = polls.map(poll => {
        const expiration = poll.expiration ? formatTimestamp(poll.expiration) : 'Unknown';
        const totalVotes = poll.total_votes || poll.votes || 0;

        return `
            <div class="poll-card">
                <h5 class="poll-title">${poll.title || 'Untitled Poll'}</h5>
                <div class="poll-meta">
                    <span class="me-3"><i class="bi bi-calendar me-1"></i>Expires: ${expiration}</span>
                    <span><i class="bi bi-people me-1"></i>Votes: ${totalVotes}</span>
                </div>
                <p class="text-muted small">${poll.question || poll.url || ''}</p>
                <button class="btn btn-sm btn-outline-primary" onclick="viewPoll('${poll.id || poll.title}')">
                    <i class="bi bi-eye me-1"></i>View Details
                </button>
            </div>
        `;
    }).join('');
}

function viewPoll(pollId) {
    const modal = new bootstrap.Modal(document.getElementById('pollModal'));
    document.getElementById('pollModalLabel').textContent = 'Poll Details';
    document.getElementById('pollModalBody').innerHTML = `
        <p>Poll ID: <code>${pollId}</code></p>
        <p class="text-muted">Use the RPC Console to get more details with: <code>getpollresults ${pollId}</code></p>
    `;
    modal.show();
}
