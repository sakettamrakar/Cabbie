# Frontend & Design Style Guide

This guide consolidates UI conventions, CSS tokens, component patterns, and accessibility requirements. It draws from `styles/theme.css`, `styles/global.css`, and the canonical React components under `components/`.

## 1. Design Tokens

Defined in [`styles/theme.css`](../styles/theme.css). Use the CSS custom properties instead of hard-coded values.

| Category | Tokens | Notes |
| --- | --- | --- |
| Colors | `--color-primary-*`, `--color-secondary-*`, `--color-gray-*`, `--color-success`, `--color-error`, `--color-bg-*`, `--color-text-*` | Primary palette aligns with Tailwind `blue-500` / `green-500`. Text defaults to `--color-text-primary`. |
| Typography | `--font-family-sans`, `--font-size-{xs..6xl}`, `--font-weight-{light..extrabold}`, `--line-height-*` | Base font size 16px; scale factor 1.25. |
| Spacing | `--space-{1..24}` | Use for padding/margins in CSS modules or inline styles. |
| Borders & Radius | `--border-width-*`, `--border-radius-*` | Buttons default to `--border-radius-md`. |
| Shadows | `--shadow-{sm..2xl}` | Apply via `box-shadow: var(--shadow-sm)` etc. |
| Z-index | `--z-{dropdown,sticky,fixed,modal,tooltip}` | Keeps stacking contexts consistent. |

## 2. Global Layout

- `styles/global.css` imports the theme and applies normalized focus states (`outline: 3px solid var(--color-primary-600)` on focusable elements).
- Layout containers (`.content`, `.siteHeader`, `.siteFooter`) use max-width 1280px with responsive padding.
- Buttons adopt `.btn`, `.btn-primary`, `.btn-secondary` classes defined in component-level styles (see `components/ModernBookingWidget.tsx`).

## 3. Component Guidelines

### 3.1 File Structure

- Prefer `.tsx` files. `.jsx` files exist for legacy compatibility but should not receive new features.
- Co-locate styles using Tailwind classes or inline CSS variables. Avoid separate `.scss` files.
- Keep components presentational unless they encapsulate a reusable hook or behavior.

### 3.2 Forms & Inputs

- Inputs, selects, and textareas should use the global styles defined in `styles/global.css` (min height 44px, accessible focus rings).
- Include `aria-invalid` when showing validation errors. Pair with `.error-msg` class for consistent red text.
- For phone numbers, reuse `validatePhoneNumber` from `lib/validate.ts` to normalize values before submission.

### 3.3 Buttons

- Primary action: `btn btn-primary btn-xl` (see `ModernBookingWidget`).
- Secondary/link buttons can use `btn btn-ghost` or simple anchor tags with focus outlines.
- Ensure icons in buttons include `aria-hidden="true"` unless they convey standalone meaning.

### 3.4 Cards & Lists

- Fare cards (`components/FareCard.tsx`) demonstrate standard spacing, shadow, and typography. Use them as reference for new card layouts.
- FAQ lists rely on definition lists `<dl>`; follow the semantics for SEO and accessibility.

### 3.5 Search Experience

- `<SearchResults />` is a client component that uses Tailwind utility classes (`grid`, `gap-*`, `text-neutral-*`). Stick to Tailwind-compatible class names for consistency.
- Filters should update via `use-search-results` hook to keep business logic centralized.

## 4. Accessibility

- All interactive elements must be reachable via keyboard (`tabindex` not negative unless intentionally removed).
- Provide visible focus states (already defined globally). Do not remove outlines without replacing them.
- Use semantic HTML (e.g., `<header>`, `<main>`, `<section>`). Booking confirmation pages should announce success using `<h1>`/`<p>` combos.
- Ensure color contrast meets WCAG AA. Run `npm run axe:contrast` after significant visual changes.
- For dynamic regions (e.g., loading states), use `aria-live="polite"` or skeleton loaders as implemented in `SearchResults`.

## 5. Internationalization & Copy

- Strings are currently English-first. `lib/i18n.ts` reads `ENABLE_HI_LOCALE` to enable Hindi content; ensure new strings run through helper functions when you add localization support.
- Use template literals that default to `BRAND_NAME` from environment variables for dynamic copy (see `pages/index.js`).

## 6. Media & Images

- Use the `<SmartImage />` component for optimized images with lazy loading and fallback placeholders.
- Asset files belong in `public/` with descriptive names (`hero-city.jpg`, `logo.svg`). Reference them via `/hero-city.jpg`.
- Respect aspect ratios defined in the component; avoid inline height overrides that could cause CLS regressions.

## 7. Responsive Breakpoints

- Tailwind-style breakpoints: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px (mirrors theme tokens).
- Use CSS Grid/Flexbox for layout. Avoid fixed pixel widths unless necessary.
- Mobile first: define base styles, then upscale using media queries or Tailwind classes (`md:flex-row`).

## 8. Theming Extensions

- To add a new brand theme, extend `:root` variables in `styles/theme.css` and override specific values under `[data-theme="new"]` selectors if necessary.
- Avoid duplicating entire CSS files; use custom properties to keep themes lightweight.

## 9. Performance Considerations

- Avoid heavy client-side libraries. Most utilities should live in `lib/` and be tree-shakeable.
- Memoize expensive computations (`useMemo`, `useCallback`) in client components (as seen in `SearchResults` filters).
- Lazy load non-critical sections if they significantly increase bundle size.

## 10. Linting & Formatting

- ESLint + TypeScript rules apply (`@typescript-eslint`, `eslint-config-next`). Run `npx eslint . --ext .ts,.tsx` before committing UI changes.
- Follow the existing Prettier formatting (2-space indent in JSON, default formatting in TSX).
- Favor descriptive prop names (`pickupDateTime` instead of `date`), and document optional props via TypeScript interfaces.

## 11. Accessibility Checklist Before Merge

- [ ] Tab through the affected page; ensure the flow is logical.
- [ ] Screen-reader-friendly labels (`aria-label`, `<label for>` pairs).
- [ ] Color contrast validated via `npm run axe:contrast`.
- [ ] Heading structure remains hierarchical (`h1` → `h2` → `h3`).
- [ ] Any new animations respect `prefers-reduced-motion`.

Keep this guide updated whenever we introduce new design tokens, components, or layout primitives.
