#!/bin/bash

# Update Keycloak client redirect URI for staging domain

echo "Updating Keycloak client redirect URI for staging.17peppertree.co.za..."

# Get admin token via nginx proxy
ADMIN_TOKEN=$(curl -s -k -X POST "https://staging.17peppertree.co.za/auth/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin_staging_password" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

if [ "$ADMIN_TOKEN" = "null" ] || [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Failed to get admin token via proxy"
  echo "Trying direct connection to container..."
  # Fallback: try direct container access
  ADMIN_TOKEN=$(docker exec peppertree_keycloak_staging curl -s -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=admin" \
    -d "password=admin_staging_password" \
    -d "grant_type=password" \
    -d "client_id=admin-cli" | jq -r '.access_token')
fi

if [ "$ADMIN_TOKEN" = "null" ] || [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Failed to get admin token"
  exit 1
fi

echo "✅ Got admin token"

# Get client ID
CLIENT_UUID=$(curl -s -k -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://staging.17peppertree.co.za/auth/admin/realms/peppertree/clients?clientId=peppertree-admin" | jq -r '.[0].id')

if [ "$CLIENT_UUID" = "null" ] || [ -z "$CLIENT_UUID" ]; then
  echo "❌ Failed to get client UUID via proxy, trying direct container access..."
  CLIENT_UUID=$(docker exec peppertree_keycloak_staging curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
    "http://localhost:8080/admin/realms/peppertree/clients?clientId=peppertree-admin" | jq -r '.[0].id')
fi

if [ "$CLIENT_UUID" = "null" ] || [ -z "$CLIENT_UUID" ]; then
  echo "❌ Failed to get client UUID"
  exit 1
fi

echo "✅ Got client UUID: $CLIENT_UUID"

# Update client redirect URIs using docker exec to ensure it works
echo "Updating redirect URIs..."
docker exec peppertree_keycloak_staging curl -s -X PUT "http://localhost:8080/admin/realms/peppertree/clients/$CLIENT_UUID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "redirectUris": [
      "https://staging.17peppertree.co.za/auth/callback",
      "https://staging.17peppertree.co.za/*"
    ],
    "webOrigins": [
      "https://staging.17peppertree.co.za",
      "+"
    ]
  }'

echo ""
echo "✅ Updated Keycloak client redirect URIs for staging domain"
echo "🌐 Staging environment now accessible at:"
echo "   Frontend: https://staging.17peppertree.co.za"
echo "   Admin:    https://staging.17peppertree.co.za/admin"
echo "   API:      https://staging.17peppertree.co.za/api"
echo "   Keycloak: https://staging.17peppertree.co.za/auth"
