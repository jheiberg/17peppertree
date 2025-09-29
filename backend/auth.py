"""
OAuth2 authentication module for Keycloak integration
"""
import os
import jwt
import requests
from functools import wraps
from flask import request, jsonify, session, redirect, url_for
from urllib.parse import urlencode
import secrets
import logging

logger = logging.getLogger(__name__)

class KeycloakAuth:
    def __init__(self):
        self.server_url = os.getenv('KEYCLOAK_SERVER_URL', 'http://keycloak:8080')
        self.realm = os.getenv('KEYCLOAK_REALM', 'peppertree')
        self.client_id = os.getenv('KEYCLOAK_CLIENT_ID', 'peppertree-admin')
        self.client_secret = os.getenv('KEYCLOAK_CLIENT_SECRET', '')
        self.redirect_uri = os.getenv('KEYCLOAK_REDIRECT_URI', 'http://localhost:3000/admin/callback')
        
        # Keycloak endpoints
        self.auth_url = f"{self.server_url}/realms/{self.realm}/protocol/openid-connect/auth"
        self.token_url = f"{self.server_url}/realms/{self.realm}/protocol/openid-connect/token"
        self.userinfo_url = f"{self.server_url}/realms/{self.realm}/protocol/openid-connect/userinfo"
        self.logout_url = f"{self.server_url}/realms/{self.realm}/protocol/openid-connect/logout"
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

    def get_authorization_url(self, state=None):
        """Generate the authorization URL for OAuth2 flow"""
        if not state:
            state = secrets.token_urlsafe(32)
        
        params = {
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'response_type': 'code',
            'scope': 'openid profile email',
            'state': state
        }
        
        return f"{self.auth_url}?{urlencode(params)}", state

    def exchange_code_for_token(self, code):
        """Exchange authorization code for access token"""
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': self.redirect_uri,
            'client_id': self.client_id
        }

        # Only include client_secret if it's set (for confidential clients)
        if self.client_secret:
            data['client_secret'] = self.client_secret
        
        try:
            response = requests.post(self.token_url, data=data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to exchange code for token: {e}")
            return None

    def refresh_token(self, refresh_token):
        """Refresh the access token using refresh token"""
        data = {
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
            'client_id': self.client_id
        }

        # Only include client_secret if it's set (for confidential clients)
        if self.client_secret:
            data['client_secret'] = self.client_secret
        
        try:
            response = requests.post(self.token_url, data=data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to refresh token: {e}")
            return None

    def get_user_info(self, access_token):
        """Get user information from Keycloak"""
        headers = {'Authorization': f'Bearer {access_token}'}
        
        try:
            response = requests.get(self.userinfo_url, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get user info: {e}")
            return None

    def verify_token(self, token):
        """Verify and decode JWT token"""
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
            decoded = jwt.decode(
                token,
                key=public_keys[kid],
                algorithms=['RS256'],
                audience="account",
                issuer=f"{self.server_url}/realms/{self.realm}"
            )
            
            return decoded
        except jwt.ExpiredSignatureError:
            logger.error("Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.error(f"Invalid token: {e}")
            return None

    def logout(self, refresh_token):
        """Logout user from Keycloak"""
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'refresh_token': refresh_token
        }
        
        try:
            response = requests.post(self.logout_url, data=data)
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to logout: {e}")
            return False


# Initialize Keycloak auth instance
keycloak_auth = KeycloakAuth()


def admin_required(f):
    """Decorator to protect admin routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check for Authorization header
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No valid authorization token provided'}), 401
        
        token = auth_header.split(' ')[1]
        
        # Verify the token
        decoded = keycloak_auth.verify_token(token)
        if not decoded:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Check if user has admin role
        realm_access = decoded.get('realm_access', {})
        roles = realm_access.get('roles', [])
        
        if 'admin' not in roles and 'peppertree-admin' not in roles:
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        # Add user info to request context
        request.user = {
            'sub': decoded.get('sub'),
            'email': decoded.get('email'),
            'name': decoded.get('name'),
            'preferred_username': decoded.get('preferred_username'),
            'roles': roles
        }
        
        return f(*args, **kwargs)
    
    return decorated_function


def init_auth_routes(app):
    """Initialize OAuth2 authentication routes"""
    
    @app.route('/api/auth/login', methods=['GET'])
    def auth_login():
        """Initiate OAuth2 login flow"""
        auth_url, state = keycloak_auth.get_authorization_url()
        session['oauth_state'] = state
        return jsonify({'auth_url': auth_url})
    
    @app.route('/api/auth/callback', methods=['POST'])
    def auth_callback():
        """Handle OAuth2 callback"""
        data = request.get_json()
        code = data.get('code')
        state = data.get('state')
        
        if not code or not state:
            return jsonify({'error': 'Missing code or state parameter'}), 400
        
        # Verify state
        if state != session.get('oauth_state'):
            return jsonify({'error': 'Invalid state parameter'}), 400
        
        # Exchange code for token
        token_response = keycloak_auth.exchange_code_for_token(code)
        if not token_response:
            return jsonify({'error': 'Failed to exchange code for token'}), 400
        
        # Get user info
        user_info = keycloak_auth.get_user_info(token_response['access_token'])
        if not user_info:
            return jsonify({'error': 'Failed to get user info'}), 400
        
        # Clear state from session
        session.pop('oauth_state', None)
        
        return jsonify({
            'access_token': token_response['access_token'],
            'refresh_token': token_response['refresh_token'],
            'user': user_info
        })
    
    @app.route('/api/auth/refresh', methods=['POST'])
    def auth_refresh():
        """Refresh access token"""
        data = request.get_json()
        refresh_token = data.get('refresh_token')
        
        if not refresh_token:
            return jsonify({'error': 'Missing refresh token'}), 400
        
        token_response = keycloak_auth.refresh_token(refresh_token)
        if not token_response:
            return jsonify({'error': 'Failed to refresh token'}), 400
        
        return jsonify({
            'access_token': token_response['access_token'],
            'refresh_token': token_response.get('refresh_token', refresh_token)
        })
    
    @app.route('/api/auth/logout', methods=['POST'])
    def auth_logout():
        """Logout user"""
        data = request.get_json()
        refresh_token = data.get('refresh_token')
        
        if refresh_token:
            keycloak_auth.logout(refresh_token)
        
        session.clear()
        return jsonify({'message': 'Logged out successfully'})
    
    @app.route('/api/auth/user', methods=['GET'])
    @admin_required
    def auth_user():
        """Get current user info"""
        return jsonify(request.user)