/**
 * Gridcoin RPC UI - Main JavaScript
 */

// Global state
const AppState = {
    autoRefresh: false,
    refreshInterval: 10000,
    refreshTimer: null,
    isConnected: false
};

// DOM Elements
const elements = {
    autoRefreshToggle: document.getElementById('autoRefreshToggle'),
    refreshIntervalSelect: document.getElementById('refreshInterval'),
    manualRefreshBtn: document.getElementById('manualRefresh'),
    connectionStatus: document.getElementById('connectionStatus'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    sidebar: document.getElementById('sidebar')
};

/**
 * Initialize the application
 */
function initApp() {
    setupEventListeners();
    setupSidebar();
    loadAutoRefreshState();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Auto refresh toggle
    if (elements.autoRefreshToggle) {
        elements.autoRefreshToggle.addEventListener('change', handleAutoRefreshToggle);
    }

    // Refresh interval change
    if (elements.refreshIntervalSelect) {
        elements.refreshIntervalSelect.addEventListener('change', handleIntervalChange);
    }

    // Manual refresh button
    if (elements.manualRefreshBtn) {
        elements.manualRefreshBtn.addEventListener('click', handleManualRefresh);
    }

    // Sidebar toggle
    if (elements.sidebarToggle) {
        elements.sidebarToggle.addEventListener('click', toggleSidebar);
    }
}

/**
 * Setup sidebar behavior
 */
function setupSidebar() {
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth < 992 && elements.sidebar?.classList.contains('show')) {
            if (!elements.sidebar.contains(e.target) && !elements.sidebarToggle?.contains(e.target)) {
                elements.sidebar.classList.remove('show');
            }
        }
    });
}

/**
 * Toggle sidebar visibility
 */
function toggleSidebar() {
    elements.sidebar?.classList.toggle('show');
}

/**
 * Handle auto refresh toggle
 */
function handleAutoRefreshToggle(e) {
    AppState.autoRefresh = e.target.checked;
    elements.refreshIntervalSelect.disabled = !AppState.autoRefresh;

    if (AppState.autoRefresh) {
        startAutoRefresh();
    } else {
        stopAutoRefresh();
    }

    saveAutoRefreshState();
}

/**
 * Handle interval change
 */
function handleIntervalChange(e) {
    AppState.refreshInterval = parseInt(e.target.value);

    if (AppState.autoRefresh) {
        stopAutoRefresh();
        startAutoRefresh();
    }

    saveAutoRefreshState();
}

/**
 * Handle manual refresh
 */
function handleManualRefresh() {
    // Trigger page-specific refresh function
    if (typeof refreshData === 'function') {
        refreshData();
    }

    // Visual feedback
    const btn = elements.manualRefreshBtn;
    const icon = btn.querySelector('i');
    icon.classList.add('spin');
    setTimeout(() => icon.classList.remove('spin'), 500);
}

/**
 * Start auto refresh
 */
function startAutoRefresh() {
    stopAutoRefresh();
    AppState.refreshTimer = setInterval(() => {
        if (typeof refreshData === 'function') {
            refreshData();
        }
    }, AppState.refreshInterval);
}

/**
 * Stop auto refresh
 */
function stopAutoRefresh() {
    if (AppState.refreshTimer) {
        clearInterval(AppState.refreshTimer);
        AppState.refreshTimer = null;
    }
}

/**
 * Save auto refresh state to localStorage
 */
function saveAutoRefreshState() {
    localStorage.setItem('autoRefresh', JSON.stringify({
        enabled: AppState.autoRefresh,
        interval: AppState.refreshInterval
    }));
}

/**
 * Load auto refresh state from localStorage
 */
function loadAutoRefreshState() {
    try {
        const saved = JSON.parse(localStorage.getItem('autoRefresh'));
        if (saved) {
            AppState.autoRefresh = saved.enabled || false;
            AppState.refreshInterval = saved.interval || 10000;

            if (elements.autoRefreshToggle) {
                elements.autoRefreshToggle.checked = AppState.autoRefresh;
            }
            if (elements.refreshIntervalSelect) {
                elements.refreshIntervalSelect.value = AppState.refreshInterval;
                elements.refreshIntervalSelect.disabled = !AppState.autoRefresh;
            }

            if (AppState.autoRefresh) {
                startAutoRefresh();
            }
        }
    } catch (e) {
        console.error('Error loading auto refresh state:', e);
    }
}

/**
 * Update connection status indicator
 */
function updateConnectionStatus(connected, message = null) {
    AppState.isConnected = connected;

    if (elements.connectionStatus) {
        const indicator = elements.connectionStatus.querySelector('.status-indicator');
        const text = elements.connectionStatus.querySelector('.status-text');

        indicator.classList.remove('connected', 'error');

        if (connected) {
            indicator.classList.add('connected');
            text.textContent = message || 'Connected';
        } else {
            indicator.classList.add('error');
            text.textContent = message || 'Disconnected';
        }
    }
}

/**
 * Format number with commas
 */
function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined) return '-';
    return parseFloat(num).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format timestamp to readable date
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Format time duration
 */
function formatDuration(seconds) {
    if (!seconds || seconds < 0) return '-';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
}

/**
 * Truncate string with ellipsis
 */
function truncateString(str, maxLength = 20) {
    if (!str) return '-';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
}

/**
 * Safe JSON stringify for display
 */
function safeStringify(obj, indent = 2) {
    try {
        return JSON.stringify(obj, null, indent);
    } catch (e) {
        return String(obj);
    }
}

/**
 * Make API request with error handling
 */
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

// Add CSS for spin animation
const style = document.createElement('style');
style.textContent = `
    .spin {
        animation: spin 0.5s linear;
    }
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
