import { getBrowserMapsKey, getMapsLanguage, getMapsRegion, isMapsEnabled } from './maps';

type GoogleNamespace = any;

let scriptPromise: Promise<GoogleNamespace | null> | null = null;
const SCRIPT_ATTR = 'data-google-maps-loader';

const buildScriptUrl = (key: string) => {
  const params = new URLSearchParams({
    key,
    libraries: 'places',
    language: getMapsLanguage(),
    region: getMapsRegion(),
  });
  return `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
};

export const loadGoogleMapsScript = async (): Promise<GoogleNamespace | null> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  if (!isMapsEnabled('client')) {
    return null;
  }

  if ((window as any).google?.maps?.places) {
    return (window as any).google as GoogleNamespace;
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  const key = getBrowserMapsKey();
  if (!key) {
    return null;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const cleanup = () => {
      scriptPromise = null;
    };

    const existing = document.querySelector(`script[${SCRIPT_ATTR}]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve((window as any).google as GoogleNamespace));
      existing.addEventListener('error', () => {
        cleanup();
        reject(new Error('Google Maps script failed to load'));
      });
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.defer = true;
    script.src = buildScriptUrl(key);
    script.setAttribute(SCRIPT_ATTR, 'true');
    script.onload = () => resolve((window as any).google as GoogleNamespace);
    script.onerror = () => {
      cleanup();
      reject(new Error('Google Maps script failed to load'));
    };

    document.head.appendChild(script);
  });

  try {
    return await scriptPromise;
  } catch (error) {
    scriptPromise = null;
    throw error;
  }
};

export const extractSessionToken = (tokenObj: unknown): string | undefined => {
  if (!tokenObj) return undefined;
  if (typeof tokenObj === 'string') return tokenObj;
  if (typeof tokenObj === 'object') {
    const candidate = (tokenObj as Record<string, unknown>).sessionToken ||
      (tokenObj as Record<string, unknown>).token;
    if (typeof candidate === 'string') {
      return candidate;
    }
  }
  return undefined;
};
