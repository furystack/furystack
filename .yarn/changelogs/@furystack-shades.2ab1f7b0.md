<!-- version-type: patch -->

# @furystack/shades

## 📚 Documentation

JSDoc rewrite across the public API to follow the new value-test guidance — drop restate-the-type narration, keep intent / trade-offs / constraints, add `@example` only where usage is not obvious from the signature.

- **Component surface** — `Shade`, `ShadeOptions`, `ShadeComponent`, `RenderOptions`, `flushUpdates`. Spells out custom-element registration (process-wide), the render-batching microtask, the `await flushUpdates()` contract for tests, and the difference between `elementBase` / `elementBaseName`.
- **Routing** — `compileRoute`. Documents path-pattern parsing and the runtime contract for handlers.
- **Styling** — `StyleManager`, `StyledShade`, `css-generator`, the `CssObject` type. Calls out the per-component scope, dedupe behavior, and how nested selectors compose.
- **View transitions** — `view-transition` helpers. Documents browser-support fallbacks and the no-op behavior when `document.startViewTransition` is unavailable.

## ⬆️ Dependencies

- Bump dev `jsdom` to `^29.1.0`.
- Bump dev `vitest` to `^4.1.5`.
