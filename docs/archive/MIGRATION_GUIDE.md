# Component Migration Guide

This guide shows how to migrate existing components to use the new design system. Using the BookingForm component as an example, here are the key transformation patterns:

## 1. Inline Styles → Utility Classes

### Before (Inline Styles):
```jsx
// Old approach with inconsistent inline styles
<form style={{ display: 'grid', gap: 10, maxWidth: 400 }}>
  <h2 style={{ marginBottom: 4 }}>Book this Route</h2>
  <input style={{ width: '100%', padding: 10, border: '1px solid #ccc' }} />
  <button style={{ minHeight: 48, fontSize: 16 }}>Submit</button>
</form>
```

### After (Design System Classes):
```jsx
// New approach using consistent utility classes
<form className="form-grid form-container">
  <h2 className="heading-lg mb-xs">Book this Route</h2>
  <input className="form-input" />
  <button className="btn btn-primary btn-lg">Submit</button>
</form>
```

## 2. Form Controls Standardization

### Before (Inconsistent Heights):
```jsx
<input style={{ padding: 10, height: 'auto' }} />  // ~38px actual height
<button style={{ padding: '10px 14px' }} />        // ~40px actual height
```

### After (Consistent Heights):
```jsx
<input className="form-input" />      // Always 44px height
<button className="btn btn-primary">  // Always 48px height
```

## 3. Color System Migration

### Before (Hard-coded Colors):
```jsx
<button style={{
  background: active ? '#064' : '#0a7b83',
  border: active ? '2px solid #032' : '2px solid #055',
  color: '#fff'
}}>
```

### After (Semantic Color Tokens):
```jsx
<button className={`btn btn-outline ${active ? 'btn-active' : ''}`}>
```

## 4. Typography Scale Usage

### Before (Random Font Sizes):
```jsx
<h2 style={{ fontSize: 18 }}>Title</h2>
<small style={{ fontSize: 11 }}>Help text</small>
<div style={{ fontSize: 14 }}>Content</div>
```

### After (Consistent Typography Scale):
```jsx
<h2 className="heading-lg">Title</h2>      <!-- 24px -->
<small className="text-xs">Help text</small>   <!-- 12px -->
<div className="text-sm">Content</div>         <!-- 14px -->
```

## 5. Spacing System Migration

### Before (Random Spacing Values):
```jsx
<div style={{ gap: 8, padding: 10, marginBottom: 4 }}>
<div style={{ padding: '8px 10px', marginTop: 4 }}>
```

### After (Consistent Spacing Scale):
```jsx
<div className="gap-xs p-sm mb-xs">      <!-- 8px, 16px, 4px -->
<div className="p-xs pt-sm mt-xs">       <!-- 8px 16px, 4px -->
```

## 6. Component State Management

### Before (Inline State Styles):
```jsx
<input 
  style={{ 
    color: errors.phone ? '#b00' : 'inherit',
    borderColor: errors.phone ? '#b00' : '#ccc'
  }}
  aria-invalid={errors.phone ? 'true' : undefined}
/>
```

### After (State-aware Classes):
```jsx
<input 
  className={`form-input ${errors.phone ? 'form-input-error' : ''}`}
  aria-invalid={errors.phone ? 'true' : undefined}
/>
```

## 7. Responsive Design Patterns

### Before (Mixed Media Queries):
```jsx
<style jsx>{`
  @media (max-width:480px){
    form { max-width:100%; padding:0 4px; }
  }
`}</style>
```

### After (Consistent Breakpoints):
```jsx
<style jsx>{`
  @media (max-width: 600px) {  /* Use theme breakpoints */
    .form-container {
      max-width: 100%;
      padding: 0 var(--space-xs);
    }
  }
`}</style>
```

## Migration Checklist

When migrating a component, check each of these items:

### ✅ Structure
- [ ] Replace inline `style` props with `className` props
- [ ] Use semantic utility classes instead of arbitrary values
- [ ] Group related styles into component-specific classes

### ✅ Forms
- [ ] All inputs use `form-input` class (44px height)
- [ ] All buttons use `btn` + variant classes (48px height)
- [ ] Form fields use `form-field` wrapper
- [ ] Labels use `form-label` class
- [ ] Help text uses `form-help` class
- [ ] Error states use `form-input-error` and `form-error` classes

### ✅ Typography
- [ ] Headings use `heading-*` classes (xl, lg, md, sm)
- [ ] Text uses `text-*` size classes (xs, sm, base, lg)
- [ ] Font weights use `font-*` classes (normal, medium, semibold, bold)

### ✅ Spacing
- [ ] Margins use `m-*` classes (xs=4px, sm=8px, md=12px, lg=16px, etc.)
- [ ] Padding uses `p-*` classes with same scale
- [ ] Gaps use `gap-*` classes for flexbox/grid layouts

### ✅ Colors
- [ ] Primary actions use `btn-primary` or `text-primary`
- [ ] Secondary actions use `btn-secondary` or `text-secondary` 
- [ ] Success states use `text-success` or `bg-success`
- [ ] Error states use `text-error` or `bg-error`
- [ ] Neutral content uses `text-neutral-*` scale

### ✅ Layout
- [ ] Flex layouts use `flex`, `align-*`, `justify-*` utilities
- [ ] Grid layouts use consistent gap values
- [ ] Responsive classes target proper breakpoints

### ✅ Accessibility
- [ ] Focus indicators work properly (automatic with new system)
- [ ] Color contrast meets 4.5:1 minimum (built into color system)
- [ ] Touch targets are 44px minimum (built into form controls)

## Performance Benefits

The new system provides several performance benefits:

1. **Reduced CSS Bundle Size**: Utility classes are reused across components
2. **Better Caching**: Theme CSS is loaded once and cached
3. **Eliminated Inline Styles**: No style recalculation on re-renders
4. **CSS Custom Properties**: Efficient theme switching capability

## Next Steps

1. **Start with Form Components**: These benefit most from standardization
2. **Update Global Components**: Header, footer, navigation first  
3. **Migrate Page-Specific Styles**: Convert page layouts
4. **Test Responsive Behavior**: Ensure consistency across breakpoints
5. **Validate Accessibility**: Run axe-core tests after migration

## Common Patterns Reference

```jsx
// Container layouts
<div className="container">              // Max-width container
<div className="flex gap-md">            // Horizontal layout
<div className="grid gap-sm">            // Grid layout

// Typography hierarchy  
<h1 className="heading-xl">              // 48px heading
<h2 className="heading-lg">              // 24px heading
<p className="text-base">                // 16px body text
<small className="text-sm">              // 14px small text

// Interactive elements
<button className="btn btn-primary">     // Primary action
<button className="btn btn-secondary">   // Secondary action  
<input className="form-input">           // Standard input
<select className="form-select">         // Standard select

// State variants
<div className="error">                  // Error state
<div className="success">                // Success state
<div className="loading">                // Loading state
```

This migration approach ensures consistent design while maintaining the flexibility needed for component-specific customization.
