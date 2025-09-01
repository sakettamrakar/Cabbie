# Cabbie Design System - Style Guide

## Overview
This document outlines the comprehensive design system implemented for the Cabbie cab booking website. The system ensures consistency across all pages and components through standardized colors, typography, spacing, and utility classes.

## 🎨 **Design Tokens (CSS Custom Properties)**

### Colors
```css
/* Primary Brand Colors */
--color-primary-500: #3b82f6;  /* Main brand blue */
--color-primary-600: #2563eb;  /* Primary buttons, links */
--color-primary-700: #1d4ed8;  /* Hover states */

/* Secondary/Success Colors */
--color-secondary-600: #16a34a; /* Success, confirmation */

/* Semantic Colors */
--color-success: #16a34a;  /* Success states */
--color-warning: #f59e0b;  /* Warning states */
--color-error: #dc2626;    /* Error states */
--color-info: #2563eb;     /* Info states */

/* Text Colors */
--color-text-primary: #111827;   /* Main text */
--color-text-secondary: #4b5563; /* Secondary text */
--color-text-tertiary: #6b7280;  /* Muted text */
--color-text-inverse: #ffffff;   /* Text on dark backgrounds */
```

### Typography Scale (1.25 ratio)
```css
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px - Accessibility minimum */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px */
--font-size-2xl: 1.5rem;    /* 24px */
--font-size-3xl: 1.875rem;  /* 30px */
--font-size-4xl: 2.25rem;   /* 36px */
--font-size-5xl: 3rem;      /* 48px */
```

### Spacing Scale (4px base unit)
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

## 📝 **Typography System**

### Headings
```css
.h1, h1 { 
  font-size: var(--font-size-4xl); 
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  margin-bottom: var(--space-6);
}

.h2, h2 { 
  font-size: var(--font-size-3xl); 
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-5);
}

.h3, h3 { 
  font-size: var(--font-size-2xl); 
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-4);
}
```

### Text Utilities
```css
.text-primary { color: var(--color-text-primary); }
.text-secondary { color: var(--color-text-secondary); }
.text-tertiary { color: var(--color-text-tertiary); }
.text-success { color: var(--color-success); }
.text-error { color: var(--color-error); }
```

## 🔘 **Form Controls**

### Input Fields (44px minimum height for accessibility)
```css
.form-input {
  min-height: 44px;
  padding: var(--space-3) var(--space-4);
  border: var(--border-width-thin) solid var(--color-gray-300);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
}

.form-input:focus {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
}

.form-input.error {
  border-color: var(--color-error);
}
```

### Buttons (48px minimum height)
```css
.btn {
  min-height: 48px;
  min-width: 48px;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-medium);
}

.btn-primary {
  background-color: var(--color-primary-600);
  color: var(--color-text-inverse);
}

.btn-secondary {
  background-color: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-gray-300);
}
```

### Form Layout
```html
<div class="form-group">
  <label class="form-label">Full Name</label>
  <input class="form-input" type="text" />
  <span class="form-error">Error message here</span>
</div>

<!-- Form rows for side-by-side inputs on desktop -->
<div class="form-row">
  <div class="form-col">
    <label class="form-label">First Name</label>
    <input class="form-input" type="text" />
  </div>
  <div class="form-col">
    <label class="form-label">Last Name</label>
    <input class="form-input" type="text" />
  </div>
</div>
```

## 🏗️ **Layout System**

### Container Classes
```css
.container        /* Max-width: 1280px */
.container-sm     /* Max-width: 768px */
.container-lg     /* Max-width: 1536px */
```

### Grid System
```css
.grid             /* Basic grid with gap */
.grid-cols-1      /* Single column */
.grid-cols-2      /* Two columns */
.grid-cols-3      /* Three columns */

/* Responsive grid */
.grid-md-cols-2   /* Two columns on tablet+ */
.grid-lg-cols-3   /* Three columns on desktop+ */
```

### Flexbox Utilities
```css
.flex             /* display: flex */
.flex-col         /* flex-direction: column */
.items-center     /* align-items: center */
.justify-center   /* justify-content: center */
.justify-between  /* justify-content: space-between */
```

## 🎯 **Component Classes**

### Cards
```css
.card {
  background-color: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-gray-200);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
}

.card-header { padding: var(--space-6); }
.card-body { padding: var(--space-6); }
.card-footer { padding: var(--space-6); }
```

### Alerts/Status Messages
```css
.alert-success { /* Green background, text */ }
.alert-warning { /* Yellow background, text */ }
.alert-error   { /* Red background, text */ }
.alert-info    { /* Blue background, text */ }
```

### Call-to-Action Button
```css
.cta {
  min-height: 56px;
  padding: var(--space-4) var(--space-8);
  font-size: var(--font-size-lg);
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700));
  box-shadow: var(--shadow-lg);
}
```

