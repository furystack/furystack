<!-- version-type: patch -->
# @furystack/shades-common-components

## ✨ Features

### New Components

- Added `ButtonGroup` - groups multiple buttons with shared variant, color, orientation, and disabled state
- Added `Carousel` - content carousel with slide/fade transitions, autoplay, dot indicators, vertical mode, and keyboard navigation
- Added `Dropdown` - dropdown menu with items, groups, and dividers, configurable placement, keyboard navigation, and click-away closing
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

## ♻️ Refactoring

- Renamed `Typography` type to `ThemeTypography` in `ThemeProviderService` to avoid naming conflict with the new `Typography` component

## 🧪 Tests

- Added unit tests for all new components: `ButtonGroup`, `Carousel`, `Dropdown`, `Image`, `Menu`, `MenuTypes`, `Rating`, `Result`, `Timeline`, `Typography`, `Slider`, and `InputNumber`
- Extended unit tests for enhanced `Button`, `Tabs`, and `Select` components
