# Setting up Google Places API for Location Autocomplete

This application now integrates with Google Places API to provide real location suggestions instead of hardcoded mock data.

## Getting Started

### 1. Get a Google Places API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing project
3. Enable the "Places API" for your project:
   - Go to "APIs & Services" > "Library"
   - Search for "Places API" 
   - Click on "Places API" and click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

### 2. Configure the API Key

1. Add your API key to the `.env` file:
   ```bash
   GOOGLE_PLACES_API_KEY=your_actual_api_key_here
   ```

2. For security, restrict your API key:
   - In Google Cloud Console, go to "APIs & Services" > "Credentials"
   - Click on your API key
   - Under "API restrictions", select "Restrict key"
   - Choose "Places API" from the dropdown
   - Save the changes

### 3. Optional: Restrict by Domain (for production)

For production deployments, add HTTP referrer restrictions:
- In the API key settings, under "Application restrictions"
- Select "HTTP referrers (web sites)"
- Add your domain(s): `yourdomain.com/*`

## How it Works

### Fallback Behavior
If no API key is configured, the application automatically falls back to mock data for development purposes.

### Features
- **Real-time suggestions**: As users type, the app fetches real location suggestions
- **Place types**: Automatically detects airports, transit stations, and other establishment types
- **Structured data**: Shows main location name and secondary details (city, state, etc.)
- **Session tokens**: Uses Google Places session tokens for cost optimization
- **Country filtering**: Currently configured for India (`country:in`), can be customized

### API Endpoint
- `GET /api/places/autocomplete?input=search_term&sessiontoken=token`
- Returns structured location data compatible with the booking widget

## Customization

### Change Country Filter
Edit `pages/api/places/autocomplete.ts` and modify:
```typescript
url.searchParams.set('components', 'country:us'); // Change 'in' to your country code
```

### Adjust Place Types
Modify the `types` parameter in the same file:
```typescript
url.searchParams.set('types', 'establishment|geocode|airport'); // Customize as needed
```

## Cost Considerations

Google Places Autocomplete API pricing:
- Session-based requests: $17 per 1000 sessions
- Per-request pricing: $2.83 per 1000 requests

The implementation uses session tokens to optimize costs by grouping related requests.

## Testing

1. Start the development server: `npm run dev`
2. Open the booking form
3. Start typing in any location field
4. You should see real location suggestions appear

Without an API key, you'll see mock suggestions with "City Center", "Airport", and "Train Station" options.
