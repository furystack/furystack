# Changelog

## [15.0.1] - 2026-03-19

### ✨ Features

- Added `navSection` prop to `Accordion`, `DataGrid`, `List`, and `Tree` for spatial‑navigation scoping.
- Added `trapFocus` and `navSection` props to `Modal` and `Dialog`, plus focusable behaviour for `Chip` and `Image` when interactive.
- Introduced `focusOutline` theme variable and `injectFocusVisibleStyles()` helper; added focus coordination to DataGrid/List/Tree and semantics improvements across components.

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0

### 💥 Breaking Changes

- Removed arrow‑key and Tab handlers from `ListService`/`CollectionService`/`TreeService`; spatial navigation now handles boundaries.
- `AccordionItem` header changed to a native `<button disabled>`; custom CSS selectors must be updated.
- Themes must supply a `focusOutline` value; various behavioural changes to keyboard handling detailed in package changelog.

## [15.0.0] - 2026-03-10

### ✨ Features

- Added `navSection` prop to `Accordion`, `DataGrid`, `List`, and `Tree` — sets a `data-nav-section` attribute so `SpatialNavigationService` constrains arrow-key navigation within the component (auto-generated per instance when not provided)
- Added `trapFocus` and `navSection` props to `Modal` — when `trapFocus` is true, spatial navigation is locked within the modal's bounds until it closes
- Added `trapFocus` (defaults to `true`) and `navSection` props to `Dialog` — forwarded to the underlying `Modal` component
- Made `Chip` focusable when clickable (including delete button) for spatial/keyboard navigation
- Made `Image` focusable when `preview={true}` and activatable with Enter/Space for spatial/keyboard navigation
- Added `focusOutline` to the `ActionColors` theme type and `cssVariableTheme` — provides a dedicated CSS variable (`--shades-theme-action-focus-outline`) for keyboard/spatial focus indicators
- Added `injectFocusVisibleStyles()` helper that injects global `:focus-visible` / `:focus:not(:focus-visible)` styles using the theme's `focusOutline` variable
- Added `focusOutline` values to all built-in themes
- Added focus coordination to `DataGrid`, `List`, and `Tree` — `focusin`/`focusout` DOM events now sync `hasFocus` and `focusedEntry`/`focusedItem` state, replacing previous click-based focus management
- Added `data-nav-section="content"` to `PageLayout` main content area for spatial navigation scoping
- Added `:focus-visible` styles to `MarkdownDisplay` code blocks and links using the theme's `focusOutline` variable
- Made `MarkdownDisplay` code blocks focusable (`tabIndex={0}`) for keyboard navigation

### 💥 Breaking Changes

- Removed `ArrowUp`/`ArrowDown` handlers from `ListService` — arrow-key navigation is now fully delegated to `SpatialNavigationService`
- Changed `ArrowUp`/`ArrowDown` handlers in `CollectionService` — they no longer unconditionally `preventDefault()`, only intercepting when there is a valid adjacent entry to move to, allowing `SpatialNavigationService` to handle boundary navigation
- Removed `Tab` handler from `CollectionService` and `ListService` — focus management now uses native `focusin`/`focusout`
- `TreeService` `ArrowRight` on an expanded node no longer focuses the first child — delegated to spatial navigation
- `ActionColors` type now requires a `focusOutline` property — all custom themes must include this value
- `CommandPalette` and `Suggest` keyboard handling changed from `onkeyup` to `onkeydown` — arrow key navigation within the suggestion list now only activates when suggestions are open
- Scroll-to-focused-item behavior changed from `smooth` to `instant` in `List`, `DataGrid`, and `Tree` — keyboard navigation no longer animates scrolling
- `AccordionItem` header changed from `<div role="button" data-disabled>` to a native `<button disabled>` — consumers with CSS targeting `.accordion-header[data-disabled]` must update to `.accordion-header:disabled` or the host's `[data-disabled]`
  **Custom themes** must add `focusOutline` to the `action` object:
  hoverBackground: '...',
  focusRing: '0 0 0 3px ...',
  hoverBackground: '...',
  focusRing: '0 0 0 3px ...',
  focusOutline: '2px solid #3f51b5', // your theme's accent color
  **ArrowUp/ArrowDown/Tab removal from CollectionService, ListService, and TreeService:**
  **CommandPalette and Suggest `onkeyup` → `onkeydown`/`oninput`:**

### 🐛 Bug Fixes

- Added `outline: 'none'` to `AccordionItem`, `Checkbox`, `Radio`, `Slider`, and `Switch` `:focus-visible` styles to prevent double focus rings when using the global `focusOutline`

### 🧪 Tests

- Added tests for `DataGrid` focus coordination and `navSection` attribute
- Added tests for `List` focus coordination behavior
- Added tests for `Modal` `trapFocus` and `navSection` behavior
- Updated `CollectionService`, `ListService`, and `TreeService` tests to verify arrow keys are no longer handled

### ⬆️ Dependencies

- Updated `@furystack/core` dependency to the new major version

## [14.0.0] - 2026-03-07

### ⬆️ Dependencies

- Updated internal FuryStack dependencies
- Updated `@furystack/shades` dependency

### 💥 Breaking Changes

### `shadowDomName` renamed to `customElementName`

All components now use `customElementName` instead of `shadowDomName`, following the upstream `@furystack/shades` rename.

### `CircularProgress` and `LinearProgress` `value` prop changed from `ObservableValue<number>` to `number`

The `value` prop on `CircularProgress` and `LinearProgress` no longer accepts an `ObservableValue<number>`. Pass a plain `number` instead and use `useObservable` at the call site to reactively update the value.

**Examples:**

```typescript
// ❌ Before
<CircularProgress value={progressObservable} variant="determinate" />

// ✅ After
const [progress] = useObservable('progress', progressObservable)
<CircularProgress value={progress} variant="determinate" />
```

### `DataGrid`, `DataGridHeader`, `DataGridFooter`, and filter components: `findOptions` changed from `ObservableValue` to plain value with `onFindOptionsChange` callback

The `findOptions` prop on `DataGrid`, `DataGridHeader`, `DataGridFooter`, `OrderButton`, and all filter components (`StringFilter`, `NumberFilter`, `BooleanFilter`, `DateFilter`, `EnumFilter`) no longer accepts an `ObservableValue<FindOptions>`. Pass a plain `FindOptions` object along with a new `onFindOptionsChange` callback to handle state updates.

**Examples:**

```typescript
// ❌ Before
const findOptions = new ObservableValue({ top: 10, skip: 0 })
<DataGrid findOptions={findOptions} ... />

// ✅ After
const [findOptions, setFindOptions] = useObservable('findOptions', findOptionsObservable)
<DataGrid
  findOptions={findOptions}
  onFindOptionsChange={setFindOptions}
  ...
/>
```

