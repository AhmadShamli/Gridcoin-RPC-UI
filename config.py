import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Application configuration."""
    
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Gridcoin RPC
    GRIDCOIN_RPC_HOST = os.environ.get('GRIDCOIN_RPC_HOST', 'host.docker.internal')
    GRIDCOIN_RPC_PORT = int(os.environ.get('GRIDCOIN_RPC_PORT', 15715))
    GRIDCOIN_RPC_USER = os.environ.get('GRIDCOIN_RPC_USER', '')
    GRIDCOIN_RPC_PASSWORD = os.environ.get('GRIDCOIN_RPC_PASSWORD', '')
    
    # App Authentication
    APP_USERNAME = os.environ.get('APP_USERNAME', 'admin')
    APP_PASSWORD = os.environ.get('APP_PASSWORD', 'changeme')
    
    @classmethod
    def get_rpc_url(cls):
        """Get the full RPC URL."""
        return f"http://{cls.GRIDCOIN_RPC_HOST}:{cls.GRIDCOIN_RPC_PORT}"
