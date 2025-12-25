/**
 * Research page JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    refreshData();
});

async function refreshData() {
    try {
        const [miningResp, beaconResp] = await Promise.all([
            apiRequest('/api/mining-info'),
            apiRequest('/api/beacon-status')
        ]);

        updateMiningInfo(miningResp);
        updateBeaconInfo(beaconResp);
        updateConnectionStatus(true, 'Connected');
    } catch (error) {
        console.error('Research refresh failed:', error);
        updateConnectionStatus(false, 'Connection Error');
    }
}

function updateMiningInfo(data) {
    if (!data.success) {
        document.getElementById('miningRawData').textContent = data.error || 'Error';
        return;
    }

    const info = data.data;
    document.getElementById('cpid').textContent = info?.CPID || info?.cpid || 'Not a researcher';
    document.getElementById('magnitude').textContent = formatNumber(info?.current_magnitude || 0, 2);
    document.getElementById('miningBlocks').textContent = formatNumber(info?.blocks || 0, 0);
    document.getElementById('miningDifficulty').textContent = formatNumber(info?.difficulty || 0, 4);
    document.getElementById('boincReward').textContent = formatNumber(info?.BOINC_Reward_Pending || 0, 8) + ' GRC';
    document.getElementById('miningErrors').textContent = info?.errors || 'None';
    document.getElementById('miningRawData').textContent = safeStringify(info);
}

function updateBeaconInfo(data) {
    if (!data.success) {
        document.getElementById('beaconRawData').textContent = data.error || 'Error';
        document.getElementById('beaconActive').textContent = 'Unknown';
        return;
    }

    const info = data.data;
    const beaconList = Array.isArray(info) ? info : [info];
    const beacon = beaconList[0] || {};

    const isActive = beacon?.active || beacon?.Active;
    document.getElementById('beaconActive').textContent = isActive ? 'Active' : 'Inactive';
    document.getElementById('beaconActive').className = 'stat-value ' + (isActive ? 'text-success' : 'text-warning');
    document.getElementById('beaconStatusActive').textContent = isActive ? 'Yes' : 'No';
    document.getElementById('beaconTimestamp').textContent = beacon?.timestamp ? formatTimestamp(beacon.timestamp) : '-';
    document.getElementById('beaconAddress').textContent = beacon?.address || '-';
    document.getElementById('beaconCode').textContent = beacon?.verification_code || '-';
    document.getElementById('beaconRawData').textContent = safeStringify(info);
}
