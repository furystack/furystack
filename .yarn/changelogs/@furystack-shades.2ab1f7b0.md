<!-- version-type: patch -->

# @furystack/shades

## 📚 Documentation

- Rewrote JSDoc across the public API (`Shade`, `flushUpdates`, `RenderOptions`, `ShadeComponent`, `StyleManager`, `StyledShade`, `compileRoute`, the CSS generator + types, the view-transition helpers) to follow the new value-test guidance: dropped restate-the-type narration, kept intent / trade-offs / constraints around custom-element registration, render batching, child reconciliation, and CSS scoping.

## ⬆️ Dependencies

- Bump dev `jsdom` to `^29.1.0`.
- Bump dev `vitest` to `^4.1.5`.