**Impact:** All consumers of `DataGrid` and its sub-components must be updated to provide `findOptions` as a plain object and supply the `onFindOptionsChange` callback.

### 📚 Documentation

- Updated README examples to use `customElementName` and the new `onFindOptionsChange` pattern

### 🧪 Tests

- Updated all component tests to use `customElementName` and the new prop signatures

## [13.5.0] - 2026-03-06

### ✨ Features

### Contained mode for `PageLayout`

Added a `contained` prop to `PageLayout` that uses `position: absolute` instead of `position: fixed`, allowing the layout to fill its nearest positioned ancestor rather than the viewport. This enables nesting multiple `PageLayout` instances on the same page (e.g. in a showcase grid or dashboard).

**Usage:**

```tsx
<div style={{ position: 'relative', height: '400px' }}>
  <PageLayout contained appBar={{ variant: 'permanent', component: <MyAppBar /> }}>
    <div>Scoped content</div>
  </PageLayout>
</div>
```

### ♻️ Refactoring

- Scoped `PageLayout` internal CSS selectors to direct children (`> * >`) to prevent styles from bleeding into nested `PageLayout` instances
- `PageContainer` now uses theme spacing tokens (`cssVariableTheme.spacing.md`) for default `padding` and `gap` instead of hardcoded pixel values

### 🧪 Tests

- Added unit tests for `PageLayout` contained mode covering data attribute binding, absolute positioning, drawer toggle, and backdrop click behavior

## [13.4.1] - 2026-03-06

### 🐛 Bug Fixes

- Fixed duplicated content on re-render in `Alert` and `Result` components caused by reusing module-level JSX element constants across renders. Default icons are now created via factory functions (`getDefaultIcon()`) that return fresh elements per render call.
- Updated `Result` exports: renamed `resultDefaultIcons` to `resultGetDefaultIcon` (factory function) and added `resultDefaultIconDefs` (icon definition map)

### 🧪 Tests

- Refactored `CacheView` tests to use `using()` / `usingAsync()` wrappers for `Cache` disposal, ensuring proper cleanup even if assertions fail

### 🔧 Chores

- Added `eslint-disable` comments for intentional `no-css-state-hooks` usage in `Input` (focused state) and `Select` (isFocused state) components where CSS state management via `useState` is the intended pattern

## [13.4.0] - 2026-03-05

### ✨ Features

- Added `viewTransition` prop to `Tabs` — animates tab panel switches via the View Transition API when the active tab changes
- Added `viewTransition` prop to `Wizard` — animates step transitions (next/prev) via the View Transition API
- Added `viewTransition` prop to `CacheView` — animates state category changes (loading → value, value → error, etc.) via the View Transition API

### 🧪 Tests

- Added tests for `Tabs` verifying `startViewTransition` is called on tab switch when enabled and skipped when not set
- Added tests for `Wizard` verifying `startViewTransition` is called on next/prev navigation when enabled and skipped when not set
- Added tests for `CacheView` verifying `startViewTransition` is called on state category changes when enabled and skipped when not set

### ⬆️ Dependencies

- Updated `@furystack/shades` peer dependency

## [13.3.1] - 2026-03-04

### ⬆️ Dependencies

- Updated `@furystack/shades` dependency with nested router metadata support

### 🧪 Tests

- Added regression test for the Drawer component verifying that ghost renders during disposal do not re-add cleared drawer state to `LayoutService`

## [13.3.0] - 2026-03-03

### 🗑️ Deprecated

- `CollectionServiceOptions.onRowClick` — use `subscribe('onRowClick', ...)` on the `CollectionService` instance instead
- `CollectionServiceOptions.onRowDoubleClick` — use `subscribe('onRowDoubleClick', ...)` on the `CollectionService` instance instead

### ♻️ Refactoring

- `CollectionService` now extends `EventHub` and routes row click/double-click through `onRowClick` and `onRowDoubleClick` events, enabling multiple subscribers

### 🧪 Tests

- Added tests for `onRowClick` and `onRowDoubleClick` event emission

### ⬆️ Dependencies

- Updated `@furystack/shades` with transitive dependency fixes

## [13.2.0] - 2026-02-28

### ✨ Features

- `useThemeCssVariables()` and `ThemeProviderService.setAssignedTheme()` now accept an optional `root` parameter to scope CSS variables to a specific element instead of `:root`

### 💥 Theme Type Changes

Several previously optional fields on the `Theme` type are now **required**. Any code that creates a `Theme` object and omits these fields will need to provide explicit values:

| Type              | Field           | Default value to use  |
| ----------------- | --------------- | --------------------- |
| `Background`      | `paperImage`    | `'none'`              |
| `Shape`           | `borderWidth`   | `'0px'`               |
| `ThemeTypography` | `letterSpacing` | _(full scale object)_ |
| `ThemeTypography` | `textShadow`    | `'none'`              |
| `Theme`           | `zIndex`        | _(full object)_       |
| `Theme`           | `effects`       | _(full object)_       |

> **Note:** Most consumer code uses `DeepPartial<Theme>` (e.g. `setAssignedTheme()`) and is **not affected**.
> Only code that implements the full `Theme` interface directly needs to be updated.

### 🐛 Bug Fixes

- Fixed stale drawer state persisting in `LayoutService` after a `Drawer` component is unmounted, which could cause incorrect content margins when navigating between views
- Added `removeDrawer()` method to `LayoutService` to clean up drawer configuration and reset associated CSS variables
- Fixed `AppBar` `backdrop-filter` creating a CSS containing block that broke `position:fixed` descendants (e.g. `Dropdown` overlays); moved the effect to a `::before` pseudo-element

### ♻️ Refactoring

- Simplified `CommandPaletteInput` by removing width animation; component is now always full-width with focus/clear on open/close
- Changed `Avatar` fallback icon to use percentage-based sizing with an inline SVG instead of the `Icon` component for better scaling at different sizes

### 🧪 Tests

- Added tests for `removeDrawer()` covering left/right removal, isolation between drawers, no-op on missing drawer, and CSS variable reset
- Added test for `initDrawer()` overwriting an existing drawer configuration
- Added integration tests for `Drawer` component disposal cleanup

## [13.1.0] - 2026-02-28

### ✨ Features

### `contentProps` support for `CacheView`

`CacheView` now accepts a `contentProps` prop to forward additional type-safe props to the content component beyond `data`. The `CacheViewProps` type gained a third generic parameter `TContentProps` that constrains the content component's full props shape. When the content component requires extra props (excluding `data` and HTML element attributes), `contentProps` becomes required; otherwise it can be omitted.

**Usage:**

```tsx
const MyContent = Shade<{ data: CacheWithValue<User>; label: string }>({
  shadowDomName: 'my-content',
  render: ({ props }) => <div>{props.label}: {props.data.value.name}</div>,
})

<CacheView
  cache={userCache}
  args={[userId]}
  content={MyContent}
  contentProps={{ label: 'User' }}
/>
```

