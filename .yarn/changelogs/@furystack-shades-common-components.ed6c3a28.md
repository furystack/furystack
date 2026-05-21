<!-- version-type: patch -->

# @furystack/shades-common-components

## 🐛 Bug fixes

- `Checkbox` change events now propagate to the parent `<Form>`, so `rawFormData` updates when the checkbox is toggled. Previously the inner input called `ev.stopPropagation()`, which swallowed the event before it reached the form.
- `Radio` and `Switch` no longer fire `props.onchange` twice per change. The inner input no longer carries a duplicate `onchange={props.onchange}` — Shade's `attachProps` already wires the handler on the host element, and the bubbled change event triggers it once.
- `Checkbox` and `Switch` now preserve the browser's native `"on"` default when the `value` prop is omitted, so form submissions emit `{ [name]: "on" }` instead of `{ [name]: "" }`.

## ⬆️ Dependencies

- Bumped `vitest` to `^4.1.7`. No source changes — dev-tooling bump only.
