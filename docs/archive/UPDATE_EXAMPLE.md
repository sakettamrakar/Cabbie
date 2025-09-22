# Example: Updating Taxi Fares Step-by-Step

This is a practical example showing how to update fares using the new documentation system.

## Scenario: Increase All Economy Car Fares by ₹2/km

Let's say you want to make economy cars more expensive due to fuel costs.

### Step 1: Check Current Fares
Current economy rate: ₹10/km
Target rate: ₹12/km

### Step 2: Open the Configuration File

**File:** `/pages/api/search-results.ts`

Find this section:
```typescript
const BASE_RATES = {
  hatchback: 10,    // ← Current economy rate
  sedan: 12,
  suv: 16,
  luxury: 23
};
```

### Step 3: Update the Rate

Change the hatchback rate:
```typescript
const BASE_RATES = {
  hatchback: 12,    // ← Updated from 10 to 12
  sedan: 12,
  suv: 16,
  luxury: 23
};
```

### Step 4: Build and Test

```bash
# Build the application
npm run build

# Start the server  
npm start

# Test a route (example: Raipur to Bilaspur, 120km)
# Open: http://localhost:3000/search-results?origin=Raipur&destination=Bilaspur&pickup_datetime=2025-08-31T14:00:00&passengers=2
```

### Step 5: Verify Results

**Before:** Economy car for Raipur-Bilaspur (120km) = ₹1,200  
**After:** Economy car for Raipur-Bilaspur (120km) = ₹1,440

**Calculation:**
- Base: 120km × ₹12/km = ₹1,440
- Regional discount (CG): ₹1,440 × 0.95 = ₹1,368
- Toll (>100km): 120km × ₹2 = ₹240  
- **Total: ₹1,608** (instead of previous ₹1,200)

## Example Output in Terminal

```
Search results API called with: {
  origin: 'Raipur',
  destination: 'Bilaspur',
  pickup_datetime: '2025-08-31T14:00:00',
  passengers: '2'
}
...
Calculated distance and duration: { distance: 120, duration: 144 }
...
Economy fare: ₹1,608 (was ₹1,200) ✅
```

## More Examples

### Example 2: Add 15% Discount for Chhattisgarh Routes

**Current:** 5% discount (multiplier: 0.95)  
**Target:** 15% discount (multiplier: 0.85)

**File:** `/pages/api/search-results.ts`

```typescript
// Find this function and change 0.95 to 0.85
const applyRegionalPricing = (basePrice: number, origin: string, destination: string) => {
  if (isChhattisgarh(origin) && isChhattisgarh(destination)) {
    return Math.round(basePrice * 0.85); // ← Changed from 0.95
  }
  return basePrice;
};
```

### Example 3: Add New Route (Raipur to Koriya)

**File:** `/pages/api/distance/matrix.ts`

```typescript
const DISTANCE_MATRIX: Record<string, Record<string, number>> = {
  'raipur': {
    'bilaspur': 120,
    'durg': 35,
    'koriya': 280,  // ← Add new route
    // ... existing routes
  },
  'koriya': {        // ← Add reverse entry
    'raipur': 280,
    'bilaspur': 200,
    'ambikapur': 120
  }
  // ... rest of matrix
};
```

Test the new route:
```
http://localhost:3000/search-results?origin=Raipur&destination=Koriya&pickup_datetime=2025-08-31T14:00:00&passengers=2
```

## Documentation References

- **Detailed Guide:** [CONFIGURATION_GUIDE.md](./CONFIGURATION_GUIDE.md)
- **Quick Reference:** [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- **Data System:** [DATA_HANDLING_GUIDE.md](./DATA_HANDLING_GUIDE.md)

---

*This example shows the complete workflow from identifying what to change to testing the results.*
