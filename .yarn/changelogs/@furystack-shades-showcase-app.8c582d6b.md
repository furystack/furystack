<!-- version-type: patch -->

# @furystack/shades-showcase-app

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

### Icon gallery now auto-discovers icons with search and filtering

The icons showcase page no longer uses a hardcoded list of icons. It dynamically reads all exported icons and groups them by their `category` metadata. A search input lets users filter icons by name, keyword, description, or category, displaying a live count of matches.

### Replaced emoji strings with `Icon` components across the app

Navigation categories, sidebar branding, breadcrumb home link, theme switcher, page headers, and the 404 page now render proper `Icon` components instead of emoji characters. The `NavCategory.icon` type changed from `string` to `IconDefinition`.

## ♻️ Refactoring

- Replaced inline-styled toggle buttons in the icons page with `ToggleButtonGroup` and `Button` components
- Extracted size-comparison section into a data-driven `.map()` loop
- Reorganized imports across ~50 showcase pages to group `@furystack/*` imports consistently