### 🧪 Tests

- Added tests for `contentProps` forwarding to the content component

## [13.0.1] - 2026-02-26

### ⬆️ Dependencies

- Updated internal `@furystack/*` dependencies
- Bumped due to updated workspace dependencies

## [13.0.0] - 2026-02-26

### 💥 Breaking Changes

### `getTextColor()` and `getRgbFromColorString()` removed from `ThemeProviderService`

The `getTextColor()` and `getRgbFromColorString()` instance methods have been removed from `ThemeProviderService`. They are now standalone functions exported from their own modules.

**Examples:**

```typescript
// ❌ Before
import { ThemeProviderService } from '@furystack/shades-common-components'
const themeProvider = injector.getInstance(ThemeProviderService)
const textColor = themeProvider.getTextColor('#ff0000')
const rgb = themeProvider.getRgbFromColorString('#3f51b5')

// ✅ After
import { getTextColor, getRgbFromColorString } from '@furystack/shades-common-components'
const textColor = getTextColor('#ff0000')
const rgb = getRgbFromColorString('#3f51b5')
```

**Impact:** All callers that accessed these methods via a `ThemeProviderService` instance must switch to the standalone function imports.

### `RgbColor` class moved to its own module

The `RgbColor` class is no longer exported from `theme-provider-service.ts`. It is now in its own `rgb-color.ts` module, re-exported through the package barrel.

If you imported `RgbColor` from the package entry point, no change is needed. If you imported directly from `theme-provider-service.js`, update the import path:

```typescript
// ❌ Before
import { RgbColor } from '@furystack/shades-common-components/services/theme-provider-service.js'

// ✅ After
import { RgbColor } from '@furystack/shades-common-components'
// or
import { RgbColor } from '@furystack/shades-common-components/services/rgb-color.js'
```

### ✨ Features

### Standalone Color Utilities

Extracted `getRgbFromColorString()` and `getTextColor()` as standalone pure functions, making them usable without a `ThemeProviderService` instance. The new `getRgbFromColorString()` also adds support for `rgb()` syntax and common CSS named colors (e.g. `red`, `dodgerblue`, `white`), in addition to the previously supported `#hex` and `rgba()` formats.

### 17 New Themes

Added a collection of pop-culture-inspired themes, each with its own color palette and visual style:

- `architectTheme` - Matrix-inspired with digital green on black, monospace typography, and a digital rain paper background
- `auditoreTheme` - Assassin's Creed-inspired with warm historical tones
- `blackMesaTheme` - Half-Life-inspired with HEV-suit Lambda orange on dark industrial backgrounds and hazard-stripe textures
- `chieftainTheme` - Warcraft 1 Orc-inspired with dark brown wood backgrounds and crimson accents
- `dragonbornTheme` - Skyrim-inspired with nordic fantasy colors
- `hawkinsTheme` - Stranger Things-inspired with warm dark backgrounds, CRT scanline pattern, Christmas-light red accents, and retro rounded typography
- `jediTheme` - Star Wars Jedi Order-inspired light theme with warm parchment backgrounds and lightsaber-blue accents
- `neonRunnerTheme` - Cyberpunk-inspired with neon accents on dark backgrounds
- `paladinTheme` - Warcraft 1 Human-inspired with cold stone backgrounds and gold accents
- `plumberTheme` - Mario-inspired with playful primary colors
- `replicantTheme` - Blade Runner-inspired with noir cyberpunk aesthetics
- `sandwormTheme` - Dune-inspired with desert earth tones
- `shadowBrokerTheme` - Mass Effect-inspired with sci-fi blue tones
- `sithTheme` - Star Wars Sith Order-inspired dark theme with near-black backgrounds, crimson accents, and bold angular typography
- `vaultDwellerTheme` - Fallout-inspired with retro-futuristic styling
- `wildHuntTheme` - Witcher 3-inspired with silver-steel accents and crimson highlights on dark stormy backgrounds
- `xenomorphTheme` - Alien franchise-inspired with cold metallic backgrounds, acid green accents, and condensed monospace typography

Each theme provides a full set of semantic palette colors (`primary`, `secondary`, `error`, `warning`, `success`, `info`) with `light`, `main`, `dark` variants and contrast colors.

### Theme Infrastructure Enhancements

- Added `paperImage` to `Background` type and CSS variable theme, allowing themes to define textured or patterned paper surfaces via `background-image`
- Added `borderWidth` to `Shape` type and CSS variable theme, enabling themes to control surface border thickness

### Semantic Typography

Refactored the `Typography` component to render semantic HTML elements (`h1`–`h6`, `p`, `span`) based on the `variant` prop instead of always rendering a generic `shade-typography` custom element. Ellipsis handling and copy functionality now apply directly to the host element, removing the need for an internal wrapper.

**Breaking:** The `<shade-typography>` custom element tag no longer exists. Typography now renders as native tags with an `is` attribute (e.g. `<p is="shade-typography-p">`). Update any CSS or JS selectors targeting `shade-typography` to use `[is^="shade-typography"]` instead.

### 🐛 Bug Fixes

- Fixed `Timeline` vertical alignment issues by replacing hardcoded pixel values with theme spacing tokens and adding consistent `lineHeight` to labels and content
- Fixed `Timeline` last-item detection to correctly exclude pending items when determining the final visible entry
- Fixed `Timeline` tail visibility on the last item by using `:last-of-type` CSS instead of a `data-last` attribute

### ♻️ Refactoring

- Moved default theme files (`default-dark-palette.ts`, `default-dark-theme.ts`, `default-light-theme.ts`, `default-palette.ts`) from `services/` to a dedicated `themes/` directory
- Updated `Dialog`, `Result`, `PageHeader`, `Paper`, and `Card` components to use `Typography` instead of raw HTML heading/paragraph tags
- Updated `Paper` and `Card` components to support the new `paperImage` and `borderWidth` theme properties
- Added `fontFamily` from the theme to `Dialog`, `Paper`, `Card`, and `PageHeader` components for consistent font rendering across themes

### 🧪 Tests

- Updated `Typography` tests to assert on semantic HTML tags (`p`, `h1`, `h6`, `span`) instead of inner wrapper elements
- Updated `PageHeader`, `Result`, `CacheView`, `AppBar`, and `NotyList` tests for compatibility with the new `Typography`-based rendering
- Added tests for the new `getRgbFromColorString()`, `getTextColor()`, and `RgbColor` standalone modules

### 🔀 Migration Guide

### Step 1: Replace `ThemeProviderService` color method calls

Search for usages of `getTextColor` and `getRgbFromColorString` on a `ThemeProviderService` instance:

```bash
grep -rn "getTextColor\|getRgbFromColorString" --include="*.ts" --include="*.tsx" src/
```

