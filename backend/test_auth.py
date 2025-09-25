"""
Comprehensive tests for authentication system (auth.py)
"""
import pytest
import jwt
import json
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

from auth import KeycloakAuth, admin_required


class TestKeycloakAuth:
    """Test KeycloakAuth class functionality"""

    def test_init_default_values(self):
        """Test initialization with default environment values"""
        auth = KeycloakAuth()

        assert auth.server_url == 'http://localhost:8080'
        assert auth.realm == 'peppertree'
        assert auth.client_id == 'peppertree-admin'
        assert auth.redirect_uri == 'http://localhost:3000/admin/callback'

        # Check endpoint URLs are constructed correctly
        assert auth.auth_url == 'http://localhost:8080/realms/peppertree/protocol/openid-connect/auth'
        assert auth.token_url == 'http://localhost:8080/realms/peppertree/protocol/openid-connect/token'
        assert auth.userinfo_url == 'http://localhost:8080/realms/peppertree/protocol/openid-connect/userinfo'
        assert auth.logout_url == 'http://localhost:8080/realms/peppertree/protocol/openid-connect/logout'
        assert auth.jwks_url == 'http://localhost:8080/realms/peppertree/protocol/openid-connect/certs'

    @patch.dict('os.environ', {
        'KEYCLOAK_SERVER_URL': 'https://auth.example.com:8443',
        'KEYCLOAK_REALM': 'test-realm',
        'KEYCLOAK_CLIENT_ID': 'test-client',
        'KEYCLOAK_CLIENT_SECRET': 'test-secret',
        'KEYCLOAK_REDIRECT_URI': 'https://app.example.com/callback'
    })
    def test_init_with_environment_variables(self):
        """Test initialization with custom environment variables"""
        auth = KeycloakAuth()

        assert auth.server_url == 'https://auth.example.com:8443'
        assert auth.realm == 'test-realm'
        assert auth.client_id == 'test-client'
        assert auth.client_secret == 'test-secret'
        assert auth.redirect_uri == 'https://app.example.com/callback'

    @patch('requests.get')
    def test_get_public_keys_success(self, mock_get):
        """Test successful fetching of public keys"""
        # Mock JWKS response
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {
            'keys': [
                {
                    'kid': 'test-key-1',
                    'kty': 'RSA',
                    'use': 'sig',
                    'n': 'test-n-value',
                    'e': 'AQAB'
                }
            ]
        }
        mock_get.return_value = mock_response

        with patch('jwt.algorithms.RSAAlgorithm.from_jwk') as mock_from_jwk:
            mock_from_jwk.return_value = 'mock-key-object'

            auth = KeycloakAuth()
            keys = auth.get_public_keys()

            assert keys is not None
            assert len(keys) == 1
            assert 'test-key-1' in keys
            mock_get.assert_called_once_with(auth.jwks_url)

    @patch('requests.get')
    def test_get_public_keys_network_error(self, mock_get):
        """Test handling of network errors when fetching public keys"""
        mock_get.side_effect = Exception('Network error')

        auth = KeycloakAuth()
        keys = auth.get_public_keys()

        assert keys is None

    def test_get_authorization_url_default_state(self):
        """Test authorization URL generation with default state"""
        auth = KeycloakAuth()
        url, state = auth.get_authorization_url()

        # Check that URL contains correct base and parameters
        assert url.startswith(auth.auth_url)
        assert 'client_id=peppertree-admin' in url
        assert 'response_type=code' in url
        assert 'scope=openid+profile+email' in url
        assert f'state={state}' in url

        # State should be a URL-safe string
        assert isinstance(state, str)
        assert len(state) > 10  # Should be reasonably long

    def test_get_authorization_url_custom_state(self):
        """Test authorization URL generation with custom state"""
        auth = KeycloakAuth()
        custom_state = 'custom-state-value'
        url, state = auth.get_authorization_url(custom_state)

        assert f'state={custom_state}' in url
        assert state == custom_state

    @patch('requests.post')
    def test_exchange_code_for_token_success(self, mock_post):
        """Test successful token exchange"""
        # Mock successful token response
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {
            'access_token': 'test-access-token',
            'refresh_token': 'test-refresh-token',
            'token_type': 'Bearer',
            'expires_in': 3600
        }
        mock_post.return_value = mock_response

        auth = KeycloakAuth()
        result = auth.exchange_code_for_token('test-auth-code')

        assert result is not None
        assert result['access_token'] == 'test-access-token'
        assert result['refresh_token'] == 'test-refresh-token'

        # Verify correct request was made
        mock_post.assert_called_once_with(auth.token_url, data={
            'grant_type': 'authorization_code',
            'code': 'test-auth-code',
            'redirect_uri': auth.redirect_uri,
            'client_id': auth.client_id,
            'client_secret': auth.client_secret
        })

    @patch('requests.post')
    def test_exchange_code_for_token_error(self, mock_post):
        """Test handling of errors during token exchange"""
        import requests.exceptions
        mock_post.side_effect = requests.exceptions.RequestException('Network error')

        auth = KeycloakAuth()
        result = auth.exchange_code_for_token('test-auth-code')

        assert result is None

    @patch('requests.post')
    def test_refresh_token_success(self, mock_post):
        """Test successful token refresh"""
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {
            'access_token': 'new-access-token',
            'refresh_token': 'new-refresh-token',
            'token_type': 'Bearer',
            'expires_in': 3600
        }
        mock_post.return_value = mock_response

        auth = KeycloakAuth()
        result = auth.refresh_token('test-refresh-token')

        assert result is not None
        assert result['access_token'] == 'new-access-token'

        # Verify correct refresh request
        mock_post.assert_called_once_with(auth.token_url, data={
            'grant_type': 'refresh_token',
            'refresh_token': 'test-refresh-token',
            'client_id': auth.client_id,
            'client_secret': auth.client_secret
        })

    @patch('requests.post')
    def test_refresh_token_failure(self, mock_post):
        """Test handling of refresh token failure"""
        import requests.exceptions
        mock_post.side_effect = requests.exceptions.RequestException('Refresh failed')

        auth = KeycloakAuth()
        result = auth.refresh_token('invalid-refresh-token')

        assert result is None

    @patch('requests.get')
    def test_get_user_info_success(self, mock_get):
        """Test successful user info retrieval"""
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {
            'sub': 'test-user-id',
            'preferred_username': 'testuser',
            'email': 'test@example.com',
            'name': 'Test User'
        }
        mock_get.return_value = mock_response

        auth = KeycloakAuth()
        result = auth.get_user_info('test-access-token')

        assert result is not None
        assert result['preferred_username'] == 'testuser'
        assert result['email'] == 'test@example.com'

        # Verify correct API call with authorization header
        mock_get.assert_called_once_with(
            auth.userinfo_url,
            headers={'Authorization': 'Bearer test-access-token'}
        )

    @patch('requests.get')
    def test_get_user_info_failure(self, mock_get):
        """Test handling of user info retrieval failure"""
        import requests.exceptions
        mock_get.side_effect = requests.exceptions.RequestException('API error')

        auth = KeycloakAuth()
        result = auth.get_user_info('test-access-token')

        assert result is None

    def test_verify_token_no_public_keys(self):
        """Test token verification when public keys are unavailable"""
        auth = KeycloakAuth()

        with patch.object(auth, 'get_public_keys', return_value=None):
            result = auth.verify_token('test-jwt-token')
            assert result is None

    def test_verify_token_invalid_jwt(self):
        """Test token verification with invalid JWT"""
        auth = KeycloakAuth()

        with patch.object(auth, 'get_public_keys') as mock_get_keys:
            mock_get_keys.return_value = {'test-kid': 'mock-key'}

            with patch('jwt.decode', side_effect=jwt.InvalidTokenError('Invalid token')):
                result = auth.verify_token('invalid-jwt-token')
                assert result is None

    @patch('requests.post')
    def test_logout_success(self, mock_post):
        """Test successful logout"""
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        auth = KeycloakAuth()
        result = auth.logout('test-refresh-token')

        assert result is True

    @patch('requests.post')
    def test_logout_failure(self, mock_post):
        """Test logout failure"""
        import requests.exceptions
        mock_post.side_effect = requests.exceptions.RequestException('Logout failed')

        auth = KeycloakAuth()
        result = auth.logout('test-refresh-token')

        assert result is False


