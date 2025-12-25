/**
 * Dashboard page JavaScript
 */

// Dashboard state
let dashboardData = {};

/**
 * Initialize dashboard
 */
document.addEventListener('DOMContentLoaded', () => {
    refreshData();
});

/**
 * Refresh dashboard data
 */
async function refreshData() {
    try {
        const response = await apiRequest('/api/dashboard-data');
        dashboardData = response;

        updateDashboard(response);
        updateConnectionStatus(true, 'Connected');
    } catch (error) {
        console.error('Dashboard refresh failed:', error);
        updateConnectionStatus(false, 'Connection Error');
    }
}

/**
 * Update dashboard UI with data
 */
function updateDashboard(data) {
    // Balance
    updateStatCard('statBalance', data.balance, (d) => {
        if (d.success) return formatNumber(d.data, 8) + ' GRC';
        return 'Error';
    });

    // Unconfirmed balance
    if (data.unconfirmed_balance?.success) {
        const unconf = data.unconfirmed_balance.data;
        document.getElementById('statUnconfirmed').textContent =
            unconf > 0 ? `+${formatNumber(unconf, 8)} pending` : 'No pending';
    }

    // Staking status
    if (data.staking_info?.success) {
        const staking = data.staking_info.data;
        document.getElementById('statStaking').textContent =
            staking?.staking ? 'Active' : 'Inactive';
        document.getElementById('statStaking').className =
            'stat-value ' + (staking?.staking ? 'text-success' : 'text-warning');
        document.getElementById('statStakingWeight').textContent =
            `Weight: ${formatNumber(staking?.weight || 0, 0)}`;
    }

    // Block height
    if (data.info?.success) {
        const info = data.info.data;
        document.getElementById('statBlocks').textContent =
            formatNumber(info?.blocks || 0, 0);
        document.getElementById('statDifficulty').textContent =
            `Diff: ${formatNumber(info?.difficulty?.['proof-of-stake'] || info?.difficulty || 0, 4)}`;
    }

    // Connections
    if (data.connection_count?.success) {
        document.getElementById('statConnections').textContent =
            data.connection_count.data || 0;
    }
    if (data.info?.success) {
        document.getElementById('statVersion').textContent =
            data.info.data?.version || '-';
    }

    // Wallet info panel
    updateWalletInfo(data.wallet_info);

    // Staking info panel
    updateStakingInfo(data.staking_info);

    // Network info panel
    updateNetworkInfo(data.network_info);

    // Superblock info panel
    updateSuperblockInfo(data.superblock_age);
}

/**
 * Update stat card
 */
function updateStatCard(elementId, data, formatter) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = formatter(data);
    }
}

/**
 * Update wallet info panel
 */
function updateWalletInfo(data) {
    if (!data?.success) {
        document.getElementById('walletRawData').textContent =
            data?.error || 'Failed to load wallet info';
        return;
    }

    const info = data.data;
    document.getElementById('walletVersion').textContent = info?.walletversion || '-';
    document.getElementById('walletTxCount').textContent = formatNumber(info?.txcount || 0, 0);
    document.getElementById('walletKeypool').textContent = formatNumber(info?.keypoolsize || 0, 0);

    const unlockedUntil = info?.unlocked_until;
    if (unlockedUntil === 0) {
        document.getElementById('walletUnlocked').textContent = 'Locked';
        document.getElementById('walletUnlocked').className = 'info-value text-warning';
    } else if (unlockedUntil) {
        document.getElementById('walletUnlocked').textContent = formatTimestamp(unlockedUntil);
        document.getElementById('walletUnlocked').className = 'info-value text-success';
    } else {
        document.getElementById('walletUnlocked').textContent = 'No encryption';
        document.getElementById('walletUnlocked').className = 'info-value';
    }

    document.getElementById('walletRawData').textContent = safeStringify(info);
}

/**
 * Update staking info panel
 */
function updateStakingInfo(data) {
    if (!data?.success) {
        document.getElementById('stakingRawData').textContent =
            data?.error || 'Failed to load staking info';
        return;
    }

    const info = data.data;
    const stakingEnabled = document.getElementById('stakingEnabled');
    stakingEnabled.textContent = info?.staking ? 'Yes' : 'No';
    stakingEnabled.className = 'info-value ' + (info?.staking ? 'text-success' : 'text-warning');

    document.getElementById('stakingWeight').textContent = formatNumber(info?.weight || 0, 0);
    document.getElementById('netStakeWeight').textContent = formatNumber(info?.netstakeweight || 0, 0);

    const expectedTime = info?.expectedtime;
    if (expectedTime && expectedTime > 0) {
        document.getElementById('expectedTime').textContent = formatDuration(expectedTime);
    } else {
        document.getElementById('expectedTime').textContent = '-';
    }

    document.getElementById('stakingRawData').textContent = safeStringify(info);
}

/**
 * Update network info panel
 */
function updateNetworkInfo(data) {
    if (!data?.success) {
        document.getElementById('networkRawData').textContent =
            data?.error || 'Failed to load network info';
        return;
    }

    const info = data.data;
    document.getElementById('protocolVersion').textContent = info?.protocolversion || '-';
    document.getElementById('subversion').textContent = info?.subversion || '-';
    document.getElementById('localServices').textContent = info?.localservices || '-';
    document.getElementById('relayFee').textContent =
        info?.relayfee ? formatNumber(info.relayfee, 8) + ' GRC' : '-';

    document.getElementById('networkRawData').textContent = safeStringify(info);
}

/**
 * Update superblock info panel
 */
function updateSuperblockInfo(data) {
    if (!data?.success) {
        document.getElementById('superblockRawData').textContent =
            data?.error || 'Failed to load superblock info';
        return;
    }

    const info = data.data;

    // Handle different response formats
    if (typeof info === 'object') {
        document.getElementById('superblockAge').textContent =
            info?.Superblock_Age || info?.superblock_age || formatDuration(info?.age_seconds) || '-';
        document.getElementById('superblockPending').textContent =
            info?.Pending_Superblock_Height ? 'Yes' : 'No';
    } else {
        document.getElementById('superblockAge').textContent = info || '-';
        document.getElementById('superblockPending').textContent = '-';
    }

    document.getElementById('superblockRawData').textContent = safeStringify(info);
}
