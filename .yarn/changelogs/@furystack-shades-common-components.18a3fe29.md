<!-- version-type: minor -->

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

## ✨ Features

### New design token groups on the `Theme` interface

Extended the theme system with six new token groups, enabling centralized control over interactive states, shape, elevation, typography, motion, and spacing:

- `action` - Interactive state colors (`hoverBackground`, `selectedBackground`, `activeBackground`, `focusRing`, `disabledOpacity`, `backdrop`)
- `shape` - Border radius scale (`xs` through `full`) for consistent rounded corners
- `shadows` - Elevation presets (`none`, `sm`, `md`, `lg`, `xl`) for layered depth
- `typography` - Font family, size scale, weight scale, and line height scale
- `transitions` - Duration presets (`fast`, `normal`, `slow`) and easing functions (`default`, `easeOut`, `easeInOut`)
- `spacing` - Spacing scale (`xs` through `xl`) for consistent padding, margins, and gaps

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

## 🧪 Tests

- Updated `fab.spec.tsx` and `loader.spec.tsx` to assert against theme tokens instead of hardcoded values
- Fixed `styles.spec.ts` to match updated `rgba` formatting in `glassBox` border