Replace instance method calls with standalone function imports:

```typescript
// ❌ Before
const themeProvider = injector.getInstance(ThemeProviderService)
const color = themeProvider.getTextColor(bgColor)
const rgb = themeProvider.getRgbFromColorString(cssColor)

// ✅ After
import { getTextColor, getRgbFromColorString } from '@furystack/shades-common-components'
const color = getTextColor(bgColor)
const rgb = getRgbFromColorString(cssColor)
```

### Step 2: Update `RgbColor` imports (if using deep imports)

If you were importing `RgbColor` directly from the `theme-provider-service` module path, update to:

```typescript
import { RgbColor } from '@furystack/shades-common-components'
```

### Step 3: Update `Typography` selectors

If you have CSS or JS selectors targeting `shade-typography`, update them:

```css
/* ❌ Before */
shade-typography { ... }

/* ✅ After */
[is^="shade-typography"] { ... }
```

### Step 4: Verify

```bash
yarn build
yarn test
```

## [12.7.0] - 2026-02-23

### ✨ Features

### MarkdownEditor Form Integration

`MarkdownEditor` now accepts form-related props forwarded from `MarkdownInputProps`, enabling direct use inside forms with validation and labeling support.

**New props:** `name`, `required`, `labelTitle`, `disabled`, `placeholder`, `rows`, `getValidationResult`, `getHelperText`

**Usage:**

```tsx
<MarkdownEditor
  value={description}
  onValueChange={setDescription}
  labelTitle="Description"
  name="description"
  required
  getValidationResult={({ value }) =>
    value.length < 10 ? { isValid: false, message: 'Must be at least 10 characters' } : { isValid: true }
  }
/>
```

The editor renders a label above the editing area, displays validation errors and helper text below it, and sets a `data-invalid` attribute on the host element when validation fails — allowing external styling of the invalid state.

### MarkdownInput `hideChrome` Prop

- Added `hideChrome` prop to `MarkdownInput` — when `true`, suppresses the label and helper text rendering while preserving form semantics (textarea `name`, `required`, etc.). This is used internally by `MarkdownEditor` to avoid duplicate chrome when it manages its own label and validation display.

## [12.6.0] - 2026-02-22

### 🗑️ Deprecated

- `Grid` component is deprecated in favor of `DataGrid`. It will be removed in a future version.
- `Autocomplete` component is deprecated in favor of `Suggest` with the `suggestions` prop. It will be removed in a future version.

### ✨ Features

### Pagination support for `List` component

The `List` component now accepts an optional `pagination` prop to slice items into pages and render a `Pagination` control below the list.

**Usage:**

```typescript
<List
  items={allItems}
  listService={service}
  renderItem={(item) => <span>{item.name}</span>}
  pagination={{ itemsPerPage: 10, page: currentPage, onPageChange: setCurrentPage }}
/>
```

### Synchronous suggestions mode for `Suggest`

`Suggest` now supports a synchronous `suggestions` prop accepting a `string[]`, in addition to the existing async `getEntries` / `getSuggestionEntry` mode. The list is filtered client-side by the search term.

**Usage:**

```typescript
<Suggest
  defaultPrefix="🔍"
  suggestions={['Apple', 'Banana', 'Cherry']}
  onSelectSuggestion={(entry) => console.log(entry)}
/>
```

### `Wizard` step indicator and progress bar

The `Wizard` component now supports a `stepLabels` prop to render a visual step indicator with numbered circles and labels, and a `showProgress` prop to display a progress bar that advances as the user navigates through steps.

### `MarkdownInput` form integration

`MarkdownInput` now supports `name`, `required`, `getValidationResult`, and `getHelperText` props, enabling validation and `FormService` integration. Invalid states are reflected via a `data-invalid` attribute with error styling.

### Customizable `DataGrid` pagination options

- Added a `paginationOptions` prop to `DataGrid` to customize the rows-per-page selector values. When only one option is provided, the selector is hidden.
- Made the `styles` prop optional on `DataGrid`

### ♻️ Refactoring

- `DataGridFooter` now uses the `Pagination` component instead of a `<select>` element for page navigation

### 🧪 Tests

- Added pagination tests for the `List` component (page slicing, `Pagination` rendering, `onPageChange` callback)
- Added form integration and validation tests for `MarkdownInput` (`name`, `required`, `getValidationResult`, `getHelperText`)
- Added synchronous suggestions mode tests for `Suggest`
- Added step indicator and progress bar tests for `Wizard`
- Added custom `paginationOptions` tests for `DataGridFooter`

## [12.5.0] - 2026-02-22

### ✨ Features

### Typed Column Filters for DataGrid

Added a new filter system for `DataGrid` with dedicated filter components for each data type, replacing the previous inline regex-only search form.

New `columnFilters` prop on `DataGrid` allows declarative filter configuration per column:

```typescript
<DataGrid
  columns={['name', 'level', 'isActive', 'role', 'createdAt']}
  columnFilters={{
    name: { type: 'string' },
    level: { type: 'number' },
    isActive: { type: 'boolean' },
    role: { type: 'enum', values: [{ label: 'Admin', value: 'admin' }, { label: 'User', value: 'user' }] },
    createdAt: { type: 'date' },
  }}
  // ...other props
/>
```

**Available filter types:**

- `StringFilter` - supports contains, starts with, ends with, and exact match operators
- `NumberFilter` - supports `=`, `>`, `>=`, `<`, `<=` comparison operators
- `BooleanFilter` - toggle between true, false, or any using a `SegmentedControl`
- `EnumFilter` - multi-select checkboxes with include/exclude modes
- `DateFilter` - before, after, or between with datetime-local inputs

All filter components are exported from `@furystack/shades-common-components` via the `filters/` barrel.

- Added `FilterDropdown` component for positioning filter panels as dropdown overlays in the grid header
- `headerComponents` and `rowComponents` props on `DataGrid` are now optional
- `ToggleButton` now accepts `pressed` and `size` props for standalone use outside a `ToggleButtonGroup`
- `ToggleButtonGroup` now accepts a `size` prop that propagates to child buttons

### ♻️ Refactoring

- Grid header height reduced from 48px to 36px with smaller font and tighter spacing for a more compact look
- Footer pager labels changed from "Goto page" / "Show X items per page" to "Page X of Y" / "Rows per page"
- `ToggleButton` no longer renders a box-shadow by default; the border is only applied when inside a `ToggleButtonGroup` (via `data-grouped` attribute)

### ⚠️ Migration

- Column filter buttons are now **opt-in** via the `columnFilters` prop. Previously, every column showed a regex search button by default. To restore filtering, add a `columnFilters` config mapping for the columns you want to be filterable.

### 🧪 Tests

