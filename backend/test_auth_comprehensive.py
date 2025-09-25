"""
Comprehensive tests to achieve 100% coverage for auth.py
"""
import pytest
import jwt
import json
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta

from auth import KeycloakAuth, admin_required, init_auth_routes


class TestKeycloakAuthTokenVerification:
    """Test complete token verification scenarios"""

    def test_verify_token_no_kid_in_header(self):
        """Test token verification when token header has no kid"""
        auth = KeycloakAuth()

        # Mock jwt.get_unverified_header to return header without kid
        with patch('jwt.get_unverified_header') as mock_get_header:
            mock_get_header.return_value = {'alg': 'RS256'}  # No kid

            result = auth.verify_token('test-token')
            assert result is None

    def test_verify_token_kid_not_in_public_keys(self):
        """Test token verification when kid is not in available public keys"""
        auth = KeycloakAuth()

        with patch('jwt.get_unverified_header') as mock_get_header:
            mock_get_header.return_value = {'kid': 'unknown-key-id', 'alg': 'RS256'}

            with patch.object(auth, 'get_public_keys') as mock_get_keys:
                mock_get_keys.return_value = {'different-key': 'mock-key'}

                result = auth.verify_token('test-token')
                assert result is None

    def test_verify_token_expired_signature(self):
        """Test token verification with expired token"""
        auth = KeycloakAuth()

        with patch('jwt.get_unverified_header') as mock_get_header:
            mock_get_header.return_value = {'kid': 'test-key', 'alg': 'RS256'}

            with patch.object(auth, 'get_public_keys') as mock_get_keys:
                mock_get_keys.return_value = {'test-key': 'mock-key'}

                with patch('jwt.decode') as mock_jwt_decode:
                    mock_jwt_decode.side_effect = jwt.ExpiredSignatureError('Token has expired')

                    result = auth.verify_token('expired-token')
                    assert result is None

    def test_verify_token_successful_verification(self):
        """Test successful token verification with all components"""
        auth = KeycloakAuth()

        expected_payload = {
            'sub': 'user123',
            'preferred_username': 'testuser',
            'email': 'test@example.com',
            'realm_access': {'roles': ['admin']}
        }

        with patch('jwt.get_unverified_header') as mock_get_header:
            mock_get_header.return_value = {'kid': 'test-key', 'alg': 'RS256'}

            with patch.object(auth, 'get_public_keys') as mock_get_keys:
                mock_get_keys.return_value = {'test-key': 'mock-rsa-key'}

                with patch('jwt.decode') as mock_jwt_decode:
                    mock_jwt_decode.return_value = expected_payload

                    result = auth.verify_token('valid-token')

                    assert result == expected_payload
                    # Verify jwt.decode was called with correct parameters
                    mock_jwt_decode.assert_called_once_with(
                        'valid-token',
                        key='mock-rsa-key',
                        algorithms=['RS256'],
                        audience="account",
                        issuer=f"{auth.server_url}/realms/{auth.realm}"
                    )

    def test_verify_token_empty_public_keys(self):
        """Test token verification when get_public_keys returns empty dict"""
        auth = KeycloakAuth()

        with patch('jwt.get_unverified_header') as mock_get_header:
            mock_get_header.return_value = {'kid': 'test-key', 'alg': 'RS256'}

            with patch.object(auth, 'get_public_keys') as mock_get_keys:
                mock_get_keys.return_value = {}  # Empty keys

                result = auth.verify_token('test-token')
                assert result is None


