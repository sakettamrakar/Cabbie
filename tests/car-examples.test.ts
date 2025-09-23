import { getFallbackCarExamples, resolveCarExamples, __TESTING__ } from '../lib/car-examples';

describe('car example fallbacks', () => {
  it('returns predefined entries for normalized categories', () => {
    expect(getFallbackCarExamples('Economy')).toEqual(['Maruti Swift', 'Maruti WagonR']);
    expect(getFallbackCarExamples('Comfort')).toEqual([
      'Maruti Swift Dzire',
      'Toyota Etios',
      'Hyundai Aura',
    ]);
    expect(getFallbackCarExamples('Premium (7-Seater)')).toEqual(['Maruti Ertiga']);
    expect(getFallbackCarExamples('Luxury — 7 seater')).toEqual(['Toyota Innova']);
  });

  it('returns empty list when nothing matches', () => {
    expect(getFallbackCarExamples('Unknown Category')).toEqual([]);
    expect(getFallbackCarExamples(undefined)).toEqual([]);
  });

  it('prefers cab provided examples', () => {
    const cab = {
      category: 'Economy',
      carExamples: ['Existing Example'],
    };

    expect(resolveCarExamples(cab)).toEqual(['Existing Example']);
  });

  it('falls back to mapping when cab examples missing', () => {
    const cab = { category: 'Premium – 7 Seater', carExamples: [] };

    expect(resolveCarExamples(cab)).toEqual(['Maruti Ertiga']);
  });

  it('exposes mapping for snapshot guardrails', () => {
    expect(__TESTING__.FALLBACK_CAR_EXAMPLES).toMatchSnapshot();
  });
});
