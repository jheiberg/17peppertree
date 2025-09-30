# Testing Your Backend API with Apidog

Based on your Flask backend with Keycloak OAuth2 authentication, here are the main API endpoints and how to test them in Apidog:

## **Base URL Configuration**
- **Local Development**: `http://localhost:5000`
- **Docker Development**: `http://localhost:5001`
- **Docker Staging**: `http://192.168.1.102:5001`

## **Public API Endpoints**

### 1. **Health Check**
- **Method**: `GET`
- **URL**: `/api/health`
- **Expected Response**:
```json
{
  "status": "healthy",
  "message": "Peppertree API is running"
}
```

### 2. **Create Booking**
- **Method**: `POST`
- **URL**: `/api/booking`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "checkin": "2024-12-15",
  "checkout": "2024-12-17",
  "guests": 2,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "message": "Looking forward to a peaceful getaway"
}
```
- **Expected Response** (201):
```json
{
  "message": "Booking request submitted successfully",
  "booking_id": 1
}
```

### 3. **Get All Bookings**
- **Method**: `GET`
- **URL**: `/api/bookings`
- **Expected Response**: Array of booking objects

### 4. **Get Specific Booking**
- **Method**: `GET`
- **URL**: `/api/booking/{booking_id}`
- **Example**: `/api/booking/1`

### 5. **Update Booking Status**
- **Method**: `PUT`
- **URL**: `/api/booking/{booking_id}/status`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "status": "confirmed"
}
```

### 6. **Get Availability**
- **Method**: `GET`
- **URL**: `/api/availability?year=2024&month=12`
- **Query Parameters**:
  - `year` (required): Integer
  - `month` (required): Integer (1-12)

## **Admin API Endpoints** (Require User Authentication)

### 7. **Admin - Get All Bookings**
- **Method**: `GET`
- **URL**: `/api/admin/bookings`
- **Headers**: `Authorization: Bearer {user_token}`
- **Query Parameters** (optional):
  - `status`: pending/approved/rejected/cancelled
  - `payment_status`: pending/paid/partial/refunded
  - `start_date`: ISO date string
  - `end_date`: ISO date string
  - `page`: Integer (default: 1)
  - `per_page`: Integer (default: 20)

### 8. **Admin - Get Booking Details**
- **Method**: `GET`
- **URL**: `/api/admin/booking/{booking_id}`
- **Headers**: `Authorization: Bearer {user_token}`

### 9. **Admin - Update Booking Status**
- **Method**: `PUT`
- **URL**: `/api/admin/booking/{booking_id}/status`
- **Headers**:
  - `Authorization: Bearer {user_token}`
  - `Content-Type: application/json`
- **Request Body**:
```json
{
  "status": "approved",
  "admin_notes": "Booking confirmed for premium suite",
  "notify_guest": true
}
```

### 10. **Admin - Update Payment Status**
- **Method**: `PUT`
- **URL**: `/api/admin/booking/{booking_id}/payment`
- **Headers**:
  - `Authorization: Bearer {user_token}`
  - `Content-Type: application/json`
- **Request Body**:
```json
{
  "payment_status": "paid",
  "payment_amount": 250.00,
  "payment_reference": "TXN123456",
  "payment_method": "credit_card"
}
```

### 11. **Admin - Dashboard Stats**
- **Method**: `GET`
- **URL**: `/api/admin/dashboard/stats`
- **Headers**: `Authorization: Bearer {user_token}`

## **Secure API Endpoints** (Require Client Credentials or User Authentication)

### 12. **Secure - Health Check**
- **Method**: `GET`
- **URL**: `/api/secure/health`
- **Headers**: `Authorization: Bearer {client_token_or_user_token}`
- **Expected Response**:
```json
{
  "status": "healthy",
  "message": "Secure Peppertree API is running",
  "auth_type": "client",
  "client_id": "peppertree-backend-api"
}
```

