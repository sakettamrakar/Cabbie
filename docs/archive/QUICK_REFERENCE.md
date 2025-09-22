# Quick Update Reference

This is a quick reference for common configuration updates. For detailed instructions, see [CONFIGURATION_GUIDE.md](./CONFIGURATION_GUIDE.md).

## 🚀 Quick Commands

```bash
# After making any changes
npm run build
npm start

# Test a route
http://localhost:3000/search-results?origin=CityA&destination=CityB&pickup_datetime=2025-08-31T14:00:00&passengers=2
```

## 💰 Update Fares

**File:** `/pages/api/search-results.ts`

```typescript
// Change base rates per km
const BASE_RATES = {
  hatchback: 10,    // Economy: ₹10/km
  sedan: 12,        // Comfort: ₹12/km  
  suv: 16,          // Premium: ₹16/km
  luxury: 23        // Luxury: ₹23/km
};
```

## 🗺️ Add New Route

**File:** `/pages/api/distance/matrix.ts`

```typescript
const DISTANCE_MATRIX: Record<string, Record<string, number>> = {
  'newcity': {
    'raipur': 150,      // 150km from NewCity to Raipur
    'bilaspur': 180,    // 180km from NewCity to Bilaspur
  },
  'raipur': {
    'newcity': 150,     // Ensure bidirectional entry
    // ... existing routes
  }
};
```

## 🏙️ Add Regional Discount

**File:** `/pages/api/search-results.ts`

```typescript
// Add new region
const isNewRegion = (city: string): boolean => {
  const cities = ['city1', 'city2', 'city3'];
  return cities.includes(city.toLowerCase());
};

// Apply discount
const applyRegionalPricing = (basePrice: number, origin: string, destination: string) => {
  if (isNewRegion(origin) && isNewRegion(destination)) {
    return Math.round(basePrice * 0.95); // 5% discount
  }
  return basePrice;
};
```

## 🚗 Update Vehicle Features

**File:** `/pages/api/search-results.ts`

```typescript
// Find your vehicle in CAB_OPTIONS and update:
{
  id: 'sedan-1',
  category: 'Comfort',
  carType: 'sedan',
  carExamples: ['Honda City', 'Maruti Ciaz'],
  capacity: 4,
  features: ['AC', 'Music System', 'GPS'], // Update this array
  rating: 4.5,
  totalRides: 890
}
```

## 🎯 Common Scenarios

| Task | File | What to Change |
|------|------|----------------|
| Increase all fares by ₹2/km | `search-results.ts` | Add 2 to each `BASE_RATES` value |
| Add 10km to Raipur-Bilaspur | `distance/matrix.ts` | Change `120` to `130` in both directions |
| 15% discount for CG routes | `search-results.ts` | Change `0.95` to `0.85` in regional pricing |
| Add night surcharge | `search-results.ts` | Modify `nightSurcharge` calculation |

## 📍 File Locations

```
/pages/api/
├── search-results.ts      # 💰 Pricing & vehicles
├── distance/matrix.ts     # 🗺️ Routes & distances

/components/search/
├── LocationInput.tsx      # 🔍 City search (auto from Google)

/docs/
├── CONFIGURATION_GUIDE.md # 📖 Detailed guide
└── QUICK_REFERENCE.md     # 📝 This file
```

## ✅ Testing Checklist

1. **Build:** `npm run build` (no errors)
2. **Start:** `npm start` 
3. **Test route:** Open browser URL
4. **Check logs:** Terminal shows pricing calculations
5. **Verify:** Correct distance, duration, and fares

## 🚨 Common Mistakes

- ❌ Forgetting bidirectional distance entries
- ❌ Not running `npm run build` after changes
- ❌ Case sensitivity in city names
- ❌ Missing commas in JSON objects
- ❌ Forgetting to restart server

## 💡 Pro Tips

- Use browser DevTools Network tab to see API responses
- Check terminal logs for detailed pricing breakdowns
- Test edge cases (very short/long distances)
- Verify mobile vs desktop behavior
- Use `npm run dev` for faster development iterations

---

*For detailed explanations and advanced scenarios, see [CONFIGURATION_GUIDE.md](./CONFIGURATION_GUIDE.md)*