class TestAdminRequiredDecorator:
    """Test the admin_required decorator with Flask app context"""

    def test_admin_required_no_auth_header(self, test_app):
        """Test admin_required with missing Authorization header"""
        with test_app.test_request_context():
            @admin_required
            def dummy_view():
                return {'message': 'success'}

            response, status_code = dummy_view()

            assert status_code == 401
            data = response.get_json()
            assert 'error' in data
            assert 'authorization token' in data['error'].lower()

    def test_admin_required_invalid_auth_header(self, test_app):
        """Test admin_required with invalid Authorization header format"""
        with test_app.test_request_context(headers={'Authorization': 'InvalidFormat token'}):
            @admin_required
            def dummy_view():
                return {'message': 'success'}

            response, status_code = dummy_view()

            assert status_code == 401
            data = response.get_json()
            assert 'error' in data

    @patch('auth.keycloak_auth.verify_token')
    def test_admin_required_invalid_token(self, mock_verify_token, test_app):
        """Test admin_required with invalid token"""
        mock_verify_token.return_value = None

        with test_app.test_request_context(headers={'Authorization': 'Bearer invalid-token'}):
            @admin_required
            def dummy_view():
                return {'message': 'success'}

            response, status_code = dummy_view()

            assert status_code == 401
            data = response.get_json()
            assert 'Invalid or expired token' in data['error']

    @patch('auth.keycloak_auth.verify_token')
    def test_admin_required_insufficient_permissions(self, mock_verify_token, test_app):
        """Test admin_required with user lacking admin role"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['user', 'viewer']},
            'preferred_username': 'regularuser',
            'email': 'user@example.com'
        }

        with test_app.test_request_context(headers={'Authorization': 'Bearer valid-token'}):
            @admin_required
            def dummy_view():
                return {'message': 'success'}

            response, status_code = dummy_view()

            assert status_code == 403
            data = response.get_json()
            assert 'Insufficient permissions' in data['error']

    @patch('auth.keycloak_auth.verify_token')
    def test_admin_required_success_admin_role(self, mock_verify_token, test_app):
        """Test admin_required with valid admin user"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['admin', 'user']},
            'preferred_username': 'adminuser',
            'email': 'admin@example.com'
        }

        with test_app.test_request_context(headers={'Authorization': 'Bearer valid-admin-token'}):
            @admin_required
            def dummy_view():
                return {'message': 'success'}

            result = dummy_view()

            assert result == {'message': 'success'}

    @patch('auth.keycloak_auth.verify_token')
    def test_admin_required_success_peppertree_admin_role(self, mock_verify_token, test_app):
        """Test admin_required with peppertree-admin role"""
        mock_verify_token.return_value = {
            'realm_access': {'roles': ['peppertree-admin', 'user']},
            'preferred_username': 'peppertreeadmin',
            'email': 'admin@peppertree.com'
        }

        with test_app.test_request_context(headers={'Authorization': 'Bearer valid-token'}):
            @admin_required
            def dummy_view():
                return {'message': 'success'}

            result = dummy_view()

            assert result == {'message': 'success'}

    @patch('auth.keycloak_auth.verify_token')
    def test_admin_required_no_realm_access(self, mock_verify_token, test_app):
        """Test admin_required with token missing realm_access"""
        mock_verify_token.return_value = {
            'preferred_username': 'user',
            'email': 'user@example.com'
            # Missing realm_access
        }

        with test_app.test_request_context(headers={'Authorization': 'Bearer valid-token'}):
            @admin_required
            def dummy_view():
                return {'message': 'success'}

            response, status_code = dummy_view()

            assert status_code == 403
            data = response.get_json()
            assert 'Insufficient permissions' in data['error']


