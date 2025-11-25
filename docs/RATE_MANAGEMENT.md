# Rate Management Feature

## Overview
The rate management system allows property owners to configure flexible pricing for the guest room, supporting different rates for 1 or 2 guests and ad-hoc special pricing for specific date ranges.

## Features

### Base Rates
- Set default rates for 1 guest and 2 guests
- Only one active base rate per guest count at a time
- Automatically displayed on the public-facing website

### Special Rates
- Create promotional or seasonal pricing for specific date ranges
- Apply to specific guest counts (1 or 2)
- Override base rates when dates overlap
- Useful for:
  - Holiday specials
  - Off-season discounts
  - Peak season pricing
  - Last-minute deals

## Database Schema

### Rates Table
```sql
CREATE TABLE rates (
    id SERIAL PRIMARY KEY,
    rate_type VARCHAR(50) NOT NULL,  -- 'base' or 'special'
    guests INTEGER NOT NULL,          -- 1 or 2
    amount NUMERIC(10, 2) NOT NULL,
    start_date DATE,                  -- NULL for base rates
    end_date DATE,                    -- NULL for base rates
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(120),
    updated_by VARCHAR(120)
);
```

## API Endpoints

### Public Endpoints (No Authentication Required)

#### Get Base Rates
```
GET /api/admin/rates/base
```
Returns active base rates for displaying on the website.

**Response:**
```json
{
  "rates": [
    {
      "id": 1,
      "rate_type": "base",
      "guests": 1,
      "amount": 850.00,
      "description": "Base rate for 1 guest",
      "is_active": true
    },
    {
      "id": 2,
      "rate_type": "base",
      "guests": 2,
      "amount": 950.00,
      "description": "Base rate for 2 guests",
      "is_active": true
    }
  ]
}
```

#### Calculate Rate
```
POST /api/admin/rates/calculate
```
Calculate total cost for a booking including special rates if applicable.

**Request Body:**
```json
{
  "checkin_date": "2025-12-01",
  "checkout_date": "2025-12-05",
  "guests": 2
}
```

**Response:**
```json
{
  "nights": 4,
  "guests": 2,
  "base_rate": 950.00,
  "nightly_rates": [
    {
      "date": "2025-12-01",
      "rate": 950.00,
      "rate_type": "base",
      "description": "Base rate for 2 guest(s)"
    },
    {
      "date": "2025-12-02",
      "rate": 800.00,
      "rate_type": "special",
      "description": "Holiday Special"
    }
  ],
  "total_amount": 3500.00,
  "currency": "ZAR"
}
```

#### Get All Rates (with filters)
```
GET /api/admin/rates/?type=special&guests=2&active=true
```

Query Parameters:
- `type`: Filter by rate type ('base' or 'special')
- `guests`: Filter by guest count (1 or 2)
- `active`: Show only active rates (default: true)
- `date`: Check rates applicable for specific date (YYYY-MM-DD)

### Admin Endpoints (Authentication Required)

#### Create Rate
```
POST /api/admin/rates/
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "rate_type": "special",
  "guests": 2,
  "amount": 800.00,
  "start_date": "2025-12-20",
  "end_date": "2026-01-10",
  "description": "Holiday Special"
}
```

#### Update Rate
```
PUT /api/admin/rates/{id}
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "amount": 850.00,
  "description": "Updated Holiday Special"
}
```

#### Delete Rate (Soft Delete)
```
DELETE /api/admin/rates/{id}
Authorization: Bearer <token>
```
Sets `is_active` to false instead of permanently deleting.

## Frontend Components

### RateManagement Component
Location: `src/components/Admin/RateManagement.js`

Features:
- View all base and special rates
- Create new rates
- Edit existing rates
- Delete rates
- Validation for date ranges and overlaps

### Hero Component Integration
Location: `src/components/Hero/Hero.js`

The Hero component now dynamically fetches and displays the minimum base rate instead of hardcoded value.

## Usage Examples

### Creating a Base Rate
1. Navigate to Admin Dashboard → Rates
2. Click "Add Rate"
3. Select "Base Rate" as type
4. Choose guest count (1 or 2)
5. Enter amount
6. Click "Create"

Note: Creating a new base rate will deactivate the previous base rate for that guest count.

### Creating a Special Rate
1. Navigate to Admin Dashboard → Rates
2. Click "Add Rate"
3. Select "Special Rate" as type
4. Choose guest count
5. Enter amount
6. Select start and end dates
7. Add description (e.g., "Summer Special")
8. Click "Create"

### Viewing Rates on Public Site
The Hero section automatically displays the lowest base rate with "From R{amount}" text.

## Validation Rules

1. **Amount**: Must be greater than 0
2. **Guest Count**: Must be 1 or 2
3. **Base Rates**: Cannot have date ranges
4. **Special Rates**: Must have both start and end dates
5. **Date Range**: End date must be >= start date
6. **Overlapping Specials**: Cannot create overlapping special rates for same guest count
7. **Deletion**: Cannot delete the only active base rate for a guest count

## Rate Calculation Logic

When calculating booking cost:
1. Iterate through each night of the booking
2. Check if any active special rate applies for that date and guest count
3. If special rate found, use it
4. Otherwise, use base rate
5. Sum all nightly rates for total

## Database Migration

To set up the rates table:
```bash
docker exec -i peppertree_db_dev psql -U postgres -d peppertree < migrations/add_rates_table.sql
```

Default base rates are automatically inserted:
- 1 guest: R850 per night
- 2 guests: R950 per night

## Testing

Run tests with:
```bash
npm test -- RateManagement
npm test -- Hero.test.js
```

## Future Enhancements

Potential improvements:
- Percentage-based discounts
- Multi-night stay discounts
- Last-minute booking discounts
- Seasonal rate templates
- Rate history and analytics
- Bulk rate updates
- Rate comparison with competitors
