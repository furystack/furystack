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

## 🐛 Bug Fixes

- Fixed `Timeline` vertical alignment issues by replacing hardcoded pixel values with theme spacing tokens and adding consistent `lineHeight` to labels and content
- Fixed `Timeline` last-item detection to correctly exclude pending items when determining the final visible entry
- Fixed `Timeline` tail visibility on the last item by using `:last-of-type` CSS instead of a `data-last` attribute

## ♻️ Refactoring

- Moved default theme files (`default-dark-palette.ts`, `default-dark-theme.ts`, `default-light-theme.ts`, `default-palette.ts`) from `services/` to a dedicated `themes/` directory
- Updated `Dialog`, `Result`, `PageHeader`, `Paper`, and `Card` components to use `Typography` instead of raw HTML heading/paragraph tags
- Updated `Paper` and `Card` components to support the new `paperImage` and `borderWidth` theme properties
- Added `fontFamily` from the theme to `Dialog`, `Paper`, `Card`, and `PageHeader` components for consistent font rendering across themes

## 🧪 Tests

- Updated `Typography` tests to assert on semantic HTML tags (`p`, `h1`, `h6`, `span`) instead of inner wrapper elements
- Updated `PageHeader`, `Result`, `CacheView`, `AppBar`, and `NotyList` tests for compatibility with the new `Typography`-based rendering