class TestFlaskAuthRoutes:
    """Test Flask authentication route handlers"""

    def test_auth_login_route(self, test_app):
        """Test /api/auth/login route"""
        with test_app.test_client() as client:
            with patch('auth.keycloak_auth.get_authorization_url') as mock_auth_url:
                mock_auth_url.return_value = ('https://auth.example.com/login', 'test-state')

                response = client.get('/api/auth/login')

                assert response.status_code == 200
                data = json.loads(response.data)
                assert 'auth_url' in data
                assert data['auth_url'] == 'https://auth.example.com/login'

    def test_auth_callback_success(self, test_app):
        """Test successful /api/auth/callback"""
        with test_app.test_client() as client:
            with client.session_transaction() as sess:
                sess['oauth_state'] = 'test-state'

            with patch('auth.keycloak_auth.exchange_code_for_token') as mock_exchange:
                with patch('auth.keycloak_auth.get_user_info') as mock_user_info:
                    mock_exchange.return_value = {
                        'access_token': 'test-access-token',
                        'refresh_token': 'test-refresh-token'
                    }
                    mock_user_info.return_value = {
                        'preferred_username': 'testuser',
                        'email': 'test@example.com'
                    }

                    response = client.post('/api/auth/callback',
                                         data=json.dumps({
                                             'code': 'test-code',
                                             'state': 'test-state'
                                         }),
                                         content_type='application/json')

                    assert response.status_code == 200
                    data = json.loads(response.data)
                    assert data['access_token'] == 'test-access-token'
                    assert data['refresh_token'] == 'test-refresh-token'
                    assert data['user']['preferred_username'] == 'testuser'

    def test_auth_callback_missing_code(self, test_app):
        """Test /api/auth/callback with missing code parameter"""
        with test_app.test_client() as client:
            response = client.post('/api/auth/callback',
                                 data=json.dumps({'state': 'test-state'}),
                                 content_type='application/json')

            assert response.status_code == 400
            data = json.loads(response.data)
            assert 'Missing code or state parameter' in data['error']

    def test_auth_callback_missing_state(self, test_app):
        """Test /api/auth/callback with missing state parameter"""
        with test_app.test_client() as client:
            response = client.post('/api/auth/callback',
                                 data=json.dumps({'code': 'test-code'}),
                                 content_type='application/json')

            assert response.status_code == 400
            data = json.loads(response.data)
            assert 'Missing code or state parameter' in data['error']

    def test_auth_callback_invalid_state(self, test_app):
        """Test /api/auth/callback with invalid state"""
        with test_app.test_client() as client:
            with client.session_transaction() as sess:
                sess['oauth_state'] = 'correct-state'

            response = client.post('/api/auth/callback',
                                 data=json.dumps({
                                     'code': 'test-code',
                                     'state': 'wrong-state'
                                 }),
                                 content_type='application/json')

            assert response.status_code == 400
            data = json.loads(response.data)
            assert 'Invalid state parameter' in data['error']

    def test_auth_callback_token_exchange_fails(self, test_app):
        """Test /api/auth/callback when token exchange fails"""
        with test_app.test_client() as client:
            with client.session_transaction() as sess:
                sess['oauth_state'] = 'test-state'

            with patch('auth.keycloak_auth.exchange_code_for_token') as mock_exchange:
                mock_exchange.return_value = None  # Failure

                response = client.post('/api/auth/callback',
                                     data=json.dumps({
                                         'code': 'invalid-code',
                                         'state': 'test-state'
                                     }),
                                     content_type='application/json')

                assert response.status_code == 400
                data = json.loads(response.data)
                assert 'Failed to exchange code for token' in data['error']

    def test_auth_callback_user_info_fails(self, test_app):
        """Test /api/auth/callback when getting user info fails"""
        with test_app.test_client() as client:
            with client.session_transaction() as sess:
                sess['oauth_state'] = 'test-state'

            with patch('auth.keycloak_auth.exchange_code_for_token') as mock_exchange:
                with patch('auth.keycloak_auth.get_user_info') as mock_user_info:
                    mock_exchange.return_value = {'access_token': 'test-token'}
                    mock_user_info.return_value = None  # Failure

                    response = client.post('/api/auth/callback',
                                         data=json.dumps({
                                             'code': 'test-code',
                                             'state': 'test-state'
                                         }),
                                         content_type='application/json')

                    assert response.status_code == 400
                    data = json.loads(response.data)
                    assert 'Failed to get user info' in data['error']

    def test_auth_refresh_success(self, test_app):
        """Test successful /api/auth/refresh"""
        with test_app.test_client() as client:
            with patch('auth.keycloak_auth.refresh_token') as mock_refresh:
                mock_refresh.return_value = {
                    'access_token': 'new-access-token',
                    'refresh_token': 'new-refresh-token'
                }

                response = client.post('/api/auth/refresh',
                                     data=json.dumps({
                                         'refresh_token': 'old-refresh-token'
                                     }),
                                     content_type='application/json')

                assert response.status_code == 200
                data = json.loads(response.data)
                assert data['access_token'] == 'new-access-token'
                assert data['refresh_token'] == 'new-refresh-token'

    def test_auth_refresh_missing_token(self, test_app):
        """Test /api/auth/refresh with missing refresh token"""
        with test_app.test_client() as client:
            response = client.post('/api/auth/refresh',
                                 data=json.dumps({}),
                                 content_type='application/json')

            assert response.status_code == 400
            data = json.loads(response.data)
            assert 'Missing refresh token' in data['error']

    def test_auth_refresh_invalid_token(self, test_app):
        """Test /api/auth/refresh with invalid refresh token"""
        with test_app.test_client() as client:
            with patch('auth.keycloak_auth.refresh_token') as mock_refresh:
                mock_refresh.return_value = None  # Invalid token

                response = client.post('/api/auth/refresh',
                                     data=json.dumps({
                                         'refresh_token': 'invalid-token'
                                     }),
                                     content_type='application/json')

                assert response.status_code == 400
                data = json.loads(response.data)
                assert 'Failed to refresh token' in data['error']

    def test_auth_logout_success(self, test_app):
        """Test successful /api/auth/logout"""
        with test_app.test_client() as client:
            with patch('auth.keycloak_auth.logout') as mock_logout:
                mock_logout.return_value = True

                response = client.post('/api/auth/logout',
                                     data=json.dumps({
                                         'refresh_token': 'test-refresh-token'
                                     }),
                                     content_type='application/json')

                assert response.status_code == 200
                data = json.loads(response.data)
                assert data['message'] == 'Logged out successfully'

    def test_auth_logout_failure(self, test_app):
        """Test /api/auth/logout - always returns success regardless of Keycloak response"""
        with test_app.test_client() as client:
            with patch('auth.keycloak_auth.logout') as mock_logout:
                mock_logout.return_value = False  # Even if Keycloak fails

                response = client.post('/api/auth/logout',
                                     data=json.dumps({
                                         'refresh_token': 'invalid-token'
                                     }),
                                     content_type='application/json')

                # Logout always returns 200 and clears session
                assert response.status_code == 200
                data = json.loads(response.data)
                assert data['message'] == 'Logged out successfully'

    def test_auth_user_info_success(self, test_app):
        """Test successful /api/auth/user"""
        with test_app.test_client() as client:
            with patch('auth.keycloak_auth.verify_token') as mock_verify:
                mock_verify.return_value = {
                    'preferred_username': 'testuser',
                    'email': 'test@example.com',
                    'realm_access': {'roles': ['admin']}  # Need admin role for admin_required
                }

                response = client.get('/api/auth/user',
                                    headers={'Authorization': 'Bearer valid-token'})

                assert response.status_code == 200
                data = json.loads(response.data)
                assert data['preferred_username'] == 'testuser'
                assert data['email'] == 'test@example.com'

    def test_auth_user_info_no_token(self, test_app):
        """Test /api/auth/user without token"""
        with test_app.test_client() as client:
            response = client.get('/api/auth/user')

            assert response.status_code == 401
            data = json.loads(response.data)
            assert 'No valid authorization token provided' in data['error']

    def test_auth_user_info_invalid_token(self, test_app):
        """Test /api/auth/user with invalid token"""
        with test_app.test_client() as client:
            with patch('auth.keycloak_auth.verify_token') as mock_verify:
                mock_verify.return_value = None

                response = client.get('/api/auth/user',
                                    headers={'Authorization': 'Bearer invalid-token'})

                assert response.status_code == 401
                data = json.loads(response.data)
                assert 'Invalid or expired token' in data['error']


class TestInitAuthRoutes:
    """Test the init_auth_routes function"""

    def test_init_auth_routes_registers_all_routes(self, test_app):
        """Test that init_auth_routes registers all expected routes"""
        # The routes should already be registered by the test app setup
        with test_app.test_client() as client:
            # Test that all auth routes are accessible
            routes_to_test = [
                ('/api/auth/login', 'GET'),
                ('/api/auth/callback', 'POST'),
                ('/api/auth/refresh', 'POST'),
                ('/api/auth/logout', 'POST'),
                ('/api/auth/user', 'GET')
            ]

            for route, method in routes_to_test:
                if method == 'GET':
                    response = client.get(route)
                else:
                    response = client.post(route,
                                         data=json.dumps({}),
                                         content_type='application/json')

                # We expect responses (not 404), even if they're error responses
                assert response.status_code != 404