#!/bin/bash

# PKCE Flow Test Script for Keycloak
# This script generates the necessary parameters and provides curl commands
# to manually test the PKCE authentication flow

echo "=== PKCE Flow Test Script ==="
echo

# Generate PKCE parameters
CODE_VERIFIER=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-43)
CODE_CHALLENGE=$(echo -n $CODE_VERIFIER | openssl dgst -sha256 -binary | openssl base64 | tr -d "=+/" | tr '/+' '_-')
STATE=$(openssl rand -hex 16)

echo "=== PKCE Parameters ==="
echo "Code Verifier: $CODE_VERIFIER"
echo "Code Challenge: $CODE_CHALLENGE"
echo "State: $STATE"
echo

# Authorization URL
AUTH_URL="http://localhost:8080/realms/peppertree/protocol/openid-connect/auth?client_id=peppertree-admin&redirect_uri=http://localhost:3000/auth/callback&response_type=code&scope=openid%20profile%20email&state=$STATE&code_challenge=$CODE_CHALLENGE&code_challenge_method=S256"

echo "=== Step 1: Authorization Request ==="
echo "Open this URL in your browser:"
echo "$AUTH_URL"
echo

echo "=== Step 2: Extract Authorization Code ==="
echo "After login, you'll be redirected to: http://localhost:3000/auth/callback?code=AUTH_CODE&state=STATE"
echo "Copy the 'code' parameter value and set it:"
echo "AUTH_CODE=\"your_code_here\""
echo

echo "=== Step 3: Token Exchange ==="
echo "Run this curl command with your AUTH_CODE:"
echo
echo "curl -X POST \"http://localhost:8080/realms/peppertree/protocol/openid-connect/token\" \\"
echo "  -H \"Content-Type: application/x-www-form-urlencoded\" \\"
echo "  -d \"grant_type=authorization_code\" \\"
echo "  -d \"code=\$AUTH_CODE\" \\"
echo "  -d \"redirect_uri=http://localhost:3000/auth/callback\" \\"
echo "  -d \"client_id=peppertree-admin\" \\"
echo "  -d \"code_verifier=$CODE_VERIFIER\""
echo

echo "=== Step 4: Use Access Token ==="
echo "Extract the access_token from the response and test:"
echo
echo "ACCESS_TOKEN=\"your_access_token_here\""
echo
echo "curl -H \"Authorization: Bearer \$ACCESS_TOKEN\" \\"
echo "  \"http://localhost:8080/realms/peppertree/protocol/openid-connect/userinfo\""
echo

echo "=== Individual Test Commands ==="
echo
echo "# 1. Generate PKCE parameters manually:"
echo "CODE_VERIFIER=\$(openssl rand -base64 32 | tr -d \"=+/\" | cut -c1-43)"
echo "CODE_CHALLENGE=\$(echo -n \$CODE_VERIFIER | openssl dgst -sha256 -binary | openssl base64 | tr -d \"=+/\" | tr '/+' '_-')"
echo "STATE=\$(openssl rand -hex 16)"
echo
echo "# 2. Token exchange (after getting AUTH_CODE):"
echo "curl -X POST \"http://localhost:8080/realms/peppertree/protocol/openid-connect/token\" \\"
echo "  -H \"Content-Type: application/x-www-form-urlencoded\" \\"
echo "  -d \"grant_type=authorization_code\" \\"
echo "  -d \"code=\$AUTH_CODE\" \\"
echo "  -d \"redirect_uri=http://localhost:3000/auth/callback\" \\"
echo "  -d \"client_id=peppertree-admin\" \\"
echo "  -d \"code_verifier=\$CODE_VERIFIER\""
echo
echo "# 3. Get user info:"
echo "curl -H \"Authorization: Bearer \$ACCESS_TOKEN\" \\"
echo "  \"http://localhost:8080/realms/peppertree/protocol/openid-connect/userinfo\""
echo

echo "=== Notes ==="
echo "- This tests the same PKCE flow your React application uses"
echo "- No client_secret is needed for PKCE flow"
echo "- Each code_verifier is unique per authentication attempt"
echo "- The authorization code can only be used once"
echo "- Make sure Keycloak is running on localhost:8080"
