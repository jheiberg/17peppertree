"""
Comprehensive tests for secure_auth.py
"""
import pytest
import jwt
import json
from unittest.mock import patch, Mock, MagicMock
from datetime import datetime, timedelta

from secure_auth import SecureAuth, client_credentials_required, user_or_client_required, secure_auth


class TestSecureAuth:
    """Test SecureAuth class functionality"""

    def test_init_default_values(self):
        """Test initialization with default environment values"""
        auth = SecureAuth()

        assert auth.server_url == 'http://localhost:8080'
        assert auth.realm == 'peppertree'
        assert auth.backend_client_id is None  # Default is None from environment
        assert auth.jwks_url == 'http://localhost:8080/realms/peppertree/protocol/openid-connect/certs'
        assert auth._public_keys is None

    @patch.dict('os.environ', {
        'KEYCLOAK_SERVER_URL': 'https://auth.example.com:8443',
        'KEYCLOAK_REALM': 'test-realm',
        'KEYCLOAK_BACKEND_CLIENT_ID': 'test-backend-client'
    })
    def test_init_with_environment_variables(self):
        """Test initialization with custom environment variables"""
        auth = SecureAuth()

        assert auth.server_url == 'https://auth.example.com:8443'
        assert auth.realm == 'test-realm'
        assert auth.backend_client_id == 'test-backend-client'
        assert auth.jwks_url == 'https://auth.example.com:8443/realms/test-realm/protocol/openid-connect/certs'

    @patch('requests.get')
    def test_get_public_keys_success(self, mock_get):
        """Test successful public keys retrieval"""
        # Mock JWKS response
        mock_response = Mock()
        mock_response.raise_for_status = Mock()
        mock_response.json.return_value = {
            'keys': [
                {
                    'kid': 'key-1',
                    'kty': 'RSA',
                    'use': 'sig',
                    'n': 'test-n-value-1',
                    'e': 'AQAB'
                },
                {
                    'kid': 'key-2',
                    'kty': 'RSA',
                    'use': 'sig',
                    'n': 'test-n-value-2',
                    'e': 'AQAB'
                }
            ]
        }
        mock_get.return_value = mock_response

        with patch('jwt.algorithms.RSAAlgorithm.from_jwk') as mock_from_jwk:
            mock_from_jwk.side_effect = ['key-obj-1', 'key-obj-2']

            auth = SecureAuth()
            result = auth.get_public_keys()

            assert result is not None
            assert len(result) == 2
            assert 'key-1' in result
            assert 'key-2' in result
            assert result['key-1'] == 'key-obj-1'
            assert result['key-2'] == 'key-obj-2'

    @patch('requests.get')
    def test_get_public_keys_network_error(self, mock_get):
        """Test public keys retrieval with network error"""
        mock_get.side_effect = Exception('Network error')

        auth = SecureAuth()
        result = auth.get_public_keys()

        assert result is None

    @patch('requests.get')
    def test_get_public_keys_caching(self, mock_get):
        """Test that public keys are cached"""
        mock_response = Mock()
        mock_response.raise_for_status = Mock()
        mock_response.json.return_value = {
            'keys': [
                {
                    'kid': 'test-key-id',
                    'kty': 'RSA',
                    'use': 'sig',
                    'n': 'test-n-value',
                    'e': 'AQAB'
                }
            ]
        }
        mock_get.return_value = mock_response

        auth = SecureAuth()
        # Ensure clean state
        auth._public_keys = None

        # First call
        result1 = auth.get_public_keys()
        assert mock_get.call_count == 1

        # Second call should use cache
        result2 = auth.get_public_keys()
        assert mock_get.call_count == 1  # No additional calls
        assert result1 is result2  # Should be the same object

    @patch('requests.get')
    def test_verify_client_credentials_token_success(self, mock_get):
        """Test successful client credentials token verification"""
        # Mock JWKS response
        mock_response = Mock()
        mock_response.raise_for_status = Mock()
        mock_response.json.return_value = {
            'keys': [
                {
                    'kid': 'test-key',
                    'kty': 'RSA',
                    'use': 'sig',
                    'n': 'test-n-value',
                    'e': 'AQAB'
                }
            ]
        }
        mock_get.return_value = mock_response

        # Mock JWT operations
        expected_payload = {
            'typ': 'Bearer',
            'preferred_username': 'service-account-test-client',
            'azp': 'test-client',
            'iss': 'http://192.168.1.102:8081/realms/peppertree',
            'exp': datetime.now().timestamp() + 3600
        }

        with patch('jwt.get_unverified_header') as mock_get_header, \
             patch('jwt.algorithms.RSAAlgorithm.from_jwk') as mock_from_jwk, \
             patch('jwt.decode') as mock_decode:

            mock_get_header.return_value = {'kid': 'test-key'}
            mock_from_jwk.return_value = 'mock-key-object'
            mock_decode.return_value = expected_payload

            auth = SecureAuth()
            result = auth.verify_client_credentials_token('test.jwt.token')

            assert result == expected_payload

    @patch('requests.get')
    def test_verify_client_credentials_token_no_kid(self, mock_get):
        """Test client credentials token verification with no kid in header"""
        auth = SecureAuth()

        with patch('jwt.get_unverified_header') as mock_get_header:
            mock_get_header.return_value = {}  # No kid

            result = auth.verify_client_credentials_token('test.jwt.token')
            assert result is None

    @patch('requests.get')
    def test_verify_client_credentials_token_invalid_typ(self, mock_get):
        """Test client credentials token verification with invalid token type"""
        # Mock JWKS response
        mock_response = Mock()
        mock_response.raise_for_status = Mock()
        mock_response.json.return_value = {
            'keys': [{'kid': 'test-key', 'kty': 'RSA', 'use': 'sig', 'n': 'test-n', 'e': 'AQAB'}]
        }
        mock_get.return_value = mock_response

        # Mock JWT operations
        payload = {
            'typ': 'ID',  # Not Bearer
            'preferred_username': 'service-account-test',
            'iss': 'http://192.168.1.102:8081/realms/peppertree'
        }

        with patch('jwt.get_unverified_header') as mock_get_header, \
             patch('jwt.algorithms.RSAAlgorithm.from_jwk') as mock_from_jwk, \
             patch('jwt.decode') as mock_decode:

            mock_get_header.return_value = {'kid': 'test-key'}
            mock_from_jwk.return_value = 'mock-key'
            mock_decode.return_value = payload

            auth = SecureAuth()
            result = auth.verify_client_credentials_token('test.jwt.token')

            assert result is None

    @patch('requests.get')
    def test_verify_client_credentials_token_not_service_account(self, mock_get):
        """Test client credentials token verification with non-service account"""
        # Mock JWKS response
        mock_response = Mock()
        mock_response.raise_for_status = Mock()
        mock_response.json.return_value = {
            'keys': [{'kid': 'test-key', 'kty': 'RSA', 'use': 'sig', 'n': 'test-n', 'e': 'AQAB'}]
        }
        mock_get.return_value = mock_response

        # Mock JWT operations
        payload = {
            'typ': 'Bearer',
            'preferred_username': 'regular-user',  # Not service-account-*
            'iss': 'http://192.168.1.102:8081/realms/peppertree'
        }

        with patch('jwt.get_unverified_header') as mock_get_header, \
             patch('jwt.algorithms.RSAAlgorithm.from_jwk') as mock_from_jwk, \
             patch('jwt.decode') as mock_decode:

            mock_get_header.return_value = {'kid': 'test-key'}
            mock_from_jwk.return_value = 'mock-key'
            mock_decode.return_value = payload

            auth = SecureAuth()
            result = auth.verify_client_credentials_token('test.jwt.token')

            assert result is None

    @patch('requests.get')
    def test_verify_client_credentials_token_expired(self, mock_get):
        """Test client credentials token verification with expired token"""
        auth = SecureAuth()

        with patch('jwt.get_unverified_header') as mock_get_header, \
             patch('jwt.decode') as mock_decode:

            mock_get_header.return_value = {'kid': 'test-key'}
            mock_decode.side_effect = jwt.ExpiredSignatureError('Token expired')

            result = auth.verify_client_credentials_token('test.jwt.token')
            assert result is None

    @patch('requests.get')
    def test_verify_user_token_success(self, mock_get):
        """Test successful user token verification"""
        # Mock JWKS response
        mock_response = Mock()
        mock_response.raise_for_status = Mock()
        mock_response.json.return_value = {
            'keys': [{'kid': 'test-key', 'kty': 'RSA', 'use': 'sig', 'n': 'test-n', 'e': 'AQAB'}]
        }
        mock_get.return_value = mock_response

        # Mock JWT operations
        expected_payload = {
            'sub': 'user-123',
            'preferred_username': 'testuser',
            'email': 'test@example.com',
            'iss': 'http://192.168.1.102:8081/realms/peppertree'
        }

        with patch('jwt.get_unverified_header') as mock_get_header, \
             patch('jwt.algorithms.RSAAlgorithm.from_jwk') as mock_from_jwk, \
             patch('jwt.decode') as mock_decode:

            mock_get_header.return_value = {'kid': 'test-key'}
            mock_from_jwk.return_value = 'mock-key'
            mock_decode.return_value = expected_payload

            auth = SecureAuth()
            result = auth.verify_user_token('test.jwt.token')

            assert result == expected_payload

    @patch('requests.get')
    def test_verify_user_token_no_kid(self, mock_get):
        """Test user token verification with no kid in header"""
        auth = SecureAuth()

        with patch('jwt.get_unverified_header') as mock_get_header:
            mock_get_header.return_value = {}  # No kid

            result = auth.verify_user_token('test.jwt.token')
            assert result is None


