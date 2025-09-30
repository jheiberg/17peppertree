"""
Secure API client for backend services using OAuth2 client credentials flow
"""
import os
import requests
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import threading

logger = logging.getLogger(__name__)

class SecureApiClient:
    """
    OAuth2 client credentials-based API client for secure backend communication
    """

    def __init__(self):
        self.keycloak_url = os.getenv('KEYCLOAK_SERVER_URL', 'http://192.168.1.102:8081')
        self.realm = os.getenv('KEYCLOAK_REALM', 'peppertree')
        self.client_id = os.getenv('KEYCLOAK_BACKEND_CLIENT_ID')
        self.client_secret = os.getenv('KEYCLOAK_BACKEND_CLIENT_SECRET')

        if not self.client_id or not self.client_secret:
            raise ValueError("Backend client credentials not configured. Please set KEYCLOAK_BACKEND_CLIENT_ID and KEYCLOAK_BACKEND_CLIENT_SECRET")

        self.token_url = f"{self.keycloak_url}/realms/{self.realm}/protocol/openid-connect/token"

        # Token management
        self._access_token: Optional[str] = None
        self._token_expires_at: Optional[datetime] = None
        self._token_lock = threading.Lock()

        logger.info(f"Initialized SecureApiClient for realm '{self.realm}' with client '{self.client_id}'")

    def get_access_token(self) -> str:
        """
        Get a valid access token, refreshing if necessary
        """
        with self._token_lock:
            # Check if we have a valid token
            if self._access_token and self._token_expires_at:
                # Add 60 second buffer before expiration
                if datetime.utcnow() < (self._token_expires_at - timedelta(seconds=60)):
                    return self._access_token

            # Need to get a new token
            logger.info("Requesting new access token via client credentials flow")

            try:
                response = requests.post(
                    self.token_url,
                    data={
                        'grant_type': 'client_credentials',
                        'client_id': self.client_id,
                        'client_secret': self.client_secret
                    },
                    headers={'Content-Type': 'application/x-www-form-urlencoded'},
                    timeout=10
                )

                response.raise_for_status()
                token_data = response.json()

                self._access_token = token_data['access_token']
                expires_in = token_data.get('expires_in', 300)  # Default 5 minutes
                self._token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

                logger.info(f"Successfully obtained access token, expires in {expires_in} seconds")
                return self._access_token

            except requests.exceptions.RequestException as e:
                logger.error(f"Failed to obtain access token: {e}")
                raise Exception(f"Failed to authenticate with Keycloak: {e}")

    def make_authenticated_request(self, method: str, url: str, **kwargs) -> requests.Response:
        """
        Make an authenticated HTTP request using the client credentials token
        """
        access_token = self.get_access_token()

        # Add Authorization header
        headers = kwargs.get('headers', {})
        headers['Authorization'] = f'Bearer {access_token}'
        kwargs['headers'] = headers

        # Make the request
        try:
            response = requests.request(method, url, **kwargs)

            # If we get 401, try to refresh token once
            if response.status_code == 401:
                logger.warning("Received 401, attempting to refresh token")

                # Clear current token and get a new one
                with self._token_lock:
                    self._access_token = None
                    self._token_expires_at = None

                # Get new token and retry
                access_token = self.get_access_token()
                headers['Authorization'] = f'Bearer {access_token}'
                kwargs['headers'] = headers

                response = requests.request(method, url, **kwargs)

            return response

        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {method} {url} - {e}")
            raise

    def get(self, url: str, **kwargs) -> requests.Response:
        """Make authenticated GET request"""
        return self.make_authenticated_request('GET', url, **kwargs)

    def post(self, url: str, **kwargs) -> requests.Response:
        """Make authenticated POST request"""
        return self.make_authenticated_request('POST', url, **kwargs)

    def put(self, url: str, **kwargs) -> requests.Response:
        """Make authenticated PUT request"""
        return self.make_authenticated_request('PUT', url, **kwargs)

    def delete(self, url: str, **kwargs) -> requests.Response:
        """Make authenticated DELETE request"""
        return self.make_authenticated_request('DELETE', url, **kwargs)

    def validate_token(self) -> bool:
        """
        Validate the current access token by making a test request
        """
        try:
            access_token = self.get_access_token()

            # Make a test request to Keycloak userinfo endpoint
            response = requests.get(
                f"{self.keycloak_url}/realms/{self.realm}/protocol/openid-connect/userinfo",
                headers={'Authorization': f'Bearer {access_token}'},
                timeout=5
            )

            return response.status_code == 200

        except Exception as e:
            logger.error(f"Token validation failed: {e}")
            return False

    def get_token_info(self) -> Dict[str, Any]:
        """
        Get information about the current token
        """
        with self._token_lock:
            return {
                'has_token': self._access_token is not None,
                'expires_at': self._token_expires_at.isoformat() if self._token_expires_at else None,
                'is_expired': (
                    self._token_expires_at is None or
                    datetime.utcnow() >= self._token_expires_at
                ) if self._token_expires_at else True,
                'client_id': self.client_id,
                'realm': self.realm
            }

# Global instance
secure_api_client = None

def get_secure_api_client() -> SecureApiClient:
    """
    Get the global secure API client instance
    """
    global secure_api_client
    if secure_api_client is None:
        secure_api_client = SecureApiClient()
    return secure_api_client