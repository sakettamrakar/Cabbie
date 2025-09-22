import handlerResolve from '../pages/api/resolve-place';
import handlerEta from '../pages/api/eta';
import { createMocks } from 'node-mocks-http';

describe('Maps fallbacks', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.MAPS_ENABLED = 'false';
    process.env.GOOGLE_MAPS_BROWSER_KEY = '';
    process.env.GOOGLE_MAPS_SERVER_KEY = '';
  });

  afterAll(() => {
    process.env = { ...originalEnv };
  });

  it('resolve-place echoes raw text when maps disabled', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        rawText: 'Shankar Nagar, Raipur',
        place_id: 'abc123',
      },
    });

    await handlerResolve(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    const data = res._getJSONData();
    expect(data).toEqual({
      place_id: 'abc123',
      address: 'Shankar Nagar, Raipur',
      lat: null,
      lng: null,
    });
  });

  it('eta uses legacy quote when maps disabled', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        origin: { address: 'Raipur' },
        destination: { address: 'Bilaspur' },
      },
    });

    await handlerEta(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    const data = res._getJSONData();
    expect(data.distance_km).toBe(120);
    expect(data.duration_min).toBe(150);
  });

  it('eta falls back to haversine when no address available', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        origin: { lat: 21.2514, lng: 81.6296 },
        destination: { lat: 21.1938, lng: 81.3509 },
      },
    });

    await handlerEta(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    const data = res._getJSONData();
    expect(data.distance_km).toBeGreaterThan(0);
    expect(data.duration_min).toBeGreaterThan(0);
  });
});
