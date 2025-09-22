export function toTitleCase(label: string): string {
  if (!label) return '';

  return label
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase());
}
