<!-- version-type: patch -->

# @furystack/shades-showcase-app

## 🧪 Tests

- Added an E2E spec for the Advanced Form that toggles the `Workshops` and `Networking` checkboxes and the `Notifications` switch, asserting that the parent `<Form>`'s raw data reflects each toggle (covers the propagation fix in `@furystack/shades-common-components`).

## ⬆️ Dependencies

- Bumped `@playwright/test` from `^1.59.1` to `^1.60.0` (E2E test runner).
- Bumped `vite` to `^8.0.14` and `vitest` to `^4.1.7`. Dev-tooling only.