### 13. **Secure - Dashboard Stats**
- **Method**: `GET`
- **URL**: `/api/secure/dashboard/stats`
- **Headers**: `Authorization: Bearer {client_token_or_user_token}`
- **Expected Response**:
```json
{
  "auth_type": "client",
  "client_id": "peppertree-backend-api",
  "user_id": null,
  "timestamp": "2025-09-30T09:17:18.686250",
  "stats": {
    "total_bookings": 0,
    "pending_bookings": 0,
    "approved_bookings": 0,
    "paid_bookings": 0,
    "pending_payments": 0,
    "total_revenue": 0.0
  },
  "recent_bookings": []
}
```

### 14. **Secure - Get All Bookings**
- **Method**: `GET`
- **URL**: `/api/secure/bookings`
- **Headers**: `Authorization: Bearer {client_token_or_user_token}`
- **Query Parameters** (optional):
  - `status`: pending/approved/rejected/cancelled
  - `payment_status`: pending/paid/partial/refunded
  - `start_date`: ISO date string
  - `end_date`: ISO date string
  - `page`: Integer (default: 1)
  - `per_page`: Integer (default: 20)
- **Expected Response**:
```json
{
  "auth_type": "client",
  "client_id": "peppertree-backend-api",
  "user_id": null,
  "bookings": [],
  "current_page": 1,
  "per_page": 20,
  "total": 0,
  "pages": 0
}
```

### 15. **Secure - Get Booking Details**
- **Method**: `GET`
- **URL**: `/api/secure/booking/{booking_id}`
- **Headers**: `Authorization: Bearer {client_token_or_user_token}`

### 16. **Secure - Create Booking**
- **Method**: `POST`
- **URL**: `/api/secure/booking`
- **Headers**:
  - `Authorization: Bearer {client_token_or_user_token}`
  - `Content-Type: application/json`
- **Request Body**: Same as public booking creation

## **Authentication Setup**

### Keycloak OAuth2 Configuration
- **Keycloak URL**: `http://192.168.1.102:8081` (staging)
- **Realm**: `peppertree`
- **Public Client**: `peppertree-admin` (for user authentication)
- **Confidential Client**: `peppertree-backend-api` (for client credentials)

### Getting Client Credentials Token
```bash
curl -X POST "http://192.168.1.102:8081/realms/peppertree/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=peppertree-backend-api" \
  -d "client_secret={your_client_secret}"
```

### Getting User Token (Authorization Code Flow)
1. Redirect to authorization URL:
```
http://192.168.1.102:8081/realms/peppertree/protocol/openid-connect/auth?client_id=peppertree-admin&redirect_uri={your_redirect}&response_type=code&scope=openid profile email
```

2. Exchange code for token:
```bash
curl -X POST "http://192.168.1.102:8081/realms/peppertree/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code={authorization_code}" \
  -d "client_id=peppertree-admin" \
  -d "redirect_uri={your_redirect}"
```

## **Testing Strategy in Apidog**

### 1. **Create Environment Variables**:
   - `base_url`: `http://localhost:5001` (or your environment URL)
   - `keycloak_url`: `http://192.168.1.102:8081`
   - `token_url`: `http://192.168.1.102:8081/realms/peppertree/protocol/openid-connect/token`
   - `client_id`: `peppertree-backend-api`
   - `client_secret`: `{your_client_secret}`
   - `user_token`: `{your_jwt_user_token}`
   - `client_token`: `{your_jwt_client_token}`

### 2. **Test Cases to Create**:
   - Valid booking creation (public API)
   - Invalid data validation (missing fields, wrong dates, etc.)
   - Booking status updates
   - Availability queries
   - Admin authentication flows
   - **Client credentials authentication**
   - **Secure API endpoint access**
   - **Mixed authentication (user vs client tokens)**

### 3. **Error Testing**:
   - Missing required fields (400 errors)
   - Invalid date formats
   - Past check-in dates
   - Invalid guest counts (must be 1-2)
   - Authentication failures for admin endpoints
   - **Invalid tokens for secure endpoints**
   - **Expired token scenarios**
   - **Wrong token type for endpoint**

### 4. **Data Validation Rules**:
   - Dates must be in `YYYY-MM-DD` format
   - Check-out must be after check-in
   - Check-in cannot be in the past
   - Guests must be between 1-2
   - Valid statuses: `pending`, `confirmed`, `rejected`, `cancelled`, `completed`

