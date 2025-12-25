import json
import requests
from config import Config


class GridcoinRPCClient:
    """Client for Gridcoin RPC communication."""
    
    def __init__(self):
        self.url = Config.get_rpc_url()
        self.auth = (Config.GRIDCOIN_RPC_USER, Config.GRIDCOIN_RPC_PASSWORD)
        self.headers = {'Content-Type': 'application/json'}
        self._id_counter = 0
    
    def _call(self, method: str, params: list = None) -> dict:
        """Make an RPC call to Gridcoin daemon."""
        self._id_counter += 1
        payload = {
            "jsonrpc": "2.0",
            "id": self._id_counter,
            "method": method,
            "params": params or []
        }
        
        try:
            response = requests.post(
                self.url,
                auth=self.auth,
                headers=self.headers,
                data=json.dumps(payload),
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            if 'error' in result and result['error']:
                return {'success': False, 'error': result['error']}
            
            return {'success': True, 'data': result.get('result')}
            
        except requests.exceptions.ConnectionError:
            return {'success': False, 'error': 'Connection failed - Is Gridcoin daemon running?'}
        except requests.exceptions.Timeout:
            return {'success': False, 'error': 'Request timed out'}
        except requests.exceptions.HTTPError as e:
            return {'success': False, 'error': f'HTTP Error: {str(e)}'}
        except json.JSONDecodeError:
            return {'success': False, 'error': 'Invalid JSON response from daemon'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    # ===== Wallet & General Info =====
    
    def get_info(self) -> dict:
        """Get general information about the wallet and blockchain."""
        return self._call('getinfo')
    
    def get_wallet_info(self) -> dict:
        """Get wallet-specific information."""
        return self._call('getwalletinfo')
    
    def get_blockchain_info(self) -> dict:
        """Get blockchain information."""
        return self._call('getblockchaininfo')
    
    def get_network_info(self) -> dict:
        """Get network information."""
        return self._call('getnetworkinfo')
    
    def get_mining_info(self) -> dict:
        """Get mining/staking information."""
        return self._call('getmininginfo')
    
    def get_staking_info(self) -> dict:
        """Get staking-specific information."""
        return self._call('getstakinginfo')
    
    def get_balance(self) -> dict:
        """Get wallet balance."""
        return self._call('getbalance')
    
    def get_unconfirmed_balance(self) -> dict:
        """Get unconfirmed balance."""
        return self._call('getunconfirmedbalance')
    
    # ===== Research/BOINC Related =====
    
    def get_researcher_info(self) -> dict:
        """Get researcher account information."""
        return self._call('getmininginfo')
    
    def list_research_accounts(self) -> dict:
        """List research accounts."""
        return self._call('listresearcheraccounts')
    
    def get_beacons(self) -> dict:
        """Get beacon status."""
        return self._call('beaconstatus')
    
    # ===== Peers & Network =====
    
    def get_peer_info(self) -> dict:
        """Get connected peer information."""
        return self._call('getpeerinfo')
    
    def get_connection_count(self) -> dict:
        """Get number of connections."""
        return self._call('getconnectioncount')
    
    # ===== Transactions =====
    
    def list_transactions(self, count: int = 10) -> dict:
        """List recent transactions."""
        return self._call('listtransactions', ['*', count])
    
    def list_unspent(self, min_conf: int = 1, max_conf: int = 9999999, addresses: list = None) -> dict:
        """List unspent transaction outputs."""
        params = [min_conf, max_conf]
        if addresses:
            params.append(addresses)
        return self._call('listunspent', params)
    
    def list_address_groupings(self) -> dict:
        """Lists groups of addresses which have had their common ownership made public."""
        return self._call('listaddressgroupings')

    def get_received_by_address(self, address: str, min_conf: int = 1) -> dict:
        """Returns the total amount received by the given address."""
        return self._call('getreceivedbyaddress', [address, min_conf])
    
    # ===== Voting/Polls =====
    
    def list_polls(self) -> dict:
        """List active polls."""
        return self._call('listpolls')
    
    # ===== Superblock/Scraper =====
    
    def get_superblock_age(self) -> dict:
        """Get superblock age."""
        return self._call('superblockage')
    
    # ===== Custom RPC =====
    
    def execute_rpc(self, method: str, params: list = None) -> dict:
        """Execute a custom RPC command."""
        return self._call(method, params)


# Singleton instance
rpc_client = GridcoinRPCClient()