- Added unit tests for `ToggleButton` standalone `pressed` and `size` props
- Added unit tests for `ToggleButtonGroup` `size` propagation to child buttons
- Updated `DataGridHeader` tests to cover filter button visibility, filter type routing for all five filter types, and dropdown opening
- Updated `DataGridFooter` tests to match new pager label text

## [12.4.0] - 2026-02-22

### ✨ Features

### Async form submission support

The `Form` component's `onSubmit` callback now accepts async functions (`() => void | Promise<void>`). New observables on `FormService`: `isSubmitting` tracks whether a submission is in progress, and `submitError` captures any error thrown during submission. When the `disableOnSubmit` prop is enabled, the form element becomes inert during submission, preventing duplicate submits.

**Usage:**

```typescript
<Form
  validate={myValidator}
  onSubmit={async (data) => {
    await saveToServer(data)
  }}
  disableOnSubmit
>
  {/* form fields */}
</Form>
```

### ♻️ Refactoring

- Changed the `validate` prop type from `any` to `unknown` for stricter type safety

### 🧪 Tests

- Added tests for async `onSubmit` behavior, `isSubmitting` state tracking, `disableOnSubmit` inert toggling, and error handling during async submission

## [12.3.0] - 2026-02-19

### ✨ Features

### Markdown Components

A new set of zero-dependency Markdown components for rendering and editing Markdown content.

**`parseMarkdown(source)`** — Converts a Markdown string into a typed AST. Supports headings, paragraphs, ordered/unordered lists, task-list checkboxes, fenced code blocks with language hints, blockquotes, horizontal rules, and inline formatting (bold, italic, inline code, links, images).

**`toggleCheckbox(source, lineIndex)`** — Toggles a checkbox at the given source line index in a raw Markdown string, returning the updated string.

**`MarkdownDisplay`** — Renders a Markdown string as styled HTML using FuryStack Shades components. When `readOnly` is set to `false`, task-list checkboxes become interactive and report changes via an `onChange` callback.

**`MarkdownInput`** — A textarea for editing raw Markdown. Supports pasting images from the clipboard, which are inlined as base64-encoded `![pasted image](data:...)` Markdown images (configurable size limit, defaults to 256 KB).

**`MarkdownEditor`** — A combined editor with an input pane and a live preview pane. Supports three layout modes: `side-by-side`, `tabs` (Edit / Preview), and `above-below`. Checkboxes toggled in the preview pane update the source text.

### 🧪 Tests

- Added unit tests for `parseMarkdown` and `parseInline` covering headings, paragraphs, lists, checkboxes, code blocks, blockquotes, horizontal rules, and inline formatting
- Added unit tests for `toggleCheckbox` verifying checked/unchecked toggling and out-of-bounds handling
- Added unit tests for `MarkdownDisplay` rendering and interactive checkbox toggling
- Added unit tests for `MarkdownEditor` layout switching between side-by-side, tabs, and above-below modes
- Added unit tests for `MarkdownInput` text input and image paste behavior

## [12.2.0] - 2026-02-19

### ⬆️ Dependencies

- Updated `@furystack/shades`

### ✨ Features

### Icon metadata for descriptions, categories, and search keywords

Extended the `IconDefinition` type with optional `name`, `description`, `keywords`, and `category` fields. All existing icons now include this metadata, enabling icon galleries to automatically group icons by category and support keyword-based search.

### 41 new icons

Added 41 new icon definitions covering areas such as communication (`envelope`, `messageCircle`), media (`music`, `film`, `image`, `images`), data visualization (`barChart`), development (`code`, `gamepad`, `puzzle`), and navigation (`arrowLeft`, `arrowRight`, `compass`). The icon set grew from 69 to 110 icons.

## [12.1.0] - 2026-02-11

### ✨ Features

### New `CacheView` component

Added a new `CacheView` component that renders the state of a cache entry. It subscribes to a `Cache` instance observable and handles all states automatically:

1. **Error first** — shows error UI with a retry button
2. **Value next** — renders the content component (triggers reload when obsolete)
3. **Loading last** — shows a custom loader or nothing by default

```tsx
import { CacheView } from '@furystack/shades-common-components'

<CacheView cache={userCache} args={[userId]} content={UserContent} />

// With custom loader and error UI
<CacheView
  cache={userCache}
  args={[userId]}
  content={UserContent}
  loader={<Skeleton />}
  error={(err, retry) => (
    <Alert severity="error">
      <Button onclick={retry}>Retry</Button>
    </Alert>
  )}
/>
```

### 🐛 Bug Fixes

- Fixed `Skeleton` component background styles not rendering correctly when used inside Shadow DOM — moved gradient styles from host CSS to inline styles on the inner element

### 📚 Documentation

- Added `CacheView` usage examples to the package README

### ⬆️ Dependencies

- Added `@furystack/cache` (workspace:^) as a new dependency

## [12.0.1] - 2026-02-11

### 🧪 Tests

- Wrapped all disposable resources in `using()` / `usingAsync()` across command palette, context menu, data grid, click-away service, list service, and tree service tests to ensure cleanup runs even when assertions fail

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Updated `@furystack/shades` dependency
- Removed `semaphore-async-await` dependency
- Updated `@furystack/shades` with fix for `useState` setter disposal error

## [12.0.0] - 2026-02-09

### 💥 Breaking Changes

### `Theme` interface extended with 6 new required properties

The `Theme` interface now requires the following additional properties: `action`, `shape`, `shadows`, `typography`, `transitions`, and `spacing`. Any custom theme objects must be updated to include these new token groups. See `defaultDarkTheme` and `defaultLightTheme` for reference implementations.

### Requires `@furystack/shades` v3

This package now depends on the new major version of `@furystack/shades` which removed the `constructed` callback. All components have been migrated to use `useDisposable()` inside `render` for one-time setup and cleanup.

### Migrated All Components from `element` to `useHostProps` and `useRef`

All components in this package have been updated to use the new declarative `useHostProps` and `useRef` APIs from `@furystack/shades`, replacing direct imperative DOM manipulation via the removed `element` parameter.

**Impact:** Components no longer accept or use the `element` render option. Any custom components that extended or wrapped these components and relied on `element` access patterns need to be updated.

**Migration:** The component API and behavior remain the same from a consumer perspective — this is a breaking change only due to the peer dependency bump on `@furystack/shades`.

- `AppBarLink` props changed from `RouteLinkProps` to `NestedRouteLinkProps` — `href` is now required and the rendered shadow DOM element changed from `route-link` to `nested-route-link`

### ✨ Features

### Component Pack 1 — 15 new UI components

Added a full set of general-purpose UI components, all themed via CSS variable tokens, with ARIA attributes, keyboard navigation, and `FormService` integration where applicable:

**Data Display:**

