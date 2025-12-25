/**
 * Gridcoin RPC UI - Addresses JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    refreshData();
    setupAddressEvents();
});

function setupAddressEvents() {
    // Search functionality
    const searchInput = document.getElementById('addressSearch');
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterAddresses(searchTerm);
        });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshAddresses');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshData();
            // Add spin effect
            const icon = refreshBtn.querySelector('i');
            icon.classList.add('spin');
            setTimeout(() => icon.classList.remove('spin'), 500);
        });
    }
}

/**
 * Fetch and display address data
 */
async function refreshData() {
    const tableBody = document.getElementById('addressesTable');
    if (!tableBody) return;

    try {
        const response = await apiRequest('/api/addresses');

        if (response.success && response.data) {
            renderAddresses(response.data);
            updateConnectionStatus(true);
        } else if (response.error) {
            console.error('RPC Error:', response.error);
            updateConnectionStatus(true, 'RPC Error');
        }
    } catch (error) {
        console.error('Failed to fetch addresses:', error);
        updateConnectionStatus(false);
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger py-3">
                    <i class="bi bi-exclamation-triangle me-1"></i> Failed to load addresses
                </td>
            </tr>
        `;
    }
}

/**
 * Render address list
 */
function renderAddresses(groupings) {
    const tableBody = document.getElementById('addressesTable');
    tableBody.innerHTML = '';

    const allAddresses = [];

    // Flatten the groupings
    // listaddressgroupings returns: [[["address", amount, "label?"]], ...]
    if (Array.isArray(groupings)) {
        groupings.forEach(group => {
            if (Array.isArray(group)) {
                group.forEach(item => {
                    if (Array.isArray(item) && item.length >= 2) {
                        allAddresses.push({
                            address: item[0],
                            amount: item[1],
                            label: item.length > 2 ? item[2] : ''
                        });
                    }
                });
            }
        });
    }

    if (allAddresses.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-3">
                    No addresses found
                </td>
            </tr>
        `;
        return;
    }

    // Sort by amount descending
    allAddresses.sort((a, b) => b.amount - a.amount);

    allAddresses.forEach(addr => {
        const row = document.createElement('tr');
        row.dataset.address = addr.address;
        row.dataset.label = addr.label || '';

        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <span class="font-monospace">${addr.address}</span>
                    <button class="btn btn-sm btn-link text-muted p-0 ms-2 copy-btn" 
                            onclick="copyToClipboard('${addr.address}')" 
                            title="Copy address">
                        <i class="bi bi-clipboard"></i>
                    </button>
                </div>
            </td>
            <td>
                ${addr.label ? `<span class="badge bg-secondary">${addr.label}</span>` : '<span class="text-muted small">-</span>'}
            </td>
            <td class="text-end font-monospace">
                ${formatNumber(addr.amount, 8)} GRC
            </td>
             <td class="text-center">
                <button class="btn btn-sm btn-outline-info" onclick="showAddressDetails('${addr.address}', '${addr.label || ''}')">
                    <i class="bi bi-eye"></i> Details
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Re-apply search filter if exists
    const searchInput = document.getElementById('addressSearch');
    if (searchInput && searchInput.value) {
        filterAddresses(searchInput.value.toLowerCase());
    }
}

/**
 * Filter addresses based on search term
 */
function filterAddresses(term) {
    const rows = document.querySelectorAll('#addressesTable tr');
    rows.forEach(row => {
        const address = row.dataset.address?.toLowerCase() || '';
        const label = row.dataset.label?.toLowerCase() || '';

        if (address.includes(term) || label.includes(term)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Find the active element (button) and show feedback
        const btn = document.activeElement;
        if (btn && btn.classList.contains('copy-btn')) {
            const originalIcon = btn.innerHTML;
            btn.innerHTML = '<i class="bi bi-check2"></i>';
            setTimeout(() => {
                btn.innerHTML = originalIcon;
            }, 1000);
        }
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

/**
 * Show address details modal
 */
async function showAddressDetails(address, label) {
    const modal = new bootstrap.Modal(document.getElementById('addressDetailsModal'));

    document.getElementById('modalAddress').innerText = address;
    document.getElementById('modalLabel').innerText = label || '-';

    const utxoTableBody = document.getElementById('utxoTable');
    utxoTableBody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-3">
                <div class="spinner-border spinner-border-sm text-primary" role="status"></div> Loading UTXOs...
            </td>
        </tr>
    `;

    modal.show();

    try {
        const response = await apiRequest(`/api/address/${address}/utxos`);

        if (response.success && response.data) {
            renderUtxos(response.data);
        } else {
            utxoTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted py-3">
                        ${response.error || 'No UTXOs found or error loading'}
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Failed to load UTXOs:', error);
        utxoTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger py-3">
                    Failed to load UTXO data
                </td>
            </tr>
        `;
    }
}

/**
 * Render UTXOs in modal
 */
function renderUtxos(utxos) {
    const tableBody = document.getElementById('utxoTable');
    tableBody.innerHTML = '';

    if (!utxos || utxos.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-3">
                    No unspent outputs found for this address.
                </td>
            </tr>
        `;
        return;
    }

    utxos.forEach(utxo => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <span class="font-monospace small text-truncate d-inline-block" style="max-width: 150px;" title="${utxo.txid}">
                    ${utxo.txid}
                </span>
            </td>
            <td>${utxo.vout}</td>
            <td class="font-monospace">${formatNumber(utxo.amount, 8)}</td>
            <td>${utxo.confirmations}</td>
        `;
        tableBody.appendChild(row);
    });
}