class TestClientCredentialsRequiredDecorator:
    """Test client_credentials_required decorator"""

    def test_client_credentials_required_success(self, test_app):
        """Test decorator with valid client credentials"""
        with test_app.test_request_context(headers={'Authorization': 'Bearer valid-token'}):
            with patch.object(secure_auth, 'verify_client_credentials_token') as mock_verify:
                mock_verify.return_value = {
                    'sub': 'service-account-test',
                    'azp': 'test-client',
                    'iss': 'http://localhost:8081/realms/peppertree',
                    'scope': 'profile email',
                    'exp': datetime.now().timestamp() + 3600,
                    'iat': datetime.now().timestamp()
                }

                @client_credentials_required
                def dummy_view():
                    return {'message': 'success'}

                result = dummy_view()
                assert result == {'message': 'success'}

    def test_client_credentials_required_no_auth_header(self, test_app):
        """Test decorator without Authorization header"""
        with test_app.test_request_context():
            @client_credentials_required
            def dummy_view():
                return {'message': 'success'}

            response, status_code = dummy_view()

            assert status_code == 401
            data = response.get_json()
            assert 'error' in data
            assert 'authorization token' in data['error'].lower()

    def test_client_credentials_required_invalid_auth_header(self, test_app):
        """Test decorator with invalid Authorization header format"""
        with test_app.test_request_context(headers={'Authorization': 'InvalidFormat token'}):
            @client_credentials_required
            def dummy_view():
                return {'message': 'success'}

            response, status_code = dummy_view()

            assert status_code == 401

    def test_client_credentials_required_invalid_token(self, test_app):
        """Test decorator with invalid token"""
        with test_app.test_request_context(headers={'Authorization': 'Bearer invalid-token'}):
            with patch.object(secure_auth, 'verify_client_credentials_token') as mock_verify:
                mock_verify.return_value = None

                @client_credentials_required
                def dummy_view():
                    return {'message': 'success'}

                response, status_code = dummy_view()

                assert status_code == 401
                data = response.get_json()
                assert 'Invalid or expired' in data['error']


