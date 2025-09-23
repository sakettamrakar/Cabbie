import { toTitleCase } from '../lib/strings';

describe('toTitleCase', () => {
  it('capitalizes each word', () => {
    expect(toTitleCase('raipur durg')).toBe('Raipur Durg');
  });

  it('handles extra spaces and hyphenated names', () => {
    expect(toTitleCase('  bhilai   nagar ')).toBe('Bhilai Nagar');
    expect(toTitleCase('new-town east')).toBe('New-Town East');
  });

  it('converts multi-word cities to title case', () => {
    expect(toTitleCase('new delhi')).toBe('New Delhi');
    expect(toTitleCase('durg')).toBe('Durg');
  });

  it('returns empty string for falsy values', () => {
    expect(toTitleCase('')).toBe('');
  });
});