- `Accordion` / `AccordionItem` — Collapsible content sections with animated expand/collapse, keyboard support, and `outlined` / `elevation` variants
- `Badge` — Count or status-dot overlay with configurable `max`, palette colors, and show/hide animation
- `Chip` — Compact tag/label element with `filled` / `outlined` variants, optional delete button, and size options
- `Tooltip` — Contextual hover/focus popup with four placement options, configurable delay, and arrow indicator

**Feedback:**

- `Alert` — Severity-coded message banner (`error` / `warning` / `info` / `success`) with `filled`, `outlined`, and `standard` variants and an optional close button
- `CircularProgress` — SVG-based circular indicator with `determinate` and `indeterminate` variants, customisable size and thickness
- `LinearProgress` — Horizontal progress bar with `determinate` and `indeterminate` variants and size options

**Surfaces:**

- `Card` — Content surface with `CardHeader`, `CardContent`, `CardMedia`, and `CardActions` sub-components, elevation levels 0–3, and an outlined variant
- `Dialog` — Modal dialog with title, body, and action slots, backdrop overlay, show/hide animation, and a `ConfirmDialog` helper function

**Layout:**

- `Divider` — Visual separator with horizontal/vertical orientation, `full` / `inset` / `middle` variants, and optional inline text content
- `Pagination` — Page navigator with ellipsis, configurable sibling/boundary counts, prev/next buttons, and size/color variants

**Inputs:**

- `Checkbox` — Checkbox with label, indeterminate state, palette colors, and `FormService` integration
- `Radio` / `RadioGroup` — Radio buttons with a group container supporting controlled and uncontrolled modes, orientation options, and shared palette color
- `Select` — Custom dropdown with full keyboard navigation (Arrow, Enter, Escape, Home, End), validation and helper-text support, and `contained` / `outlined` variants
- `Switch` — Animated toggle switch with `small` / `medium` sizes and palette color support

### New design token groups on the `Theme` interface

Extended the theme system with six new token groups, enabling centralised control over interactive states, shape, elevation, typography, motion, and spacing:

- `action` — Interactive state colors (`hoverBackground`, `selectedBackground`, `activeBackground`, `focusRing`, `disabledOpacity`, `backdrop`, `subtleBorder`)
- `shape` — Border radius scale (`xs` through `full`) for consistent rounded corners
- `shadows` — Elevation presets (`none`, `sm`, `md`, `lg`, `xl`) for layered depth
- `typography` — Font family, size scale, weight scale, and line height scale
- `transitions` — Duration presets (`fast`, `normal`, `slow`) and easing functions (`default`, `easeOut`, `easeInOut`)
- `spacing` — Spacing scale (`xs` through `xl`) for consistent padding, margins, and gaps

All new tokens are available in `defaultDarkTheme`, `defaultLightTheme`, and `cssVariableTheme`.

### New exported types

All token group types are exported for type-safe custom themes: `ActionColors`, `BorderRadiusScale`, `Shape`, `Shadows`, `FontSizeScale`, `FontWeightScale`, `LineHeightScale`, `Typography`, `TransitionDurations`, `TransitionEasings`, `Transitions`, `Spacing`.

### `buildTransition` helper

New utility function `buildTransition(...specs)` that builds CSS transition strings from `[property, duration, easing]` tuples, reducing boilerplate when composing multi-property transitions.

### New Layout System Components

A complete layout system for building application shells with AppBar, drawers, and content areas.

#### PageLayout Component

Full viewport layout component that orchestrates AppBar and drawer positioning with automatic CSS variable management.

**Features:**

- Optional AppBar with `permanent` or `auto-hide` variants
- Left and/or right drawers with `permanent`, `collapsible`, or `temporary` variants
- Responsive drawer collapse via `collapseOnBreakpoint` prop
- Configurable gaps between AppBar/drawers and content
- Scoped `LayoutService` instance for child components

**Usage:**

```tsx
<PageLayout
  appBar={{
    variant: 'permanent',
    height: '64px',
    component: <MyAppBar />,
  }}
  drawer={{
    left: {
      variant: 'collapsible',
      width: '280px',
      component: <Sidebar />,
      collapseOnBreakpoint: 'md', // Auto-collapse below 960px
    },
  }}
  topGap="16px"
  sideGap="24px"
>
  <MainContent />
</PageLayout>
```

#### Drawer Component

Standalone drawer component for sidebars and navigation panels with three behavior variants.

**Variants:**

- `permanent`: Always visible, cannot be closed
- `collapsible`: Toggleable, pushes content when open
- `temporary`: Overlays content with backdrop, closes on backdrop click

**Usage:**

```tsx
<Drawer position="left" variant="collapsible" collapseOnBreakpoint="md">
  <nav>Navigation items...</nav>
</Drawer>
```

#### DrawerToggleButton Component

A button component to toggle drawer open/close state, integrates with `LayoutService`.

**Usage:**

```tsx
<DrawerToggleButton position="left" />
```

#### PageContainer Component

Container component for consistent page content styling with max-width, centering, and spacing.

**Usage:**

```tsx
<PageContainer maxWidth="1200px" centered padding="48px" gap="24px">
  <PageHeader icon="👥" title="Users" description="Manage user accounts" />
  <Paper>Content here...</Paper>
</PageContainer>
```

#### PageHeader Component

Styled header component with optional icon, title, and description.

**Usage:**

```tsx
<PageHeader icon="📊" title="Dashboard" description="Overview of your application metrics" />
```

#### LayoutService

Service for managing layout state with observable values and CSS custom properties.

**Features:**

- Drawer state management (`drawerState`, `toggleDrawer`, `setDrawerOpen`)
- AppBar visibility control (`appBarVisible`, `appBarVariant`)
- Gap configuration (`topGap`, `sideGap`)
- Scoped CSS variables via `LAYOUT_CSS_VARIABLES` constant

**CSS Variables:**

```typescript
import { LAYOUT_CSS_VARIABLES } from '@furystack/shades-common-components'

// Available CSS variables:
// --layout-appbar-height
// --layout-drawer-left-width
// --layout-drawer-right-width
// --layout-content-margin-left
// --layout-content-margin-right
// --layout-content-padding-top
// --layout-top-gap
// --layout-side-gap
```

### List Component

Added `List` and `ListItem` components for rendering selectable, keyboard-navigable lists with support for single and multi-selection.

- Click to focus, `ArrowUp`/`ArrowDown` to navigate, `Enter` to activate an item
- Multi-selection via `Ctrl+Click` (toggle), `Shift+Click` (range), `Space` (toggle focused), `+` (select all), `-` (deselect all)
- Type-ahead search when `searchField` is configured on `ListService`
- Supports custom `renderItem`, `renderIcon`, and `renderSecondaryActions` render props
- Click-away detection to release focus
- Smooth scroll-into-view when navigating with keyboard

Added `ListService` - a standalone state manager for list focus, selection, and keyboard navigation that can be used independently of the component.