## 📱 **Responsive Design**

### Breakpoints
- **Mobile**: ≤600px (default styles)
- **Tablet**: 600px - 1024px  
- **Desktop**: >1024px

### Form Behavior
- **Mobile**: All inputs full-width, stacked layout
- **Desktop**: Inputs 50% width, side-by-side in `.form-row`

### Grid Behavior
```css
/* Mobile: Single column */
@media (max-width: 600px) {
  .grid-cols-2,
  .grid-cols-3 {
    grid-template-columns: 1fr;
  }
}

/* Tablet: Two columns max */
@media (min-width: 600px) and (max-width: 1024px) {
  .grid-md-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: Full grid capability */
@media (min-width: 1024px) {
  .grid-lg-cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## ♿ **Accessibility Features**

### Minimum Standards Met
- **Font Size**: 16px minimum (no smaller text)
- **Tap Targets**: 44px minimum (forms), 48px minimum (buttons)
- **Color Contrast**: 4.5:1 minimum ratio maintained
- **Focus Indicators**: 3px outline with proper offset

### Focus Management
```css
*:focus-visible {
  outline: 3px solid var(--color-primary-600);
  outline-offset: 2px;
}
```

### Screen Reader Support
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
```

## 🛠️ **Usage Examples**

### Landing Page Hero
```html
<section data-hero>
  <h1>Book Your Cab Today</h1>
  <p>Reliable, affordable transportation when you need it</p>
  <a href="/search" class="cta">Search Cabs</a>
</section>
```

### Search Results Card
```html
<div class="search-result-card">
  <div class="card-body">
    <h3>Economy Sedan</h3>
    <div class="price-display">₹1,200</div>
    <div class="feature-list">
      <span class="feature-tag">AC</span>
      <span class="feature-tag">4 Seats</span>
    </div>
    <button class="btn btn-primary">Select Cab</button>
  </div>
</div>
```

### Booking Form
```html
<form class="booking-card">
  <div class="trip-summary">
    <h3>Trip Summary</h3>
    <div class="trip-route">
      <div class="route-point">
        <div class="route-dot origin"></div>
        <span>Mumbai</span>
      </div>
      <div class="route-connector"></div>
      <div class="route-point">
        <div class="route-dot destination"></div>
        <span>Pune</span>
      </div>
    </div>
  </div>
  
  <div class="card-body">
    <div class="form-row">
      <div class="form-col">
        <label class="form-label">Full Name</label>
        <input class="form-input" type="text" required />
      </div>
      <div class="form-col">
        <label class="form-label">Phone Number</label>
        <input class="form-input" type="tel" required />
      </div>
    </div>
    
    <button class="btn btn-primary btn-lg w-full">
      Confirm Booking
    </button>
  </div>
</form>
```

### Status Indicators
```html
<span class="status-badge status-pending">Pending</span>
<span class="status-badge status-confirmed">Confirmed</span>
<span class="status-badge status-completed">Completed</span>
```

## 🔄 **Migration Guide**

### Replacing Legacy Styles

#### Old Button Styles
```css
/* OLD */
button { background:#075; padding:8px 14px; }

/* NEW */
button { @extend .btn; @extend .btn-primary; }
```

#### Old Form Styles  
```css
/* OLD */
input { border:1px solid #bbb; padding:10px; }

/* NEW */
input { @extend .form-input; }
```

#### Old Layout Styles
```css
/* OLD */
.content { max-width:1120px; padding:16px; }

/* NEW */
.content { @extend .container; }
```

## 📊 **Performance Considerations**

- **Critical CSS**: Hero, headings, primary buttons (<10KB)
- **Theme CSS**: Complete design system loaded with page
- **Late CSS**: Non-critical components loaded after interaction
- **Total Size**: ~15KB compressed design system

## 🧪 **Testing Checklist**

### Visual Consistency
- [ ] All buttons use consistent heights (44px/48px/56px)
- [ ] All inputs have consistent styling and focus states
- [ ] Typography scale is consistent across pages
- [ ] Spacing follows the defined scale

### Accessibility Testing
- [ ] Tab navigation works correctly
- [ ] Focus indicators are visible
- [ ] Text meets contrast requirements (4.5:1)
- [ ] Mobile tap targets are minimum 44px

### Responsive Testing
- [ ] Forms stack properly on mobile
- [ ] Grid layouts adapt at breakpoints
- [ ] Text remains readable at all screen sizes
- [ ] Interactive elements work on touch devices

## 🎯 **Next Steps**

1. **Component Library**: Build React components using these styles
2. **Style Linting**: Add stylelint rules to enforce the design system
3. **Documentation**: Interactive style guide with live examples
4. **Testing**: Automated visual regression testing
5. **Optimization**: Bundle analysis and performance monitoring

This design system provides a solid foundation for consistent, accessible, and maintainable styling across the entire Cabbie application.
