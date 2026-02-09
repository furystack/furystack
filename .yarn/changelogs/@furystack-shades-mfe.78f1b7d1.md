<!-- version-type: major -->

# @furystack/shades-mfe

## 💥 Breaking Changes

### Migrated from `element` to `useRef` for Container Management

The `MicroFrontend` component no longer uses the `element` render option to access the host element. Instead, it uses `useRef` to create a container `<div>` inside the component, and the micro-frontend is mounted into that container.

**Impact:** The internal mounting behavior has changed — micro-frontends are now mounted inside a child `<div>` rather than directly into the host custom element. This should be transparent for most consumers, but any code that relies on the MFE being a direct child of the `shade-micro-frontend` element may need adjustment.

## ♻️ Refactoring

- Replaced `element` parameter with `useRef('mfeContainer')` and a container `<div>` for MFE mounting
- MFE loader now defers initialization via `queueMicrotask` to ensure the ref is available after the first render
- Added prop propagation to inner MFE elements for Shade-based micro-frontends

## 🧪 Tests

- Updated tests to accommodate new rendering flow

## ⬆️ Dependencies

- Peer dependency on `@furystack/shades` bumped to new major version
