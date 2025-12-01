#!/bin/bash

# Setup backend API as a Keycloak client with client credentials grant type

echo "Setting up backend API client in Keycloak..."

# Configuration
KEYCLOAK_URL="http://192.168.1.102:8081"
REALM="peppertree"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin_staging_password"
CLIENT_ID="peppertree-backend-api"

echo "🔐 Getting admin token..."

# Get admin token
ADMIN_TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${ADMIN_USER}" \
  -d "password=${ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

if [ "$ADMIN_TOKEN" = "null" ] || [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Failed to get admin token"
  exit 1
fi

echo "✅ Got admin token"

# Check if client already exists
echo "🔍 Checking if backend client already exists..."
EXISTING_CLIENT=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "${KEYCLOAK_URL}/admin/realms/${REALM}/clients?clientId=${CLIENT_ID}" | jq -r '.[0].id // empty')

if [ -n "$EXISTING_CLIENT" ]; then
  echo "⚠️  Backend client already exists, updating configuration..."
  CLIENT_UUID="$EXISTING_CLIENT"
else
  echo "📝 Creating new backend API client..."

  # Create backend API client
  CLIENT_RESPONSE=$(curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM}/clients" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "clientId": "'${CLIENT_ID}'",
      "name": "Peppertree Backend API",
      "description": "Backend API service for secure server-to-server communication",
      "enabled": true,
      "clientAuthenticatorType": "client-secret",
      "secret": "'$(openssl rand -hex 32)'",
      "standardFlowEnabled": false,
      "implicitFlowEnabled": false,
      "directAccessGrantsEnabled": false,
      "serviceAccountsEnabled": true,
      "publicClient": false,
      "bearerOnly": false,
      "consentRequired": false,
      "attributes": {
        "oauth2.device.authorization.grant.enabled": "false",
        "oidc.ciba.grant.enabled": "false"
      },
      "authenticationFlowBindingOverrides": {},
      "fullScopeAllowed": true,
      "nodeReRegistrationTimeout": 0,
      "defaultClientScopes": [
        "web-origins",
        "role_list",
        "profile",
        "roles",
        "email"
      ],
      "optionalClientScopes": [
        "address",
        "phone",
        "offline_access",
        "microprofile-jwt"
      ]
    }')

  # Get the created client UUID
  CLIENT_UUID=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
    "${KEYCLOAK_URL}/admin/realms/${REALM}/clients?clientId=${CLIENT_ID}" | jq -r '.[0].id')

  if [ "$CLIENT_UUID" = "null" ] || [ -z "$CLIENT_UUID" ]; then
    echo "❌ Failed to create backend client"
    exit 1
  fi

  echo "✅ Created backend API client with UUID: $CLIENT_UUID"
fi

# Get client secret
echo "🔑 Retrieving client secret..."
CLIENT_SECRET=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${CLIENT_UUID}/client-secret" | jq -r '.value')

if [ "$CLIENT_SECRET" = "null" ] || [ -z "$CLIENT_SECRET" ]; then
  echo "❌ Failed to get client secret"
  exit 1
fi

echo "✅ Retrieved client secret"

# Create service account roles
echo "👤 Setting up service account roles..."

# Get service account user
SERVICE_ACCOUNT_USER=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${CLIENT_UUID}/service-account-user" | jq -r '.id')

if [ "$SERVICE_ACCOUNT_USER" = "null" ] || [ -z "$SERVICE_ACCOUNT_USER" ]; then
  echo "❌ Failed to get service account user"
  exit 1
fi

# Get admin role ID
ADMIN_ROLE_ID=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "${KEYCLOAK_URL}/admin/realms/${REALM}/roles/admin" | jq -r '.id // empty')

if [ -n "$ADMIN_ROLE_ID" ]; then
  # Assign admin role to service account
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM}/users/${SERVICE_ACCOUNT_USER}/role-mappings/realm" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '[{
      "id": "'${ADMIN_ROLE_ID}'",
      "name": "admin"
    }]'
  echo "✅ Assigned admin role to service account"
else
  echo "⚠️  Admin role not found, service account created without specific roles"
fi

# Output configuration
echo ""
echo "🎉 Backend API client setup complete!"
echo ""
echo "📋 Configuration Details:"
echo "  Client ID: ${CLIENT_ID}"
echo "  Client Secret: ${CLIENT_SECRET}"
echo "  Service Account UUID: ${SERVICE_ACCOUNT_USER}"
echo ""
echo "💡 Add these to your .env file:"
echo "  KEYCLOAK_BACKEND_CLIENT_ID=${CLIENT_ID}"
echo "  KEYCLOAK_BACKEND_CLIENT_SECRET=${CLIENT_SECRET}"
echo ""
echo "🔧 Token endpoint for client credentials:"
echo "  POST ${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token"
echo "  Content-Type: application/x-www-form-urlencoded"
echo "  Body: grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}"