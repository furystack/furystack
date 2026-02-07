<!-- version-type: major -->

# @furystack/shades-common-components

<!--
FORMATTING GUIDE:

### Detailed Entry (appears first when merging)

Use h3 (###) and below for detailed entries with paragraphs, code examples, and lists.

### Simple List Items

- Simple changes can be added as list items
- They are collected together at the bottom of each section

TIP: When multiple changelog drafts are merged, heading-based entries
appear before simple list items within each section.
-->

## 💥 Breaking Changes

### `Theme` interface extended with 6 new required properties

The `Theme` interface now requires the following additional properties: `action`, `shape`, `shadows`, `typography`, `transitions`, and `spacing`. Any custom theme objects must be updated to include these new token groups. See `defaultDarkTheme` and `defaultLightTheme` for reference implementations.

## ✨ Features

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

## 🐛 Bug Fixes

- Fixed `defaultDarkTheme.divider` using a light-theme value (`rgba(0, 0, 0, 0.12)`) — now correctly uses `rgba(255, 255, 255, 0.12)`

## ♻️ Refactoring

- Replaced hardcoded `rgba(128,128,128,...)` backgrounds across all interactive components with `action.*` theme tokens
- Replaced hardcoded `border-radius` pixel values with `shape.borderRadius.*` tokens
- Replaced hardcoded `box-shadow` definitions with `shadows.*` elevation tokens
- Replaced hardcoded `font-size` and `font-weight` values with `typography.*` tokens
- Replaced hardcoded transition timing strings with `transitions.*` tokens
- Replaced hardcoded spacing pixel values with `spacing.*` tokens
- Replaced hardcoded disabled opacity, focus ring, and backdrop overlay values with `action.*` tokens
- Refactored `Button` to use `buildTransition()` helper and `spacing.lg` token instead of hardcoded values

## 🧪 Tests

- Added unit tests for all 15 new components (`accordion`, `alert`, `badge`, `card`, `chip`, `circular-progress`, `dialog`, `divider`, `linear-progress`, `pagination`, `tooltip`, `checkbox`, `radio`, `radio-group`, `select`, `switch`)
- Updated `fab.spec.tsx` and `loader.spec.tsx` to assert against theme tokens instead of hardcoded values
- Fixed `styles.spec.ts` to match updated `rgba` formatting in `glassBox` border
