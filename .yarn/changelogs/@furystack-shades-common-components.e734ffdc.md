<!-- version-type: major -->

# @furystack/shades-common-components

## 💥 Breaking Changes

### Added Contrast Colors to ColorVariants

The `ColorVariants` type now requires contrast color properties for accessible text on colored backgrounds. This affects any code that defines custom themes or palette colors.

**New required properties:**

- `lightContrast` - Text color for the `light` variant background
- `mainContrast` - Text color for the `main` variant background
- `darkContrast` - Text color for the `dark` variant background

**Migration:**

```typescript
// Before
const myPalette: Palette = {
  primary: {
    light: '#6573c3',
    main: '#3f51b5',
    dark: '#2c387e',
  },
  // ...
}

// After
const myPalette: Palette = {
  primary: {
    light: '#6573c3',
    lightContrast: '#ffffff',
    main: '#3f51b5',
    mainContrast: '#ffffff',
    dark: '#2c387e',
    darkContrast: '#ffffff',
  },
  // ...
}
```

## ♻️ Refactoring

### Migrated Components to CSS Property

Refactored all components to use the new `css` property from `@furystack/shades` instead of inline styles and `useState` for CSS states. This provides cleaner code, better separation of concerns, and improved performance.

**Refactored components:**

- `Button` - uses `css` for hover/active/disabled states and variant styles via data attributes
- `AppBar` and `AppBarLink` - moved layout and hover styles to `css`
- `Avatar` - moved styling to `css` with support for customizable border radius
- `CommandPalette`, `CommandPaletteInput`, `CommandPaletteSuggestionList` - consolidated styles into `css`
- `DataGrid`, `DataGridRow`, `DataGridHeader`, `DataGridFooter`, `SelectionCell` - migrated grid styling to `css`
- `FAB` (Floating Action Button) - moved positioning and hover effects to `css`
- `Grid` - moved responsive grid styling to `css`
- `Input` and `TextArea` - migrated input styling and focus states to `css`
- `Loader` - minor style cleanup
- `Modal` - moved backdrop and content container styles to `css`
- `NotyList` - migrated notification styling to `css`
- `Paper` - moved card styling to `css`
- `Skeleton` - minor style cleanup
- `Suggest`, `SuggestInput`, `SuggestionList` - consolidated autocomplete styling into `css`
- `Tabs` - moved tab styling and active states to `css`
- `Wizard` - moved wizard container styles to `css`