class TestUserOrClientRequiredDecorator:
    """Test user_or_client_required decorator"""

    def test_user_or_client_required_client_success(self, test_app):
        """Test decorator with valid client credentials"""
        with test_app.test_request_context(headers={'Authorization': 'Bearer valid-token'}):
            with patch.object(secure_auth, 'verify_client_credentials_token') as mock_verify_client, \
                 patch.object(secure_auth, 'verify_user_token') as mock_verify_user:

                mock_verify_client.return_value = {
                    'sub': 'service-account-test',
                    'azp': 'test-client',
                    'scope': 'profile email',
                    'exp': datetime.now().timestamp() + 3600,
                    'iat': datetime.now().timestamp()
                }
                mock_verify_user.return_value = None

                @user_or_client_required
                def dummy_view():
                    return {'message': 'success'}

                result = dummy_view()
                assert result == {'message': 'success'}

    def test_user_or_client_required_user_success(self, test_app):
        """Test decorator with valid user token"""
        with test_app.test_request_context(headers={'Authorization': 'Bearer valid-token'}):
            with patch.object(secure_auth, 'verify_client_credentials_token') as mock_verify_client, \
                 patch.object(secure_auth, 'verify_user_token') as mock_verify_user:

                mock_verify_client.return_value = None
                mock_verify_user.return_value = {
                    'sub': 'user-123',
                    'preferred_username': 'testuser',
                    'email': 'test@example.com',
                    'realm_access': {'roles': ['user']}
                }

                @user_or_client_required
                def dummy_view():
                    return {'message': 'success'}

                result = dummy_view()
                assert result == {'message': 'success'}

    def test_user_or_client_required_no_auth_header(self, test_app):
        """Test decorator without Authorization header"""
        with test_app.test_request_context():
            @user_or_client_required
            def dummy_view():
                return {'message': 'success'}

            response, status_code = dummy_view()

            assert status_code == 401

    def test_user_or_client_required_invalid_tokens(self, test_app):
        """Test decorator with invalid tokens"""
        with test_app.test_request_context(headers={'Authorization': 'Bearer invalid-token'}):
            with patch.object(secure_auth, 'verify_client_credentials_token') as mock_verify_client, \
                 patch.object(secure_auth, 'verify_user_token') as mock_verify_user:

                mock_verify_client.return_value = None
                mock_verify_user.return_value = None

                @user_or_client_required
                def dummy_view():
                    return {'message': 'success'}

                response, status_code = dummy_view()

                assert status_code == 401


