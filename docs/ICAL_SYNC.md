# iCal Calendar Synchronization

## Overview

The 17 @ Peppertree booking system includes full iCal/ICS calendar synchronization functionality, allowing seamless integration with major booking platforms like Airbnb, Booking.com, VRBO, LekkeSlaap, and SafariNow.

## Features

### Export (Outbound Sync)
- **Real-time feed** - Automatically exports confirmed and approved bookings
- **Standard iCal format** - Compatible with all major booking platforms
- **Automatic updates** - Feed refreshes every time it's accessed
- **Detailed information** - Includes guest details, dates, and booking information
- **Secure** - Only exports confirmed/approved bookings, not pending ones

### Import (Inbound Sync)
- **Multi-platform support** - Import from Airbnb, Booking.com, VRBO, and others
- **Duplicate detection** - Automatically skips existing bookings
- **Platform tagging** - Marks imported bookings with their source
- **Manual control** - Import on-demand when needed

## API Endpoints

### Export Endpoint
```
GET /api/ical/bookings.ics
```

**Response:** iCal/ICS file containing all confirmed and approved bookings

**Example:**
```bash
curl http://localhost:5000/api/ical/bookings.ics > bookings.ics
```

### Import Endpoint
```
POST /api/ical/import
Content-Type: application/json
```

**Request Body:**
```json
{
  "ical_url": "https://www.airbnb.com/calendar/ical/...",
  "platform": "airbnb"
}
```

**Response:**
```json
{
  "message": "iCal import completed",
  "imported": 5,
  "skipped": 2
}
```

### Info Endpoint
```
GET /api/ical/info
```

**Response:**
```json
{
  "export_url": "http://localhost:5000/api/ical/bookings.ics",
  "instructions": {
    "airbnb": "Go to Calendar > Availability Settings > Import Calendar > Paste the export URL",
    "booking_com": "Go to Calendar > Import/Export > Import Calendar > Paste the export URL",
    "vrbo": "Go to Calendar > Sync Calendar > Import Calendar > Paste the export URL",
    "general": "Copy the export URL and paste it into the calendar import section of any booking platform"
  },
  "features": [...]
}
```

## Using the Admin Interface

### Accessing Calendar Sync

1. Log in to the admin dashboard at `/admin`
2. Click **"Calendar Sync"** in the navigation menu
3. You'll see two sections: Export and Import

### Exporting Your Bookings

1. In the **Export Your Bookings** section, you'll see your unique iCal feed URL
2. Click the **"Copy URL"** button
3. Go to your booking platform (Airbnb, Booking.com, etc.)
4. Find their calendar import/sync settings
5. Paste your feed URL
6. The platform will automatically sync your bookings

**Your export URL format:**
```
http://your-domain.com/api/ical/bookings.ics
```

### Importing External Bookings

1. Get the iCal feed URL from your booking platform:
   - **Airbnb:** Calendar → Availability Settings → Export Calendar
   - **Booking.com:** Calendar → Import/Export → Export Calendar
   - **VRBO:** Calendar → Sync Calendar → Export Calendar

2. In the **Import External Bookings** section:
   - Select the platform from the dropdown
   - Paste the iCal feed URL
   - Click **"Import Bookings"**

3. The system will:
   - Fetch the external calendar
   - Import all events as bookings
   - Skip duplicates automatically
   - Tag bookings with the source platform

## Platform-Specific Setup Guides

### Airbnb

**Export to Airbnb:**
1. Log in to Airbnb
2. Go to Calendar → Availability Settings
3. Scroll to "Sync calendar"
4. Click "Import Calendar"
5. Paste your export URL: `http://your-domain.com/api/ical/bookings.ics`
6. Name it "17 @ Peppertree"
7. Click "Import calendar"

**Import from Airbnb:**
1. In Airbnb, go to Calendar → Availability Settings
2. Click "Export Calendar"
3. Copy the calendar link
4. In your admin panel, go to Calendar Sync → Import
5. Select "Airbnb" and paste the URL
6. Click "Import Bookings"

### Booking.com

**Export to Booking.com:**
1. Log in to Booking.com Extranet
2. Go to Calendar → Import/Export
3. Click "Import Calendar"
4. Paste your export URL
5. Set refresh frequency (recommended: Daily)
6. Click "Import"

**Import from Booking.com:**
1. In Extranet, go to Calendar → Import/Export
2. Click "Export Calendar"
3. Copy the iCal link
4. Import via your admin panel

