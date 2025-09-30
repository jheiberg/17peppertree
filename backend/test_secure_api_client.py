"""
Comprehensive tests for secure_api_client.py
"""
import pytest
import json
import requests
from unittest.mock import patch, Mock, MagicMock
from datetime import datetime, timedelta, timezone
import threading
import time

from secure_api_client import SecureApiClient


@patch.dict('os.environ', {
    'KEYCLOAK_SERVER_URL': 'http://localhost:8080',
    'KEYCLOAK_BACKEND_CLIENT_ID': 'peppertree-backend-api',
    'KEYCLOAK_BACKEND_CLIENT_SECRET': 'test-secret'
})
class TestSecureApiClient:
    """Test SecureApiClient class functionality"""

    def test_init_default_values(self):
        """Test initialization with default environment values"""
        client = SecureApiClient()

        assert client.keycloak_url == 'http://localhost:8080'
        assert client.realm == 'peppertree'
        assert client.client_id == 'peppertree-backend-api'
        assert client.client_secret == 'test-secret'
        assert client.token_url == 'http://localhost:8080/realms/peppertree/protocol/openid-connect/token'

    @patch.dict('os.environ', {
        'KEYCLOAK_SERVER_URL': 'https://auth.example.com:8443',
        'KEYCLOAK_REALM': 'test-realm',
        'KEYCLOAK_BACKEND_CLIENT_ID': 'test-client',
        'KEYCLOAK_BACKEND_CLIENT_SECRET': 'test-secret',
        'API_BASE_URL': 'https://api.example.com'
    })
    def test_init_with_environment_variables(self):
        """Test initialization with custom environment variables"""
        client = SecureApiClient()

        assert client.keycloak_url == 'https://auth.example.com:8443'
        assert client.realm == 'test-realm'
        assert client.client_id == 'test-client'
        assert client.client_secret == 'test-secret'
        assert client.token_url == 'https://auth.example.com:8443/realms/test-realm/protocol/openid-connect/token'

    @patch('requests.post')
    def test_get_access_token_success(self, mock_post):
        """Test successful access token retrieval"""
        # Mock successful token response
        mock_response = Mock()
        mock_response.raise_for_status = Mock()
        mock_response.json.return_value = {
            'access_token': 'test-access-token',
            'token_type': 'Bearer',
            'expires_in': 3600
        }
        mock_post.return_value = mock_response

        client = SecureApiClient()
        result = client.get_access_token()

        assert result == 'test-access-token'
        assert client._access_token == 'test-access-token'
        assert client._token_expires_at is not None

        # Verify correct request was made
        expected_url = f"{client.keycloak_url}/realms/{client.realm}/protocol/openid-connect/token"
        mock_post.assert_called_once_with(
            expected_url,
            data={
                'grant_type': 'client_credentials',
                'client_id': client.client_id,
                'client_secret': client.client_secret
            },
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            timeout=10
        )

    @patch('requests.post')
    def test_get_access_token_failure(self, mock_post):
        """Test access token retrieval failure"""
        mock_post.side_effect = requests.exceptions.RequestException('Network error')

        client = SecureApiClient()

        with pytest.raises(Exception, match='Failed to authenticate with Keycloak'):
            client.get_access_token()

    @patch('requests.post')
    def test_get_access_token_caching(self, mock_post):
        """Test that access token is cached and reused when valid"""
        # Mock successful token response
        mock_response = Mock()
        mock_response.raise_for_status = Mock()
        mock_response.json.return_value = {
            'access_token': 'test-access-token',
            'token_type': 'Bearer',
            'expires_in': 3600
        }
        mock_post.return_value = mock_response

        client = SecureApiClient()

        # First call should make network request
        token1 = client.get_access_token()
        assert token1 == 'test-access-token'
        assert mock_post.call_count == 1

        # Second call should use cached token
        token2 = client.get_access_token()
        assert token2 == 'test-access-token'
        assert mock_post.call_count == 1  # No additional calls

    @patch('requests.post')
    def test_get_access_token_expired_refresh(self, mock_post):
        """Test that expired token is refreshed"""
        # Mock successful token response
        mock_response = Mock()
        mock_response.raise_for_status = Mock()
        mock_response.json.return_value = {
            'access_token': 'new-access-token',
            'token_type': 'Bearer',
            'expires_in': 3600
        }
        mock_post.return_value = mock_response

        client = SecureApiClient()

        # Set expired token
        client._access_token = 'old-token'
        client._token_expires_at = datetime.now(timezone.utc) - timedelta(minutes=5)

        # Should refresh token
        token = client.get_access_token()
        assert token == 'new-access-token'
        assert mock_post.call_count == 1

    # Removed tests for _is_token_valid() method which doesn't exist

    @patch.object(SecureApiClient, 'get_access_token')
    @patch('requests.request')
    def test_make_authenticated_request_get_success(self, mock_request, mock_get_token):
        """Test successful authenticated GET request"""
        mock_get_token.return_value = 'test-token'

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'data': 'test'}
        mock_request.return_value = mock_response

        client = SecureApiClient()
        result = client.make_authenticated_request('GET', 'http://localhost:5000/test-endpoint')

        assert result == mock_response
        assert result.json() == {'data': 'test'}

        # Verify correct request was made
        mock_request.assert_called_once_with(
            'GET',
            'http://localhost:5000/test-endpoint',
            headers={'Authorization': 'Bearer test-token'}
        )

    @patch.object(SecureApiClient, 'get_access_token')
    @patch('requests.request')
    def test_make_authenticated_request_post_with_data(self, mock_request, mock_get_token):
        """Test authenticated POST request with data"""
        mock_get_token.return_value = 'test-token'

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'success': True}
        mock_request.return_value = mock_response

        client = SecureApiClient()
        test_data = {'key': 'value'}
        result = client.make_authenticated_request('POST', 'http://localhost:5000/test-endpoint', json=test_data)

        assert result == mock_response
        assert result.json() == {'success': True}

        # Verify correct request was made
        mock_request.assert_called_once_with(
            'POST',
            'http://localhost:5000/test-endpoint',
            json=test_data,
            headers={'Authorization': 'Bearer test-token'}
        )

    @patch.object(SecureApiClient, 'get_access_token')
    def test_make_authenticated_request_no_token(self, mock_get_token):
        """Test authenticated request when token cannot be obtained"""
        mock_get_token.side_effect = Exception('Failed to authenticate')

        client = SecureApiClient()

        with pytest.raises(Exception, match='Failed to authenticate'):
            client.make_authenticated_request('GET', 'http://localhost:5000/test-endpoint')

    @patch.object(SecureApiClient, 'get_access_token')
    @patch('requests.request')
    def test_make_authenticated_request_network_error(self, mock_request, mock_get_token):
        """Test authenticated request with network error"""
        mock_get_token.return_value = 'test-token'
        mock_request.side_effect = requests.exceptions.RequestException('Network error')

        client = SecureApiClient()

        with pytest.raises(requests.exceptions.RequestException, match='Network error'):
            client.make_authenticated_request('GET', 'http://localhost:5000/test-endpoint')

    @patch.object(SecureApiClient, 'get_access_token')
    @patch('requests.request')
    def test_make_authenticated_request_put_method(self, mock_request, mock_get_token):
        """Test authenticated PUT request"""
        mock_get_token.return_value = 'test-token'

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'updated': True}
        mock_request.return_value = mock_response

        client = SecureApiClient()
        result = client.make_authenticated_request('PUT', 'http://localhost:5000/test-endpoint', json={'update': 'data'})

        assert result == mock_response
        assert result.json() == {'updated': True}
        mock_request.assert_called_once_with(
            'PUT',
            'http://localhost:5000/test-endpoint',
            json={'update': 'data'},
            headers={'Authorization': 'Bearer test-token'}
        )

    @patch.object(SecureApiClient, 'get_access_token')
    @patch('requests.request')
    def test_make_authenticated_request_delete_method(self, mock_request, mock_get_token):
        """Test authenticated DELETE request"""
        mock_get_token.return_value = 'test-token'

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'deleted': True}
        mock_request.return_value = mock_response

        client = SecureApiClient()
        result = client.make_authenticated_request('DELETE', 'http://localhost:5000/test-endpoint')

        assert result == mock_response
        assert result.json() == {'deleted': True}
        mock_request.assert_called_once_with(
            'DELETE',
            'http://localhost:5000/test-endpoint',
            headers={'Authorization': 'Bearer test-token'}
        )

    @patch.object(SecureApiClient, 'get_access_token')
    @patch('requests.request')
    def test_make_authenticated_request_invalid_method(self, mock_request, mock_get_token):
        """Test authenticated request with invalid HTTP method"""
        mock_get_token.return_value = 'test-token'
        mock_request.side_effect = requests.exceptions.RequestException('Invalid method')

        client = SecureApiClient()

        with pytest.raises(requests.exceptions.RequestException, match='Invalid method'):
            client.make_authenticated_request('INVALID', 'http://localhost:5000/test-endpoint')

    # Removed tests for get_bookings() and update_booking_status() methods which don't exist

    def test_threading_lock_exists(self):
        """Test that threading lock exists"""
        client = SecureApiClient()

        # Verify the lock exists and is the right type
        assert hasattr(client, '_token_lock')
        assert isinstance(client._token_lock, type(threading.Lock()))

    @patch.object(SecureApiClient, 'get_access_token')
    @patch('requests.request')
    def test_make_authenticated_request_401_retry(self, mock_request, mock_get_token):
        """Test that 401 responses trigger token refresh and retry"""
        # Mock token calls - first call returns old token, second returns new token
        mock_get_token.side_effect = ['old-token', 'new-token']

        # First response is 401, second is success
        mock_response_401 = Mock()
        mock_response_401.status_code = 401

        mock_response_success = Mock()
        mock_response_success.status_code = 200
        mock_response_success.json.return_value = {'success': True}

        mock_request.side_effect = [mock_response_401, mock_response_success]

        client = SecureApiClient()
        result = client.make_authenticated_request('GET', 'http://localhost:5000/test-endpoint')

        # Should succeed after retry
        assert result == mock_response_success
        assert result.status_code == 200

        # Should have made two requests
        assert mock_request.call_count == 2

        # Should have cleared token and requested new one
        assert mock_get_token.call_count == 2

    @patch.object(SecureApiClient, 'make_authenticated_request')
    def test_convenience_methods(self, mock_request):
        """Test GET, POST, PUT, DELETE convenience methods"""
        mock_response = Mock()
        mock_request.return_value = mock_response

        client = SecureApiClient()

        # Test GET
        result = client.get('http://localhost:5000/test')
        assert result == mock_response
        mock_request.assert_called_with('GET', 'http://localhost:5000/test')

        # Test POST
        result = client.post('http://localhost:5000/test', json={'data': 'test'})
        assert result == mock_response
        mock_request.assert_called_with('POST', 'http://localhost:5000/test', json={'data': 'test'})

        # Test PUT
        result = client.put('http://localhost:5000/test', json={'data': 'test'})
        assert result == mock_response
        mock_request.assert_called_with('PUT', 'http://localhost:5000/test', json={'data': 'test'})

        # Test DELETE
        result = client.delete('http://localhost:5000/test')
        assert result == mock_response
        mock_request.assert_called_with('DELETE', 'http://localhost:5000/test')

    @patch('requests.get')
    @patch.object(SecureApiClient, 'get_access_token')
    def test_validate_token_success(self, mock_get_token, mock_get):
        """Test successful token validation"""
        mock_get_token.return_value = 'valid-token'
        mock_response = Mock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response

        client = SecureApiClient()
        result = client.validate_token()

        assert result is True
        mock_get.assert_called_once_with(
            f"{client.keycloak_url}/realms/{client.realm}/protocol/openid-connect/userinfo",
            headers={'Authorization': 'Bearer valid-token'},
            timeout=5
        )

    @patch('requests.get')
    @patch.object(SecureApiClient, 'get_access_token')
    def test_validate_token_failure(self, mock_get_token, mock_get):
        """Test token validation failure"""
        mock_get_token.return_value = 'invalid-token'
        mock_response = Mock()
        mock_response.status_code = 401
        mock_get.return_value = mock_response

        client = SecureApiClient()
        result = client.validate_token()

        assert result is False

    @patch('requests.get')
    @patch.object(SecureApiClient, 'get_access_token')
    def test_validate_token_exception(self, mock_get_token, mock_get):
        """Test token validation with exception"""
        mock_get_token.return_value = 'test-token'
        mock_get.side_effect = Exception('Network error')

        client = SecureApiClient()
        result = client.validate_token()

        assert result is False

    def test_get_token_info_with_token(self):
        """Test get_token_info with valid token"""
        client = SecureApiClient()

        # Set up token state
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        client._access_token = 'test-token'
        client._token_expires_at = expires_at

        info = client.get_token_info()

        assert info['has_token'] is True
        assert info['expires_at'] == expires_at.isoformat()
        assert info['is_expired'] is False
        assert info['client_id'] == client.client_id
        assert info['realm'] == client.realm

    def test_get_token_info_no_token(self):
        """Test get_token_info without token"""
        client = SecureApiClient()

        info = client.get_token_info()

        assert info['has_token'] is False
        assert info['expires_at'] is None
        assert info['is_expired'] is True
        assert info['client_id'] == client.client_id
        assert info['realm'] == client.realm

    def test_get_token_info_expired_token(self):
        """Test get_token_info with expired token"""
        client = SecureApiClient()

        # Set up expired token
        expires_at = datetime.now(timezone.utc) - timedelta(minutes=5)
        client._access_token = 'expired-token'
        client._token_expires_at = expires_at

        info = client.get_token_info()

        assert info['has_token'] is True
        assert info['expires_at'] == expires_at.isoformat()
        assert info['is_expired'] is True