class TestAuthIntegration:
    """Integration tests for authentication functionality"""

    @patch('requests.get')
    @patch('requests.post')
    def test_full_oauth_flow_simulation(self, mock_post, mock_get):
        """Test simulated full OAuth flow"""
        auth = KeycloakAuth()

        # Step 1: Get authorization URL
        auth_url, state = auth.get_authorization_url()
        assert 'state=' in auth_url
        assert len(state) > 0

        # Step 2: Mock token exchange
        mock_post.return_value.raise_for_status = MagicMock()
        mock_post.return_value.json.return_value = {
            'access_token': 'test-access-token',
            'refresh_token': 'test-refresh-token'
        }

        token_response = auth.exchange_code_for_token('test-code')
        assert token_response['access_token'] == 'test-access-token'

        # Step 3: Mock user info retrieval
        mock_get.return_value.raise_for_status = MagicMock()
        mock_get.return_value.json.return_value = {
            'preferred_username': 'testuser',
            'email': 'test@example.com'
        }

        user_info = auth.get_user_info(token_response['access_token'])
        assert user_info['preferred_username'] == 'testuser'

    def test_keycloak_url_construction(self):
        """Test that all Keycloak URLs are constructed correctly"""
        auth = KeycloakAuth()

        expected_base = f"{auth.server_url}/realms/{auth.realm}/protocol/openid-connect"

        assert auth.auth_url == f"{expected_base}/auth"
        assert auth.token_url == f"{expected_base}/token"
        assert auth.userinfo_url == f"{expected_base}/userinfo"
        assert auth.logout_url == f"{expected_base}/logout"
        assert auth.jwks_url == f"{expected_base}/certs"