### Tree Component

Added `Tree` and `TreeItem` components for rendering hierarchical data with expand/collapse, indented levels, and keyboard navigation.

- `ArrowRight` expands a collapsed node or moves focus to its first child; `ArrowLeft` collapses an expanded node or moves focus to the parent
- Double-click toggles expand/collapse on parent nodes, activates leaf nodes
- Inherits all selection and navigation behavior from `ListService`
- Renders expand/collapse indicators (`▸`/`▾`) with level-based indentation
- Supports custom `renderItem` and `renderIcon` render props

Added `TreeService` - extends `ListService` with tree-specific state including expand/collapse tracking, flattened visible node list, and parent lookup.

### Context Menu Component

Added `ContextMenu` and `ContextMenuItemComponent` for rendering positioned popup menus with keyboard navigation and item selection.

- Supports both right-click and programmatic trigger via `ContextMenuManager.open()`
- Items can have labels, descriptions, icons, disabled state, and separators
- `ArrowUp`/`ArrowDown` to navigate, `Enter` to select, `Escape` to close, `Home`/`End` to jump
- Clicking the backdrop or right-clicking elsewhere closes the menu
- Disabled items are skipped during keyboard navigation

Added `ContextMenuManager` - manages context menu state including open/close, item list, focus index, positioning, and keyboard navigation. Emits `onSelectItem` events via `EventHub`.

### Breadcrumb Component

Added a new `Breadcrumb` component for navigating hierarchical route structures with automatic active state detection.

**Features:**

- Dynamic route parameter support (e.g., `/users/:id`)
- Custom label rendering with `render` prop
- Configurable separators (string or JSX element)
- Active item detection based on current URL
- Optional home/root link
- Last item clickable/non-clickable configuration

**Basic Usage:**

```typescript
import { Breadcrumb } from '@furystack/shades-common-components'

<Breadcrumb
  homeItem={{ path: '/', label: 'Home' }}
  items={[
    { path: '/users', label: 'Users' },
    { path: '/users/:id', label: 'User Details', params: { id: '123' } },
  ]}
  separator=" › "
/>
```

**Type-Safe Usage:**

The `createBreadcrumb<TRoutes>()` helper provides compile-time route validation:

```typescript
import { createBreadcrumb } from '@furystack/shades-common-components'
import type { appRoutes } from './routes'

const AppBreadcrumb = createBreadcrumb<typeof appRoutes>()

// ✅ Type-safe: only valid paths accepted
<AppBreadcrumb
  items={[{ path: '/buttons', label: 'Buttons' }]}
/>

// ❌ TypeScript error: invalid path
<AppBreadcrumb items={[{ path: '/nonexistent', label: 'Error' }]} />
```

**Route Parameters:**

Route parameters are automatically inferred from the path pattern:

- `path="/buttons"` — `params` is optional
- `path="/users/:id"` — `params: { id: string }` is required

### AppBarLink Enhancements

- Added `routingOptions` prop to `AppBarLink` for customizing route matching behavior using `path-to-regexp` options
- Added `createAppBarLink<TRoutes>()` helper for type-safe app bar links constrained to specific route trees

### New Components

- Added `ButtonGroup` - groups multiple buttons with shared variant, color, orientation, and disabled state
- Added `Carousel` - content carousel with slide/fade transitions, autoplay, dot indicators, vertical mode, and keyboard navigation
- Added `Dropdown` - dropdown menu with items, groups, and dividers, configurable placement, keyboard navigation, and click-away closing
- Added `Icon` - SVG icon component with size variants (small/medium/large/custom), palette colors, and accessibility support (`ariaLabel` / `aria-hidden`)
- Added 50+ SVG icon definitions (`icons` namespace) for common UI actions, navigation, status indicators, and more
- Added `Image` - image component with loading skeleton, error fallback, preview/lightbox overlay, and load/error animations
- Added `Menu` - navigation menu with vertical, horizontal, and inline modes, expandable groups, and keyboard navigation
- Added `MenuEntry` types (`MenuItemEntry`, `MenuGroupEntry`, `MenuDividerEntry`) and `getNavigableKeys` utility for building menu structures
- Added `Rating` - star rating with configurable max, half-star precision, multiple sizes, palette colors, read-only mode, and keyboard accessibility
- Added `Result` - status feedback component for success/error/warning/info and HTTP error codes (403, 404, 500) with icon, title, and subtitle
- Added `Timeline` and `TimelineItem` - vertical timeline with color-coded dots, connector lines, and alternate/left/right positioning modes
- Added `Typography` - text component with semantic variants (h1–h6, subtitle, body, caption, overline), palette colors, ellipsis truncation, and copyable text
- Added `Slider` - range/value slider with min/max/step, marks with labels, tooltips, range mode (two thumbs), and keyboard accessibility
- Added `InputNumber` - numeric input with +/- stepper buttons, min/max/step constraints, decimal precision, form integration, and validation

### Enhanced Components

- Added `text` variant, `size` prop (small/medium/large), `danger` flag, `loading` spinner, and `startIcon`/`endIcon` support to `Button`
- Added controlled mode (`activeKey`/`onTabChange`), `line`/`card` visual styles, `vertical` orientation, closable tabs with `onClose`, and an add button with `onAdd` to `Tabs`
- Added option groups (`optionGroups`), multi-select mode with chip display, and search/filter input to `Select`

### Theme Design Tokens

- Added `ZIndex` type with stacking layers: `drawer`, `appBar`, `modal`, `tooltip`, `dropdown`
- Added `Effects` type with blur tokens: `blurSm`, `blurMd`, `blurLg`, `blurXl`
- Added `LetterSpacingScale` type with spacing values: `tight`, `dense`, `normal`, `wide`, `wider`, `widest`
- All three theme presets (`defaultDarkTheme`, `defaultLightTheme`, `cssVariableTheme`) updated with the new tokens

### Migrated `styles.tsx` to CSS Variable Theme

- `colors` and `glassBox` exports now reference `cssVariableTheme` tokens instead of hardcoded values, ensuring consistency with the active theme

### 🐛 Bug Fixes

- Fixed `defaultDarkTheme.divider` using a light-theme value (`rgba(0, 0, 0, 0.12)`) — now correctly uses `rgba(255, 255, 255, 0.12)`
- Fixed DataGrid row keyboard navigation not scrolling the focused row into view
- Fixed `Autocomplete` datalist binding to use `setTimeout` instead of `queueMicrotask`, avoiding conflicts with the new microtask-based component update batching in `@furystack/shades`. Also added proper cleanup via `clearTimeout` on dispose.

### ♻️ Refactoring

### Components migrated to declarative host manipulation

All components now use `useHostProps` to set data attributes, ARIA attributes, CSS custom properties, and styles on the host element instead of imperatively calling `element.setAttribute()`, `element.style.setProperty()`, etc. This includes:

