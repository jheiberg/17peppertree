#!/bin/bash

# Update Keycloak client redirect URI for staging to use local network IP

echo "Updating Keycloak client redirect URI for local network access..."

# Get admin token
ADMIN_TOKEN=$(curl -s -X POST "http://192.168.1.102:8081/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin_staging_password" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

if [ "$ADMIN_TOKEN" = "null" ] || [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Failed to get admin token"
  exit 1
fi

echo "✅ Got admin token"

# Get client ID
CLIENT_UUID=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://192.168.1.102:8081/admin/realms/peppertree/clients?clientId=peppertree-admin" | jq -r '.[0].id')

if [ "$CLIENT_UUID" = "null" ] || [ -z "$CLIENT_UUID" ]; then
  echo "❌ Failed to get client UUID"
  exit 1
fi

echo "✅ Got client UUID: $CLIENT_UUID"

# Update client redirect URIs
echo "Updating redirect URIs..."
curl -s -X PUT "http://192.168.1.102:8081/admin/realms/peppertree/clients/$CLIENT_UUID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "redirectUris": [
      "http://192.168.1.102:3001/auth/callback",
      "http://localhost:3000/auth/callback"
    ],
    "webOrigins": [
      "http://192.168.1.102:3001",
      "http://localhost:3000"
    ]
  }'

echo "✅ Updated Keycloak client redirect URIs for local network access"
echo "🌐 Staging environment now accessible at:"
echo "   Frontend: http://192.168.1.102:3001"
echo "   Admin:    http://192.168.1.102:3001/admin"
echo "   Backend:  http://192.168.1.102:5001/api"
echo "   Keycloak: http://192.168.1.102:8081"