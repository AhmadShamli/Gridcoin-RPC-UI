/**
 * RPC Console page JavaScript
 */

const commandHistory = [];
let historyIndex = -1;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('rpcForm');
    const input = document.getElementById('rpcCommand');

    form?.addEventListener('submit', handleSubmit);
    document.getElementById('clearConsole')?.addEventListener('click', clearConsole);

    document.querySelectorAll('.quick-cmd').forEach(btn => {
        btn.addEventListener('click', () => {
            input.value = btn.dataset.cmd;
            input.focus();
        });
    });

    input?.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            navigateHistory(-1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            navigateHistory(1);
        }
    });
});

async function handleSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('rpcCommand');
    const command = input.value.trim();

    if (!command) return;

    addToHistory(command);
    input.value = '';

    const [method, ...params] = command.split(/\s+/);
    appendToConsole(command, null, true);

    try {
        const response = await apiRequest('/api/execute-rpc', {
            method: 'POST',
            body: JSON.stringify({ method, params })
        });

        if (response.success) {
            appendToConsole(null, response.data);
        } else {
            appendToConsole(null, response.error, false, true);
        }
        updateConnectionStatus(true, 'Connected');
    } catch (error) {
        appendToConsole(null, error.message, false, true);
        updateConnectionStatus(false, 'Connection Error');
    }
}

function appendToConsole(command, result, isCommand = false, isError = false) {
    const output = document.getElementById('consoleOutput');
    const entry = document.createElement('div');
    entry.className = 'console-entry';

    if (isCommand) {
        entry.innerHTML = `<div class="console-command">${command}</div>`;
    } else {
        const content = typeof result === 'object' ? safeStringify(result) : result;
        entry.innerHTML = `<div class="console-result ${isError ? 'console-error' : ''}">${content}</div>`;
    }

    output.appendChild(entry);
    output.scrollTop = output.scrollHeight;
}

function addToHistory(command) {
    commandHistory.unshift(command);
    if (commandHistory.length > 50) commandHistory.pop();
    historyIndex = -1;
    updateHistoryDisplay();
}

function navigateHistory(direction) {
    const input = document.getElementById('rpcCommand');
    historyIndex += direction;

    if (historyIndex < 0) {
        historyIndex = -1;
        input.value = '';
    } else if (historyIndex >= commandHistory.length) {
        historyIndex = commandHistory.length - 1;
    }

    if (historyIndex >= 0) {
        input.value = commandHistory[historyIndex];
    }
}

function updateHistoryDisplay() {
    const container = document.getElementById('commandHistory');
    if (commandHistory.length === 0) {
        container.innerHTML = '<p class="text-muted mb-0">No commands yet</p>';
        return;
    }

    container.innerHTML = commandHistory.slice(0, 10).map(cmd =>
        `<div class="command-history-item" onclick="document.getElementById('rpcCommand').value='${cmd}'">${cmd}</div>`
    ).join('');
}

function clearConsole() {
    const output = document.getElementById('consoleOutput');
    output.innerHTML = `<div class="console-welcome">
        <p class="mb-2">Console cleared.</p>
        <p class="text-muted mb-0">Enter commands below. Use 'help' to list available commands.</p>
    </div>`;
}
