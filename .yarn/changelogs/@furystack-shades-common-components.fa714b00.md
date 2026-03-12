<!-- version-type: patch -->
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
- Added `navSection` prop to `Accordion`, `DataGrid`, `List`, and `Tree` for spatial‑navigation scoping.
- Added `trapFocus` and `navSection` props to `Modal` and `Dialog`, plus focusable behaviour for `Chip` and `Image` when interactive.
- Introduced `focusOutline` theme variable and `injectFocusVisibleStyles()` helper; added focus coordination to DataGrid/List/Tree and semantics improvements across components.

## 💥 Breaking Changes
- Removed arrow‑key and Tab handlers from `ListService`/`CollectionService`/`TreeService`; spatial navigation now handles boundaries.
- `AccordionItem` header changed to a native `<button disabled>`; custom CSS selectors must be updated.
- Themes must supply a `focusOutline` value; various behavioural changes to keyboard handling detailed in package changelog.


## 🐛 Bug Fixes
<!-- PLACEHOLDER: Describe the nasty little bugs that has been eradicated (fix:) -->

## 📚 Documentation
<!-- PLACEHOLDER: Describe documentation changes (docs:) -->

## ⚡ Performance
<!-- PLACEHOLDER: Describe performance improvements (perf:) -->

## ♻️ Refactoring
<!-- PLACEHOLDER: Describe code refactoring (refactor:) -->

## 🧪 Tests
<!-- PLACEHOLDER: Describe test changes (test:) -->

## 📦 Build
<!-- PLACEHOLDER: Describe build system changes (build:) -->

## 👷 CI
<!-- PLACEHOLDER: Describe CI configuration changes (ci:) -->

## ⬆️ Dependencies
<!-- PLACEHOLDER: Describe dependency updates (deps:) -->

## 🔧 Chores
<!-- PLACEHOLDER: Describe other changes (chore:) -->
