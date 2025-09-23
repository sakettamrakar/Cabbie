const FALLBACK_CAR_EXAMPLES: Record<string, readonly string[]> = {
  economy: ['Maruti Swift', 'Maruti WagonR'],
  comfort: ['Maruti Swift Dzire', 'Toyota Etios', 'Hyundai Aura'],
  'premium-7-seater': ['Maruti Ertiga'],
  'luxury-7-seater': ['Toyota Innova'],
};

const normalizeCategory = (category?: string) => {
  if (!category) {
    return '';
  }

  return category
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export const getFallbackCarExamples = (category?: string): string[] => {
  const key = normalizeCategory(category);
  if (!key) {
    return [];
  }

  const entries = FALLBACK_CAR_EXAMPLES[key];
  return entries ? [...entries] : [];
};

export const resolveCarExamples = (
  cab: { carExamples?: string[] | null; category?: string } | null | undefined,
): string[] => {
  if (!cab) {
    return [];
  }

  if (cab.carExamples && cab.carExamples.length > 0) {
    return cab.carExamples;
  }

  return getFallbackCarExamples(cab.category);
};

export const __TESTING__ = {
  FALLBACK_CAR_EXAMPLES,
  normalizeCategory,
};