### VRBO/HomeAway

**Export to VRBO:**
1. Log in to VRBO
2. Go to Calendar → Sync Calendar
3. Click "Import Calendar"
4. Paste your export URL
5. Click "Subscribe"

**Import from VRBO:**
1. Go to Calendar → Sync Calendar
2. Click "Export Calendar"
3. Copy the iCal URL
4. Import via your admin panel

### LekkeSlaap.co.za

**Export to LekkeSlaap:**
1. Contact LekkeSlaap support for iCal import feature
2. Provide your export URL
3. They will configure it on their end

**Import from LekkeSlaap:**
1. Request iCal export URL from LekkeSlaap support
2. Import via your admin panel

### SafariNow.co.za

**Export to SafariNow:**
1. Contact SafariNow support for calendar sync
2. Provide your export URL
3. They will set up the integration

**Import from SafariNow:**
1. Request iCal feed from SafariNow support
2. Import via your admin panel

## Testing Without Live Bookings

### Method 1: Google Calendar (Recommended)

1. Open [Google Calendar](https://calendar.google.com)
2. Click ⚙️ Settings
3. Click "Add calendar" → "From URL"
4. Paste: `http://localhost:5000/api/ical/bookings.ics`
5. Click "Add calendar"
6. Your bookings will appear in Google Calendar

### Method 2: Download and Inspect

```bash
# Download your feed
curl http://localhost:5000/api/ical/bookings.ics > my-bookings.ics

# View the contents
cat my-bookings.ics

# Open in any calendar application
# - Outlook: File → Open → Import
# - Apple Calendar: File → Import
# - Thunderbird: Events and Tasks → Import
```

### Method 3: Automated Testing Script

Run the provided test script:

```bash
./test-ical-sync.sh
```

This will:
- Export your bookings
- Validate the iCal format
- Create test import data
- Verify the import functionality
- Show results

### Method 4: Use Test iCal Feeds

Test the import feature with public iCal feeds:

```
# South African holidays
https://www.officeholidays.com/ics/south-africa

# Google Calendar public feed
https://calendar.google.com/calendar/ical/en.south_africa%23holiday%40group.v.calendar.google.com/public/basic.ics
```

Import these in your admin panel to test the import functionality.

## iCal Feed Format

### Sample Export

```ical
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//17 @ Peppertree//Booking Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:17 @ Peppertree Bookings
X-WR-TIMEZONE:Africa/Johannesburg
X-WR-CALDESC:Confirmed and approved bookings for 17 @ Peppertree

BEGIN:VEVENT
SUMMARY:Booking: John Doe
DTSTART;VALUE=DATE:20251215
DTEND;VALUE=DATE:20251220
DTSTAMP:20251124T091422Z
UID:booking-25@17peppertree.co.za
CLASS:PRIVATE
CREATED:20251124T091422Z
DESCRIPTION:Guest: John Doe\nEmail: john@example.com\nPhone: 1234567890\nGuests: 2\nStatus: confirmed\nBooking ID: 25
ORGANIZER:bookings@17peppertree.co.za
STATUS:CONFIRMED
LAST-MODIFIED:20251124T091422Z
END:VEVENT

END:VCALENDAR
```

### Field Mapping

| iCal Field | Booking Field | Description |
|------------|---------------|-------------|
| SUMMARY | guest_name | "Booking: {guest_name}" |
| DTSTART | checkin_date | Check-in date (all-day event) |
| DTEND | checkout_date | Check-out date |
| UID | booking_id | Unique identifier: "booking-{id}@17peppertree.co.za" |
| DESCRIPTION | Multiple fields | Guest details, email, phone, etc. |
| CREATED | created_at | Booking creation timestamp |
| LAST-MODIFIED | updated_at | Last update timestamp |
| STATUS | - | Always "CONFIRMED" for exports |

## Best Practices

### For Export (Your Bookings → Other Platforms)

1. **Update regularly** - The feed updates in real-time, but platforms refresh every 6-24 hours
2. **Use HTTPS in production** - Ensure your domain has SSL certificate
3. **Monitor conflicts** - Check for double bookings across platforms
4. **Keep URL secure** - Treat your feed URL as sensitive (it exposes booking dates)

### For Import (Other Platforms → Your System)

1. **Import frequently** - Run imports daily or when you get external bookings
2. **Check for duplicates** - The system skips duplicates, but verify manually
3. **Tag clearly** - Use the platform field to identify booking sources
4. **Verify dates** - Confirm imported bookings have correct check-in/out dates

### General

1. **Test first** - Use Google Calendar to test before connecting to live platforms
2. **One source of truth** - Decide if your system or an external platform is primary
3. **Manual verification** - Always verify critical bookings manually
4. **Backup your data** - Export your calendar regularly as backup
5. **Document your setup** - Keep track of which platforms are synced

## Troubleshooting

### Export Issues

**Problem:** Platform says "Invalid iCal URL"
- **Solution:** Ensure the URL is accessible from the internet (not localhost)
- **Solution:** Check that your backend is running and the endpoint responds

**Problem:** Bookings not showing on external platform
- **Solution:** Wait 24 hours for the platform to refresh
- **Solution:** Verify bookings are marked as "confirmed" or "approved" in your system
- **Solution:** Check the platform's import logs for errors

**Problem:** Old bookings still showing
- **Solution:** Most platforms cache feeds; wait for refresh cycle
- **Solution:** Remove and re-add the calendar feed

### Import Issues

**Problem:** Import fails with "Failed to fetch"
- **Solution:** Verify the external iCal URL is correct and accessible
- **Solution:** Check that the URL starts with http:// or https://
- **Solution:** Some platforms require authentication - check their docs

**Problem:** Duplicate bookings created
- **Solution:** The system should skip duplicates automatically
- **Solution:** Check if booking dates are slightly different
- **Solution:** Delete duplicates manually from the admin panel

**Problem:** Imported bookings have wrong dates
- **Solution:** Check timezone settings on both platforms
- **Solution:** Verify the external feed uses correct date format
- **Solution:** Contact the platform support

## Security Considerations

### Export URL Security

- The export URL is **publicly accessible** and doesn't require authentication
- It only exposes booking dates and guest names (not sensitive financial data)
- Consider implementing authentication if needed for production
- Use HTTPS in production to prevent URL interception

### Import Security

- Only import from trusted platforms
- Verify iCal URLs before importing
- Monitor imported bookings for suspicious activity
- The import endpoint doesn't require authentication (add if needed)

## Technical Details

### Dependencies

- **Python:** `icalendar==5.0.11`
- **Flask:** For API endpoints
- **SQLAlchemy:** For database queries

### Database Schema

Imported bookings are stored in the `booking_requests` table with:
- `guest_name`: Format: "{platform}: {summary}"
- `email`: Format: "imported@{platform}.com"
- `phone`: "N/A"
- `special_requests`: Contains original UID and platform info
- `status`: "confirmed"
- `payment_status`: "paid"

### Code Structure

```
backend/
├── ical_routes.py          # iCal API endpoints
├── app.py                  # Registers iCal blueprint
└── requirements.txt        # Python dependencies

src/
└── components/
    └── Admin/
        └── CalendarSync.js # Admin UI component
```

## Future Enhancements

Potential improvements for future versions:

1. **Automatic periodic imports** - Cron job to sync external calendars daily
2. **Two-way sync** - Update external platforms when bookings change
3. **Conflict detection** - Alert when bookings overlap across platforms
4. **Analytics** - Track which platforms generate most bookings
5. **Webhook support** - Real-time notifications instead of polling
6. **Authentication** - Secure iCal feeds with tokens
7. **Custom fields** - Map additional booking fields
8. **Timezone handling** - Better support for international bookings

## Production & Staging Setup

### Overview

The iCal sync feature works identically in development, staging, and production environments. The main difference is the **export URL** which must be publicly accessible for external platforms to fetch your bookings.

### Development Setup

Already configured! Your export URL:
```
http://localhost:5000/api/ical/bookings.ics
```

**Note:** This only works locally and cannot be used with external platforms.

### Staging Setup

#### 1. Update Backend Configuration

No code changes needed! The iCal routes are already deployed when you build the backend container.

#### 2. Configure Staging Domain

Update your staging environment variables:

```bash
# In your staging .env or environment config
REACT_APP_API_URL=https://staging.17peppertree.co.za/api
```

#### 3. Deploy to Staging

```bash
# Using docker-compose.staging.yml
docker compose -f docker-compose.staging.yml up -d --build

# Verify the endpoint is accessible
curl https://staging.17peppertree.co.za/api/ical/info
```

#### 4. Staging Export URL

Your staging iCal feed URL will be:
```
https://staging.17peppertree.co.za/api/ical/bookings.ics
```

#### 5. Test with External Platform

1. Use a test Airbnb/Booking.com account
2. Import your staging feed URL
3. Create test bookings in your system
4. Verify they appear on the external platform (may take 24 hours)

### Production Setup

#### 1. SSL Certificate Required

**IMPORTANT:** External booking platforms require HTTPS. Ensure your production domain has a valid SSL certificate.

```nginx
# In config/nginx.conf (production)
server {
    listen 443 ssl http2;
    server_name 17peppertree.co.za www.17peppertree.co.za;
    
    ssl_certificate /etc/letsencrypt/live/17peppertree.co.za/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/17peppertree.co.za/privkey.pem;
    
    # iCal endpoint
    location /api/ical/ {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache headers for iCal feeds
        add_header Cache-Control "no-cache, must-revalidate";
        add_header Pragma "no-cache";
        expires 0;
    }
}
```

#### 2. Environment Variables

Update production environment:

```bash
# production.env or .env.production
REACT_APP_API_URL=https://17peppertree.co.za/api
FLASK_ENV=production
DATABASE_URL=postgresql://user:pass@production-db:5432/peppertree
```

#### 3. Deploy to Production

```bash
# Using production docker-compose
docker compose -f docker-compose.production.yml up -d --build

# Verify deployment
curl https://17peppertree.co.za/api/health
curl https://17peppertree.co.za/api/ical/info
```

#### 4. Production Export URL

Your production iCal feed URL:
```
https://17peppertree.co.za/api/ical/bookings.ics
```

#### 5. Configure External Platforms

Now you can add this URL to your live booking platforms:

**Airbnb:**
1. Log in to your host account
2. Go to Calendar → Availability Settings
3. Import Calendar → Paste production URL
4. Set sync frequency to "Daily"

**Booking.com:**
1. Log in to Extranet
2. Calendar → Import/Export
3. Import Calendar → Paste production URL
4. Enable automatic sync

**VRBO:**
1. Property Dashboard → Calendar
2. Sync Calendar → Import
3. Paste production URL

#### 6. Monitor the Feed

Set up monitoring to ensure the feed is always accessible:

```bash
# Add to cron (check every hour)
0 * * * * curl -f https://17peppertree.co.za/api/ical/bookings.ics > /dev/null || mail -s "iCal Feed Down" admin@17peppertree.co.za
```

Or use a monitoring service like:
- UptimeRobot
- Pingdom
- StatusCake
- Datadog

### Environment-Specific URLs Reference

| Environment | Export URL | Import Endpoint | Admin UI |
|-------------|-----------|-----------------|----------|
| Development | `http://localhost:5000/api/ical/bookings.ics` | `http://localhost:5000/api/ical/import` | `http://localhost:3000/admin` |
| Staging | `https://staging.17peppertree.co.za/api/ical/bookings.ics` | `https://staging.17peppertree.co.za/api/ical/import` | `https://staging.17peppertree.co.za/admin` |
| Production | `https://17peppertree.co.za/api/ical/bookings.ics` | `https://17peppertree.co.za/api/ical/import` | `https://17peppertree.co.za/admin` |

### Security Considerations for Production

#### 1. Rate Limiting

Add rate limiting to prevent abuse:

```nginx
# In nginx.conf
limit_req_zone $binary_remote_addr zone=ical_limit:10m rate=10r/m;

location /api/ical/ {
    limit_req zone=ical_limit burst=5;
    # ... other config
}
```

#### 2. Access Logs

Enable detailed logging for iCal endpoints:

```python
# In ical_routes.py, add at the top of each endpoint:
logger.info(f"iCal export requested from {request.remote_addr}")
```

Monitor these logs for suspicious activity:

```bash
# Check who's accessing your feed
docker compose logs backend | grep "iCal export"
```

#### 3. Optional: Authentication

If you want to add authentication to the export URL (though not required for most platforms):

```python
# In ical_routes.py
@ical_bp.route('/bookings.ics', methods=['GET'])
def export_bookings():
    # Optional token authentication
    token = request.args.get('token')
    expected_token = os.getenv('ICAL_EXPORT_TOKEN')
    
    if expected_token and token != expected_token:
        return jsonify({'error': 'Unauthorized'}), 401
    
    # ... rest of export logic
```

Then your URL becomes:
```
https://17peppertree.co.za/api/ical/bookings.ics?token=YOUR_SECRET_TOKEN
```

#### 4. CORS Configuration

Ensure CORS is properly configured for production:

```python
# In app.py
cors_origins = [
    "https://17peppertree.co.za",
    "https://www.17peppertree.co.za",
    "https://staging.17peppertree.co.za"
]

CORS(app, origins=cors_origins, ...)
```

### Deployment Checklist

Before going live with iCal sync on production:

- [ ] SSL certificate installed and valid
- [ ] Domain DNS configured correctly
- [ ] Backend deployed and accessible via HTTPS
- [ ] `/api/ical/bookings.ics` returns valid iCal data
- [ ] `/api/ical/info` endpoint responds correctly
- [ ] Admin UI "Calendar Sync" section loads
- [ ] Test import with a sample iCal URL
- [ ] Export URL tested with Google Calendar
- [ ] Rate limiting configured
- [ ] Monitoring/alerts set up
- [ ] Logs being captured
- [ ] Backup strategy in place
- [ ] Documentation updated with production URLs

### Rollback Plan

If issues occur after deploying to production:

1. **Revert backend deployment:**
   ```bash
   docker compose -f docker-compose.production.yml down
   docker compose -f docker-compose.production.yml up -d --no-build
   ```

2. **Remove from external platforms:**
   - Log in to each platform
   - Remove the iCal import URL
   - This prevents platforms from trying to sync

3. **Check logs for errors:**
   ```bash
   docker compose -f docker-compose.production.yml logs backend --tail=100
   ```

4. **Fix and redeploy:**
   - Address the issue
   - Test in staging first
   - Deploy to production when stable

### Performance Optimization

For high-traffic production environments:

#### 1. Caching

Add Redis caching for the iCal feed:

```python
# In ical_routes.py
from flask_caching import Cache

cache = Cache(config={
    'CACHE_TYPE': 'redis',
    'CACHE_REDIS_URL': os.getenv('REDIS_URL', 'redis://localhost:6379/0')
})

@ical_bp.route('/bookings.ics', methods=['GET'])
@cache.cached(timeout=300)  # Cache for 5 minutes
def export_bookings():
    # ... existing code
```

#### 2. Database Indexing

Ensure proper indexes for iCal queries:

```sql
-- Add index for status filtering
CREATE INDEX idx_booking_status ON booking_requests(status) 
WHERE status IN ('confirmed', 'approved');

-- Add index for date queries
CREATE INDEX idx_booking_dates ON booking_requests(checkin_date, checkout_date);
```

#### 3. Connection Pooling

Optimize database connections:

```python
# In app.py
app.config['SQLALCHEMY_POOL_SIZE'] = 10
app.config['SQLALCHEMY_POOL_RECYCLE'] = 3600
app.config['SQLALCHEMY_MAX_OVERFLOW'] = 20
```

### Troubleshooting Production Issues

**Problem:** External platforms show "Invalid URL" error
- **Check:** Is your domain accessible via HTTPS?
- **Test:** `curl -I https://17peppertree.co.za/api/ical/bookings.ics`
- **Verify:** SSL certificate is valid and not expired

**Problem:** Feed returns 500 error
- **Check logs:** `docker compose logs backend --tail=100`
- **Verify:** Database connection is working
- **Test:** Access `/api/health` endpoint

**Problem:** Bookings not updating on external platforms
- **Solution:** Most platforms refresh every 24 hours
- **Check:** Platform's sync logs for errors
- **Verify:** Your feed URL is still correct in their settings

**Problem:** Too many requests (Rate limit exceeded)
- **Solution:** Increase rate limit in nginx config
- **Check:** Who/what is accessing your feed
- **Monitor:** Set up alerts for unusual traffic

### Support

For production deployment issues:
- Check the troubleshooting section above
- Review [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- Review [STAGING.md](STAGING.md)
- Contact support: bookings@17peppertree.co.za

## Changelog

### Version 1.0 (2025-11-24)
- Initial release
- Export functionality for confirmed/approved bookings
- Import functionality for external iCal feeds
- Admin UI for managing calendar sync
- Support for Airbnb, Booking.com, VRBO, LekkeSlaap, SafariNow
- Testing script included
- Production and staging deployment documentation

---

**Last Updated:** 2025-11-24  
**Version:** 1.0  
**Author:** 17 @ Peppertree Development Team
