#!/bin/bash

# Keycloak setup script for 17 @ Peppertree Admin Portal

echo "========================================="
echo "17 @ Peppertree - Keycloak Setup Script"
echo "========================================="

# Configuration
KEYCLOAK_URL="http://localhost:8080"
KEYCLOAK_ADMIN="admin"
KEYCLOAK_ADMIN_PASSWORD="admin_password"
REALM_NAME="peppertree"
CLIENT_ID="peppertree-admin"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Wait for Keycloak to be ready
echo -e "${YELLOW}Waiting for Keycloak to be ready...${NC}"
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -f -s "${KEYCLOAK_URL}/health/ready" > /dev/null; then
        echo -e "${GREEN}Keycloak is ready!${NC}"
        break
    fi
    echo "Attempt $((attempt+1))/$max_attempts - Keycloak not ready yet..."
    sleep 5
    attempt=$((attempt+1))
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}Keycloak failed to start. Please check Docker logs.${NC}"
    exit 1
fi

# Get admin access token
echo -e "${YELLOW}Authenticating with Keycloak...${NC}"
ACCESS_TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=${KEYCLOAK_ADMIN}" \
    -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
    -d "grant_type=password" \
    -d "client_id=admin-cli" | jq -r '.access_token')

if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}Failed to authenticate with Keycloak. Please check admin credentials.${NC}"
    exit 1
fi

echo -e "${GREEN}Successfully authenticated!${NC}"

# Check if realm already exists
echo -e "${YELLOW}Checking if realm '${REALM_NAME}' exists...${NC}"
REALM_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}")

if [ "$REALM_EXISTS" == "200" ]; then
    echo -e "${YELLOW}Realm '${REALM_NAME}' already exists. Skipping realm creation.${NC}"
else
    # Import realm configuration
    echo -e "${YELLOW}Creating realm '${REALM_NAME}'...${NC}"
    
    # Create a simplified realm first
    REALM_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        "${KEYCLOAK_URL}/admin/realms" \
        -d '{
            "realm": "'${REALM_NAME}'",
            "enabled": true,
            "sslRequired": "external",
            "registrationAllowed": false,
            "loginWithEmailAllowed": true,
            "duplicateEmailsAllowed": false,
            "resetPasswordAllowed": true,
            "editUsernameAllowed": false,
            "bruteForceProtected": true
        }')
    
    if [ "$REALM_RESPONSE" == "201" ]; then
        echo -e "${GREEN}Realm created successfully!${NC}"
    else
        echo -e "${RED}Failed to create realm. Response code: $REALM_RESPONSE${NC}"
        exit 1
    fi
fi

# Create admin role
echo -e "${YELLOW}Creating admin roles...${NC}"
curl -s -X POST \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles" \
    -d '{
        "name": "admin",
        "description": "Administrator role with full access"
    }' > /dev/null 2>&1

curl -s -X POST \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles" \
    -d '{
        "name": "peppertree-admin",
        "description": "Peppertree property administrator"
    }' > /dev/null 2>&1

echo -e "${GREEN}Roles created!${NC}"

# Create client
echo -e "${YELLOW}Creating client '${CLIENT_ID}'...${NC}"

# Generate a secure client secret
CLIENT_SECRET=$(openssl rand -hex 32)

CLIENT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients" \
    -d '{
        "clientId": "'${CLIENT_ID}'",
        "name": "Peppertree Admin Portal",
        "description": "Admin portal for managing bookings and payments",
        "rootUrl": "http://localhost:3000",
        "adminUrl": "http://localhost:3000",
        "baseUrl": "/admin",
        "enabled": true,
        "clientAuthenticatorType": "client-secret",
        "secret": "'${CLIENT_SECRET}'",
        "redirectUris": ["http://localhost:3000/*", "http://localhost:5000/*"],
        "webOrigins": ["http://localhost:3000", "http://localhost:5000"],
        "publicClient": false,
        "protocol": "openid-connect",
        "standardFlowEnabled": true,
        "implicitFlowEnabled": false,
        "directAccessGrantsEnabled": false,
        "serviceAccountsEnabled": false
    }')

if [ "$CLIENT_RESPONSE" == "201" ] || [ "$CLIENT_RESPONSE" == "409" ]; then
    echo -e "${GREEN}Client configured!${NC}"
else
    echo -e "${YELLOW}Client may already exist or configuration issue. Response: $CLIENT_RESPONSE${NC}"
fi

# Create admin user
echo -e "${YELLOW}Creating admin user...${NC}"

# Prompt for owner email if not set
if [ -z "$OWNER_EMAIL" ]; then
    read -p "Enter the property owner's email address: " OWNER_EMAIL
fi

# Generate a temporary password
TEMP_PASSWORD=$(openssl rand -base64 12)

USER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users" \
    -d '{
        "username": "admin",
        "email": "'${OWNER_EMAIL}'",
        "emailVerified": true,
        "enabled": true,
        "firstName": "Property",
        "lastName": "Owner",
        "credentials": [{
            "type": "password",
            "value": "'${TEMP_PASSWORD}'",
            "temporary": true
        }]
    }')

if [ "$USER_RESPONSE" == "201" ]; then
    echo -e "${GREEN}Admin user created!${NC}"
    
    # Get user ID to assign roles
    USER_ID=$(curl -s \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users?username=admin" | jq -r '.[0].id')
    
    # Assign roles to user
    ADMIN_ROLE_ID=$(curl -s \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles/admin" | jq -r '.id')
    
    PEPPERTREE_ROLE_ID=$(curl -s \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles/peppertree-admin" | jq -r '.id')
    
    curl -s -X POST \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${USER_ID}/role-mappings/realm" \
        -d '[
            {"id": "'${ADMIN_ROLE_ID}'", "name": "admin"},
            {"id": "'${PEPPERTREE_ROLE_ID}'", "name": "peppertree-admin"}
        ]' > /dev/null 2>&1
    
    echo -e "${GREEN}Roles assigned to admin user!${NC}"
elif [ "$USER_RESPONSE" == "409" ]; then
    echo -e "${YELLOW}Admin user already exists.${NC}"
else
    echo -e "${RED}Failed to create admin user. Response: $USER_RESPONSE${NC}"
fi

# Save configuration to .env file
echo -e "${YELLOW}Saving configuration...${NC}"
cat >> .env.keycloak << EOF

# Keycloak Configuration (Generated by setup script)
KEYCLOAK_SERVER_URL=${KEYCLOAK_URL}
KEYCLOAK_REALM=${REALM_NAME}
KEYCLOAK_CLIENT_ID=${CLIENT_ID}
KEYCLOAK_CLIENT_SECRET=${CLIENT_SECRET}
REACT_APP_KEYCLOAK_URL=${KEYCLOAK_URL}
REACT_APP_KEYCLOAK_REALM=${REALM_NAME}
REACT_APP_KEYCLOAK_CLIENT_ID=${CLIENT_ID}
EOF

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Keycloak setup completed successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${YELLOW}Important information:${NC}"
echo "1. Admin username: admin"
echo "2. Temporary password: ${TEMP_PASSWORD}"
echo "3. Email: ${OWNER_EMAIL}"
echo "4. Client Secret has been saved to .env.keycloak"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Add the client secret from .env.keycloak to your main .env file"
echo "2. Navigate to ${KEYCLOAK_URL}/admin"
echo "3. Login with username: ${KEYCLOAK_ADMIN}, password: ${KEYCLOAK_ADMIN_PASSWORD}"
echo "4. Or navigate to http://localhost:3000/admin to test the integration"
echo ""
echo -e "${RED}IMPORTANT: Change the admin password on first login!${NC}"