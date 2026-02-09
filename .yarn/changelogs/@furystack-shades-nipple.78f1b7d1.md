<!-- version-type: major -->

# @furystack/shades-nipple

## 💥 Breaking Changes

### Migrated from `element` to `useRef` for Zone Management

The `NippleComponent` no longer uses the `element` render option as the nipplejs zone. Instead, it uses `useRef` to reference a dedicated container `<div>`, which is passed to `nipplejs.create()` as the zone.

**Impact:** The nipplejs manager is now attached to a child `<div>` inside the component rather than the host custom element itself. This should be transparent for most consumers.

## ♻️ Refactoring

- Replaced `element` parameter with `useRef('zone')` and a container `<div>` for nipplejs initialization
- Nipple manager creation now deferred via `queueMicrotask` to ensure the ref is available after the first render

## ⬆️ Dependencies

- Peer dependency on `@furystack/shades` bumped to new major version
