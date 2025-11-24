"""
Secure authentication decorators for client credentials and service-to-service communication
"""
import os
import jwt
import requests
from functools import wraps
from flask import request, jsonify
import logging

logger = logging.getLogger(__name__)

class SecureAuth:
    def __init__(self):
        self.server_url = os.getenv('KEYCLOAK_SERVER_URL', 'http://192.168.1.102:8081')
        self.realm = os.getenv('KEYCLOAK_REALM', 'peppertree')
        self.backend_client_id = os.getenv('KEYCLOAK_BACKEND_CLIENT_ID')
        self.jwks_url = f"{self.server_url}/realms/{self.realm}/protocol/openid-connect/certs"
        self._public_keys = None

    def get_public_keys(self):
        """Fetch and cache public keys from Keycloak"""
        if not self._public_keys:
            try:
                response = requests.get(self.jwks_url)
                response.raise_for_status()
                jwks = response.json()
                self._public_keys = {}
                for key in jwks['keys']:
                    self._public_keys[key['kid']] = jwt.algorithms.RSAAlgorithm.from_jwk(key)
            except Exception as e:
                logger.error(f"Failed to fetch public keys: {e}")
                return None
        return self._public_keys

    def verify_client_credentials_token(self, token):
        """Verify JWT token from client credentials flow"""
        try:

            # Get the token header to find the key ID
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get('kid')

            if not kid:
                logger.error("No kid found in token header")
                return None

            # Get public keys
            public_keys = self.get_public_keys()
            if not public_keys or kid not in public_keys:
                logger.error(f"Public key not found for kid: {kid}")
                return None

            # Verify and decode the token
            expected_issuer = f"{self.server_url}/realms/{self.realm}"
            decoded = jwt.decode(
                token,
                key=public_keys[kid],
                algorithms=['RS256'],
                audience="account",
                issuer=expected_issuer
            )

            # Verify this is a client credentials token
            if decoded.get('typ') != 'Bearer':
                logger.error("Token is not a Bearer token")
                return None

            # Check if token is for service account (client credentials)
            preferred_username = decoded.get('preferred_username', '')
            if not preferred_username.startswith('service-account-'):
                logger.error(f"Token is not from a service account: {preferred_username}")
                return None

            return decoded

        except jwt.ExpiredSignatureError:
            logger.error("Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.error(f"Invalid token: {e}")
            return None

    def verify_user_token(self, token):
        """Verify JWT token from user authentication"""
        try:

            # Get the token header to find the key ID
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get('kid')

            if not kid:
                logger.error("No kid found in token header")
                return None

            # Get public keys
            public_keys = self.get_public_keys()
            if not public_keys or kid not in public_keys:
                logger.error(f"Public key not found for kid: {kid}")
                return None

            # Decode token without strict issuer validation first
            unverified_decoded = jwt.decode(
                token,
                key=public_keys[kid],
                algorithms=['RS256'],
                audience="account",
                options={"verify_signature": True, "verify_iss": False}
            )
            
            # Manually verify issuer - accept both localhost and internal keycloak URLs
            token_issuer = unverified_decoded.get('iss', '')
            allowed_issuers = [
                f"http://keycloak:8080/realms/{self.realm}",
                f"http://localhost:8080/realms/{self.realm}",
                f"http://192.168.1.222:8080/realms/{self.realm}",
                f"http://127.0.0.1:8080/realms/{self.realm}",
            ]
            
            if token_issuer not in allowed_issuers:
                logger.error(f"Invalid issuer: {token_issuer}. Expected one of: {allowed_issuers}")
                return None

            # Verify this is a user token (not service account)
            preferred_username = unverified_decoded.get('preferred_username', '')
            if preferred_username.startswith('service-account-'):
                logger.error(f"Service account token not allowed for user endpoints: {preferred_username}")
                return None

            return unverified_decoded

        except jwt.ExpiredSignatureError:
            logger.error("Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.error(f"Invalid token: {e}")
            return None

# Initialize secure auth instance
secure_auth = SecureAuth()

def client_credentials_required(f):
    """Decorator to protect routes that require client credentials authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check for Authorization header
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No valid authorization token provided'}), 401

        token = auth_header.split(' ')[1]

        # Verify the client credentials token
        decoded = secure_auth.verify_client_credentials_token(token)
        if not decoded:
            return jsonify({'error': 'Invalid or expired client credentials token'}), 401

        # Add client info to request context
        request.client = {
            'sub': decoded.get('sub'),
            'client_id': decoded.get('azp'),  # Authorized party (client_id)
            'realm': decoded.get('iss', '').split('/')[-1],
            'scope': decoded.get('scope', '').split(),
            'exp': decoded.get('exp'),
            'iat': decoded.get('iat')
        }

        return f(*args, **kwargs)

    return decorated_function

def user_or_client_required(f):
    """Decorator to protect routes that accept both user and client credentials tokens"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check for Authorization header
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No valid authorization token provided'}), 401

        token = auth_header.split(' ')[1]

        # Try client credentials first
        decoded = secure_auth.verify_client_credentials_token(token)
        if decoded:
            # Client credentials token
            request.auth_type = 'client'
            request.client = {
                'sub': decoded.get('sub'),
                'client_id': decoded.get('azp'),
                'realm': decoded.get('iss', '').split('/')[-1],
                'scope': decoded.get('scope', '').split(),
                'exp': decoded.get('exp'),
                'iat': decoded.get('iat')
            }
            request.user = None
        else:
            # Try user token
            decoded = secure_auth.verify_user_token(token)
            if not decoded:
                return jsonify({'error': 'Invalid or expired token'}), 401

            # User token
            request.auth_type = 'user'
            request.user = {
                'sub': decoded.get('sub'),
                'email': decoded.get('email'),
                'name': decoded.get('name'),
                'preferred_username': decoded.get('preferred_username'),
                'roles': decoded.get('realm_access', {}).get('roles', [])
            }
            request.client = None

        return f(*args, **kwargs)

    return decorated_function