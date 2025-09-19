# Testing Your Backend API with Apidog

Based on your Flask backend, here are the main API endpoints and how to test them in Apidog:

## **Base URL Configuration**
- **Local Development**: `http://localhost:5000`
- **Docker**: `http://localhost:5000` (mapped through docker-compose)

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

## **Admin API Endpoints** (Require Authentication)

### 7. **Admin - Get All Bookings**
- **Method**: `GET`
- **URL**: `/api/admin/bookings`
- **Headers**: `Authorization: Bearer {token}`
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
- **Headers**: `Authorization: Bearer {token}`

### 9. **Admin - Update Booking Status**
- **Method**: `PUT`
- **URL**: `/api/admin/booking/{booking_id}/status`
- **Headers**:
  - `Authorization: Bearer {token}`
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
  - `Authorization: Bearer {token}`
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
- **Headers**: `Authorization: Bearer {token}`

## **Testing Strategy in Apidog**

### 1. **Create Environment Variables**:
   - `base_url`: `http://localhost:5000`
   - `auth_token`: `{your_jwt_token}` (for admin endpoints)

### 2. **Test Cases to Create**:
   - Valid booking creation
   - Invalid data validation (missing fields, wrong dates, etc.)
   - Booking status updates
   - Availability queries
   - Admin authentication flows

### 3. **Error Testing**:
   - Missing required fields (400 errors)
   - Invalid date formats
   - Past check-in dates
   - Invalid guest counts (must be 1-2)
   - Authentication failures for admin endpoints

### 4. **Data Validation Rules**:
   - Dates must be in `YYYY-MM-DD` format
   - Check-out must be after check-in
   - Check-in cannot be in the past
   - Guests must be between 1-2
   - Valid statuses: `pending`, `confirmed`, `rejected`, `cancelled`, `completed`

## **Setting Up Your First Test in Apidog**

1. **Start your backend**: `cd backend && python app.py`
2. **Test health endpoint first**: `GET http://localhost:5000/api/health`
3. **Create a booking**: Use the POST `/api/booking` endpoint with valid data
4. **Verify the booking**: Use GET `/api/bookings` to see your created booking

## **Example Test Scenarios**

### Valid Booking Test
```json
POST /api/booking
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
POST /api/booking
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
POST /api/booking
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
POST /api/booking
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

This gives you a complete testing foundation for your accommodation booking API.