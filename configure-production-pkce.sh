#!/bin/bash

# Configure PKCE S256 for Production Environment
# Run this after production is deployed

set -e

echo "Configuring PKCE S256 for Production..."
echo ""

# Check if production container is running
if ! docker ps | grep -q peppertree_keycloak_prod; then
    echo "❌ Production Keycloak container is not running"
    echo "   Start it with: docker compose -f docker-compose.production.yml up -d"
    exit 1
fi

echo "✓ Production Keycloak container is running"
echo ""

# Get admin password from environment
if [ -z "$KEYCLOAK_ADMIN_PASSWORD_PROD" ]; then
    echo "⚠️  KEYCLOAK_ADMIN_PASSWORD_PROD not set, using default from .env"
    source .env
    ADMIN_PASSWORD="$KEYCLOAK_ADMIN_PASSWORD_PROD"
else
    ADMIN_PASSWORD="$KEYCLOAK_ADMIN_PASSWORD_PROD"
fi

# Get admin token from production Keycloak
echo "Getting admin token..."
ADMIN_TOKEN=$(docker exec peppertree_keycloak_prod curl -s -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=$ADMIN_PASSWORD" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
    echo "❌ Failed to get admin token"
    exit 1
fi

echo "✓ Admin token obtained"
echo ""

# Get client UUID
echo "Getting client UUID..."
CLIENT_UUID=$(docker exec peppertree_keycloak_prod curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:8080/admin/realms/peppertree/clients?clientId=peppertree-admin" | jq -r '.[0].id')

if [ -z "$CLIENT_UUID" ] || [ "$CLIENT_UUID" = "null" ]; then
    echo "❌ Failed to get client UUID"
    exit 1
fi

echo "✓ Client UUID: $CLIENT_UUID"
echo ""

# Get current configuration
echo "Updating PKCE configuration to S256 (required for HTTPS)..."
CURRENT=$(docker exec peppertree_keycloak_prod curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:8080/admin/realms/peppertree/clients/$CLIENT_UUID")

# Set PKCE to S256 (required)
echo "$CURRENT" | jq '.attributes["pkce.code.challenge.method"] = "S256"' | \
docker exec -i peppertree_keycloak_prod curl -s -X PUT "http://localhost:8080/admin/realms/peppertree/clients/$CLIENT_UUID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d @-

echo ""
echo "✅ PKCE S256 configured successfully for PRODUCTION"
echo ""
echo "Verification:"
docker exec peppertree_keycloak_prod curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:8080/admin/realms/peppertree/clients/$CLIENT_UUID" | \
  jq -r '.attributes["pkce.code.challenge.method"]'
echo ""
echo "Production environment: https://17peppertree.co.za"
echo "PKCE Method: S256 (secure, required for HTTPS)"
