#!/bin/bash

echo "========================================="
echo "iCal Sync Testing Script"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Export your bookings
echo -e "${YELLOW}Test 1: Exporting bookings...${NC}"
curl -s http://localhost:5000/api/ical/bookings.ics > /tmp/export-test.ics
if [ -s /tmp/export-test.ics ]; then
    echo -e "${GREEN}✓ Export successful${NC}"
    echo "  File saved to: /tmp/export-test.ics"
    echo "  Preview:"
    head -20 /tmp/export-test.ics | sed 's/^/    /'
else
    echo -e "${RED}✗ Export failed${NC}"
fi
echo ""

# Test 2: Check export URL
echo -e "${YELLOW}Test 2: Checking iCal info endpoint...${NC}"
INFO=$(curl -s http://localhost:5000/api/ical/info)
if echo "$INFO" | grep -q "export_url"; then
    echo -e "${GREEN}✓ Info endpoint working${NC}"
    echo "$INFO" | jq -r '.export_url' | sed 's/^/    Export URL: /'
else
    echo -e "${RED}✗ Info endpoint failed${NC}"
fi
echo ""

# Test 3: Create a test import file
echo -e "${YELLOW}Test 3: Creating test import file...${NC}"
cat > /tmp/test-import.ics << 'EOF'
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
SUMMARY:Test External Booking
DTSTART;VALUE=DATE:20251225
DTEND;VALUE=DATE:20251227
UID:test-123@example.com
DTSTAMP:20251124T100000Z
DESCRIPTION:This is a test booking
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
EOF
echo -e "${GREEN}✓ Test file created: /tmp/test-import.ics${NC}"
cat /tmp/test-import.ics | sed 's/^/    /'
echo ""

# Test 4: Start a temporary HTTP server for the test file
echo -e "${YELLOW}Test 4: Testing import functionality...${NC}"
echo "  Starting temporary HTTP server on port 8889..."

# Start server in background
cd /tmp && python3 -m http.server 8889 > /dev/null 2>&1 &
SERVER_PID=$!
sleep 2

# Test import
IMPORT_RESULT=$(curl -s -X POST http://localhost:5000/api/ical/import \
  -H "Content-Type: application/json" \
  -d '{
    "ical_url": "http://localhost:8889/test-import.ics",
    "platform": "test-platform"
  }')

# Stop server
kill $SERVER_PID 2>/dev/null

if echo "$IMPORT_RESULT" | grep -q "imported"; then
    echo -e "${GREEN}✓ Import successful${NC}"
    echo "$IMPORT_RESULT" | jq '.' | sed 's/^/    /'
else
    echo -e "${RED}✗ Import failed${NC}"
    echo "$IMPORT_RESULT" | sed 's/^/    /'
fi
echo ""

# Test 5: Verify imported booking
echo -e "${YELLOW}Test 5: Verifying imported bookings...${NC}"
docker compose exec -T backend python3 << 'PYTHON'
from app import app
from database import db, BookingRequest

with app.app_context():
    imported = BookingRequest.query.filter(
        BookingRequest.guest_name.like('%test-platform%')
    ).all()
    
    if imported:
        print(f"✓ Found {len(imported)} imported booking(s):")
        for b in imported:
            print(f"  - {b.guest_name} ({b.checkin_date} to {b.checkout_date})")
    else:
        print("  No imported bookings found")
PYTHON
echo ""

echo "========================================="
echo -e "${GREEN}Testing Complete!${NC}"
echo "========================================="
echo ""
echo "Summary:"
echo "  - Export URL: http://localhost:5000/api/ical/bookings.ics"
echo "  - Test files: /tmp/export-test.ics, /tmp/test-import.ics"
echo ""
echo "Next steps for manual testing:"
echo "  1. Open Google Calendar"
echo "  2. Click Settings > Add Calendar > From URL"
echo "  3. Paste: http://localhost:5000/api/ical/bookings.ics"
echo "  4. Your bookings will appear in Google Calendar"
echo ""