- **Button** — color custom properties, variant/size/loading data attributes
- **Checkbox** — disabled/indeterminate data attributes, color custom property, replaced `querySelector` with `useRef` for form input registration
- **Input** — focus/validation state, label/helper text attributes
- **InputNumber** — stepper button refs, value formatting
- **Select** — open/disabled state, option list management
- **Slider** — track/thumb positioning via refs and host props
- **Switch** — checked/disabled state attributes
- **TextArea** — focus/validation state
- **Radio / RadioGroup** — checked/disabled state, group management
- **Autocomplete** — dropdown state management
- **Accordion** — expanded state toggling
- **Alert** — severity data attribute and color
- **AppBar / AppBarLink** — layout positioning
- **Avatar** — size and color attributes
- **Badge** — position and color
- **Carousel** — slide positioning and navigation via refs
- **Chip** — variant and deletable state
- **CircularProgress** — progress value and size via host props
- **CommandPalette** — open state and input focus via refs
- **ContextMenu** — position and visibility
- **DataGrid / DataGridRow** — selection state, column sizing
- **Dialog** — open state and focus management via refs
- **Divider** — orientation attribute
- **Dropdown** — open/closed state
- **Fab** — position and color
- **Form** — validation state
- **Icon** — size attribute and SVG rendering
- **Image** — loading/error state
- **LinearProgress** — progress value host props
- **List / ListItem** — selection state
- **Loader** — active state
- **Menu** — open state and positioning
- **Modal** — visibility and backdrop
- **NotyList** — notification state
- **PageContainer / PageLayout** — layout dimensions
- **Pagination** — page state
- **Rating** — value and hover state via refs
- **Skeleton** — animation variant
- **Suggest** — dropdown state and input refs
- **Tabs** — active tab indicator
- **Timeline** — item positioning
- **Tooltip** — visibility and positioning
- **Tree / TreeItem** — expanded/selected state
- **Typography** — variant data attribute

### Services updated

- **ClickAwayService** — updated for compatibility with new rendering model
- **LayoutService** — updated for compatibility with new rendering model

- Replaced hardcoded `rgba(128,128,128,...)` backgrounds across all interactive components with `action.*` theme tokens
- Replaced hardcoded `border-radius` pixel values with `shape.borderRadius.*` tokens
- Replaced hardcoded `box-shadow` definitions with `shadows.*` elevation tokens
- Replaced hardcoded `font-size` and `font-weight` values with `typography.*` tokens
- Replaced hardcoded transition timing strings with `transitions.*` tokens
- Replaced hardcoded spacing pixel values with `spacing.*` tokens
- Replaced hardcoded disabled opacity, focus ring, and backdrop overlay values with `action.*` tokens
- Refactored `Button` to use `buildTransition()` helper and `spacing.lg` token instead of hardcoded values
- Migrated `Dropdown` keyboard event handler from `constructed` to `useDisposable()` in `render`
- Migrated `Checkbox`, `Input`, `InputNumber`, `Select`, `Switch`, `Slider`, `Autocomplete`, `Radio`, and `RadioGroup` form service registration from `constructed` to `useDisposable()` in `render`
- Migrated `NotyComponent` enter animation from `constructed` to `useDisposable()` in `render`
- Migrated `ButtonGroup`, `AppBar`, `CircularProgress`, `ContextMenu`, `ContextMenuItem`, `DataGrid`, `LinearProgress`, `List`, and `Tree` initialization logic from `constructed` to `useDisposable()` in `render`
- Migrated `AppBarLink` from the deprecated `RouteLink` to `NestedRouteLink` for SPA navigation
- Renamed `Typography` type to `ThemeTypography` in `ThemeProviderService` to avoid naming conflict with the new `Typography` component
- Made `zIndex`, `effects`, and `typography.letterSpacing` optional on the `Theme` interface for backward compatibility with existing custom themes

### 🧪 Tests

- Added unit tests for all 15 new components (`accordion`, `alert`, `badge`, `card`, `chip`, `circular-progress`, `dialog`, `divider`, `linear-progress`, `pagination`, `tooltip`, `checkbox`, `radio`, `radio-group`, `select`, `switch`)
- Updated `fab.spec.tsx` and `loader.spec.tsx` to assert against theme tokens instead of hardcoded values
- Fixed `styles.spec.ts` to match updated `rgba` formatting in `glassBox` border
- Added unit tests for `Drawer`, `DrawerToggleButton`, `PageLayout`, `PageContainer`, `PageHeader`, and `LayoutService`
- Updated component tests to align with the removal of `constructed` callback
- Added tests for `ListService` covering selection, focus, keyboard navigation, type-ahead search, click handling, and disposal
- Added tests for `List` and `ListItem` components verifying rendering, keyboard interactions, click behaviors, and selection callbacks
- Added tests for `TreeService` covering expand/collapse, flattened node generation, keyboard navigation (`ArrowRight`/`ArrowLeft`), parent lookup, and disposal
- Added tests for `Tree` and `TreeItem` components verifying hierarchical rendering, expand/collapse interactions, and activation callbacks
- Added tests for `ContextMenuManager` covering open/close, item selection, keyboard navigation, disabled item skipping, and disposal
- Added tests for `ContextMenu` and `ContextMenuItemComponent` verifying rendering, focus highlighting, click handling, and backdrop dismiss
- Updated tests across multiple components (accordion, alert, badge, breadcrumb, card, chip, divider, icon, autocomplete, pagination, result, suggest-input, suggestion-list, timeline, tooltip) to work with microtask-based rendering
- Refactored tests across all components (AppBar, Button, CommandPalette, DataGrid, Drawer, Fab, Form, Grid, Input, TextArea, Loader, NotyList, PageLayout, Paper, Skeleton, Suggest, Wizard) to use `usingAsync` for proper `Injector` disposal
- Updated tests across components to accommodate the new rendering flow and `flushUpdates()` for async assertions
- Updated visual snapshot baselines for form fieldset tests
- Added full test coverage for `Breadcrumb` component including runtime behavior tests and type safety validation
- Added unit tests for all new components: `ButtonGroup`, `Carousel`, `Dropdown`, `Icon`, `Image`, `Menu`, `MenuTypes`, `Rating`, `Result`, `Timeline`, `Typography`, `Slider`, and `InputNumber`
- Extended unit tests for enhanced `Button`, `Tabs`, and `Select` components

### ⬆️ Dependencies

- Peer dependency on `@furystack/shades` bumped to new major version

## [11.0.0] - 2026-02-01

### 💥 Breaking Changes

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

### ♻️ Refactoring

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

## [10.0.35] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [10.0.34] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [10.0.33] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 📚 Documentation

- Added detailed README with component documentation and usage examples

### 🔧 Chores

- Migrated to centralized changelog management system