## **Setting Up Your First Test in Apidog**

### Prerequisites
1. **Start your backend**: `docker compose -f docker-compose.staging.yml up -d`
2. **Verify services are running**:
   - Backend: `http://192.168.1.102:5001/api/health`
   - Keycloak: `http://192.168.1.102:8081`

### Test Sequence
1. **Test health endpoint first**: `GET {{base_url}}/api/health`
2. **Get client credentials token**: Use Keycloak token endpoint
3. **Test secure health endpoint**: `GET {{base_url}}/api/secure/health` with Bearer token
4. **Create a booking**: Use the POST `/api/booking` endpoint with valid data
5. **Test secure dashboard**: `GET {{base_url}}/api/secure/dashboard/stats` with Bearer token
6. **Verify secure bookings**: `GET {{base_url}}/api/secure/bookings` with Bearer token

## **Example Test Scenarios**

### Get Client Credentials Token
```bash
POST {{keycloak_url}}/realms/peppertree/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id={{client_id}}&client_secret={{client_secret}}
```
**Expected**: 200 status with access_token

### Test Secure Endpoint with Client Token
```bash
GET {{base_url}}/api/secure/dashboard/stats
Authorization: Bearer {{client_token}}
```
**Expected**: 200 status with `auth_type: "client"`

### Test Secure Endpoint with User Token
```bash
GET {{base_url}}/api/secure/dashboard/stats
Authorization: Bearer {{user_token}}
```
**Expected**: 200 status with `auth_type: "user"`

### Valid Booking Test
```json
POST {{base_url}}/api/booking
Content-Type: application/json

{
  "checkin": "2024-12-15",
  "checkout": "2024-12-17",
  "guests": 2,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "message": "Looking forward to a peaceful getaway"
}
```
**Expected**: 201 status with booking_id

### Invalid Date Format Test
```json
POST {{base_url}}/api/booking
Content-Type: application/json

{
  "checkin": "15-12-2024",
  "checkout": "17-12-2024",
  "guests": 2,
  "name": "Bob Smith",
  "email": "bob.smith@example.com",
  "phone": "+1234567890"
}
```
**Expected**: 400 status with error message

### Missing Required Field Test
```json
POST {{base_url}}/api/booking
Content-Type: application/json

{
  "checkin": "2024-12-15",
  "checkout": "2024-12-17",
  "guests": 2,
  "name": "Jane Doe",
  "phone": "+1234567890"
}
```
**Expected**: 400 status with "Missing required field: email"

### Invalid Guest Count Test
```json
POST {{base_url}}/api/booking
Content-Type: application/json

{
  "checkin": "2024-12-15",
  "checkout": "2024-12-17",
  "guests": 3,
  "name": "Large Family",
  "email": "family@example.com",
  "phone": "+1234567890"
}
```
**Expected**: 400 status with guest count error

### Unauthorized Secure API Test
```bash
GET {{base_url}}/api/secure/dashboard/stats
# No Authorization header
```
**Expected**: 401 status with "No valid authorization token provided"

### Invalid Token Test
```bash
GET {{base_url}}/api/secure/dashboard/stats
Authorization: Bearer invalid_token_here
```
**Expected**: 401 status with "Invalid or expired token"

## **Advanced Testing Scenarios**

### Token Expiration Testing
1. Get a client credentials token
2. Wait for token expiration (300 seconds for client credentials)
3. Test secure endpoint with expired token
4. **Expected**: 401 status with expiration error

### Mixed Authentication Testing
1. Test secure endpoint with user token → Should work with `auth_type: "user"`
2. Test secure endpoint with client token → Should work with `auth_type: "client"`
3. Test admin endpoint with client token → Should fail (admin endpoints require user tokens)

### Service Account Detection
1. Get client credentials token
2. Decode JWT payload (base64 decode the middle part)
3. Verify `preferred_username` starts with `service-account-`
4. Test that secure API correctly identifies it as client authentication

This comprehensive guide covers all public, admin, and secure API endpoints with proper OAuth2 authentication testing scenarios.