# API Testing Guide

## /api/booking Endpoint Tests

This document explains how to test the `/api/booking` endpoint using curl commands.

### Prerequisites

1. **Start the Flask application**:
   ```bash
   cd backend
   python app.py
   ```
   The server should be running on `http://localhost:5000`

2. **Ensure database is set up**:
   - PostgreSQL database should be running
   - Environment variables should be configured (see `.env` file)

### Running the Test Suite

Execute the comprehensive test script:
```bash
cd backend
./test_booking_api.sh
```

### Individual Test Commands

#### 1. Valid Booking Request
```bash
curl -X POST "http://localhost:5000/api/booking" \
  -H "Content-Type: application/json" \
  -d '{
    "checkin": "2025-12-15",
    "checkout": "2025-12-17",
    "guests": 2,
    "name": "John Doe",
    "email": "jako.heiberg@gmail.com",
    "phone": "+1234567890",
    "message": "Looking forward to a peaceful getaway"
  }'
```
**Expected**: HTTP 201, success message with booking ID

#### 2. Missing Required Field
```bash
curl -X POST "http://localhost:5000/api/booking" \
  -H "Content-Type: application/json" \
  -d '{
    "checkin": "2024-12-15",
    "checkout": "2024-12-17",
    "guests": 2,
    "name": "Jane Doe",
    "phone": "+1234567890"
  }'
```
**Expected**: HTTP 400, error about missing email field

#### 3. Invalid Date Format
```bash
curl -X POST "http://localhost:5000/api/booking" \
  -H "Content-Type: application/json" \
  -d '{
    "checkin": "15-12-2024",
    "checkout": "17-12-2024",
    "guests": 2,
    "name": "Bob Smith",
    "email": "bob.smith@example.com",
    "phone": "+1234567890"
  }'
```
**Expected**: HTTP 400, invalid date format error

#### 4. Invalid Date Logic (Check-out before Check-in)
```bash
curl -X POST "http://localhost:5000/api/booking" \
  -H "Content-Type: application/json" \
  -d '{
    "checkin": "2024-12-17",
    "checkout": "2024-12-15",
    "guests": 2,
    "name": "Alice Johnson",
    "email": "alice.johnson@example.com",
    "phone": "+1234567890"
  }'
```
**Expected**: HTTP 400, error about check-out date before check-in

#### 5. Invalid Number of Guests
```bash
curl -X POST "http://localhost:5000/api/booking" \
  -H "Content-Type: application/json" \
  -d '{
    "checkin": "2024-12-15",
    "checkout": "2024-12-17",
    "guests": 3,
    "name": "Large Family",
    "email": "family@example.com",
    "phone": "+1234567890"
  }'
```
**Expected**: HTTP 400, error about guest limit (max 2)

### API Response Format

#### Success Response (HTTP 201)
```json
{
  "message": "Booking request submitted successfully",
  "booking_id": 123
}
```

#### Error Response (HTTP 400)
```json
{
  "error": "Missing required field: email"
}
```

#### Server Error Response (HTTP 500)
```json
{
  "error": "An error occurred while processing your request"
}
```

### Required Fields

The `/api/booking` endpoint requires these fields:
- `checkin` (string, format: YYYY-MM-DD)
- `checkout` (string, format: YYYY-MM-DD)
- `guests` (integer, 1-2)
- `name` (string, guest name)
- `email` (string, valid email address)
- `phone` (string, phone number)

### Optional Fields
- `message` (string, special requests)

### Validation Rules

1. **Date Format**: Must be YYYY-MM-DD
2. **Date Logic**: Check-out must be after check-in
3. **Future Dates**: Check-in cannot be in the past
4. **Guest Limit**: 1-2 guests maximum
5. **Required Fields**: All required fields must be present and non-empty

### Email Notifications

When a booking is successfully created:
1. **Confirmation email** sent to the guest
2. **Notification email** sent to the property owner (if `OWNER_EMAIL` is configured)

### Testing Other Endpoints

#### Health Check
```bash
curl "http://localhost:5000/api/health"
```

#### Get All Bookings
```bash
curl "http://localhost:5000/api/bookings"
```

#### Get Specific Booking
```bash
curl "http://localhost:5000/api/booking/1"
```

#### Update Booking Status
```bash
curl -X PUT "http://localhost:5000/api/booking/1/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

### Troubleshooting

1. **Connection refused**: Make sure Flask app is running
2. **Database errors**: Check PostgreSQL connection and environment variables
3. **Email errors**: Check email configuration in environment variables
4. **CORS errors**: Ensure CORS is properly configured for your client