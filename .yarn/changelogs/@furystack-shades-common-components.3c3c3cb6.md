<!-- version-type: patch -->

# @furystack/shades-common-components

## 🐛 Bug Fixes

- Fixed `Autocomplete` datalist binding to use `setTimeout` instead of `queueMicrotask`, avoiding conflicts with the new microtask-based component update batching in `@furystack/shades`. Also added proper cleanup via `clearTimeout` on dispose.

## 🧪 Tests

- Updated tests across multiple components (accordion, alert, badge, breadcrumb, card, chip, divider, icon, autocomplete, pagination, result, suggest-input, suggestion-list, timeline, tooltip) to work with microtask-based rendering
