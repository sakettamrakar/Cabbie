import { isMapsEnabled } from '../lib/maps';

describe('isMapsEnabled', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns false when flag disabled', () => {
    process.env.MAPS_ENABLED = 'false';
    process.env.GOOGLE_MAPS_BROWSER_KEY = 'browser';
    process.env.GOOGLE_MAPS_SERVER_KEY = 'server';

    expect(isMapsEnabled('server')).toBe(false);
    expect(isMapsEnabled('client')).toBe(false);
  });

  it('returns false when keys missing', () => {
    process.env.MAPS_ENABLED = 'true';
    process.env.GOOGLE_MAPS_BROWSER_KEY = '';
    process.env.GOOGLE_MAPS_SERVER_KEY = '';

    expect(isMapsEnabled('server')).toBe(false);
    expect(isMapsEnabled('client')).toBe(false);
  });

  it('returns true only for client when browser key available', () => {
    process.env.MAPS_ENABLED = 'true';
    process.env.GOOGLE_MAPS_BROWSER_KEY = 'browser';
    process.env.GOOGLE_MAPS_SERVER_KEY = '';

    expect(isMapsEnabled('client')).toBe(true);
    expect(isMapsEnabled('server')).toBe(false);
  });

  it('returns true when both keys available', () => {
    process.env.MAPS_ENABLED = 'true';
    process.env.GOOGLE_MAPS_BROWSER_KEY = 'browser';
    process.env.GOOGLE_MAPS_SERVER_KEY = 'server';

    expect(isMapsEnabled('client')).toBe(true);
    expect(isMapsEnabled('server')).toBe(true);
  });
});
