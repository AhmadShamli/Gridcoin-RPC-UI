from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash, generate_password_hash
from config import Config
from rpc_client import rpc_client
import json

app = Flask(__name__)
app.config.from_object(Config)

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message_category = 'warning'


class User(UserMixin):
    """Simple user class for single-user authentication."""
    
    def __init__(self, id):
        self.id = id


@login_manager.user_loader
def load_user(user_id):
    if user_id == Config.APP_USERNAME:
        return User(user_id)
    return None


# ===== Authentication Routes =====

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username', '')
        password = request.form.get('password', '')
        
        if username == Config.APP_USERNAME and password == Config.APP_PASSWORD:
            user = User(username)
            login_user(user, remember=True)
            next_page = request.args.get('next')
            flash('Login successful!', 'success')
            return redirect(next_page or url_for('dashboard'))
        else:
            flash('Invalid username or password', 'danger')
    
    return render_template('login.html')


@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('login'))


# ===== Dashboard Routes =====

@app.route('/')
@login_required
def dashboard():
    """Main dashboard with overview of wallet and network status."""
    return render_template('dashboard.html')


@app.route('/transactions')
@login_required
def transactions():
    """Transactions view."""
    return render_template('transactions.html')


@app.route('/network')
@login_required
def network():
    """Network and peers view."""
    return render_template('network.html')


@app.route('/research')
@login_required
def research():
    """Research/BOINC information view."""
    return render_template('research.html')


@app.route('/polls')
@login_required
def polls():
    """Polls and voting view."""
    return render_template('polls.html')


@app.route('/rpc-console')
@login_required
def rpc_console():
    """Custom RPC console."""
    return render_template('rpc_console.html')


@app.route('/addresses')
@login_required
def addresses():
    """Address list view."""
    return render_template('addresses.html')


# ===== API Routes =====

@app.route('/api/dashboard-data')
@login_required
def api_dashboard_data():
    """Get all dashboard data in one call."""
    data = {
        'info': rpc_client.get_info(),
        'wallet_info': rpc_client.get_wallet_info(),
        'staking_info': rpc_client.get_staking_info(),
        'network_info': rpc_client.get_network_info(),
        'balance': rpc_client.get_balance(),
        'unconfirmed_balance': rpc_client.get_unconfirmed_balance(),
        'connection_count': rpc_client.get_connection_count(),
        'superblock_age': rpc_client.get_superblock_age(),
    }
    return jsonify(data)


@app.route('/api/info')
@login_required
def api_info():
    """Get general info."""
    return jsonify(rpc_client.get_info())


@app.route('/api/wallet-info')
@login_required
def api_wallet_info():
    """Get wallet info."""
    return jsonify(rpc_client.get_wallet_info())


@app.route('/api/blockchain-info')
@login_required
def api_blockchain_info():
    """Get blockchain info."""
    return jsonify(rpc_client.get_blockchain_info())


@app.route('/api/network-info')
@login_required
def api_network_info():
    """Get network info."""
    return jsonify(rpc_client.get_network_info())


@app.route('/api/mining-info')
@login_required
def api_mining_info():
    """Get mining info."""
    return jsonify(rpc_client.get_mining_info())


@app.route('/api/staking-info')
@login_required  
def api_staking_info():
    """Get staking info."""
    return jsonify(rpc_client.get_staking_info())


@app.route('/api/balance')
@login_required
def api_balance():
    """Get balance."""
    return jsonify(rpc_client.get_balance())


@app.route('/api/peer-info')
@login_required
def api_peer_info():
    """Get peer info."""
    return jsonify(rpc_client.get_peer_info())


@app.route('/api/transactions')
@login_required
def api_transactions():
    """Get recent transactions."""
    count = request.args.get('count', 20, type=int)
    return jsonify(rpc_client.list_transactions(count))


@app.route('/api/beacon-status')
@login_required
def api_beacon_status():
    """Get beacon status."""
    return jsonify(rpc_client.get_beacons())


@app.route('/api/polls')
@login_required
def api_polls():
    """Get active polls."""
    return jsonify(rpc_client.list_polls())


@app.route('/api/superblock-age')
@login_required
def api_superblock_age():
    """Get superblock age."""
    return jsonify(rpc_client.get_superblock_age())


@app.route('/api/addresses')
@login_required
def api_addresses():
    """Get address groupings."""
    return jsonify(rpc_client.list_address_groupings())


@app.route('/api/address/<address>/utxos')
@login_required
def api_address_utxos(address):
    """Get UTXOs for a specific address."""
    return jsonify(rpc_client.list_unspent(addresses=[address]))


@app.route('/api/execute-rpc', methods=['POST'])
@login_required
def api_execute_rpc():
    """Execute custom RPC command."""
    data = request.get_json()
    method = data.get('method', '')
    params = data.get('params', [])
    
    if not method:
        return jsonify({'success': False, 'error': 'Method is required'}), 400
    
    # Parse params if it's a string
    if isinstance(params, str):
        try:
            params = json.loads(params) if params.strip() else []
        except json.JSONDecodeError:
            # Try to parse as space-separated values
            params = params.split() if params.strip() else []
    
    result = rpc_client.execute_rpc(method, params)
    return jsonify(result)


# ===== Error Handlers =====

@app.errorhandler(404)
def not_found(e):
    return render_template('error.html', error_code=404, error_message='Page not found'), 404


@app.errorhandler(500)
def server_error(e):
    return render_template('error.html', error_code=500, error_message='Internal server error'), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