class TestSecureAuthIntegration:
    """Integration tests for secure authentication"""

    def test_secure_auth_instance_exists(self):
        """Test that secure_auth module instance exists"""
        assert secure_auth is not None
        assert isinstance(secure_auth, SecureAuth)

    def test_environment_configuration(self):
        """Test that environment variables are used correctly"""
        with patch.dict('os.environ', {
            'KEYCLOAK_SERVER_URL': 'https://custom.auth.server:8443',
            'KEYCLOAK_REALM': 'custom-realm',
            'KEYCLOAK_BACKEND_CLIENT_ID': 'custom-backend-client'
        }):
            auth = SecureAuth()

            assert auth.server_url == 'https://custom.auth.server:8443'
            assert auth.realm == 'custom-realm'
            assert auth.backend_client_id == 'custom-backend-client'

    @patch('requests.get')
    def test_full_verification_flow_client_credentials(self, mock_get):
        """Test complete client credentials token verification flow"""
        # Mock JWKS response
        mock_response = Mock()
        mock_response.raise_for_status = Mock()
        mock_response.json.return_value = {
            'keys': [
                {
                    'kid': 'test-key',
                    'kty': 'RSA',
                    'use': 'sig',
                    'n': 'test-n-value',
                    'e': 'AQAB'
                }
            ]
        }
        mock_get.return_value = mock_response

        # Mock JWT operations
        expected_payload = {
            'typ': 'Bearer',
            'preferred_username': 'service-account-peppertree-backend-api',
            'azp': 'peppertree-backend-api',
            'iss': 'http://192.168.1.102:8081/realms/peppertree',
            'exp': datetime.now().timestamp() + 3600
        }

        with patch('jwt.get_unverified_header') as mock_get_header, \
             patch('jwt.algorithms.RSAAlgorithm.from_jwk') as mock_from_jwk, \
             patch('jwt.decode') as mock_decode:

            mock_get_header.return_value = {'kid': 'test-key'}
            mock_from_jwk.return_value = 'mock-key-object'
            mock_decode.return_value = expected_payload

            # Test the full flow
            result = secure_auth.verify_client_credentials_token('test.jwt.token')

            assert result == expected_payload

            # Verify all steps were called correctly
            mock_get.assert_called_once()
            mock_get_header.assert_called_once_with('test.jwt.token')
            mock_from_jwk.assert_called_once()
            mock_decode.assert_called_once()