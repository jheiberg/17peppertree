#!/bin/bash

# Test script for the /api/booking endpoint
# Make sure the Flask app is running on localhost:5000 before running these tests

BASE_URL="http://localhost:5000"
BOOKING_ENDPOINT="${BASE_URL}/api/booking"

echo "=== Testing /api/booking endpoint ==="
echo

# Test 1: Successful booking creation
echo "Test 1: Valid booking request"
echo "=============================="
curl -X POST "${BOOKING_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "checkin": "2024-12-15",
    "checkout": "2024-12-17",
    "guests": 2,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "message": "Looking forward to a peaceful getaway"
  }' \
  -w "\nHTTP Status: %{http_code}\n\n"

echo
echo "----------------------------------------"
echo

# Test 2: Missing required field
echo "Test 2: Missing required field (email)"
echo "======================================"
curl -X POST "${BOOKING_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "checkin": "2024-12-15",
    "checkout": "2024-12-17",
    "guests": 2,
    "name": "Jane Doe",
    "phone": "+1234567890"
  }' \
  -w "\nHTTP Status: %{http_code}\n\n"

echo
echo "----------------------------------------"
echo

# Test 3: Invalid date format
echo "Test 3: Invalid date format"
echo "==========================="
curl -X POST "${BOOKING_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "checkin": "15-12-2024",
    "checkout": "17-12-2024",
    "guests": 2,
    "name": "Bob Smith",
    "email": "bob.smith@example.com",
    "phone": "+1234567890"
  }' \
  -w "\nHTTP Status: %{http_code}\n\n"

echo
echo "----------------------------------------"
echo

# Test 4: Check-out before check-in
echo "Test 4: Check-out before check-in"
echo "================================="
curl -X POST "${BOOKING_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "checkin": "2024-12-17",
    "checkout": "2024-12-15",
    "guests": 2,
    "name": "Alice Johnson",
    "email": "alice.johnson@example.com",
    "phone": "+1234567890"
  }' \
  -w "\nHTTP Status: %{http_code}\n\n"

echo
echo "----------------------------------------"
echo

# Test 5: Invalid number of guests
echo "Test 5: Invalid number of guests (3 guests, max is 2)"
echo "===================================================="
curl -X POST "${BOOKING_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "checkin": "2024-12-15",
    "checkout": "2024-12-17",
    "guests": 3,
    "name": "Large Family",
    "email": "family@example.com",
    "phone": "+1234567890"
  }' \
  -w "\nHTTP Status: %{http_code}\n\n"

echo
echo "----------------------------------------"
echo

# Test 6: Past check-in date
echo "Test 6: Past check-in date"
echo "=========================="
curl -X POST "${BOOKING_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "checkin": "2020-01-01",
    "checkout": "2020-01-03",
    "guests": 1,
    "name": "Time Traveler",
    "email": "past@example.com",
    "phone": "+1234567890"
  }' \
  -w "\nHTTP Status: %{http_code}\n\n"

echo
echo "----------------------------------------"
echo

# Test 7: Minimal valid booking
echo "Test 7: Minimal valid booking (1 guest, no message)"
echo "=================================================="
curl -X POST "${BOOKING_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "checkin": "2024-12-20",
    "checkout": "2024-12-21",
    "guests": 1,
    "name": "Solo Traveler",
    "email": "solo@example.com",
    "phone": "+0987654321"
  }' \
  -w "\nHTTP Status: %{http_code}\n\n"

echo
echo "=== Testing complete ==="