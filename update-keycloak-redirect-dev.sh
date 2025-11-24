#!/bin/bash

# Update Keycloak redirect URIs for development environment
# Run this after updating IP addresses

set -e

KEYCLOAK_URL="http://192.168.1.222:8080"
REALM="peppertree"
CLIENT_ID="peppertree-admin"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin_password"

echo "Updating Keycloak redirect URIs for development..."
echo "Keycloak URL: $KEYCLOAK_URL"
echo "Realm: $REALM"
echo "Client ID: $CLIENT_ID"
echo ""

# Get admin token
echo "Getting admin access token..."
TOKEN_RESPONSE=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$ADMIN_USER" \
  -d "password=$ADMIN_PASSWORD" \
  -d "grant_type=password" \
  -d "client_id=admin-cli")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "Error: Failed to get access token"
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

echo "Access token obtained successfully"

# Get client representation
echo "Fetching client configuration..."
CLIENTS=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM/clients?clientId=$CLIENT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

CLIENT_UUID=$(echo $CLIENTS | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$CLIENT_UUID" ]; then
    echo "Error: Client not found"
    exit 1
fi

echo "Client UUID: $CLIENT_UUID"

# Update redirect URIs
echo "Updating redirect URIs..."
curl -s -X PUT "$KEYCLOAK_URL/admin/realms/$REALM/clients/$CLIENT_UUID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "'$CLIENT_ID'",
    "redirectUris": [
      "http://192.168.1.222:3000/*",
      "http://192.168.1.222:3000/auth/callback",
      "http://localhost:3000/*",
      "http://localhost:3000/auth/callback",
      "http://127.0.0.1:3000/*",
      "http://127.0.0.1:3000/auth/callback"
    ],
    "webOrigins": [
      "http://192.168.1.222:3000",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "+"
    ]
  }'

echo ""
echo "✓ Redirect URIs updated successfully!"
echo ""
echo "Updated redirect URIs:"
echo "  - http://192.168.1.222:3000/*"
echo "  - http://192.168.1.222:3000/auth/callback"
echo "  - http://localhost:3000/*"
echo "  - http://localhost:3000/auth/callback"
echo ""
echo "You can now access the application from your mobile device at:"
echo "  http://192.168.1.222:3000"
