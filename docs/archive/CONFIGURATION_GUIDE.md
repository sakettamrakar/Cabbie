# Configuration & Update Guide

This guide explains how to update fares, routes, cities, and other configurations in the RaipurToCabs taxi booking system.

## Table of Contents
1. [Fare Management](#fare-management)
2. [Route & Distance Updates](#route--distance-updates)
3. [City Database Management](#city-database-management)
4. [Pricing Structure](#pricing-structure)
5. [Vehicle Configuration](#vehicle-configuration)
6. [Regional Settings](#regional-settings)
7. [API Configuration](#api-configuration)

## Fare Management

### Updating Base Fares for Vehicle Types

**File:** `/pages/api/search-results.ts`

```typescript
// Base rates per km (in ₹)
const BASE_RATES = {
  hatchback: 10,    // Economy vehicles
  sedan: 12,        // Comfort vehicles  
  suv: 16,          // Premium vehicles
  luxury: 23        // Luxury vehicles
};
```

**To update fares:**
1. Open `/pages/api/search-results.ts`
2. Find the `BASE_RATES` object
3. Modify the rates as needed
4. Run `npm run build` to apply changes

### Regional Pricing Adjustments

**File:** `/pages/api/search-results.ts`

```typescript
// Regional discounts (applied as multiplier)
const applyRegionalPricing = (basePrice: number, origin: string, destination: string) => {
  // 5% discount for Chhattisgarh routes
  if (isChhattisgarh(origin) && isChhattisgarh(destination)) {
    return Math.round(basePrice * 0.95);
  }
  return basePrice;
};
```

**To modify regional pricing:**
1. Locate the `applyRegionalPricing` function
2. Adjust the discount multiplier (0.95 = 5% discount)
3. Add new regional conditions as needed

## Route & Distance Updates

### Adding New Routes

**File:** `/pages/api/distance/matrix.ts`

**Step 1:** Add distance data to the distance matrix:

```typescript
const DISTANCE_MATRIX: Record<string, Record<string, number>> = {
  'raipur': {
    'bilaspur': 120,
    'durg': 35,
    'bhilai': 45,
    // Add new destination here
    'newcity': 150
  },
  // Add new origin city
  'newcity': {
    'raipur': 150,
    'bilaspur': 180,
    'durg': 200
  }
};
```

**Step 2:** Update city lists in search results:

**File:** `/pages/api/search-results.ts`

```typescript
// Add to Chhattisgarh cities list if applicable
const isChhattisgarh = (city: string): boolean => {
  const cgCities = [
    'raipur', 'bilaspur', 'durg', 'bhilai', 'korba',
    // Add your new CG city here
    'newcity'
  ];
  return cgCities.includes(city.toLowerCase());
};
```

### Updating Existing Route Distances

**Example:** To change Raipur to Bilaspur from 120km to 125km:

1. Open `/pages/api/distance/matrix.ts`
2. Find the entry: `'raipur': { 'bilaspur': 120 }`
3. Change to: `'raipur': { 'bilaspur': 125 }`
4. Also update the reverse: `'bilaspur': { 'raipur': 125 }`

## City Database Management

### Adding a New City

**Step 1:** Add to distance matrix (see above)

**Step 2:** Add to Google Places integration (if using real places):

**File:** `/components/search/LocationInput.tsx`
- The city should automatically appear if it's a real place
- No code changes needed for Google Places integration

**Step 3:** Test the new city:
```bash
# Build and start server
npm run build
npm start

# Test in browser
http://localhost:3000/search-results?origin=NewCity&destination=Raipur&pickup_datetime=2025-08-31T14:00:00&passengers=2
```

### Removing a City

1. Remove from distance matrix in `/pages/api/distance/matrix.ts`
2. Remove from regional city lists if applicable
3. Test to ensure no broken routes

## Pricing Structure

### Toll and Surcharge Configuration

**File:** `/pages/api/search-results.ts`

```typescript
// Toll calculation (₹2 per km for distances > 100km)
const tollCharges = distance > 100 ? Math.round(distance * 2) : 0;

// Night surcharge (10% between 11 PM - 6 AM)
const isNightTime = hour >= 23 || hour < 6;
const nightSurcharge = isNightTime ? Math.round(basePrice * 0.1) : 0;
```

**To modify:**
- **Toll rates:** Change the multiplier `2` in toll calculation
- **Toll threshold:** Change the distance check `100`
- **Night surcharge:** Modify the percentage `0.1` (10%)
- **Night hours:** Adjust the time conditions

### Minimum Fare Settings

```typescript
// Minimum fare per vehicle type
const MIN_FARES = {
  hatchback: 300,
  sedan: 400,
  suv: 500,
  luxury: 800
};
```

## Vehicle Configuration

### Adding New Vehicle Types

**File:** `/pages/api/search-results.ts`

```typescript
// Add to CAB_OPTIONS array
{
  id: 'newtype-1',
  category: 'New Category',
  carType: 'newtype',
  carExamples: ['Car Model 1', 'Car Model 2'],
  capacity: 6,
  features: ['Feature 1', 'Feature 2'],
  price: 0, // Will be calculated
  rating: 4.5,
  totalRides: 100
}
```

**Also add to BASE_RATES:**
```typescript
const BASE_RATES = {
  // existing rates...
  newtype: 18  // rate per km
};
```

### Updating Vehicle Features

Find the vehicle in `CAB_OPTIONS` and modify the `features` array:

```typescript
features: ['AC', 'GPS Tracking', 'Professional Driver', 'Music System']
```

## Regional Settings

### Adding New Regional Pricing

**Example:** Adding Odisha regional pricing:

```typescript
const applyRegionalPricing = (basePrice: number, origin: string, destination: string) => {
  // Chhattisgarh routes - 5% discount
  if (isChhattisgarh(origin) && isChhattisgarh(destination)) {
    return Math.round(basePrice * 0.95);
  }
  
  // Odisha routes - 3% discount (new)
  if (isOdisha(origin) && isOdisha(destination)) {
    return Math.round(basePrice * 0.97);
  }
  
  return basePrice;
};

// Add helper function
const isOdisha = (city: string): boolean => {
  const odishaCities = ['bhubaneswar', 'cuttack', 'puri'];
  return odishaCities.includes(city.toLowerCase());
};
```

## API Configuration

### Google Places API

**File:** `/lib/env.ts` or environment variables

```bash
# Add to .env.local
GOOGLE_PLACES_API_KEY=your_api_key_here
```

### Rate Limiting

**File:** `/pages/api/search-results.ts`

```typescript
// Current: 100 requests per hour per IP
// To modify, change the limiter configuration
```

## Testing Your Changes

### 1. Build the Application
```bash
npm run build
```

### 2. Start the Server
```bash
npm start
```

### 3. Test Specific Routes
```bash
# Test via browser
http://localhost:3000/search-results?origin=YourCity&destination=AnotherCity&pickup_datetime=2025-08-31T14:00:00&passengers=2

# Test via API
curl "http://localhost:3000/api/search-results?origin=YourCity&destination=AnotherCity&pickup_datetime=2025-08-31T14:00:00&passengers=2"
```

### 4. Validate Pricing
Check the terminal output for detailed pricing calculations:
- Base fare calculation
- Regional adjustments
- Toll charges
- Final prices for each vehicle type

## Common Update Scenarios

### Scenario 1: Increase Economy Car Fare by ₹2/km

1. Open `/pages/api/search-results.ts`
2. Change `hatchback: 10` to `hatchback: 12`
3. Build and test

### Scenario 2: Add 10% Discount for Raipur-Bilaspur Route

```typescript
// Add specific route pricing
if ((origin.toLowerCase() === 'raipur' && destination.toLowerCase() === 'bilaspur') ||
    (origin.toLowerCase() === 'bilaspur' && destination.toLowerCase() === 'raipur')) {
  return Math.round(basePrice * 0.9); // 10% discount
}
```

### Scenario 3: Update Distance for Multiple Routes

Use find-and-replace in your editor:
1. Open `/pages/api/distance/matrix.ts`
2. Search for the city name
3. Update all relevant distance entries
4. Ensure bidirectional consistency

## File Structure Reference

```
/pages/api/
├── search-results.ts      # Main pricing and vehicle logic
├── distance/matrix.ts     # Distance calculations
└── ...

/components/search/
├── LocationInput.tsx      # City search interface
└── ...

/docs/
├── CONFIGURATION_GUIDE.md # This file
└── ...
```

## Troubleshooting

### Changes Not Reflecting
1. Ensure you ran `npm run build`
2. Restart the server: `npm start`
3. Clear browser cache
4. Check terminal for error messages

### Distance Not Found
1. Verify city name spelling in distance matrix
2. Ensure bidirectional entries exist
3. Check case sensitivity

### Pricing Issues
1. Verify regional pricing logic
2. Check minimum fare settings
3. Review toll calculation logic

## Support

For additional help:
1. Check `/docs/TROUBLESHOOTING.md`
2. Review terminal logs for detailed pricing breakdowns
3. Test changes in development mode: `npm run dev`

---

*Last updated: August 31, 2025*
