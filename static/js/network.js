/**
 * Network page JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('refreshPeers')?.addEventListener('click', refreshData);
    refreshData();
});

async function refreshData() {
    try {
        const response = await apiRequest('/api/peer-info');
        updatePeersTable(response);
        updateStats(response);
        updateConnectionStatus(true, 'Connected');
    } catch (error) {
        console.error('Network refresh failed:', error);
        updateConnectionStatus(false, 'Connection Error');
    }
}

function updateStats(data) {
    if (!data.success) return;
    const peers = data.data || [];
    document.getElementById('peerCount').textContent = peers.length;

    let totalRecv = 0, totalSent = 0;
    peers.forEach(p => {
        totalRecv += p.bytesrecv || 0;
        totalSent += p.bytessent || 0;
    });

    document.getElementById('bytesRecv').textContent = formatBytes(totalRecv);
    document.getElementById('bytesSent').textContent = formatBytes(totalSent);
}

function updatePeersTable(data) {
    const tbody = document.getElementById('peersTable');
    if (!data.success) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-danger">${data.error}</td></tr>`;
        return;
    }

    const peers = data.data || [];
    if (peers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-muted">No peers connected</td></tr>`;
        return;
    }

    tbody.innerHTML = peers.map(p => `
        <tr>
            <td class="font-monospace">${p.addr || '-'}</td>
            <td>${p.version || '-'}</td>
            <td>${p.subver || '-'}</td>
            <td>${p.pingtime ? (p.pingtime * 1000).toFixed(0) + ' ms' : '-'}</td>
            <td>${formatNumber(p.startingheight || 0, 0)}</td>
            <td>${p.banscore || 0}</td>
            <td>${p.inbound ? 'Inbound' : 'Outbound'}</td>
        </tr>
    `).join('');
}
