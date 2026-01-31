<!-- version-type: minor -->
# @furystack/shades

## ✨ Features

### CSS Property for Component-Level Styling

Added a new `css` property to `Shade()` components that enables defining component-level styles with support for pseudo-selectors and nested selectors. This provides a cleaner alternative to using `useState` for hover/focus states.

**Key benefits:**

- Define `:hover`, `:active`, `:focus`, and `:disabled` states declaratively
- Support for nested selectors (e.g., `& .className`, `& > div`)
- Styles are injected as a shared stylesheet, reducing DOM overhead
- Type-safe with the new `CSSObject` type

**Usage:**

```typescript
const Button = Shade({
  shadowDomName: 'my-button',
  css: {
    padding: '12px 24px',
    backgroundColor: 'blue',
    cursor: 'pointer',
    '&:hover': { backgroundColor: 'darkblue' },
    '&:disabled': { opacity: '0.5', cursor: 'not-allowed' },
    '& .icon': { marginRight: '8px' }
  },
  render: ({ children }) => <button>{children}</button>
})
```

- Added `CSSObject` type - type definition for CSS styles with nested selector support
- Added `StyleManager` - singleton that manages CSS injection and deduplication for components
- Added `generateCSS()` - utility function to convert `CSSObject` to CSS strings
- Extended support for customized built-in elements (e.g., `a[is="my-link"]` selectors)

## 📚 Documentation

- Updated README with documentation for the new `css` property and styling patterns

## 🧪 Tests

- Added tests for `generateCSS()` covering camelCase conversion, pseudo-selectors, and nested selectors
- Added tests for `StyleManager` covering component registration, deduplication, and customized built-in elements
