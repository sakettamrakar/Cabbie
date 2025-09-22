const TRUTHY = new Set(['1', 'true', 'yes', 'on']);

const trim = (value?: string | null) => (value ?? '').trim();

const toBoolean = (value?: string | null): boolean => {
  if (!value) return false;
  return TRUTHY.has(value.toLowerCase());
};

const resolveBrowserKey = (): string => {
  const candidates = [
    process.env.GOOGLE_MAPS_BROWSER_KEY,
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY,
  ];
  for (const candidate of candidates) {
    if (trim(candidate)) {
      return trim(candidate);
    }
  }
  return '';
};

const resolveServerKey = (): string => {
  const candidates = [
    process.env.GOOGLE_MAPS_SERVER_KEY,
    process.env.GOOGLE_MAPS_API_KEY,
  ];
  for (const candidate of candidates) {
    if (trim(candidate)) {
      return trim(candidate);
    }
  }
  return '';
};

export const getMapsRegion = (): string => trim(process.env.MAPS_REGION) || 'IN';
export const getMapsLanguage = (): string => trim(process.env.MAPS_LANGUAGE) || 'en';
export const getBrowserMapsKey = (): string => resolveBrowserKey();
export const getServerMapsKey = (): string => resolveServerKey();

export type RuntimeSide = 'client' | 'server';

const detectRuntime = (): RuntimeSide => (typeof window === 'undefined' ? 'server' : 'client');

export const isMapsEnabled = (side: RuntimeSide = detectRuntime()): boolean => {
  const flag = toBoolean(process.env.MAPS_ENABLED ?? process.env.NEXT_PUBLIC_MAPS_ENABLED);
  if (!flag) {
    return false;
  }

  const hasBrowserKey = !!resolveBrowserKey();
  if (side === 'client') {
    return hasBrowserKey;
  }

  const hasServerKey = !!resolveServerKey();
  return hasBrowserKey && hasServerKey;
};

export const mapsConfigSummary = () => ({
  enabled: isMapsEnabled(),
  region: getMapsRegion(),
  language: getMapsLanguage(),
  hasBrowserKey: !!resolveBrowserKey(),
  hasServerKey: !!resolveServerKey(),
});
