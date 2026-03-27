<!-- version-type: major -->

# @furystack/shades-nipple

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

- Normalized joystick callbacks to receive a single `event` object with a `data` payload (`onStart`, `onMove`, `onDir`, `onEnd`), aligning the component API with the current runtime event shape.

## 🐛 Bug Fixes

<!-- PLACEHOLDER: Describe the nasty little bugs that has been eradicated (fix:) -->

## 📚 Documentation

- Updated README examples and prop documentation to use the new callback signature and `NippleManagerOptions` type.

## ⚡ Performance

<!-- PLACEHOLDER: Describe performance improvements (perf:) -->

## ♻️ Refactoring

<!-- PLACEHOLDER: Describe code refactoring (refactor:) -->

## 🧪 Tests

- Updated component tests to use the exported `NippleManagerEventHandler` type for callback mocks.

## 📦 Build

<!-- PLACEHOLDER: Describe build system changes (build:) -->

## 👷 CI

<!-- PLACEHOLDER: Describe CI configuration changes (ci:) -->

## ⬆️ Dependencies

- Upgraded `nipplejs` from `^0.10.2` to `^1.0.1` to use the latest upstream manager and event behavior.

## 💥 Breaking Changes

### Callback Signatures Now Receive A Single Event Object

Joystick callback props no longer receive positional `(evt, data)` arguments.  
All callback props now receive a single `event` object, and joystick payload values are available under `event.data`.

**Before / After:**

```tsx
// ❌ Before
<NippleComponent
  managerOptions={{ mode: 'static', position: { left: '50%', top: '50%' } }}
  onMove={(_evt, data) => {
    console.log(data.direction?.angle)
    console.log(data.force)
  }}
/>

// ✅ After
<NippleComponent
  managerOptions={{ mode: 'static', position: { left: '50%', top: '50%' } }}
  onMove={(event) => {
    console.log(event.data.direction?.angle)
    console.log(event.data.force)
  }}
/>
```

**Impact:** Consumers using `onStart`, `onMove`, `onDir`, or `onEnd` with `(evt, data)` parameters must update handlers to use a single `event` parameter.

**Migration steps:**

1. Find all `NippleComponent` callback usages in your app.
2. Replace handler signatures from `(evt, data)` (or similar two-argument forms) to `(event)`.
3. Replace direct `data` references with `event.data`.
4. Run type-check and tests to verify all joystick interactions still compile and behave as expected.

## 🔧 Chores

<!-- PLACEHOLDER: Describe other changes (chore:) -->
