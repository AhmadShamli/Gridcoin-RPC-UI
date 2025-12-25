/**
 * Transactions page JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    refreshData();
});

function setupEventListeners() {
    document.getElementById('txCount')?.addEventListener('change', refreshData);
    document.getElementById('refreshTx')?.addEventListener('click', refreshData);
}

async function refreshData() {
    const count = document.getElementById('txCount')?.value || 20;

    try {
        const response = await apiRequest(`/api/transactions?count=${count}`);
        updateTransactionsTable(response);
        updateConnectionStatus(true, 'Connected');
    } catch (error) {
        console.error('Transactions refresh failed:', error);
        updateConnectionStatus(false, 'Connection Error');
        showError('Failed to load transactions');
    }
}

function updateTransactionsTable(data) {
    const tbody = document.getElementById('transactionsTable');

    if (!data.success) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5 text-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>${data.error || 'Failed to load transactions'}
                </td>
            </tr>
        `;
        return;
    }

    const transactions = data.data || [];

    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5 text-muted">
                    <i class="bi bi-inbox me-2"></i>No transactions found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = transactions.map(tx => {
        const typeClass = getTypeClass(tx.category);
        const amount = tx.amount || 0;
        const amountClass = amount >= 0 ? 'text-success' : 'text-danger';
        const amountPrefix = amount >= 0 ? '+' : '';

        return `
            <tr>
                <td>
                    <span class="badge-tx-type ${typeClass}">
                        ${getTypeIcon(tx.category)} ${tx.category || 'unknown'}
                    </span>
                </td>
                <td class="${amountClass} fw-semibold">
                    ${amountPrefix}${formatNumber(amount, 8)} GRC
                </td>
                <td>
                    <span class="text-truncate d-inline-block" style="max-width: 150px;" 
                          title="${tx.address || ''}">
                        ${tx.address || '-'}
                    </span>
                </td>
                <td>${tx.category || '-'}</td>
                <td>
                    <span class="badge ${tx.confirmations >= 6 ? 'bg-success' : 'bg-warning'}">
                        ${tx.confirmations || 0}
                    </span>
                </td>
                <td>${formatTimestamp(tx.time)}</td>
                <td>
                    <span class="text-truncate d-inline-block font-monospace" style="max-width: 100px;"
                          title="${tx.txid || ''}">
                        ${truncateString(tx.txid, 12)}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

function getTypeClass(category) {
    switch (category?.toLowerCase()) {
        case 'send': return 'badge-send';
        case 'receive': return 'badge-receive';
        case 'stake':
        case 'generated':
        case 'generate': return 'badge-stake';
        case 'research':
        case 'por': return 'badge-research';
        default: return 'bg-secondary';
    }
}

function getTypeIcon(category) {
    switch (category?.toLowerCase()) {
        case 'send': return '<i class="bi bi-arrow-up-right"></i>';
        case 'receive': return '<i class="bi bi-arrow-down-left"></i>';
        case 'stake':
        case 'generated':
        case 'generate': return '<i class="bi bi-lightning"></i>';
        case 'research':
        case 'por': return '<i class="bi bi-mortarboard"></i>';
        default: return '<i class="bi bi-question"></i>';
    }
}

function showError(message) {
    document.getElementById('transactionsTable').innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-5 text-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>${message}
            </td>
        </tr>
    `;
}
