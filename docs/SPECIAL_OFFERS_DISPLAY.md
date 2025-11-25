# Special Offers Display Feature

## Overview
Added a prominent banner to display active special rates on the homepage, making promotional pricing visible to guests.

## What Was Added

### SpecialOffers Component
**Location:** `src/components/SpecialOffers/SpecialOffers.js`

**Features:**
- Fetches active special rates from database
- Filters to show only current/future specials
- Displays as eye-catching banner below hero
- Shows savings amount and percentage
- Auto-hides when no specials active
- Responsive design for mobile/desktop

### Visual Design
- **Gold gradient background** with animated stars
- **Glass-morphism cards** for each special
- **Hover effects** for interactivity
- **Clear pricing** with savings highlighted
- **Date range** prominently displayed

### Example Display
```
★ Special Offers ★

┌──────────────────────────────────────┐
│  R650                               │
│  1 guest                            │
│  ───────────────                    │
│  Start of holidays special          │
│  1 Dec 2025 - 8 Dec 2025          │
│  Save R200 (24% off!)               │
└──────────────────────────────────────┘
```

## Integration

### App.js
Added SpecialOffers component after Hero section:
```javascript
<Header />
<Hero />
<SpecialOffers />  // ← New banner here
<Accommodation />
```

### Positioning Strategy
Placed immediately after Hero for maximum visibility:
1. **First impression** - Guests see it right away
2. **Above the fold** - Visible without scrolling
3. **Eye-catching** - Gold gradient stands out
4. **Non-intrusive** - Auto-hides if no specials

## How It Works

### 1. Data Fetching
```javascript
const fetchSpecialRates = async () => {
  const today = new Date().toISOString().split('T')[0];
  const response = await fetch(
    `/api/admin/rates/?type=special&active=true&date=${today}`
  );
  // Filters to current/upcoming specials only
};
```

### 2. Savings Calculation
Compares special rate against base rate:
- **1 guest base:** R850
- **2 guests base:** R950
- **Calculates:** Amount saved & percentage discount

### 3. Smart Display Logic
- **No specials?** Component returns `null` (nothing shown)
- **Active specials?** Banner appears automatically
- **Multiple specials?** All displayed in one banner

## API Endpoint Used

```
GET /api/admin/rates/?type=special&active=true&date=YYYY-MM-DD
```

Returns active special rates that apply on the specified date.

## Creating Special Offers

### From Admin Dashboard:
1. Login to admin
2. Go to "Rates" tab
3. Click "Add Rate"
4. Select "Special Rate"
5. Fill in details:
   - Guests: 1 or 2
   - Amount: e.g., R650
   - Start Date: e.g., 2025-12-01
   - End Date: e.g., 2025-12-08
   - Description: "Start of holidays special"
6. Click "Create"

### Result:
- Special appears on homepage immediately
- Visible to all visitors
- Auto-disappears after end date

## Example Specials

### Holiday Special
```
Type: Special Rate
Guests: 1
Amount: R650
Start: 2025-12-01
End: 2025-12-08
Description: "Start of holidays special"
Result: R200 off (24% discount)
```

### Weekend Special
```
Type: Special Rate
Guests: 2
Amount: R850
Start: 2026-01-10
End: 2026-01-31
Description: "Summer weekend getaway"
Result: R100 off (11% discount)
```

### Last Minute Deal
```
Type: Special Rate
Guests: 1
Amount: R700
Start: 2025-11-28
End: 2025-12-05
Description: "Last minute booking deal"
Result: R150 off (18% discount)
```

## Benefits

1. **Increased Visibility**
   - Specials prominently displayed
   - Can't be missed by visitors

2. **Dynamic Pricing**
   - No code changes needed
   - Update from admin dashboard

3. **Urgency Creation**
   - Dates shown clearly
   - Savings emphasized

4. **Multiple Offers**
   - Can run multiple specials simultaneously
   - Each displayed in banner

5. **Automatic Management**
   - Auto-shows when active
   - Auto-hides when expired

## Responsive Design

### Desktop
- Horizontal layout
- All specials in one row
- Large, readable text

### Mobile
- Vertical stacking
- Touch-friendly cards
- Optimized spacing

## Testing

### Manual Test:
1. Visit homepage
2. Look below hero section
3. Should see gold banner with special offer
4. Shows: "Start of holidays special"
5. Displays: R650 with savings info

### No Specials Test:
1. Delete or deactivate all special rates
2. Refresh homepage
3. Banner should not appear
4. Page flows normally without it

## Future Enhancements

Potential improvements:
- Countdown timer for ending soon
- "Book Now" button in banner
- Carousel for many specials
- Animation effects
- Share special on social media
- Email notification signup

## Files Added

- `src/components/SpecialOffers/SpecialOffers.js` - Main component

## Files Modified

- `src/App.js` - Added SpecialOffers to HomePage

## Status

✅ Component created
✅ Integrated into homepage
✅ Frontend compiled
✅ Live on development site
✅ Ready for testing

## Current Example

There's already one special in the database:
- **"Start of holidays special"**
- R650 for 1 guest (Save R200!)
- Valid Dec 1-8, 2025

Visit the homepage to see it in action!
